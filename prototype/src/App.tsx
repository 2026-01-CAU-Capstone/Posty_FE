import { useEffect, useState } from 'react';
import { api, Estimate, Job, StyleBrief } from './api';
import { Posty } from './Posty';

const STAGE_NAMES = ['레퍼런스 분석', '컷편집', '색보정', '자막', '음성·BGM'];
type Step = 'ref' | 'sources' | 'options' | 'run';
const STEPS: { key: Step; label: string }[] = [
  { key: 'ref', label: '레퍼런스' },
  { key: 'sources', label: '소스' },
  { key: 'options', label: '옵션' },
  { key: 'run', label: '생성' },
];

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

  const [srcFiles, setSrcFiles] = useState<File[]>([]);
  const [srcUrls, setSrcUrls] = useState('');
  const [uploadedSources, setUploadedSources] = useState<string[]>([]);
  const [srcBusy, setSrcBusy] = useState(false);
  const [srcError, setSrcError] = useState('');

  const [opt, setOpt] = useState({
    captionLanguage: '', captionDensity: '', tone: '', purpose: '',
    keywords: '', mustInclude: '', extraNotes: '', styleNote: '',
  });
  const setO = (k: keyof typeof opt, v: string) => setOpt(prev => ({ ...prev, [k]: v }));

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

  const canGenerate = stage0Done && uploadedSources.length > 0 && !mainJobId;
  const finalPath: string | null = mainJob?.status === 'done' ? (mainJob.result?.final ?? null) : null;

  useEffect(() => { api.health().then(setOnline); }, []);

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

  async function addSources() {
    setSrcError('');
    if (!projectId) { setSrcError('먼저 레퍼런스 분석을 시작하세요'); return; }
    setSrcBusy(true);
    try {
      const added: string[] = [];
      if (srcFiles.length > 0) {
        added.push(...await api.uploadFiles(projectId, 'source', srcFiles));
        setSrcFiles([]);
      }
      const urls = srcUrls.split(/\s+/).map(s => s.trim()).filter(Boolean);
      if (urls.length > 0) {
        const r = await api.igImport(projectId, 'source', urls);
        for (const s of r.saved || []) added.push(...((s.files as string[]) || []));
        setSrcUrls('');
      }
      if (added.length === 0) { setSrcError('추가할 파일이나 URL이 없습니다'); return; }
      setUploadedSources(prev => [...prev, ...added]);
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
      const toArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
      const brief: StyleBrief = {
        caption_language: opt.captionLanguage,
        caption_density: opt.captionDensity,
        tone: opt.tone.trim(),
        purpose: opt.purpose.trim(),
        topic_keywords: toArr(opt.keywords),
        must_include_phrases: toArr(opt.mustInclude),
        extra_notes: opt.extraNotes.trim(),
      };
      await api.saveStyleBrief(projectId, brief);
      await api.saveStyleNote(projectId, opt.styleNote);
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
    setSrcFiles([]); setSrcUrls(''); setUploadedSources([]); setSrcError('');
    setOpt({ captionLanguage: '', captionDensity: '', tone: '', purpose: '', keywords: '', mustInclude: '', extraNotes: '', styleNote: '' });
    setStage0JobId(null); setMainJobId(null); setGenError('');
  }

  return (
    <div className="page">
      <header className="hd">
        <div className="logo"><Posty size={46} working={stage0Running || mainRunning} /><h1>Posty</h1></div>
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
          <p className="hint">따라 하고 싶은 릴스 1개. <b>다음으로 넘어가면 바로 분석이 시작</b>되고, 그동안 소스·옵션을 채우면 돼요.</p>
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
          <AnalysisBanner stage0Job={stage0Job} estimate={estimate} now={now} />
          <div className="cardhead"><span className="num">2</span><h2>내 소스 영상</h2></div>
          <p className="hint">편집 재료가 될 내 영상들. <b>여러 개일수록</b> 좋아요. (파일 또는 IG URL)</p>
          <input className="inp" type="file" accept="video/*" multiple onChange={e => setSrcFiles(Array.from(e.target.files || []))} />
          <textarea className="inp" rows={2} placeholder="(선택) Instagram URL 여러 개 — 줄바꿈/공백으로 구분" value={srcUrls} onChange={e => setSrcUrls(e.target.value)} />
          <button className="btn" disabled={srcBusy} onClick={addSources}>{srcBusy ? '업로드 중…' : '+ 소스 추가'}</button>
          {srcError && <div className="err">{srcError}</div>}
          {uploadedSources.length > 0 && (
            <div className="chips">{uploadedSources.map((s, i) => <span className="chip" key={i}>🎞 {s}</span>)}</div>
          )}
          <div className="nav">
            <span />
            <button className="btn primary" disabled={uploadedSources.length === 0} onClick={() => setStep('options')}>다음 →</button>
          </div>
          {uploadedSources.length === 0 && <p className="hint center">소스를 1개 이상 추가하면 다음으로 넘어갈 수 있어요.</p>}
        </section>
      )}

      {/* ── STEP: 옵션 ── */}
      {step === 'options' && (
        <section className="card">
          <AnalysisBanner stage0Job={stage0Job} estimate={estimate} now={now} />
          <div className="cardhead"><span className="num">3</span><h2>편집 옵션 <small>(전부 선택 — 비우면 레퍼런스 따라감)</small></h2></div>
          <div className="grid">
            <label>자막 언어
              <select className="inp" value={opt.captionLanguage} onChange={e => setO('captionLanguage', e.target.value)}>
                <option value="">레퍼런스 따라가기</option>
                <option value="ko">한국어</option><option value="en">영어</option><option value="mixed">한+영 혼합</option>
              </select>
            </label>
            <label>자막 빈도
              <select className="inp" value={opt.captionDensity} onChange={e => setO('captionDensity', e.target.value)}>
                <option value="">레퍼런스 따라가기</option>
                <option value="every_cut">모든 컷</option><option value="most_cuts">대부분 컷</option>
                <option value="occasional">가끔</option><option value="minimal">최소</option><option value="none">자막 없음</option>
              </select>
            </label>
            <label>톤/분위기<input className="inp" placeholder="예: 발랄한 / 잔잔한" value={opt.tone} onChange={e => setO('tone', e.target.value)} /></label>
            <label>영상 목적<input className="inp" placeholder="예: 카페 홍보 / 여행" value={opt.purpose} onChange={e => setO('purpose', e.target.value)} /></label>
            <label>주제 키워드<input className="inp" placeholder="쉼표 구분 — 제주, 바다" value={opt.keywords} onChange={e => setO('keywords', e.target.value)} /></label>
            <label>꼭 넣을 문구<input className="inp" placeholder="쉼표 구분" value={opt.mustInclude} onChange={e => setO('mustInclude', e.target.value)} /></label>
          </div>
          <label className="full">추가 메모<textarea className="inp" rows={2} placeholder="자유롭게 — 예: 첫 컷에 가게 이름 크게" value={opt.extraNotes} onChange={e => setO('extraNotes', e.target.value)} /></label>
          <label className="full">자유 스타일 노트<textarea className="inp" rows={2} value={opt.styleNote} onChange={e => setO('styleNote', e.target.value)} /></label>

          {estimate && <p className="hint center">예상 소요 시간 약 <b>{fmtClock(estimate.total14)}</b></p>}
          {genError && <div className="err">{genError}</div>}
          <div className="nav">
            <button className="btn" onClick={() => setStep('sources')}>← 이전</button>
            <button className="btn primary" disabled={!canGenerate} onClick={generate}>✨ 영상 생성</button>
          </div>
          {!canGenerate && !stage0Done && <p className="hint center">레퍼런스 분석이 끝나면 생성할 수 있어요.</p>}
        </section>
      )}

      {/* ── STEP: 생성/결과 ── */}
      {step === 'run' && (
        <>
          {finalPath ? (
            <section className="card result">
              <div className="cardhead"><h2>✅ 완성!</h2></div>
              <video className="preview" src={api.fileUrl(finalPath)} controls playsInline />
              <div className="row">
                <a className="btn primary" href={api.fileUrl(finalPath)} download>⬇ 다운로드</a>
                <button className="btn" onClick={resetAll}>새 영상 만들기</button>
              </div>
            </section>
          ) : (
            <ProgressPanel job={mainJob} estimate={estimate} now={now} onReset={resetAll} />
          )}
        </>
      )}
    </div>
  );
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

function AnalysisBanner({ stage0Job, estimate, now }: { stage0Job: Job | null; estimate: Estimate | null; now: number }) {
  const done = stage0Job?.status === 'done';
  const err = stage0Job?.status === 'error';
  return (
    <div className={'analysis ' + (done ? 'done' : err ? 'fail' : 'run')}>
      {err ? <>⚠ 레퍼런스 분석 실패: {stage0Job?.error}</>
        : done ? <>✓ 레퍼런스 분석 완료</>
          : (
            <div className="analysis-run">
              <Posty size={34} working />
              <div>
                <div>레퍼런스 분석 중…</div>
                {estimate && <div className="eta-sm">남은 시간 약 {fmtClock(phaseProgress(stage0Job, estimate.perStage, 0, 0, now).eta)}</div>}
              </div>
            </div>
          )}
    </div>
  );
}

function ProgressPanel({ job, estimate, now, onReset }: { job: Job | null; estimate: Estimate | null; now: number; onReset: () => void }) {
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
      <div className="log">{(job?.progress || []).slice(-5).map((p, i) => <div key={i}>· {p.msg}</div>)}</div>
      {failed && <div className="row"><button className="btn" onClick={onReset}>처음으로</button></div>}
    </section>
  );
}
