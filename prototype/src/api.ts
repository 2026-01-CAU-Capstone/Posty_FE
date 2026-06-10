// ============================================================
// 백엔드(Hono, 기본 :8787) HTTP 클라이언트.
// VITE_API_BASE 로 주소 변경 가능.
// ============================================================

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:8787';

async function jsonReq(path: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`);
  return data;
}

export type JobStatus = 'pending' | 'running' | 'done' | 'error';
export type Job = {
  id: string;
  type: string;
  projectId: string;
  status: JobStatus;
  progress: { step: string; msg: string; at: string; extra?: any }[];
  result: any;
  error: string | null;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type Estimate = {
  refDur: number;
  srcDur: number;
  nSources: number;
  outDurEst: number;
  perStage: number[];   // [s0,s1,s2,s3,s4] (초)
  total04: number;
  total14: number;
};

// ⚠ 아래 DTO 들(SuggestBrief, AnalysisPoint, StyleSuggest, TtsConfig/TtsSource/
//   TtsGenMode, AudioConfig/OriginalVolume, TTS_VOICES)은 백엔드 타입의 수작업 미러다.
//   - SuggestBrief / AnalysisPoint / StyleSuggest → lib/style-suggest.ts
//   - TtsConfig / TtsSource / TtsGenMode          → lib/tts-config.ts
//   - AudioConfig / OriginalVolume                → lib/audio-config.ts
//   - TTS_VOICES                                  → lib/tts.ts PREBUILT_VOICES
//   백엔드에서 필드를 바꾸면 여기도 같이 고쳐야 한다 (공유 모듈 없음).
export type SuggestBrief = {
  tone: string;
  purpose: string;
  topic_keywords: string[];
  must_include_phrases: string[];
  caption_language: '' | 'ko' | 'en' | 'mixed';
  caption_density: '' | 'every_cut' | 'most_cuts' | 'occasional' | 'minimal' | 'none';
  caption_mode: '' | 'per_scene' | 'brand_title' | 'continuous' | 'none';
};

export type AnalysisPoint = {
  label: string;
  detail: string;
};

export type StyleSuggest = {
  summary: string;
  analysis: AnalysisPoint[];
  brief: SuggestBrief;
  generated_at: string;
  model: string;
};

// ---- TTS (나레이션) 설정 ----
export type TtsSource = 'captions' | 'generate';
export type TtsGenMode = 'auto' | 'manual';
export type TtsConfig = {
  enabled: boolean;
  source: TtsSource;
  genMode: TtsGenMode;
  voice: string;
  script: string;
};
export const TTS_VOICES = ['Kore', 'Puck', 'Charon', 'Aoede', 'Fenrir', 'Leda', 'Orus', 'Zephyr'] as const;

// ---- 오디오 밸런스 설정 ----
export type OriginalVolume = 'mute' | 'low' | 'full';
export type AudioConfig = {
  originalVolume: OriginalVolume;
};

// 컷편집 설정 — lib/cut-config.ts 미러. target_sec: 0=레퍼런스 따라가기, >0=목표 길이(초).
export type CutConfig = {
  target_sec: number;
};

export type PreviewFrame = {
  url: string;
  source: 'reference' | 'source';
  sourceFile: string;
};

export type BgmCandidate = {
  identifier: string;
  title?: string;
  source_url: string;
  duration_sec: number;
  size_bytes: number;
  query_used: string;
};

// 유료/유명 곡 추천 (Gemini + iTunes 검증) — 저작권상 임베드 안 함, 정보/링크/미리듣기만.
export type FamousTrack = {
  title: string;
  artist: string;
  year?: string;
  genre?: string;
  reason?: string;
  spotify_url: string;
  youtube_url: string;
  apple_url?: string;     // Apple Music/iTunes 곡 페이지
  preview_url?: string;   // 30초 미리듣기 (m4a)
  artwork?: string;       // 앨범 아트 썸네일
  verified?: boolean;     // iTunes 실존 확인됨
  duration_sec?: number;  // 곡 전체 길이(초) — iTunes trackTimeMillis
};

export type ReferenceBgm = {
  status: 'no_token' | 'no_match' | 'matched' | 'error';
  title?: string;
  artist?: string;
  album?: string;
  release_date?: string;
  genres?: string[];
  song_link?: string;
  spotify_url?: string;
  apple_url?: string;
};

export type BgmCandidatesResp = {
  referenceBgm: ReferenceBgm | null;
  paid: FamousTrack[];          // 유료/유명 곡 추천 (정보·링크)
  free: BgmCandidate[];         // 무료 음원 (선택 시 영상에 입힘)
  profile: any | null;
  cached: boolean;
};

export type StyleBrief = {
  category?: string;
  category_other?: string;
  purpose?: string;
  tone?: string;
  formality?: string;
  caption_mode?: string;
  caption_density?: string;
  caption_language?: string;
  topic_keywords?: string[];
  avoid_phrases?: string[];
  must_include_phrases?: string[];
  extra_notes?: string;
};

export const api = {
  base: BASE,

  async health(): Promise<boolean> {
    try { const r = await fetch(BASE + '/api/health'); return r.ok; } catch { return false; }
  },

  async createProject(): Promise<string> {
    const d = await jsonReq('/api/projects', { method: 'POST' });
    return d.projectId as string;
  },

  async uploadFiles(projectId: string, kind: 'reference' | 'source' | 'bgm', files: File[]): Promise<string[]> {
    const form = new FormData();
    form.append('projectId', projectId);
    form.append('kind', kind);
    for (const f of files) form.append('file', f);
    const res = await fetch(BASE + '/api/upload', { method: 'POST', body: form });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d?.error || `업로드 실패 ${res.status}`);
    return d.saved as string[];
  },

  async igImport(projectId: string, kind: 'reference' | 'source', urls: string[]): Promise<any> {
    return jsonReq('/api/ig-import', { method: 'POST', body: JSON.stringify({ projectId, kind, urls }) });
  },

  async getProject(projectId: string): Promise<any> {
    return jsonReq('/api/project?projectId=' + encodeURIComponent(projectId));
  },

  async run(
    projectId: string,
    opts: {
      mode: 'all' | 'stage';
      stage?: number;
      from?: number;
      to?: number;
      // Stage 0 전용 — "다시 분석하기" 호출 시.
      // 백엔드에서 이전 edit-spec.json 을 프롬프트에 끼워 보강 분석을 돌린다.
      reanalyze?: boolean;
      userFocus?: string;
    },
  ): Promise<string> {
    const d = await jsonReq('/api/run', { method: 'POST', body: JSON.stringify({ projectId, ...opts }) });
    return d.jobId as string;
  },

  async getJob(jobId: string): Promise<Job> {
    const d = await jsonReq('/api/jobs/' + encodeURIComponent(jobId));
    return d.job as Job;
  },

  async getEstimate(projectId: string): Promise<Estimate> {
    const d = await jsonReq('/api/estimate?projectId=' + encodeURIComponent(projectId));
    return d.estimate as Estimate;
  },

  async saveStyleBrief(projectId: string, brief: StyleBrief): Promise<void> {
    await jsonReq('/api/style-brief', { method: 'POST', body: JSON.stringify({ projectId, brief }) });
  },

  async saveStyleNote(projectId: string, text: string): Promise<void> {
    await jsonReq('/api/style-note', { method: 'POST', body: JSON.stringify({ projectId, text }) });
  },

  // 캐시 조회 — 아직 만들기 전이면 null
  async getStyleSuggest(projectId: string): Promise<StyleSuggest | null> {
    const d = await jsonReq('/api/style-suggest?projectId=' + encodeURIComponent(projectId));
    return d.suggest as StyleSuggest | null;
  },
  // 생성 (Stage 0 완료 후 호출). force=true 면 캐시 무시.
  async generateStyleSuggest(projectId: string, force = false): Promise<StyleSuggest> {
    const d = await jsonReq('/api/style-suggest', {
      method: 'POST',
      body: JSON.stringify({ projectId, force }),
    });
    return d.suggest as StyleSuggest;
  },

  // TTS 설정 저장
  async saveTtsConfig(projectId: string, tts: Partial<TtsConfig>): Promise<void> {
    await jsonReq('/api/tts-config', { method: 'POST', body: JSON.stringify({ projectId, tts }) });
  },

  // 오디오 밸런스(원본 음량) 저장
  async saveAudioConfig(projectId: string, audio: Partial<AudioConfig>): Promise<void> {
    await jsonReq('/api/audio-config', { method: 'POST', body: JSON.stringify({ projectId, audio }) });
  },

  // 컷편집 설정(영상 목표 길이 등) 저장
  async saveCutConfig(projectId: string, cut: Partial<CutConfig>): Promise<void> {
    await jsonReq('/api/cut-config', { method: 'POST', body: JSON.stringify({ projectId, cut }) });
  },

  // 레퍼런스 분석 결과(edit-spec.json) 전체 — 디버그 표시용
  async getEditSpec(projectId: string): Promise<any | null> {
    const d = await jsonReq('/api/edit-spec?projectId=' + encodeURIComponent(projectId));
    return d.spec ?? null;
  },

  fileUrl(relPath: string): string {
    return BASE + '/api/file?path=' + encodeURIComponent(relPath);
  },

  // 진행 화면 캐러셀용 — 레퍼런스 + 소스에서 N개 프레임 추출
  async getPreviewFrames(projectId: string, count = 16): Promise<PreviewFrame[]> {
    const d = await jsonReq(
      '/api/preview-frames?projectId=' + encodeURIComponent(projectId) +
      '&count=' + encodeURIComponent(String(count))
    );
    return (d.frames || []).map((f: any) => ({
      url: BASE + f.url,
      source: f.source,
      sourceFile: f.sourceFile,
    }));
  },

  // BGM 후보 — 캐시 우선
  async getBgmCandidates(projectId: string, force = false): Promise<BgmCandidatesResp> {
    const d = await jsonReq(
      '/api/bgm-candidates?projectId=' + encodeURIComponent(projectId) +
      (force ? '&force=1' : '')
    );
    return {
      referenceBgm: d.referenceBgm || null,
      paid: d.paid || [],
      free: d.free || [],
      profile: d.profile || null,
      cached: !!d.cached,
    };
  },

  // BGM 선택 (다운로드)
  async pickBgm(projectId: string, pick: { identifier: string; source_url: string; title?: string } | { none: true }): Promise<void> {
    await jsonReq('/api/bgm-pick', { method: 'POST', body: JSON.stringify({ projectId, ...pick }) });
  },

  // 디버그용: raw-api-responses.json 누적 entries (마지막 limit 개만)
  async getRawResponses(projectId: string, limit = 200): Promise<{ total: number; entries: any[] }> {
    const d = await jsonReq(
      '/api/raw-responses?projectId=' + encodeURIComponent(projectId) +
      '&limit=' + encodeURIComponent(String(limit))
    );
    return { total: d.total ?? 0, entries: d.entries ?? [] };
  },
};
