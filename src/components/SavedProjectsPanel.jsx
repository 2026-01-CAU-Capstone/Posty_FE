import { BookmarkCheck, Clock3, FolderKanban, Sparkles, TrendingUp } from 'lucide-react';

export function SavedProjectsPanel({ projects, selectedStyle, stats }) {
  return (
    <div className="sticky top-5 space-y-6">
      <section className="panel-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">워크스페이스 현황</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              저장 프로젝트와 최근 실험
            </h3>
          </div>
          <span className="soft-badge bg-[rgba(18,23,31,0.94)] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            라이브 데모
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[24px] border border-white/72 bg-white/84 px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                <span className="rounded-full bg-[rgba(255,244,236,0.86)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]">
                  {stat.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-surface p-5">
        <div className="rounded-[28px] bg-[rgba(18,23,31,0.94)] p-5 text-white">
          <div className="flex items-center gap-2 text-sm text-white/72">
            <TrendingUp className="h-4 w-4" />
            현재 선택 스타일
          </div>
          <h4 className="mt-3 text-2xl font-semibold">{selectedStyle.name}</h4>
          <p className="mt-2 text-sm leading-6 text-white/72">{selectedStyle.summary}</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <BookmarkCheck className="h-4 w-4 text-white/72" />
            추천 점수 {selectedStyle.score}/100
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-[26px] border border-white/72 bg-white/84 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-14 w-14 shrink-0 rounded-[20px] border border-white/50"
                  style={{
                    background: `linear-gradient(135deg, ${project.colorFrom} 0%, ${project.colorTo} 100%)`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                    <span className="rounded-full bg-[rgba(248,244,239,0.9)] px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      {project.type}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {project.date}
                    </span>
                    <span className="rounded-full bg-[rgba(255,244,236,0.86)] px-2.5 py-1 font-semibold text-[var(--accent-deep)]">
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-surface p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FolderKanban className="h-4 w-4 text-[var(--accent)]" />
          데모 메모
        </div>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <div className="rounded-[24px] bg-[rgba(248,244,239,0.86)] px-4 py-4">
            투자자 데모 시에는 업로드 → 추천 → 생성 결과가 한 번에 보이는 구성을 강조하면 제품 이해가
            훨씬 빠릅니다.
          </div>
          <div className="rounded-[24px] bg-[rgba(248,244,239,0.86)] px-4 py-4">
            현재 버전은 백엔드 없이도 실제 SaaS 제품처럼 느껴지도록 카드 구조와 상호작용을 모두
            채워둔 상태입니다.
          </div>
        </div>
      </section>
    </div>
  );
}
