import { RefreshCcw, ScrollText, Sparkles } from 'lucide-react';

export function CaptionCard({ caption, captionIndex, totalCaptions, style, onRegenerate }) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">캡션 결과</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">캡션 초안</h3>
        </div>
        <button type="button" className="btn-secondary" onClick={onRegenerate}>
          <RefreshCcw className="h-4 w-4" />
          캡션 재생성
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-[24px] bg-[rgba(18,23,31,0.94)] px-4 py-3 text-sm text-white">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-white/72" />
          {style.captionTone}
        </div>
        <span className="text-white/68">
          버전 0{captionIndex + 1} / 0{totalCaptions}
        </span>
      </div>

      <div className="mt-5 rounded-[30px] border border-white/75 bg-white/84 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700">{caption}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {style.captionGuides.map((guide) => (
          <div
            key={guide}
            className="rounded-[24px] bg-[rgba(255,244,236,0.82)] px-4 py-4 text-sm leading-6 text-slate-600"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span>{guide}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
