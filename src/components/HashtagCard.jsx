import { Bookmark, Download, Hash, Layers3 } from 'lucide-react';

const groupClassMap = {
  브랜드: 'bg-[rgba(255,244,236,0.86)] text-[var(--accent-deep)]',
  탐색: 'bg-[rgba(232,244,242,0.92)] text-[#0F766E]',
  지역: 'bg-[rgba(236,233,255,0.92)] text-[#5B4FCF]',
  리치: 'bg-[rgba(255,239,219,0.96)] text-[#B45309]',
};

export function HashtagCard({ hashtags, onTryAnotherStyle, onSaveDraft, onExport }) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">해시태그 제안</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            추천 해시태그 전략
          </h3>
        </div>
        <span className="soft-badge bg-white/90 text-slate-700">
          <Hash className="h-3.5 w-3.5 text-[var(--accent)]" />
          탐색 + 브랜드 + 지역 조합
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {hashtags.map((item) => (
          <div
            key={item.tag}
            className="rounded-full border border-white/70 bg-white/84 px-3 py-2 shadow-[0_12px_26px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{item.tag}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${groupClassMap[item.group]}`}>
                {item.group} · {item.reach}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[28px] border border-white/75 bg-[rgba(248,244,239,0.84)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Layers3 className="h-4 w-4 text-[var(--accent)]" />
          실행 액션
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={onTryAnotherStyle}>
            다른 스타일 시도
          </button>
          <button type="button" className="btn-secondary" onClick={onSaveDraft}>
            <Bookmark className="h-4 w-4" />
            초안 저장
          </button>
          <button type="button" className="btn-primary" onClick={onExport}>
            <Download className="h-4 w-4" />
            모크 내보내기
          </button>
        </div>
      </div>
    </section>
  );
}
