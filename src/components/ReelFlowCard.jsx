import { Film, Sparkles } from 'lucide-react';

export function ReelFlowCard({ flow }) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">추천 릴스 흐름</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            4단계 릴스 제작 플로우
          </h3>
        </div>
        <span className="soft-badge bg-white/90 text-slate-700">
          <Film className="h-3.5 w-3.5 text-[var(--accent)]" />
          12초 구조 제안
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {flow.map((step, index) => (
          <article
            key={`${step.second}-${step.label}`}
            className="rounded-[28px] border border-white/74 bg-white/84 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[rgba(18,23,31,0.94)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                {step.second}
              </span>
              <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
            </div>
            <h4 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{step.label}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              {step.focus}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
