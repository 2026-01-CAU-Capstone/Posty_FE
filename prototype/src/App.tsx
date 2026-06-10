import { useEffect, useMemo, useRef, useState } from 'react';
import { api, BgmCandidate, BgmCandidatesResp, Estimate, Job, OriginalVolume, PreviewFrame, StyleBrief, StyleSuggest, SuggestBrief, TtsGenMode, TtsSource, TTS_VOICES } from './api';
import { Posty } from './Posty';

const STAGE_NAMES = ['레퍼런스 분석', '컷편집', '색보정', '자막', '음성·BGM'];

// 흐름: 레퍼런스 → 소스 → 분석 → 옵션 → 편집(컷+자막) → BGM 입히기 → 완성
//   'edit'  = stages 1~3 (컷편집/색보정/자막) 진행. 끝나면 결과를 미리 보여줌.
//   'bgm'   = 편집 결과를 보면서 BGM 을 골라 입혀봄.
//   'final' = stage 4 (BGM/음성) 적용 → 최종 결과.
type Step = 'ref' | 'sources' | 'waiting' | 'options' | 'edit' | 'caption' | 'bgm' | 'final';
const STEPS: { key: Step; label: string }[] = [
  { key: 'ref',      label: '레퍼런스' },
  { key: 'sources',  label: '소스' },
  { key: 'waiting',  label: '분석' },
  { key: 'options',  label: '옵션' },
  { key: 'edit',     label: '컷편집' },
  { key: 'caption',  label: '자막' },
  { key: 'bgm',      label: 'BGM' },
  { key: 'final',    label: '완성' },
];

// 영상 확장자(드롭 시 필터링용)
const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi'];
function looksLikeVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const lower = file.name.toLowerCase();
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
}

// 옵션 화면 예시(placeholder, 사용자에게 어떤 걸 적을지 힌트)
const TONE_EXAMPLES = ['발랄한', '잔잔한', '감성적인', '에너지 넘치는', '시크한', '따뜻한'];
const PURPOSE_EXAMPLES = ['카페 홍보', '여행 vlog', '제품 리뷰', '맛집 추천', '브이로그', '일상 공유'];
const KEYWORD_EXAMPLES = ['감성', '노을', '제주', '맛집', '커피', '바다', '도시', '친구'];
const PHRASE_EXAMPLES = ['오늘 퇴근 후', '꼭 가봐야 할', '딱 한 잔', '믿고 가는'];

// ============================================================
// 훅 / 순수 헬퍼
// ============================================================
function usePolledJob(
  jobId: string | null,
  recover?: (jobId: string) => Promise<Job | null>,
): Job | null {
  const [job, setJob] = useState<Job | null>(null);
  // recover 는 매 렌더 새로 만들어질 수 있어 ref 로 최신본만 참조 (effect 의존성에서 제외).
  const recoverRef = useRef(recover);
  recoverRef.current = recover;
  useEffect(() => {
    setJob(null);
    if (!jobId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await api.getJob(jobId);
        if (!active) return;
        setJob(j);
        if (j.status === 'done' || j.status === 'error') return;
      } catch {
        // job 이 사라졌을 수 있음 (예: 백엔드 재시작 → 인메모리 job Map 초기화).
        // 복구 콜백이 디스크 산출물로 완료를 확인하면 그걸 채택하고 폴링 종료.
        try {
          const recovered = recoverRef.current ? await recoverRef.current(jobId) : null;
          if (active && recovered) { setJob(recovered); return; }
        } catch { /* 무시하고 재시도 */ }
      }
      if (active) timer = setTimeout(tick, 1500);
    };
    timer = setTimeout(tick, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [jobId]);
  return job;
}

// rAF 기반 시계 — 진행 바가 매 프레임 부드럽게 갱신되도록.
// (active 일 때만 회전. inactive 면 멈춰서 불필요한 렌더 안 함.)
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let alive = true;
    let last = 0;
    const tick = (ts: number) => {
      if (!alive) return;
      // ~10Hz 로 throttle — bar 의 width transition 이 자연스럽게 부드러워지면서도
      // React 리렌더 비용은 100ms 마다라 가벼움.
      if (ts - last >= 100) {
        last = ts;
        setNow(Date.now());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [active]);
  return now;
}

// 정확한 분/초 ticking 표시 — "5분 43초 남음" 처럼 1초마다 시각적으로 줄어든다.
function fmtClockTicking(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  if (s <= 0) return '잠시 후 완료';
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}초 남음`;
  return `${m}분 ${String(r).padStart(2, '0')}초 남음`;
}

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}분 ${r}초` : `${r}초`;
}

// 사용자에게 보여줄 "현실적인" 예상 시간 — 초 단위로 반올림하지 않고
// 분 단위 범위 ("약 6~7분") 로 표시. 60초 미만은 "1분 이내" 로.
// 보수 계수(SAFETY=1.6)가 백엔드에 끼어 있어 실제보다 길게 잡혀 있으므로
// 표시 단계에서 0.75 를 곱해 좀 더 현실적인 범위로 좁혀 보여준다.
function fmtClockRange(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '잠시 후 완료';
  const realistic = sec * 0.75;
  if (realistic < 60) return '약 1분 이내';
  const lo = Math.max(1, Math.floor(realistic / 60));
  const hi = Math.max(lo + 1, Math.ceil((realistic * 1.15) / 60));
  return lo === hi ? `약 ${lo}분` : `약 ${lo}~${hi}분`;
}

type PhaseProg = { pct: number; eta: number; currentStage: number };
function phaseProgress(job: Job | null, perStage: number[] | null, from: number, to: number, nowMs: number): PhaseProg {
  const w = perStage && perStage.length === 5 ? perStage : [1, 1, 1, 1, 1];
  const total = w.slice(from, to + 1).reduce((a, b) => a + b, 0) || 1;
  if (!job) return { pct: 0.02, eta: total, currentStage: from };
  const startMs = job.startedAt ? Date.parse(job.startedAt) : nowMs;
  const elapsed = Math.max(0, (nowMs - startMs) / 1000);
  let completed = from - 1;
  for (const p of job.progress) {
    if (p.step.endsWith('_done') && typeof p.extra?.stage === 'number') completed = Math.max(completed, p.extra.stage);
  }
  const doneEst = completed >= from ? w.slice(from, completed + 1).reduce((a, b) => a + b, 0) : 0;
  let pct = Math.max(elapsed / total, doneEst / total, 0.02);
  let eta = Math.max(0, total - elapsed);
  if (job.status === 'done') { pct = 1; eta = 0; }
  pct = Math.min(job.status === 'done' ? 1 : 0.99, pct);
  return { pct, eta, currentStage: Math.min(to, completed + 1) };
}

