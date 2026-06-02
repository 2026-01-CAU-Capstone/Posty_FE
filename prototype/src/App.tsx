import { useEffect, useRef, useState } from 'react';
import { api, Estimate, Job, StyleBrief, StyleSuggest, SuggestBrief } from './api';
import { Posty } from './Posty';

const STAGE_NAMES = ['레퍼런스 분석', '컷편집', '색보정', '자막', '음성·BGM'];

type Step = 'ref' | 'sources' | 'waiting' | 'options' | 'run';
const STEPS: { key: Step; label: string }[] = [
  { key: 'ref',      label: '레퍼런스' },
  { key: 'sources',  label: '소스' },
  { key: 'waiting',  label: '분석 대기' },
  { key: 'options',  label: '옵션' },
  { key: 'run',      label: '생성' },
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
function usePolledJob(jobId: string | null): Job | null {
  const [job, setJob] = useState<Job | null>(null);
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
      } catch { /* 재시도 */ }
      if (active) timer = setTimeout(tick, 1500);
    };
    timer = setTimeout(tick, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [jobId]);
  return job;
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}분 ${r}초` : `${r}초`;
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
    caption_language: '', caption_density: '',
  });
  // tone / purpose 는 단일 선택. 후보 풀(추천 + 사용자 추가)을 관리.
  const [tonePool, setTonePool] = useState<string[]>([]);
  const [purposePool, setPurposePool] = useState<string[]>([]);
  const [extraNotes, setExtraNotes] = useState('');

  const [stage0JobId, setStage0JobId] = useState<string | null>(null);
  const [mainJobId, setMainJobId] = useState<string | null>(null);
  const [genError, setGenError] = useState('');

  const stage0Job = usePolledJob(stage0JobId);
  const mainJob = usePolledJob(mainJobId);

  const stage0Done = stage0Job?.status === 'done';
  const stage0Error = stage0Job?.status === 'error';
  const stage0Running = refStarted && !stage0Done && !stage0Error;
  const mainRunning = !!mainJob && mainJob.status !== 'done' && mainJob.status !== 'error';
  const now = useNow(stage0Running || mainRunning);

  const finalPath: string | null = mainJob?.status === 'done' ? (mainJob.result?.final ?? null) : null;

  useEffect(() => { api.health().then(setOnline); }, []);

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

  async function generate() {
    if (!projectId) return;
    setGenError('');
    try {
      const payload: StyleBrief = {
        caption_language: brief.caption_language,
        caption_density: brief.caption_density,
        tone: brief.tone.trim(),
        purpose: brief.purpose.trim(),
        topic_keywords: brief.topic_keywords.slice(0, 20),
        must_include_phrases: brief.must_include_phrases.slice(0, 10),
        extra_notes: extraNotes.trim(),
      };
      await api.saveStyleBrief(projectId, payload);
      // extra_notes 와 같이 통합 — 기존 saveStyleNote 는 호환 위해 자유 메모를 전체 전달
      await api.saveStyleNote(projectId, extraNotes.trim());
      await refreshEstimate(projectId);
      setMainJobId(await api.run(projectId, { mode: 'all', from: 1, to: 4 }));
      setStep('run');
    } catch (e: any) {
      setGenError(e.message || String(e));
    }
  }

  function resetAll() {
    setStep('ref'); setProjectId(null); setEstimate(null);
    setRefMode('url'); setRefUrl(''); setRefFile(null); setRefStarted(false); setRefError('');
    setUploadedSources([]); setSrcError('');
    setSuggest(null); setSuggestError(''); setSuggestBusy(false);
    setBrief({ tone: '', purpose: '', topic_keywords: [], must_include_phrases: [], caption_language: '', caption_density: '' });
    setTonePool([]); setPurposePool([]); setExtraNotes('');
    setStage0JobId(null); setMainJobId(null); setGenError('');
  }

  return (
    <div className="page">
      <header className="hd">
        <div className="logo"><Posty size={46} variant="logo" working={stage0Running || mainRunning} /><h1>Posty</h1></div>
        <p>레퍼런스 릴스의 스타일로 내 영상을 자동 편집</p>
        <span className={'status ' + (online ? 'on' : online === false ? 'off' : '')}>
          {online == null ? '서버 확인 중…' : online ? '백엔드 연결됨' : '백엔드 미연결 (cd backend → npm run dev)'}
        </span>
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
            <button className="btn primary" onClick={startReference}>분석 시작하고 다음 →</button>
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
          onBack={() => setStep('sources')}
          onNext={() => setStep('options')}
        />
      )}

      {/* ── STEP: 옵션 ── */}
      {step === 'options' && (
        <section className="card">
          {suggest && (
            <Bubble>
              <span className="bubble-emoji">🐻</span>
              <span>{suggest.summary}</span>
            </Bubble>
          )}
          <div className="cardhead"><span className="num">4</span><h2>편집 옵션 <small>(추천이 미리 채워져 있어요 — 자유 수정)</small></h2></div>

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
          </div>

          <label className="full">추가 메모
            <textarea className="inp" rows={2} placeholder="자유롭게 — 예: 첫 컷에 가게 이름 크게"
              value={extraNotes} onChange={e => setExtraNotes(e.target.value)} />
          </label>

          {estimate && <p className="hint center">예상 소요 시간 약 <b>{fmtClock(estimate.total14)}</b></p>}
          {genError && <div className="err">{genError}</div>}
          <div className="nav">
            <button className="btn" onClick={() => setStep('waiting')}>← 이전</button>
            <button className="btn primary" disabled={!stage0Done || mainJobId !== null} onClick={generate}>✨ 영상 생성</button>
          </div>
        </section>
      )}

      {/* ── STEP: 생성/결과 ── */}
      {step === 'run' && (
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
  return (
    <div className="stepind">
      {STEPS.map((s, i) => (
        <div key={s.key} className={'sind ' + (i < idx ? 'done' : i === idx ? 'cur' : '')}>
          <span className="dot">{i < idx ? '✓' : i + 1}</span>
          <span className="lbl">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Waiting 단계 — Stage 0 polling + 실측 진행률 + 완료 시 말풍선
// ============================================================
function WaitingPanel({
  stage0Job, estimate, now, suggest, suggestBusy, suggestError, onBack, onNext,
}: {
  stage0Job: Job | null;
  estimate: Estimate | null;
  now: number;
  suggest: StyleSuggest | null;
  suggestBusy: boolean;
  suggestError: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const failed = stage0Job?.status === 'error';
  const done = stage0Job?.status === 'done';

  // Stage 0 만의 진행률 (from=0, to=0). perStage[0] 기준 실측.
  const { pct, eta } = phaseProgress(stage0Job, estimate?.perStage ?? null, 0, 0, now);
  const pctInt = done ? 100 : Math.round(pct * 100);

  return (
    <section className="card progress">
      <div className="cardhead"><span className="num">3</span><h2>레퍼런스 분석</h2></div>

      <div className="prog-hero">
        <Posty size={96} working={!done && !failed} />
        {failed
          ? <div className="err">분석 실패: {stage0Job?.error}</div>
          : done
            ? <>
                <div className="pct done">분석 완료!</div>
                {suggestBusy && <div className="eta">Posty가 영상을 정리하는 중…</div>}
                {suggestError && <div className="err">옵션 추천 실패: {suggestError}</div>}
              </>
            : <>
                <div className="pct">{pctInt}%</div>
                <div className="eta">남은 시간 약 {fmtClock(eta)}</div>
              </>
        }
      </div>

      {!failed && !done && (
        <div className="bar"><div className="fill" style={{ width: `${Math.max(3, pctInt)}%` }} /></div>
      )}

      {done && suggest && (
        <Bubble>
          <span className="bubble-emoji">🐻</span>
          <span>{suggest.summary}</span>
        </Bubble>
      )}

      <div className="nav">
        <button className="btn" onClick={onBack}>← 이전</button>
        <button
          className="btn primary"
          disabled={!done || suggestBusy}
          onClick={onNext}
        >옵션 채우러 가기 →</button>
      </div>
    </section>
  );
}

// 마스코트 말풍선
function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="bubble">{children}</div>;
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
      <div className="dz-icon">{busy ? '⏳' : '📁'}</div>
      <div className="dz-title">
        {busy ? '업로드 중…' : dragging ? '여기로 놓아주세요' : '영상 파일을 드래그하거나 클릭'}
      </div>
      <div className="dz-sub">여러 개 한 번에 가능 · MP4 / MOV / WebM / MKV</div>
    </div>
  );
}

// 생성 진행 — 로그는 기본 숨김, "로그 확인" 버튼으로 토글
function ProgressPanel({
  job, estimate, now, projectId, onReset,
}: {
  job: Job | null;
  estimate: Estimate | null;
  now: number;
  projectId: string | null;
  onReset: () => void;
}) {
  const failed = job?.status === 'error';
  const { pct, eta, currentStage } = phaseProgress(job, estimate?.perStage ?? null, 1, 4, now);
  const pctInt = Math.round(pct * 100);
  return (
    <section className="card progress">
      <div className="prog-hero">
        <Posty size={96} working={!failed} />
        {failed ? <div className="err">{job?.error}</div> : (
          <>
            <div className="pct">{pctInt}%</div>
            <div className="eta">남은 시간 약 {fmtClock(eta)}</div>
          </>
        )}
      </div>
      {!failed && (
        <>
          <div className="bar"><div className="fill" style={{ width: `${Math.max(3, pctInt)}%` }} /></div>
          <ol className="steps">
            {STAGE_NAMES.slice(1).map((name, i) => {
              const stage = i + 1;
              const state = stage < currentStage ? 'ok' : stage === currentStage ? 'cur' : 'todo';
              return <li key={stage} className={state}>{state === 'ok' ? '✓' : state === 'cur' ? '◴' : '○'} {name}</li>;
            })}
          </ol>
        </>
      )}
      <DebugLog job={job} projectId={projectId} active={!failed} />
      {failed && <div className="row"><button className="btn" onClick={onReset}>처음으로</button></div>}
    </section>
  );
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
