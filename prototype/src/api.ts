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

  async run(projectId: string, opts: { mode: 'all' | 'stage'; stage?: number; from?: number; to?: number }): Promise<string> {
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

  fileUrl(relPath: string): string {
    return BASE + '/api/file?path=' + encodeURIComponent(relPath);
  },
};