// ============================================================
// 메인
// ============================================================
export default function App() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('ref');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [refMode, setRefMode] = useState<'url' | 'file'>('url');
  const [refUrl, setRefUrl] = useState('');
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refStarted, setRefStarted] = useState(false);
  const [refError, setRefError] = useState('');

  const [uploadedSources, setUploadedSources] = useState<string[]>([]);
  const [srcBusy, setSrcBusy] = useState(false);
  const [srcError, setSrcError] = useState('');

  // 옵션 (StyleSuggest 로 자동 채워짐, 사용자가 자유 수정)
  const [suggest, setSuggest] = useState<StyleSuggest | null>(null);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  const [brief, setBrief] = useState<SuggestBrief>({
    tone: '', purpose: '',
    topic_keywords: [], must_include_phrases: [],
    caption_language: '', caption_density: '', caption_mode: '',
  });
  // tone / purpose 는 단일 선택. 후보 풀(추천 + 사용자 추가)을 관리.
  const [tonePool, setTonePool] = useState<string[]>([]);
  const [purposePool, setPurposePool] = useState<string[]>([]);
  const [extraNotes, setExtraNotes] = useState('');

  // 오디오 밸런스 — 기본은 음원(BGM)만. 사용자가 원본 영상 소리를 키울 수 있음.
  const [originalAudio, setOriginalAudio] = useState<OriginalVolume>('mute');

  // TTS(나레이션) 옵션 트리
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsSource, setTtsSource] = useState<TtsSource>('captions');     // 자막 읽기 | 새로 생성
  const [ttsGenMode, setTtsGenMode] = useState<TtsGenMode>('auto');      // 자동 생성 | 수동 작업
  const [ttsScript, setTtsScript] = useState('');                        // 수동 작업 대본
  const [ttsVoice, setTtsVoice] = useState<string>('Kore');

  const [stage0JobId, setStage0JobId] = useState<string | null>(null);
  const [mainJobId, setMainJobId] = useState<string | null>(null);
  const [genError, setGenError] = useState('');
  // 생성 단계 구분: 'edit'(컷+보정 1~2) → 'caption'(자막 3) → 'final'(stage 4). mainJob 재사용.
  const [genPhase, setGenPhase] = useState<'edit' | 'caption' | 'final'>('edit');
  const [gradedUrl, setGradedUrl] = useState<string | null>(null);
  // 컷편집 옵션 — 영상 목표 길이(초). 0 = 레퍼런스 따라가기.
  const [cutTargetSec, setCutTargetSec] = useState<number>(0);
  // 편집(컷+자막) 결과 영상 URL — BGM 단계에서 미리보기로 보여줌.
  const [captionedUrl, setCaptionedUrl] = useState<string | null>(null);
  // 자막 검토용 — 생성된 컷별 자막 텍스트 (editPlan.items 에서 추출).
  const [captionList, setCaptionList] = useState<{ start: number; layers: string[] }[]>([]);

  // BGM 선택 상태
  const [bgmResp, setBgmResp] = useState<BgmCandidatesResp | null>(null);
  const [bgmBusy, setBgmBusy] = useState(false);
  const [bgmError, setBgmError] = useState('');
  const [bgmPick, setBgmPick] = useState<'none' | string | null>(null); // identifier or 'none'
  const [bgmPickBusy, setBgmPickBusy] = useState(false);

  // 진행 화면 캐러셀 프레임
  const [previewFrames, setPreviewFrames] = useState<PreviewFrame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);

  // 완료 알림을 1회만 발사하기 위한 가드
  const completedNotifiedRef = useRef(false);

  // 자동 재시도 상태 — Stage 0 / main job 둘 다 따로 카운트
  const [stage0Retry, setStage0Retry] = useState(0);
  const [stage0Retrying, setStage0Retrying] = useState(false);
  const [mainRetry, setMainRetry] = useState(0);
  const [mainRetrying, setMainRetrying] = useState(false);
  const MAX_RETRIES = 3;

  // 백엔드 재시작 등으로 Stage 0 job 이 사라져(404) 폴링이 멈춰도, 분석 결과(edit-spec.json)가
  // 디스크에 있으면 "분석 완료"로 간주해 다음 단계(style-suggest→옵션)로 진행한다.
  const recoverStage0FromSpec = async (jobId: string): Promise<Job | null> => {
    if (!projectId) return null;
    try {
      const spec = await api.getEditSpec(projectId);
      if (!spec) return null;
      return {
        id: jobId, type: 'stage', projectId, status: 'done',
        progress: [], result: { recovered: true }, error: null,
      };
    } catch { return null; }
  };
  const stage0Job = usePolledJob(stage0JobId, recoverStage0FromSpec);
  const mainJob = usePolledJob(mainJobId);

  const stage0Done = stage0Job?.status === 'done';
  const stage0Running = refStarted && !stage0Done && stage0Job?.status !== 'error';
  const mainRunning = !!mainJob && mainJob.status !== 'done' && mainJob.status !== 'error';
  const now = useNow(stage0Running || mainRunning);

  // Stage 0 의 "마지막 진행 시각" — hang 판정을 경과시간이 아니라 "진행이 멈춘 시간"으로 한다.
  // (Stage 0 가 단계별 progress 를 내보내므로, 정상 진행 중이면 이 값이 계속 갱신된다.)
  const stage0LastProgressMs = useMemo(() => {
    const ps = stage0Job?.progress;
    if (Array.isArray(ps) && ps.length > 0) {
      const t = Date.parse(ps[ps.length - 1]?.at || '');
      if (Number.isFinite(t)) return t;
    }
    if (stage0Job?.startedAt) {
      const s = Date.parse(stage0Job.startedAt);
      if (Number.isFinite(s)) return s;
    }
    return null; // 유효한 타임스탬프가 없으면 null → stall 타이머가 안전하게 noop.
  }, [stage0Job?.progress, stage0Job?.startedAt]);

  // 최종 영상은 'final' 단계의 mainJob 이 끝났을 때만.
  const finalPath: string | null = (genPhase === 'final' && mainJob?.status === 'done') ? (mainJob.result?.final ?? null) : null;

  useEffect(() => { api.health().then(setOnline); }, []);

  // BGM 후보 백그라운드 선행 fetch — BGM 검색(AudD+Archive+Gemini)은 오래 걸려서 'bgm' 화면
  // 도착 후 받으면 한참 기다린다. → 편집(edit)/자막(caption) 단계(무거운 렌더가 도는 동안)부터
  // 미리 받아 캐시(4_final/bgm-candidates.json)를 데워두고, bgm 도착 시 즉시 표시한다.
  // (Stage 0 가 끝나 audio_profile 이 있어야 가능. 중복 fetch 는 bgmResp/bgmBusy 가드로 방지.)
  useEffect(() => {
    if (step !== 'edit' && step !== 'caption' && step !== 'bgm') return;
    if (!projectId || !stage0Done) return;
    if (bgmResp || bgmBusy) return;
    let cancelled = false;
    (async () => {
      setBgmBusy(true);
      setBgmError('');
      try {
        const r = await api.getBgmCandidates(projectId);
        if (cancelled) return;
        setBgmResp(r);
        // 기본 선택: 첫번째 무료 후보 (유료 곡은 임베드 불가라 선택 대상 아님)
        if (r.free.length > 0) setBgmPick(r.free[0].identifier);
        else setBgmPick('none');
      } catch (e: any) {
        if (!cancelled) setBgmError(e.message || String(e));
      } finally {
        // step 이동으로 cancelled 돼도 busy 는 '항상' 해제 — 안 그러면 busy 가 stuck 돼
        // (편집→자막→bgm 이동 중 흔함) 다음 fetch 가 영영 막힌다. (백엔드 캐시라 재요청도 저렴.)
        setBgmBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, projectId, stage0Done]); // eslint-disable-line react-hooks/exhaustive-deps

  // 진행 화면 진입 시 프레임 캐러셀 fetch
  // 캐러셀 프레임 — 옵션 단계에서 미리 추출·캐시해 둔다 (#2). 편집/완성 진행 화면에서 바로 사용.
  // 옵션 단계의 콜드 추출(ffmpeg)이 끝나기 전에 편집으로 넘어가면 fetch 가 취소돼
  // previewFrames 가 빈 채로 남는다 → 편집/완성 단계에서도 (비었으면) 다시 가져온다.
  useEffect(() => {
    if (!projectId) return;
    if (previewFrames.length > 0) return;
    if (step !== 'options' && step !== 'edit' && step !== 'final') return;
    let cancelled = false;
    setFramesLoading(true);
    (async () => {
      try {
        const frames = await api.getPreviewFrames(projectId, 16);
        if (!cancelled) setPreviewFrames(frames);
      } catch { /* 캐러셀 실패해도 무시 */ }
      finally { if (!cancelled) setFramesLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [step, projectId, previewFrames.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 컷+보정(stages 1~2) 완료 → 자막 설정 단계로. 편집본(graded.mp4) 미리보기 URL 도 가져온다.
  useEffect(() => {
    if (step !== 'edit') return;
    if (genPhase !== 'edit') return;
    if (mainJob?.status !== 'done') return;
    let cancelled = false;
    (async () => {
      try {
        const proj = await api.getProject(projectId!);
        const rel = proj?.paths?.gradedMp4 || proj?.paths?.cutMp4;
        if (!cancelled && rel) setGradedUrl(api.fileUrl(rel));
      } catch { /* 미리보기 없어도 진행 */ }
      if (!cancelled) setStep('caption');
    })();
    return () => { cancelled = true; };
  }, [step, genPhase, mainJob?.status, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 자막 생성(stage 3) 완료 → BGM 으로 자동 이동하지 않고 "검토 화면"에 머문다.
  // 캡션된 영상 URL + 생성된 컷별 자막 텍스트를 가져와 사용자가 확인/재생성할 수 있게 한다.
  useEffect(() => {
    if (step !== 'caption') return;
    if (genPhase !== 'caption') return;
    if (mainJob?.status !== 'done') return;
    let cancelled = false;
    (async () => {
      try {
        const proj = await api.getProject(projectId!);
        const rel = proj?.paths?.captionedMp4;
        const items: any[] = proj?.artifacts?.editPlan?.items || [];
        const list = items
          .map((it) => ({
            start: Number(it.output_start) || 0,
            layers: (Array.isArray(it.planned_caption_layers) ? it.planned_caption_layers : [])
              .map((l: any) => String(l?.text || '').trim())
              .filter(Boolean),
          }))
          .filter((c) => c.layers.length > 0);
        if (!cancelled) {
          setCaptionList(list);
          // captionedUrl 은 마지막에 설정 — 이 값이 채워지면 렌더가 진행→검토 화면으로 전환된다.
          if (rel) setCaptionedUrl(api.fileUrl(rel) + '&t=' + Date.now()); // 재생성 시 캐시 무효화
        }
      } catch { /* 미리보기 없어도 검토는 가능 */ }
    })();
    return () => { cancelled = true; };
  }, [step, genPhase, mainJob?.status, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 자동 재시도: Stage 0 ──────────────────────────────────────
  // job.status='error' 가 되면 backoff 후 같은 stage 를 다시 큐잉.
  // MAX_RETRIES 까지 시도. (보통은 일시적 429/네트워크라 1~2번 안에 통과.)
  useEffect(() => {
    if (!projectId) return;
    if (stage0Job?.status !== 'error') return;
    if (stage0Retry >= MAX_RETRIES) return;
    if (stage0Retrying) return;
    const delay = Math.min(8000, 1500 * Math.pow(2, stage0Retry));
    setStage0Retrying(true);
    const timer = setTimeout(async () => {
      try {
        const newId = await api.run(projectId, { mode: 'stage', stage: 0 });
        setStage0Retry(r => r + 1);
        setStage0JobId(newId);
      } catch {
        // 재시도 자체가 실패하면 다음 사이클로 — 카운트는 올린다.
        setStage0Retry(r => r + 1);
      } finally {
        setStage0Retrying(false);
      }
    }, delay);
    return () => { clearTimeout(timer); setStage0Retrying(false); };
  }, [stage0Job?.status, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 자동 재시도: 메인 job ──────────────────────────────────────
  // 'edit' 단계(stages 1~3): 마지막 완료 stage 다음부터 ~3 까지 재실행.
  // 'final' 단계(stage 4): stage 4 만 재실행.
  // 완료된 stage 산출물(cut.mp4 등)은 남아 있어 이어서 진행 가능.
  useEffect(() => {
    if (!projectId) return;
    if (mainJob?.status !== 'error') return;
    if (mainRetry >= MAX_RETRIES) return;
    if (mainRetrying) return;
    const toStage = genPhase === 'edit' ? 2 : genPhase === 'caption' ? 3 : 4;
    let restartFrom: number;
    if (genPhase === 'final') {
      restartFrom = 4;
    } else if (genPhase === 'caption') {
      restartFrom = 3;
    } else {
      let lastDone = 0;
      for (const p of mainJob.progress || []) {
        if (p.step.endsWith('_done') && typeof p.extra?.stage === 'number') {
          lastDone = Math.max(lastDone, p.extra.stage);
        }
      }
      restartFrom = Math.max(1, lastDone + 1);
    }
    const delay = Math.min(8000, 1500 * Math.pow(2, mainRetry));
    setMainRetrying(true);
    const timer = setTimeout(async () => {
      try {
        const newId = await api.run(projectId, { mode: 'all', from: restartFrom, to: toStage });
        setMainRetry(r => r + 1);
        setMainJobId(newId);
      } catch {
        setMainRetry(r => r + 1);
      } finally {
        setMainRetrying(false);
      }
    }, delay);
    return () => { clearTimeout(timer); setMainRetrying(false); };
  }, [mainJob?.status, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hang 감지: "진행이 멈춘" 경우에만 강제 재시작 (느린 건 그대로 둔다) ───────
  // 예전엔 "경과 > 추정×2.5" 로 판정해, 진행 중인데 추정보다 느릴 뿐인 Stage 0 를 죽여
  // 진행률이 99%→2% 로 리셋되는 루프를 만들었다(추정이 실제보다 짧을 때). 이제 "마지막 진행
  // 이후 STALL_MS 동안 새 진행이 없을 때"만 멈춤으로 보고 재시작한다. Stage 0 가 단계별
  // progress 를 내보내므로 정상 진행 중엔 타이머가 계속 갱신돼 재시작되지 않는다.
  useEffect(() => {
    if (!projectId) return;
    if (stage0Job?.status !== 'running') return;
    if (stage0Retry >= MAX_RETRIES) return;
    if (stage0LastProgressMs == null) return;
    // STALL_MS: 단계 사이 정상 간격(업로드+ACTIVE 대기+pro 영상 호출 1회, 재시도 포함)이
    // 수 분에 달할 수 있어 넉넉히 15분으로 둔다. 백엔드가 타임아웃/네트워크 에러를 자체
    // 재시도로 흡수하므로, 이 stall 재시작은 사실상 최후의 안전장치다.
    // (게다가 백엔드 dedup 덕에 진행 중 잡엔 재시작이 같은 잡으로 합쳐져 무해하다.)
    const STALL_MS = 900_000;
    const remaining = Math.max(5000, STALL_MS - (Date.now() - stage0LastProgressMs));
    const timer = setTimeout(async () => {
      try {
        const newId = await api.run(projectId, { mode: 'stage', stage: 0 });
        setStage0Retry(r => r + 1);
        setStage0JobId(newId);
      } catch { /* 다음 사이클 */ }
    }, remaining);
    return () => clearTimeout(timer);
  }, [stage0Job?.status, stage0LastProgressMs, projectId, stage0Retry]); // eslint-disable-line react-hooks/exhaustive-deps

  // 완료 시 브라우저 알림 (최종 영상 완성 시에만)
  useEffect(() => {
    if (genPhase !== 'final') return;
    if (!mainJob || mainJob.status !== 'done') return;
    if (completedNotifiedRef.current) return;
    completedNotifiedRef.current = true;
    try {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('Posty 영상 생성 완료', { body: '편집된 영상이 준비됐어요. 탭으로 돌아와서 확인해보세요.' });
        }
      }
    } catch { /* 무시 */ }
  }, [mainJob?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stage 0 가 끝나는 순간 (waiting 화면에서) 자동으로 style-suggest 호출
  useEffect(() => {
    if (!projectId || !stage0Done || suggest || suggestBusy) return;
    if (step !== 'waiting') return;
    let cancelled = false;
    (async () => {
      setSuggestBusy(true);
      setSuggestError('');
      try {
        const s = await api.generateStyleSuggest(projectId);
        if (cancelled) return;
        setSuggest(s);
        // 옵션 상태에 미리 채우기 + 풀에 추천값 병합
        setBrief({
          tone: s.brief.tone,
          purpose: s.brief.purpose,
          topic_keywords: [...s.brief.topic_keywords],
          must_include_phrases: [...s.brief.must_include_phrases],
          caption_language: s.brief.caption_language,
          caption_density: s.brief.caption_density,
          caption_mode: s.brief.caption_mode || '',
        });
        setTonePool(dedupeMerge(TONE_EXAMPLES, s.brief.tone ? [s.brief.tone] : []));
        setPurposePool(dedupeMerge(PURPOSE_EXAMPLES, s.brief.purpose ? [s.brief.purpose] : []));
      } catch (e: any) {
        if (!cancelled) setSuggestError(e.message || String(e));
      } finally {
        if (!cancelled) setSuggestBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, stage0Done, step]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshEstimate(pid: string) {
    try { setEstimate(await api.getEstimate(pid)); } catch { /* 무시 */ }
  }

  // "다시 분석하기" — Stage 0 만 reanalyze=true 로 다시 큐잉.
  // 백엔드가 이전 edit-spec.json 을 프롬프트에 끼워 second-pass 로 돌린다.
  // 캐시된 suggest 도 비워서, 새 spec 이 나오면 useEffect 가 자동으로 다시 추천 재생성.
  async function reanalyzeReference(userFocus: string) {
    if (!projectId) return;
    setSuggest(null);
    setSuggestError('');
    setRefError('');
    setStage0Retry(0);
    setStage0Retrying(false);
    try {
      const newId = await api.run(projectId, {
        mode: 'stage',
        stage: 0,
        reanalyze: true,
        userFocus: userFocus.trim() || undefined,
      });
      setStage0JobId(newId);
    } catch (e: any) {
      setRefError(e.message || String(e));
    }
  }

  async function startReference() {
    setRefError('');
    try {
      let pid = projectId;
      if (!pid) { pid = await api.createProject(); setProjectId(pid); }
      if (refMode === 'file') {
        if (!refFile) throw new Error('레퍼런스 영상 파일을 선택하세요');
        await api.uploadFiles(pid, 'reference', [refFile]);
      } else {
        if (!refUrl.trim()) throw new Error('레퍼런스 Instagram URL을 입력하세요');
        await api.igImport(pid, 'reference', [refUrl.trim()]);
      }
      setStage0JobId(await api.run(pid, { mode: 'stage', stage: 0 }));
      setRefStarted(true);
      refreshEstimate(pid);
      setStep('sources');
    } catch (e: any) {
      setRefError(e.message || String(e));
    }
  }

  async function addSourceFiles(files: File[]) {
    setSrcError('');
    if (!projectId) { setSrcError('먼저 레퍼런스 분석을 시작하세요'); return; }
    const accepted = files.filter(looksLikeVideo);
    const rejected = files.length - accepted.length;
    if (accepted.length === 0) {
      setSrcError(rejected > 0 ? '영상 파일만 추가할 수 있어요' : '추가할 파일이 없습니다');
      return;
    }
    setSrcBusy(true);
    try {
      const added = await api.uploadFiles(projectId, 'source', accepted);
      setUploadedSources(prev => [...prev, ...added]);
      if (rejected > 0) setSrcError(`영상이 아닌 ${rejected}개 파일은 제외됐어요`);
      refreshEstimate(projectId);
    } catch (e: any) {
      setSrcError(e.message || String(e));
    } finally {
      setSrcBusy(false);
    }
  }

  // 옵션 단계 "편집 시작" — 설정 저장 후 컷편집~자막(stages 1~3) 잡 실행.
  // BGM/음성(stage 4)은 편집 결과를 본 뒤 'final' 단계에서 따로 돌린다.
  async function startEditing() {
    if (!projectId) return;
    setGenError('');
    try {
      const payload: StyleBrief = {
        caption_language: brief.caption_language,
        caption_density: brief.caption_density,
        caption_mode: brief.caption_mode,
        tone: brief.tone.trim(),
        purpose: brief.purpose.trim(),
        topic_keywords: brief.topic_keywords.slice(0, 20),
        must_include_phrases: brief.must_include_phrases.slice(0, 10),
        extra_notes: extraNotes.trim(),
      };
      await api.saveStyleBrief(projectId, payload);
      await api.saveStyleNote(projectId, extraNotes.trim());
      // 오디오 밸런스 + TTS 설정도 미리 저장 (stage 4 가 나중에 읽음)
      await api.saveAudioConfig(projectId, { originalVolume: originalAudio });
      await api.saveTtsConfig(projectId, {
        enabled: ttsEnabled,
        source: ttsSource,
        genMode: ttsGenMode,
        voice: ttsVoice,
        script: ttsScript.trim(),
      });
      await api.saveCutConfig(projectId, { target_sec: cutTargetSec });
      await refreshEstimate(projectId);
      // 컷+보정만 먼저(1~2). 자막은 편집본을 본 뒤 'caption' 단계에서 생성한다.
      const jobId = await api.run(projectId, { mode: 'all', from: 1, to: 2 });
      setGenPhase('edit');
      setMainRetry(0); setMainRetrying(false);
      setCaptionedUrl(null); setGradedUrl(null); setCaptionList([]);
      completedNotifiedRef.current = false;
      setMainJobId(jobId);
      setStep('edit');
    } catch (e: any) {
      setGenError(e.message || String(e));
    }
  }

  // 자막 설정 단계 "자막 생성" — 갱신된 자막 설정 저장 후 Stage 3(자막 플래닝+burn)만 실행.
  // (편집본을 보고 정한 분위기/방식으로 자막을 생성. 자막만 다시 만들 수 있어 컷 재편집 불필요.)
  async function generateCaptions() {
    if (!projectId) return;
    setGenError('');
    try {
      const payload: StyleBrief = {
        caption_language: brief.caption_language,
        caption_density: brief.caption_density,
        caption_mode: brief.caption_mode,
        tone: brief.tone.trim(),
        purpose: brief.purpose.trim(),
        topic_keywords: brief.topic_keywords.slice(0, 20),
        must_include_phrases: brief.must_include_phrases.slice(0, 10),
        extra_notes: extraNotes.trim(),
      };
      await api.saveStyleBrief(projectId, payload);
      await api.saveStyleNote(projectId, extraNotes.trim());
      const jobId = await api.run(projectId, { mode: 'stage', stage: 3 });
      setGenPhase('caption');
      setMainRetry(0); setMainRetrying(false);
      setCaptionedUrl(null);   // null 이면 렌더가 진행 화면을 보여줌 (완료 시 검토 화면으로)
      setCaptionList([]);
      completedNotifiedRef.current = false;
      setMainJobId(jobId);
      // step 은 'caption' 유지 → 아래 렌더가 진행률을 보여줌.
    } catch (e: any) {
      setGenError(e.message || String(e));
    }
  }

  // BGM 단계 "이 음원으로 완성" — 선택 음원 다운로드 후 stage 4 잡 실행.
  // (Notification 권한은 await 이전에 요청해야 user-gesture 가 안 끊긴다.)
  async function finalizeWithBgm() {
    if (!projectId || !bgmPick) return;
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch { /* 무시 */ }

    setBgmPickBusy(true);
    setGenError('');
    try {
      if (bgmPick === 'none') {
        await api.pickBgm(projectId, { none: true });
      } else {
        const cand = bgmResp?.free.find(c => c.identifier === bgmPick);
        if (!cand) throw new Error('선택된 후보를 찾을 수 없습니다');
        await api.pickBgm(projectId, {
          identifier: cand.identifier,
          source_url: cand.source_url,
          title: cand.title,
        });
      }
      const jobId = await api.run(projectId, { mode: 'all', from: 4, to: 4 });
      setGenPhase('final');
      setMainRetry(0); setMainRetrying(false);
      completedNotifiedRef.current = false;
      setMainJobId(jobId);
      setStep('final');
    } catch (e: any) {
      setGenError(e.message || String(e));
    } finally {
      setBgmPickBusy(false);
    }
  }

  function resetAll() {
    setStep('ref'); setProjectId(null); setEstimate(null);
    setRefMode('url'); setRefUrl(''); setRefFile(null); setRefStarted(false); setRefError('');
    setUploadedSources([]); setSrcError('');
    setSuggest(null); setSuggestError(''); setSuggestBusy(false);
    setBrief({ tone: '', purpose: '', topic_keywords: [], must_include_phrases: [], caption_language: '', caption_density: '', caption_mode: '' });
    setTonePool([]); setPurposePool([]); setExtraNotes('');
    setCutTargetSec(0); setGradedUrl(null); setGenPhase('edit');
    setOriginalAudio('mute');
    setTtsEnabled(false); setTtsSource('captions'); setTtsGenMode('auto'); setTtsScript(''); setTtsVoice('Kore');
    setStage0JobId(null); setMainJobId(null); setGenError('');
    setGenPhase('edit'); setCaptionedUrl(null); setCaptionList([]);
    setBgmResp(null); setBgmBusy(false); setBgmError(''); setBgmPick(null); setBgmPickBusy(false);
    setPreviewFrames([]);
    setFramesLoading(false);
    setStage0Retry(0); setStage0Retrying(false); setMainRetry(0); setMainRetrying(false);
    completedNotifiedRef.current = false;
  }

  return (
    <div className="page">
      <header className="hd">
        <div className="logo"><Posty size={46} variant="logo" working={stage0Running || mainRunning} /><h1>Posty</h1></div>
        <p>레퍼런스 릴스의 스타일로 내 영상을 자동 편집</p>
        {online !== true && (
          <span className={'status ' + (online === false ? 'off' : '')}>
            {online == null ? '서버 확인 중…' : '백엔드 미연결 (cd backend → npm run dev)'}
          </span>
        )}
      </header>

      <StepIndicator step={step} />

      {/* ── STEP: 레퍼런스 ── */}
      {step === 'ref' && (
        <section className="card">
          <div className="cardhead"><span className="num">1</span><h2>레퍼런스 영상</h2></div>
          <p className="hint">따라 하고 싶은 릴스 1개. <b>다음으로 넘어가면 바로 분석이 시작</b>되고, 그동안 소스를 업로드하면 돼요.</p>
          <div className="tabs">
            <button className={refMode === 'url' ? 'tab on' : 'tab'} onClick={() => setRefMode('url')}>Instagram URL</button>
            <button className={refMode === 'file' ? 'tab on' : 'tab'} onClick={() => setRefMode('file')}>파일 업로드</button>
          </div>
          {refMode === 'url'
            ? <input className="inp" placeholder="https://www.instagram.com/reel/..." value={refUrl} onChange={e => setRefUrl(e.target.value)} />
            : <input className="inp" type="file" accept="video/*" onChange={e => setRefFile(e.target.files?.[0] || null)} />}
          {refError && <div className="err">{refError}</div>}
          <div className="nav">
            <span />
            <button className="btn primary" onClick={startReference}>분석 시작</button>
          </div>
        </section>
      )}

      {/* ── STEP: 소스 ── */}
      {step === 'sources' && (
        <section className="card">
          <div className="cardhead"><span className="num">2</span><h2>내 소스 영상</h2></div>
          <p className="hint">편집 재료가 될 내가 찍은 영상들. <b>여러 개일수록</b> 좋아요.</p>

          <SourceDropzone busy={srcBusy} onFiles={addSourceFiles} />

          {srcError && <div className="err">{srcError}</div>}

          {uploadedSources.length > 0 && (
            <>
              <div className="src-count">📦 {uploadedSources.length}개 추가됨</div>
              <div className="chips">{uploadedSources.map((s, i) => <span className="chip" key={i}>🎞 {s}</span>)}</div>
            </>
          )}

          <div className="nav">
            <span />
            <button
              className="btn primary"
              disabled={uploadedSources.length === 0}
              onClick={() => setStep('waiting')}
            >다음 →</button>
          </div>
          {uploadedSources.length === 0 && <p className="hint center">소스를 1개 이상 추가하면 다음으로 넘어갈 수 있어요.</p>}
        </section>
      )}

      {/* ── STEP: 분석 대기 ── */}
      {step === 'waiting' && (
        <WaitingPanel
          stage0Job={stage0Job}
          estimate={estimate}
          now={now}
          suggest={suggest}
          suggestBusy={suggestBusy}
          suggestError={suggestError}
          retryCount={stage0Retry}
          retryMax={MAX_RETRIES}
          retrying={stage0Retrying}
          onBack={() => setStep('sources')}
          onNext={() => setStep('options')}
          onReanalyze={reanalyzeReference}
        />
      )}

      {/* ── STEP: 옵션 ── */}
      {step === 'options' && (
        <section className="card">
          {suggest && (
            <>
              <Bubble>
                <span className="bubble-emoji"><RefFileIcon size={34} /></span>
                <span>{suggest.summary}</span>
              </Bubble>
              <AnalysisDetail points={suggest.analysis} />
            </>
          )}
          <div className="cardhead"><span className="num">4</span><h2>컷편집 옵션 <small>(영상 길이·톤 — 자막은 컷 본 뒤 설정합니다)</small></h2></div>

          <ChipSingle
            label="톤 / 분위기"
            value={brief.tone}
            pool={tonePool}
            placeholder="예: 발랄한"
            examples={TONE_EXAMPLES}
            onChange={(v) => setBrief(b => ({ ...b, tone: v }))}
            onAddToPool={(v) => setTonePool(p => dedupeMerge(p, [v]))}
          />

          <ChipSingle
            label="영상 목적"
            value={brief.purpose}
            pool={purposePool}
            placeholder="예: 카페 홍보"
            examples={PURPOSE_EXAMPLES}
            onChange={(v) => setBrief(b => ({ ...b, purpose: v }))}
            onAddToPool={(v) => setPurposePool(p => dedupeMerge(p, [v]))}
          />

          <ChipMulti
            label="주제 키워드"
            values={brief.topic_keywords}
            placeholder="예: 감성, 노을, 제주"
            examples={KEYWORD_EXAMPLES}
            onAdd={(v) => setBrief(b => ({ ...b, topic_keywords: dedupeMerge(b.topic_keywords, [v]).slice(0, 20) }))}
            onRemove={(v) => setBrief(b => ({ ...b, topic_keywords: b.topic_keywords.filter(x => x !== v) }))}
          />

          <ChipMulti
            label="꼭 넣을 문구"
            values={brief.must_include_phrases}
            placeholder="예: 오늘 퇴근 후"
            examples={PHRASE_EXAMPLES}
            onAdd={(v) => setBrief(b => ({ ...b, must_include_phrases: dedupeMerge(b.must_include_phrases, [v]).slice(0, 10) }))}
            onRemove={(v) => setBrief(b => ({ ...b, must_include_phrases: b.must_include_phrases.filter(x => x !== v) }))}
          />

          <div className="grid">
            <label>영상 길이
              <select className="inp" value={String(cutTargetSec)}
                onChange={e => setCutTargetSec(Number(e.target.value))}>
                <option value="0">레퍼런스 따라가기</option>
                <option value="15">약 15초</option>
                <option value="30">약 30초</option>
                <option value="45">약 45초</option>
                <option value="60">약 60초</option>
              </select>
            </label>
          </div>

          <label className="full">추가 메모
            <textarea className="inp" rows={2} placeholder="자유롭게 — 예: 발랄한 톤, 빠른 컷"
              value={extraNotes} onChange={e => setExtraNotes(e.target.value)} />
          </label>

          <AudioNarrationOptions
            originalAudio={originalAudio} setOriginalAudio={setOriginalAudio}
            ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled}
            ttsSource={ttsSource} setTtsSource={setTtsSource}
            ttsGenMode={ttsGenMode} setTtsGenMode={setTtsGenMode}
            ttsScript={ttsScript} setTtsScript={setTtsScript}
            ttsVoice={ttsVoice} setTtsVoice={setTtsVoice}
          />

          {estimate && <p className="hint center">예상 소요 시간 <b>{fmtClockRange(estimate.total14)}</b></p>}
          {genError && <div className="err">{genError}</div>}
          <div className="nav">
            <button className="btn" onClick={() => setStep('waiting')}>← 이전</button>
            <button className="btn primary" disabled={!stage0Done} onClick={startEditing}>편집 시작 (컷+보정) →</button>
          </div>
        </section>
      )}

      {/* ── STEP: 편집 (컷+색보정+자막, stages 1~3) ── */}
      {step === 'edit' && (
        <ProgressPanel
          job={mainJob}
          estimate={estimate}
          now={now}
          projectId={projectId}
          frames={previewFrames}
          framesLoading={framesLoading}
          fromStage={1}
          toStage={2}
          phaseLabel="컷편집 + 보정"
          retryCount={mainRetry}
          retryMax={MAX_RETRIES}
          retrying={mainRetrying}
          onReset={resetAll}
        />
      )}

      {/* ── STEP: 자막 (편집본 보고 설정 → 생성 → 검토/재생성) ── */}
      {/* genPhase==='caption' && 아직 결과(captionedUrl) 없음 = 생성 중 → 진행 화면.
          그 외 = CaptionPanel (결과 있으면 검토, 없으면 설정 폼). 둘 다 영상 좌 + 설정 우 2단. */}
      {step === 'caption' && (
        (genPhase === 'caption' && !captionedUrl) ? (
          <ProgressPanel
            job={mainJob}
            estimate={estimate}
            now={now}
            projectId={projectId}
            frames={previewFrames}
            framesLoading={framesLoading}
            fromStage={3}
            toStage={3}
            phaseLabel="자막 생성"
            retryCount={mainRetry}
            retryMax={MAX_RETRIES}
            retrying={mainRetrying}
            onReset={resetAll}
          />
        ) : (
          <CaptionPanel
            videoUrl={captionedUrl || gradedUrl}
            generated={!!captionedUrl}
            captionList={captionList}
            brief={brief}
            setBrief={setBrief}
            extraNotes={extraNotes}
            setExtraNotes={setExtraNotes}
            genError={genError}
            onBack={() => setStep('options')}
            onGenerate={generateCaptions}
            onNext={() => setStep('bgm')}
          />
        )
      )}

      {/* ── STEP: BGM 입히기 (편집 결과 미리보기 + 음원 선택) ── */}
      {step === 'bgm' && (
        <BgmPanel
          resp={bgmResp}
          busy={bgmBusy}
          error={bgmError}
          pick={bgmPick}
          setPick={setBgmPick}
          pickBusy={bgmPickBusy}
          genError={genError}
          captionedUrl={captionedUrl}
          onBack={() => setStep('options')}
          onConfirm={finalizeWithBgm}
        />
      )}

      {/* ── STEP: 완성 (BGM/음성 입히기, stage 4) ── */}
      {step === 'final' && (
        <>
          {finalPath ? (
            <ResultPanel
              finalPath={finalPath}
              job={mainJob}
              projectId={projectId}
              onReset={resetAll}
              onBackToOptions={() => { setMainJobId(null); setGenError(''); setStep('options'); }}
            />
          ) : (
            <ProgressPanel
              job={mainJob}
              estimate={estimate}
              now={now}
              projectId={projectId}
              frames={previewFrames}
              framesLoading={framesLoading}
              fromStage={4}
              toStage={4}
              phaseLabel={bgmPick === 'none' && !ttsEnabled ? '영상 렌더링·마무리' : 'BGM·음성 입히기'}
              retryCount={mainRetry}
              retryMax={MAX_RETRIES}
              retrying={mainRetrying}
              onReset={resetAll}
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 보조 함수
// ============================================================
function dedupeMerge(...arrs: string[][]): string[] {
  const out: string[] = [];
  for (const a of arrs) for (const v of a) {
    const s = (v || '').trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

// ============================================================
// 보조 컴포넌트
// ============================================================
function StepIndicator({ step }: { step: Step }) {
  const idx = STEPS.findIndex(s => s.key === step);
  // 8단계가 한 줄로 넘쳐 줄바꿈되므로 4개씩 끊어 2줄로 배치(둘 다 왼→오).
  const perRow = 4;
  const rows: { s: (typeof STEPS)[number]; i: number }[][] = [];
  STEPS.forEach((s, i) => {
    const r = Math.floor(i / perRow);
    if (!rows[r]) rows[r] = [];
    rows[r].push({ s, i });
  });
  return (
    <div className="stepind">
      {rows.map((row, r) => (
        <div key={r} className="stepind-row">
          {row.map(({ s, i }) => (
            <div key={s.key} className={'sind ' + (i < idx ? 'done' : i === idx ? 'cur' : '')}>
              <span className="dot">{i < idx ? '✓' : i + 1}</span>
              <span className="lbl">{s.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Waiting 단계 — Stage 0 polling + 실측 진행률 + 완료 시 말풍선
// ============================================================
function WaitingPanel({
  stage0Job, estimate, now, suggest, suggestBusy, suggestError, retryCount, retryMax, retrying, onBack, onNext, onReanalyze,
}: {
  stage0Job: Job | null;
  estimate: Estimate | null;
  now: number;
  suggest: StyleSuggest | null;
  suggestBusy: boolean;
  suggestError: string;
  retryCount: number;
  retryMax: number;
  retrying: boolean;
  onBack: () => void;
  onNext: () => void;
  onReanalyze: (userFocus: string) => Promise<void> | void;
}) {
  const failed = stage0Job?.status === 'error';
  const done = stage0Job?.status === 'done';
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [reanalyzeFocus, setReanalyzeFocus] = useState('');
  // 재시도 한도 안에서는 사용자에게 "실패" 가 아니라 "재시도 중" 으로 보여준다.
  const willRetry = failed && retryCount < retryMax;

  // Stage 0 만의 진행률 (from=0, to=0). perStage[0] 기준 실측.
  const { pct, eta } = phaseProgress(stage0Job, estimate?.perStage ?? null, 0, 0, now);
  const pctInt = done ? 100 : Math.round(pct * 100);

  // 현재 분석 단계 메시지 — Stage 0 가 단계별로 보고하는 progress 의 최신 항목.
  // (시간추정만 따라가는 % 가 99%에서 멈춘 것처럼 보일 때 "지금 뭘 하는 중"인지 보여준다.)
  const stage0SubMsg = (() => {
    const ps = stage0Job?.progress;
    if (!Array.isArray(ps)) return '';
    for (let i = ps.length - 1; i >= 0; i--) {
      const step = String(ps[i]?.step || '');
      if (step.startsWith('stage0_') && step !== 'stage0_start' && step !== 'stage0_done') return String(ps[i]?.msg || '');
    }
    return '';
  })();

  return (
    <section className="card progress">
      <div className="cardhead"><span className="num">3</span><h2>레퍼런스 분석</h2></div>

      <div className="prog-hero">
        <Posty size={96} working={!done && !failed} />
        {failed && !willRetry
          ? <div className="err">분석 실패: {stage0Job?.error}</div>
          : done
            ? <>
                <div className="pct done">분석 완료!</div>
                {suggestBusy && <div className="eta">Posty가 영상을 정리하는 중…</div>}
                {suggestError && <div className="err">옵션 추천 실패: {suggestError}</div>}
              </>
            : <>
                <div className="pct">{pctInt}%</div>
                <div className="eta">{fmtClockRange(eta)}</div>
                {stage0SubMsg && <div className="eta">{stage0SubMsg}…</div>}
              </>
        }
      </div>

      {(!failed || willRetry) && !done && (
        <div className="bar"><div className="fill" style={{ width: `${Math.max(3, pctInt)}%` }} /></div>
      )}

      {willRetry && (
        <p className="hint center retry-hint">
          ⟳ 일시적 오류라 자동으로 다시 시도하고 있어요 ({retryCount + 1}/{retryMax})
          {retrying ? ' …' : ''}
        </p>
      )}

      {done && suggest && (
        <>
          <Bubble>
            <span className="bubble-emoji"><RefFileIcon size={34} /></span>
            <span>{suggest.summary}</span>
          </Bubble>
          <AnalysisDetail points={suggest.analysis} />
        </>
      )}

      {/* 다시 분석하기 — 완료 상태에서만 노출. 사용자가 결과가 부족하다고
          느끼면 추가 포커스를 적고 second-pass 분석을 돌릴 수 있다.
          백엔드는 이전 spec 을 프롬프트에 끼워 "그 이외" 를 채우라고 지시. */}
      {done && (
        <div className="reanalyze">
          {!reanalyzeOpen ? (
            <button
              type="button"
              className="btn ghost reanalyze-toggle"
              onClick={() => setReanalyzeOpen(true)}
              disabled={suggestBusy}
            >🔁 다시 분석하기 <span className="reanalyze-hint">(이전 결과 위에 보강)</span></button>
          ) : (
            <div className="reanalyze-form">
              <label className="reanalyze-label">
                특히 봐주길 원하는 부분 <small>(선택 · 비워두면 일반 보강)</small>
              </label>
              <textarea
                className="inp"
                rows={2}
                placeholder="예: 자막 폰트와 색을 더 자세히 / 점프컷 놓친 거 있는지 / BGM 분위기 다시 확인"
                value={reanalyzeFocus}
                onChange={e => setReanalyzeFocus(e.target.value)}
              />
              <p className="hint">
                ⓘ 이전 분석 결과를 프롬프트에 함께 넣어, 같은 답이 아니라 <b>놓쳤거나 부정확했던 부분</b>을 다시 보도록 요청합니다.
              </p>
              <div className="reanalyze-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setReanalyzeOpen(false); setReanalyzeFocus(''); }}
                >취소</button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={async () => {
                    setReanalyzeOpen(false);
                    await onReanalyze(reanalyzeFocus);
                    setReanalyzeFocus('');
                  }}
                >다시 분석 시작 →</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="nav">
        <button className="btn" onClick={onBack}>← 이전</button>
        <button
          className="btn primary"
          disabled={!done || suggestBusy}
          onClick={onNext}
        >옵션 채우러 가기 →</button>
      </div>

      {/* 디버그 전용 — 정확한 남은 시간 / raw 진행률은 사용자에게 노출하지 않고
          이 토글을 펼쳤을 때만 보이도록 분리. 평소엔 접혀 있음. */}
      <TimingDebug
        eta={eta}
        pct={pct}
        now={now}
        job={stage0Job}
        done={done}
        failed={failed}
        projectId={stage0Job?.projectId ?? null}
      />
    </section>
  );
}

// ============================================================
// 타이밍 디버그 — "정확한 N분 M초 남음" 처럼 정밀한 진행 정보는
// 사용자에겐 거슬리므로 토글로 숨겨두고, 디버깅할 때만 펼쳐서 본다.
// ============================================================
function TimingDebug({
  eta, pct, now, job, done, failed, projectId,
}: {
  eta: number;
  pct: number;
  now: number;
  job: Job | null;
  done: boolean;
  failed: boolean;
  projectId: string | null;
}) {
  const [show, setShow] = useState(false);
  const startedMs = job?.startedAt ? Date.parse(job.startedAt) : null;
  const elapsedSec = startedMs ? Math.max(0, (now - startedMs) / 1000) : 0;
  const state = done ? 'done' : failed ? 'error' : (job?.status ?? 'idle');
  return (
    <div className="log-section">
      <button className="btn ghost log-toggle" onClick={() => setShow(!show)}>
        {show ? '▾ 타이밍 디버그 숨기기' : '▸ 타이밍 디버그'}
        <span className="log-count">디버그 전용</span>
      </button>
      {show && (
        <div className="log timing-log">
          <div className="timing-row">
            <span className="timing-key">정확한 남은 시간</span>
            <span className="timing-val">{done ? '0초 (완료)' : fmtClockTicking(eta * 0.75)}</span>
          </div>
          <div className="timing-row">
            <span className="timing-key">Raw ETA</span>
            <span className="timing-val">{eta.toFixed(2)} s</span>
          </div>
          <div className="timing-row">
            <span className="timing-key">진행률 (raw)</span>
            <span className="timing-val">{(pct * 100).toFixed(2)}%</span>
          </div>
          <div className="timing-row">
            <span className="timing-key">경과 시간</span>
            <span className="timing-val">{elapsedSec.toFixed(1)} s</span>
          </div>
          <div className="timing-row">
            <span className="timing-key">Job 상태</span>
            <span className="timing-val">{state}</span>
          </div>
          {job?.id && (
            <div className="timing-row">
              <span className="timing-key">Job ID</span>
              <span className="timing-val mono">{job.id}</span>
            </div>
          )}
          {job?.startedAt && (
            <div className="timing-row">
              <span className="timing-key">시작 시각</span>
              <span className="timing-val mono">{job.startedAt}</span>
            </div>
          )}
          <EditSpecDebug projectId={projectId} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// 레퍼런스 분석 결과(edit-spec.json) 디버그 뷰어 — 타이밍 디버그 안에서만 노출.
// 펼칠 때 1회 fetch. 전체 JSON 을 보기 좋게 출력 (디버깅 전용).
// ============================================================
function EditSpecDebug({ projectId }: { projectId: string | null }) {
  const [open, setOpen] = useState(false);
  const [spec, setSpec] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!projectId) { setError('projectId 없음'); return; }
    setLoading(true); setError('');
    try {
      setSpec(await api.getEditSpec(projectId));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && spec === null && !loading) load();
  };

  return (
    <div className="spec-debug">
      <button type="button" className="spec-debug-toggle" onClick={toggle}>
        {open ? '▾' : '▸'} 레퍼런스 분석 결과 (edit-spec.json)
        <span className="spec-debug-refresh" onClick={(e) => { e.stopPropagation(); load(); }}>
          {loading ? '⟳' : '↻'}
        </span>
      </button>
      {open && (
        <div className="spec-debug-body">
          {error && <div className="err">{error}</div>}
          {!error && loading && <div className="log-empty">불러오는 중…</div>}
          {!error && !loading && spec === null && <div className="log-empty">아직 분석 결과가 없어요.</div>}
          {!error && !loading && spec && (
            <pre className="log-extra">{safeJson(spec)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

// 마스코트 말풍선
function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="bubble">{children}</div>;
}

// ============================================================
// 오디오 / 나레이션 옵션 — 옵션 단계에 들어가는 한 묶음.
//   1) 원본 영상 소리: 기본은 음원(BGM)만, 원하면 원본 소리를 작게/크게.
//   2) AI 음성 나레이션(TTS): 끄기 / 자막 읽기 / 새로 생성(자동·수동).
// ============================================================
function AudioNarrationOptions({
  originalAudio, setOriginalAudio,
  ttsEnabled, setTtsEnabled,
  ttsSource, setTtsSource,
  ttsGenMode, setTtsGenMode,
  ttsScript, setTtsScript,
  ttsVoice, setTtsVoice,
}: {
  originalAudio: OriginalVolume;
  setOriginalAudio: (v: OriginalVolume) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  ttsSource: TtsSource;
  setTtsSource: (v: TtsSource) => void;
  ttsGenMode: TtsGenMode;
  setTtsGenMode: (v: TtsGenMode) => void;
  ttsScript: string;
  setTtsScript: (v: string) => void;
  ttsVoice: string;
  setTtsVoice: (v: string) => void;
}) {
  return (
    <div className="audio-opts">
      {/* 원본 영상 소리 */}
      <div className="opt-block">
        <div className="opt-head">
          <span className="opt-title">🔊 원본 영상 소리</span>
          <span className="opt-sub">기본은 음원(BGM)만 나와요</span>
        </div>
        <div className="seg">
          {([
            ['mute', '음원만', '원본 소리 끔'],
            ['low', '작게 넣기', '음원 위주 + 현장음 살짝'],
            ['full', '크게 넣기', '현장음 + 음원은 아래로'],
          ] as [OriginalVolume, string, string][]).map(([val, label, desc]) => (
            <button
              type="button"
              key={val}
              className={'seg-btn' + (originalAudio === val ? ' on' : '')}
              onClick={() => setOriginalAudio(val)}
              title={desc}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* AI 음성 나레이션 */}
      <div className="opt-block">
        <div className="opt-head">
          <span className="opt-title">🎙 AI 음성 나레이션</span>
          <label className="switch">
            <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} />
            <span className="switch-track"><span className="switch-thumb" /></span>
            <span className="switch-label">{ttsEnabled ? '켜짐' : '꺼짐'}</span>
          </label>
        </div>

        {ttsEnabled && (
          <div className="opt-nested">
            {/* 내용 선택: 자막 읽기 vs 새로 생성 */}
            <div className="seg">
              {([
                ['captions', '자막 읽기', '화면 자막을 그대로 음성으로'],
                ['generate', '새로 생성', '나레이션을 새로 만들기'],
              ] as [TtsSource, string, string][]).map(([val, label, desc]) => (
                <button
                  type="button"
                  key={val}
                  className={'seg-btn' + (ttsSource === val ? ' on' : '')}
                  onClick={() => setTtsSource(val)}
                  title={desc}
                >{label}</button>
              ))}
            </div>

            {/* 새로 생성이면: 자동 vs 수동 */}
            {ttsSource === 'generate' && (
              <>
                <div className="seg">
                  {([
                    ['auto', '자동 생성', 'AI 가 영상 보고 작성'],
                    ['manual', '수동 작업', '내가 직접 대본 작성'],
                  ] as [TtsGenMode, string, string][]).map(([val, label, desc]) => (
                    <button
                      type="button"
                      key={val}
                      className={'seg-btn' + (ttsGenMode === val ? ' on' : '')}
                      onClick={() => setTtsGenMode(val)}
                      title={desc}
                    >{label}</button>
                  ))}
                </div>
                {ttsGenMode === 'manual' && (
                  <label className="full opt-script">나레이션 대본
                    <textarea
                      className="inp"
                      rows={3}
                      placeholder="음성으로 읽어줄 내용을 적어주세요. 문장 단위로 컷에 나눠 배치돼요."
                      value={ttsScript}
                      onChange={e => setTtsScript(e.target.value)}
                    />
                  </label>
                )}
              </>
            )}

            {/* 목소리 선택 */}
            <label className="opt-voice">목소리
              <select className="inp" value={ttsVoice} onChange={e => setTtsVoice(e.target.value)}>
                {TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 레퍼런스 분석 항목별 상세 — 말풍선 아래에 접이식으로 표시.
// summary(한 줄) 보다 자세히, 무드/리듬/색감/자막/오디오/소재 등을 풀어 보여준다.
// ============================================================
function AnalysisDetail({ points }: { points?: { label: string; detail: string }[] }) {
  const [open, setOpen] = useState(true);
  if (!points || points.length === 0) return null;
  return (
    <div className="analysis">
      <button type="button" className="analysis-toggle" onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} 분석 내용 자세히 보기
        <span className="analysis-count">{points.length}</span>
      </button>
      {open && (
        <ul className="analysis-list">
          {points.map((p, i) => (
            <li key={i} className="analysis-item">
              <span className="analysis-label">{p.label}</span>
              <span className="analysis-text">{p.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// 레퍼런스 파일 아이콘 — Posty 스프라이트(이미지 4) 안의 "이미지/파일
// placeholder" 아이콘 스타일을 인라인 SVG 로 재현. 점선 라운드 프레임 +
// 산 실루엣 + 작은 해. 분석 완료 말풍선 좌측에 들어가 "분석한 레퍼런스
// 영상" 을 시각적으로 상기시킨다.
// ============================================================
function RefFileIcon({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="레퍼런스 파일"
    >
      {/* 점선 라운드 프레임 */}
      <rect
        x="3.2" y="7" width="29.6" height="22" rx="4"
        stroke="rgba(185,169,240,0.7)"
        strokeWidth="1.4"
        strokeDasharray="3.2 2.4"
        fill="rgba(185,169,240,0.10)"
      />
      {/* 해 */}
      <circle cx="11.5" cy="14" r="2.3" fill="#f2a9c4" opacity="0.92" />
      {/* 산 두 개 — 뒤쪽 큰 산 */}
      <path
        d="M5.5 26.5 L13.5 16.5 L21 24 L21 26.5 Z"
        fill="rgba(185,169,240,0.55)"
      />
      {/* 산 — 앞쪽 작은 산 */}
      <path
        d="M16 26.5 L23 19.5 L30.5 26.5 Z"
        fill="rgba(158,230,192,0.6)"
      />
    </svg>
  );
}

// ============================================================
// 태그 입력 — 단일 선택 (tone / purpose)
// ============================================================
function ChipSingle({
  label, value, pool, placeholder, examples, onChange, onAddToPool,
}: {
  label: string;
  value: string;
  pool: string[];
  placeholder: string;
  examples: string[];
  onChange: (v: string) => void;
  onAddToPool: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const example = placeholder || examples.join(', ');

  const confirm = () => {
    const v = draft.trim();
    if (!v) { setAdding(false); return; }
    onAddToPool(v);
    onChange(v);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="tagblock">
      <div className="tagblock-head">
        <span className="tagblock-label">{label}</span>
        {value && <span className="tagblock-current">선택: <b>{value}</b></span>}
      </div>
      <div className="tags">
        {pool.length === 0 && !adding && (
          <span className="tag-placeholder">{example}</span>
        )}
        {pool.map(p => (
          <button
            type="button"
            key={p}
            className={'tag ' + (value === p ? 'on' : '')}
            onClick={() => onChange(value === p ? '' : p)}
          >{p}</button>
        ))}
        {adding ? (
          <span className="tag-add-input">
            <input
              autoFocus
              className="tag-input"
              value={draft}
              placeholder={example}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirm(); }
                if (e.key === 'Escape') { setAdding(false); setDraft(''); }
              }}
              onBlur={confirm}
            />
          </span>
        ) : (
          <button type="button" className="tag tag-plus" onClick={() => setAdding(true)}>+ 추가</button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 태그 입력 — 다중 선택 (keywords / phrases)
// ============================================================
function ChipMulti({
  label, values, placeholder, examples, onAdd, onRemove,
}: {
  label: string;
  values: string[];
  placeholder: string;
  examples: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const example = placeholder || examples.join(', ');

  const confirm = () => {
    const v = draft.trim();
    if (!v) { setAdding(false); return; }
    onAdd(v);
    setDraft('');
    // 연속 추가가 자연스러우므로 입력창 유지
  };

  return (
    <div className="tagblock">
      <div className="tagblock-head">
        <span className="tagblock-label">{label}</span>
        {values.length > 0 && <span className="tagblock-count">{values.length}개</span>}
      </div>
      <div className="tags">
        {values.length === 0 && !adding && (
          <span className="tag-placeholder">{example}</span>
        )}
        {values.map(v => (
          <button
            type="button"
            key={v}
            className="tag on"
            onClick={() => onRemove(v)}
            title="클릭해서 제거"
          >{v} <span className="tag-x">×</span></button>
        ))}
        {adding ? (
          <span className="tag-add-input">
            <input
              autoFocus
              className="tag-input"
              value={draft}
              placeholder={example}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirm(); }
                if (e.key === 'Escape') { setAdding(false); setDraft(''); }
              }}
              onBlur={() => {
                if (!draft.trim()) { setAdding(false); }
                else confirm();
              }}
            />
          </span>
        ) : (
          <button type="button" className="tag tag-plus" onClick={() => setAdding(true)}>+ 추가</button>
        )}
      </div>
    </div>
  );
}

// 소스 영상 드롭존 — 클릭 시 탐색기, 드래그&드롭 모두 지원
function SourceDropzone({ busy, onFiles }: { busy: boolean; onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const open = () => inputRef.current?.click();

  return (
    <div
      className={'dropzone' + (dragging ? ' dragging' : '') + (busy ? ' busy' : '')}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      role="button"
      tabIndex={0}
      onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      <div className="dz-icon">
        <Posty size={72} variant="logo" working={busy} />
      </div>
      <div className="dz-title">
        {busy ? '업로드 중…' : dragging ? '여기로 놓아주세요' : '영상 파일을 드래그하거나 클릭'}
      </div>
      <div className="dz-sub">여러 개 한 번에 가능 · MP4 / MOV / WebM / MKV</div>
    </div>
  );
}

// 생성 진행 — 로그는 기본 숨김, "로그 확인" 버튼으로 토글
function ProgressPanel({
  job, estimate, now, projectId, frames, framesLoading, fromStage, toStage, phaseLabel, retryCount, retryMax, retrying, onReset,
}: {
  job: Job | null;
  estimate: Estimate | null;
  now: number;
  projectId: string | null;
  frames: PreviewFrame[];
  framesLoading: boolean;
  fromStage: number;
  toStage: number;
  phaseLabel?: string;
  retryCount: number;
  retryMax: number;
  retrying: boolean;
  onReset: () => void;
}) {
  const failed = job?.status === 'error';
  const willRetry = failed && retryCount < retryMax;
  const showError = failed && !willRetry;
  const { pct, eta, currentStage } = phaseProgress(job, estimate?.perStage ?? null, fromStage, toStage, now);
  const pctInt = Math.round(pct * 100);
  // 이 단계에 해당하는 stage 들 (fromStage..toStage)
  const phaseStages: number[] = [];
  for (let s = fromStage; s <= toStage; s++) phaseStages.push(s);
  return (
    <section className="card progress">
      <div className="prog-split">
        <div className="prog-left">
          <Posty size={96} working={!showError} />
          {showError ? <div className="err">{job?.error}</div> : (
            <>
              <div className="pct">{pctInt}%</div>
              <div className="eta">{fmtClockRange(eta)}</div>
            </>
          )}
        </div>
        {!showError && frames.length > 0 && (
          <div className="prog-right">
            <FrameCarousel frames={frames} />
            <div className="carousel-tag">이런 장면들 위주로 작업하고 있어요</div>
          </div>
        )}
        {!showError && frames.length === 0 && framesLoading && (
          <div className="prog-right">
            <div className="carousel-skeleton" aria-busy="true" aria-label="미리보기 불러오는 중">
              <div className="sk side" />
              <div className="sk center" />
              <div className="sk side" />
            </div>
            <div className="carousel-tag">미리보기 불러오는 중…</div>
          </div>
        )}
      </div>
      {!showError && (
        <>
          {phaseLabel && <div className="phase-label">{phaseLabel}</div>}
          <div className="bar"><div className="fill" style={{ width: `${Math.max(3, pctInt)}%` }} /></div>
          <ol className="steps">
            {phaseStages.map((stage) => {
              const name = STAGE_NAMES[stage];
              const state = stage < currentStage ? 'ok' : stage === currentStage ? 'cur' : 'todo';
              return <li key={stage} className={state}>{state === 'ok' ? '✓' : state === 'cur' ? '◴' : '○'} {name}</li>;
            })}
          </ol>
          {willRetry && (
            <p className="hint center retry-hint">
              ⟳ 일시적 오류라 자동으로 다시 시도하고 있어요 ({retryCount + 1}/{retryMax})
              {retrying ? ' …' : ''}
            </p>
          )}
          <p className="hint center close-tab-hint">
            이 창을 켜둔 상태로 벗어나셔도 좋아요. 완료되면 알려드릴게요.
          </p>
        </>
      )}
      <TimingDebug eta={eta} pct={pct} now={now} job={job} done={job?.status === 'done'} failed={showError} projectId={projectId} />
      <DebugLog job={job} projectId={projectId} active={!showError} />
      {showError && <div className="row"><button className="btn" onClick={onReset}>처음으로</button></div>}
    </section>
  );
}

// ============================================================
// 진행 화면 캐러셀 — 프레임 자동 회전 + 마우스 호버 시 일시정지
// ============================================================
function FrameCarousel({ frames }: { frames: PreviewFrame[] }) {
  // 프레임 순서를 한 번 무작위로 섞는다 (Fisher–Yates).
  // - 원본 순서대로면 동시에 보이는 3장이 거의 인접(=비슷한) 장면이라 단조롭다.
  // - 섞으면 회전 순서가 랜덤이고, 동시에 보이는 3장도 타임라인상 멀리 떨어진 장면이 된다.
  const shuffled = useMemo(() => {
    const a = frames.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [frames]);

  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (hover || shuffled.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % shuffled.length), 1600);
    return () => clearInterval(t);
  }, [hover, shuffled.length]);

  // 3 장이 동시에 보이는 휠 — 가운데가 활성, 좌우는 흐릿하게
  // (offset 이 음수일 수 있어 두 번 나눠야 안전한 모듈러)
  const at = (offset: number) => {
    const n = shuffled.length;
    return shuffled[((idx + offset) % n + n) % n];
  };
  return (
    <div
      className="carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="carousel-wheel">
        <img className="carousel-slot side" src={at(-1).url} alt="" />
        <img className="carousel-slot center" key={at(0).url} src={at(0).url} alt="" />
        <img className="carousel-slot side" src={at(1).url} alt="" />
      </div>
      <div className="carousel-dots">
        {shuffled.map((_, i) => (
          <span key={i} className={'carousel-dot ' + (i === idx ? 'on' : '')} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 자막 단계 — 영상(좌) + 설정·생성된 자막·재생성(우) 2단.
//   generated=false : 편집본(graded) 보며 자막 설정 → "자막 생성"
//   generated=true  : 캡션된 영상 + 생성된 자막 목록 확인 → "재생성" / "다음(BGM)"
// ============================================================
function CaptionPanel({
  videoUrl, generated, captionList, brief, setBrief, extraNotes, setExtraNotes,
  genError, onBack, onGenerate, onNext,
}: {
  videoUrl: string | null;
  generated: boolean;
  captionList: { start: number; layers: string[] }[];
  brief: SuggestBrief;
  setBrief: React.Dispatch<React.SetStateAction<SuggestBrief>>;
  extraNotes: string;
  setExtraNotes: (v: string) => void;
  genError: string;
  onBack: () => void;
  onGenerate: () => void;
  onNext: () => void;
}) {
  return (
    <section className="card">
      <div className="cardhead">
        <span className="num">5</span>
        <h2>자막 {generated
          ? <small>(생성된 자막을 확인하고, 마음에 안 들면 재생성하세요)</small>
          : <small>(편집본을 보고 자막 분위기·방식을 정하세요)</small>}</h2>
      </div>

      <div className="side-split">
        {/* 좌 — 영상 미리보기 */}
        <div className="side-video">
          {videoUrl
            ? <video className="side-video-el" src={videoUrl} controls playsInline loop muted={!generated} key={videoUrl} />
            : <div className="side-video-ph">미리보기 준비 중…</div>}
          <div className="side-video-tag">
            {generated ? '🎬 자막까지 입힌 결과' : '🎬 편집본 (컷+보정) — 여기에 자막을 입힙니다'}
          </div>
        </div>

        {/* 우 — 설정 + 생성된 자막 + 액션 */}
        <div className="side-pane">
          {generated && (
            <div className="cap-review">
              <div className="cap-review-head">📝 생성된 자막 <span className="cap-review-count">{captionList.length}컷</span></div>
              {captionList.length === 0
                ? <div className="cap-review-empty">이 영상엔 자막이 없어요 (자막 없음 설정이거나 레퍼런스에 자막이 없는 구간).</div>
                : (
                  <ul className="cap-review-list">
                    {captionList.map((c, i) => (
                      <li key={i} className="cap-review-item">
                        <span className="cap-review-t">{fmtClock(c.start)}</span>
                        <span className="cap-review-text">
                          {c.layers.map((t, j) => (
                            <span key={j} className="cap-review-line">{t.split('\n').join(' / ')}</span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          <div className="cap-settings">
            <div className="grid">
              <label>자막 언어
                <select className="inp" value={brief.caption_language}
                  onChange={e => setBrief(b => ({ ...b, caption_language: e.target.value as SuggestBrief['caption_language'] }))}>
                  <option value="">레퍼런스 따라가기</option>
                  <option value="ko">한국어</option>
                  <option value="en">영어</option>
                  <option value="mixed">한+영 혼합</option>
                </select>
              </label>
              <label>자막 빈도
                <select className="inp" value={brief.caption_density}
                  onChange={e => setBrief(b => ({ ...b, caption_density: e.target.value as SuggestBrief['caption_density'] }))}>
                  <option value="">레퍼런스 따라가기</option>
                  <option value="every_cut">모든 컷</option>
                  <option value="most_cuts">대부분 컷</option>
                  <option value="occasional">가끔</option>
                  <option value="minimal">최소</option>
                  <option value="none">자막 없음</option>
                </select>
              </label>
              <label>자막 텍스트 방식
                <select className="inp" value={brief.caption_mode}
                  onChange={e => setBrief(b => ({ ...b, caption_mode: e.target.value as SuggestBrief['caption_mode'] }))}>
                  <option value="">레퍼런스 따라가기</option>
                  <option value="per_scene">컷마다 다른 자막</option>
                  <option value="brand_title">브랜드 타이틀 고정 + 훅 변주</option>
                  <option value="continuous">하나의 타이틀 유지</option>
                  <option value="none">자막 없음</option>
                </select>
              </label>
            </div>
            <label className="full">자막 메모 (분위기·상세)
              <textarea className="inp" rows={2} placeholder="예: 감성적인 톤, 첫 컷에 가게 이름 크게"
                value={extraNotes} onChange={e => setExtraNotes(e.target.value)} />
            </label>
            {generated && <p className="hint"><b>재생성</b>을 누르면 같은 컷·스타일은 그대로 두고 자막 <b>문구만 새로</b> 바꿔요 (누를 때마다 다른 문구 · 컷 재편집 없음). 설정·메모를 바꾸면 그 방향으로 반영돼요.</p>}
          </div>
        </div>
      </div>

      {genError && <div className="err">{genError}</div>}
      <div className="nav">
        <button className="btn" onClick={onBack}>← 옵션</button>
        {generated ? (
          <div className="nav-group">
            <button className="btn" onClick={onGenerate}>🔁 재생성</button>
            <button className="btn primary" onClick={onNext}>다음 (BGM) →</button>
          </div>
        ) : (
          <button className="btn primary" onClick={onGenerate}>자막 생성 →</button>
        )}
      </div>
    </section>
  );
}

// ============================================================
// BGM 고르기 — 레퍼런스 실제 BGM 정보 + 무료 추천 트랙 후보 + 미리듣기 + 선택
// ============================================================
function BgmPanel({
  resp, busy, error, pick, setPick, pickBusy, genError, captionedUrl, onBack, onConfirm,
}: {
  resp: BgmCandidatesResp | null;
  busy: boolean;
  error: string;
  pick: 'none' | string | null;
  setPick: (v: 'none' | string) => void;
  pickBusy: boolean;
  genError: string;
  captionedUrl: string | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  // 미리듣기 — 한 번에 하나만 재생되도록 ref 공유
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 한 번에 하나만 재생 — 무료 후보(source_url)와 유료 추천 미리듣기(preview_url) 공용.
  const playUrl = (id: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    const a = new Audio(url);
    a.volume = 0.7;
    a.onended = () => setPlayingId(null);
    a.onerror = () => setPlayingId(null);
    audioRef.current = a;
    a.play().catch(() => setPlayingId(null));
    setPlayingId(id);
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const ref = resp?.referenceBgm;
  const refKnown = ref && ref.status === 'matched';

  return (
    <section className="card">
      <div className="cardhead"><span className="num">6</span><h2>BGM 입히기</h2></div>
      <p className="hint">
        컷편집 + 자막까지 끝난 결과예요. 왼쪽 영상을 재생해두고 오른쪽에서 음원을 들어보며 어울리는 트랙을 고르세요. BGM 없이 진행할 수도 있어요.
      </p>

      <div className="side-split">
        {/* 좌 — 편집 결과 영상 */}
        <div className="side-video">
          {captionedUrl
            ? <video className="side-video-el" src={captionedUrl} controls playsInline loop muted key={captionedUrl} />
            : <div className="side-video-ph">미리보기 준비 중…</div>}
          <div className="side-video-tag">🎬 편집 결과 (컷+자막) — 음원과 함께 재생해 확인</div>
        </div>

        {/* 우 — 레퍼런스 음원 정보 + 후보 리스트 */}
        <div className="side-pane">
      {/* 1) 레퍼런스 원곡 — 맨 위 (식별됐을 때만, 강조) */}
      {refKnown && (
        <div className="ref-bgm ref-bgm-top">
          <div className="ref-bgm-head">🎯 레퍼런스가 쓴 곡 <span className="ref-bgm-badge">원곡</span></div>
          <div className="ref-bgm-body">
            <div className="ref-bgm-title">{ref?.title}{ref?.artist ? ` — ${ref?.artist}` : ''}</div>
            {ref?.album && <div className="ref-bgm-sub">{ref?.album}{ref?.release_date ? ` · ${ref?.release_date.slice(0, 4)}` : ''}</div>}
            {ref?.genres && ref.genres.length > 0 && (
              <div className="ref-bgm-chips">
                {ref.genres.slice(0, 4).map(g => <span className="chip" key={g}>{g}</span>)}
              </div>
            )}
            <div className="ref-bgm-links">
              {ref?.spotify_url && <a href={ref.spotify_url} target="_blank" rel="noreferrer" className="bgm-link sp">Spotify ↗</a>}
              {ref?.apple_url && <a href={ref.apple_url} target="_blank" rel="noreferrer" className="bgm-link am">Apple Music ↗</a>}
              {ref?.song_link && <a href={ref.song_link} target="_blank" rel="noreferrer" className="bgm-link">기타 ↗</a>}
            </div>
            <div className="ref-bgm-note">상용곡이라 영상엔 바로 못 넣어요. 아래 추천 곡을 듣고 직접 준비하거나, 무료 음원을 입히세요.</div>
          </div>
        </div>
      )}

      {busy && <div className="bgm-loading">🎶 추천 음원을 가져오는 중…</div>}
      {error && <div className="err">{error}</div>}

      {resp && (
        <>
          {/* 2) 유료·유명 음원 추천 (정보·링크만 — 임베드 X) */}
          {resp.paid.length > 0 && (
            <div className="bgm-section">
              <div className="bgm-section-head">💰 유료·유명 음원 <span className="bgm-section-sub">분위기에 맞는 유명 곡 (영상엔 못 넣어요 · 들어보고 직접)</span></div>
              <div className="bgm-paid-list">
                {resp.paid.map((t, i) => {
                  const pid = 'paid:' + i;
                  const playing = playingId === pid;
                  return (
                    <div key={i} className="bgm-paid-item">
                      {t.artwork
                        ? <img className="bgm-art" src={t.artwork} alt="" />
                        : <span className="bgm-rank">{i + 1}</span>}
                      {t.preview_url && (
                        <button
                          type="button"
                          className={'bgm-play' + (playing ? ' on' : '')}
                          onClick={() => playUrl(pid, t.preview_url!)}
                          aria-label={playing ? '일시정지' : '미리듣기'}
                        >{playing ? '⏸' : '▶'}</button>
                      )}
                      <div className="bgm-meta">
                        <div className="bgm-title">{t.title} <span className="bgm-artist">— {t.artist}</span></div>
                        <div className="bgm-sub">{[t.genre, t.year].filter(Boolean).join(' · ')}{t.verified ? ' · ✓ 확인됨' : ''}</div>
                        {t.reason && <div className="bgm-reason">{t.reason}</div>}
                      </div>
                      <div className="bgm-paid-links">
                        {t.apple_url && <a href={t.apple_url} target="_blank" rel="noreferrer" className="bgm-link am">Apple ↗</a>}
                        <a href={t.spotify_url} target="_blank" rel="noreferrer" className="bgm-link sp">Spotify ↗</a>
                        <a href={t.youtube_url} target="_blank" rel="noreferrer" className="bgm-link yt">YouTube ↗</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3) 무료 음원 (선택 시 영상에 입힘) */}
          <div className="bgm-section">
            <div className="bgm-section-head">🆓 무료 음원 <span className="bgm-section-sub">선택하면 영상에 입혀져요</span></div>
            <div className="bgm-list">
              {resp.free.map((c, i) => {
                const checked = pick === c.identifier;
                const playing = playingId === c.identifier;
                return (
                  <div key={c.identifier} className={'bgm-item' + (checked ? ' on' : '')}>
                    <label className="bgm-item-pick">
                      <input type="radio" name="bgm-pick" checked={checked} onChange={() => setPick(c.identifier)} />
                      <span className="bgm-radio" />
                    </label>
                    <button
                      type="button"
                      className={'bgm-play' + (playing ? ' on' : '')}
                      onClick={() => playUrl(c.identifier, c.source_url)}
                      aria-label={playing ? '일시정지' : '미리듣기'}
                    >{playing ? '⏸' : '▶'}</button>
                    <div className="bgm-meta">
                      <div className="bgm-title">{c.title || `Track ${i + 1}`}</div>
                      <div className="bgm-sub">{fmtDur(c.duration_sec)} · Internet Archive</div>
                    </div>
                  </div>
                );
              })}
              {resp.free.length === 0 && <div className="bgm-empty">어울리는 무료 음원을 찾지 못했어요. 위 추천 곡을 참고하거나 BGM 없이 진행하세요.</div>}
              <div className={'bgm-item bgm-none' + (pick === 'none' ? ' on' : '')}>
                <label className="bgm-item-pick">
                  <input type="radio" name="bgm-pick" checked={pick === 'none'} onChange={() => setPick('none')} />
                  <span className="bgm-radio" />
                </label>
                <div className="bgm-meta">
                  <div className="bgm-title">BGM 없이 진행</div>
                  <div className="bgm-sub">원본 영상 사운드만 사용</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
        </div>{/* /side-pane */}
      </div>{/* /side-split */}

      {genError && <div className="err">{genError}</div>}
      <div className="nav">
        <button className="btn" onClick={onBack} disabled={pickBusy}>← 이전</button>
        <button
          className="btn primary"
          disabled={busy || pickBusy || !pick}
          onClick={onConfirm}
        >{pickBusy
          ? '영상 만드는 중…'
          : pick === 'none'
            ? '🎬 BGM 없이 영상 받으러 가기'
            : '✨ 이 음원으로 영상 받으러 가기'}</button>
      </div>
    </section>
  );
}

function fmtDur(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ResultPanel({
  finalPath, job, projectId, onReset, onBackToOptions,
}: {
  finalPath: string;
  job: Job | null;
  projectId: string | null;
  onReset: () => void;
  onBackToOptions: () => void;
}) {
  return (
    <section className="card result">
      <div className="cardhead"><h2>✅ 완성!</h2></div>
      <video className="preview" src={api.fileUrl(finalPath)} controls playsInline />
      <div className="row">
        <a className="btn primary" href={api.fileUrl(finalPath)} download>⬇ 다운로드</a>
        <button className="btn" onClick={onBackToOptions}>옵션 수정해서 다시 생성</button>
        <button className="btn" onClick={onReset}>새 영상 만들기</button>
      </div>
      <DebugLog job={job} projectId={projectId} active={false} />
    </section>
  );
}

// ============================================================
// 디버그 로그 — 진행 로그(progress) + raw API 응답(raw-api-responses.json)
// "▸ 로그 확인" 버튼 토글. 평소엔 숨김, 디버깅할 때만 펼침.
// active=true 면 (생성 진행 중) 펼친 동안 5초 간격으로 raw responses 폴링.
// ============================================================
function DebugLog({
  job, projectId, active,
}: {
  job: Job | null;
  projectId: string | null;
  active: boolean;
}) {
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState<'progress' | 'raw'>('progress');
  const [raw, setRaw] = useState<{ total: number; entries: any[] } | null>(null);
  const [rawError, setRawError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRaw = async () => {
    if (!projectId) return;
    setLoading(true); setRawError('');
    try {
      setRaw(await api.getRawResponses(projectId, 500));
    } catch (e: any) {
      setRawError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // 펼친 직후 1회 로드 + active 중에는 5초 간격 폴링
  useEffect(() => {
    if (!show) return;
    fetchRaw();
    if (!active) return;
    const t = setInterval(fetchRaw, 5000);
    return () => clearInterval(t);
  }, [show, active, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const progEntries = job?.progress || [];

  return (
    <div className="log-section">
      <button className="btn ghost log-toggle" onClick={() => setShow(!show)}>
        {show ? '▾ 로그 숨기기' : '▸ 로그 확인'}
        <span className="log-count">{progEntries.length} 진행 · {raw?.total ?? '?'} API</span>
      </button>
      {show && (
        <>
          <div className="log-tabs">
            <button
              className={'log-tab ' + (tab === 'progress' ? 'on' : '')}
              onClick={() => setTab('progress')}
            >진행 로그 ({progEntries.length})</button>
            <button
              className={'log-tab ' + (tab === 'raw' ? 'on' : '')}
              onClick={() => setTab('raw')}
            >API 응답 ({raw?.total ?? '…'})</button>
            <button className="log-refresh" onClick={fetchRaw} disabled={loading}>
              {loading ? '⟳' : '↻'} 새로고침
            </button>
          </div>

          {tab === 'progress' && (
            <div className="log">
              {progEntries.length === 0
                ? <div className="log-empty">아직 기록된 진행 로그가 없어요.</div>
                : progEntries.map((p, i) => <ProgressEntry key={i} entry={p} />)}
            </div>
          )}

          {tab === 'raw' && (
            <div className="log">
              {rawError && <div className="err">{rawError}</div>}
              {!raw && !rawError && <div className="log-empty">불러오는 중…</div>}
              {raw && raw.entries.length === 0 && <div className="log-empty">아직 기록된 API 응답이 없어요.</div>}
              {raw && raw.entries.map((e, i) => <RawEntry key={i} entry={e} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 진행 로그 한 줄 — msg 외에 extra 객체도 펼침
function ProgressEntry({ entry }: { entry: { step: string; msg: string; at: string; extra?: any } }) {
  const [open, setOpen] = useState(false);
  const hasExtra = entry.extra && Object.keys(entry.extra).length > 0;
  return (
    <div className="log-entry">
      <div className="log-entry-head" onClick={() => hasExtra && setOpen(!open)}>
        <span className="log-time">{formatTime(entry.at)}</span>
        <span className="log-step">{entry.step}</span>
        <span className="log-msg">{entry.msg}</span>
        {hasExtra && <span className="log-toggle-mini">{open ? '▾' : '▸'}</span>}
      </div>
      {hasExtra && open && (
        <pre className="log-extra">{safeJson(entry.extra)}</pre>
      )}
    </div>
  );
}

// raw API 응답 한 줄 — 클릭하면 전체 JSON 펼침
function RawEntry({ entry }: { entry: any }) {
  const [open, setOpen] = useState(false);
  const title = `Stage ${entry.stage ?? '?'} · ${entry.kind ?? '?'}`;
  const sub = entry.model || entry.filename || entry.video_id || '';
  return (
    <div className="log-entry">
      <div className="log-entry-head" onClick={() => setOpen(!open)}>
        <span className="log-time">{formatTime(entry.at)}</span>
        <span className="log-step">{title}</span>
        {sub && <span className="log-msg">{sub}</span>}
        <span className="log-toggle-mini">{open ? '▾' : '▸'}</span>
      </div>
      {open && <pre className="log-extra">{safeJson(entry)}</pre>}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch { return iso; }
}

function safeJson(v: any): string {
  try {
    const s = JSON.stringify(v, null, 2);
    // 너무 큰 응답은 잘라서 표시 (12k char)
    return s.length > 12000 ? s.slice(0, 12000) + `\n\n… (${s.length - 12000} char 생략됨)` : s;
  } catch { return String(v); }
}
