import { ArrowRight, Clock, Eye, FolderOpen, Plus, TrendingUp, Users } from 'lucide-react';

const STAT_ICONS = {
  users: Users,
  reach: TrendingUp,
  engage: TrendingUp,
  eye: Eye,
};

const FLOW_STEPS = [
  { num: '01', label: '이미지 업로드', desc: '촬영한 사진을 올리거나 샘플 선택' },
  { num: '02', label: '설명 입력', desc: '업종·무드·목적을 자유롭게 입력' },
  { num: '03', label: 'AI 스타일 분석', desc: '반응 높은 스타일 5개 자동 추천' },
  { num: '04', label: '콘텐츠 생성', desc: '캡션·해시태그·릴스 플로우 완성' },
];

export function DashboardScreen({ savedProjects, workspaceStats, onStartNew }) {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[rgba(124,96,74,0.1)] bg-[rgba(247,242,236,0.88)] backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center">
          <div className="flex items-center gap-3">
            <div className="logo-emblem">
              <span className="logo-emblem__inner">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">POSTY Studio</p>
              <p className="text-xs text-slate-400">인스타그램 콘텐츠 생성</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Hero */}
        <section className="panel-surface relative overflow-hidden">
          <div className="hero-orb" />
          <div className="hero-orb hero-orb-secondary" />

          {/* ── 헤드라인 ── */}
          <div className="relative z-10 border-b border-white/50 px-8 py-12">
            <p className="section-kicker mb-5">AI 인스타 콘텐츠 랩</p>
            <h1 className="space-y-1">
              <span className="block text-[clamp(2.6rem,5vw,4rem)] font-semibold leading-[1.08] tracking-tight text-slate-950">
                사진을 올리면,
              </span>
              <span className="block font-display text-[clamp(2.6rem,5vw,4rem)] font-medium italic leading-[1.08] tracking-tight text-[var(--accent-deep)]">
                반응이 나는 콘텐츠로.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-500">
              스타일 분석부터 캡션·해시태그·릴스 플로우까지,
              업로드 한 번으로 즉시 완성해드려요.
            </p>

            <button
              type="button"
              className="btn-primary mt-7 text-base px-8 py-4"
              onClick={onStartNew}
            >
              <Plus className="h-5 w-5" />
              새 콘텐츠 만들기
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* ── 플로우 스텝 ── */}
          <div className="relative z-10 grid grid-cols-2 gap-0 sm:grid-cols-4 divide-x divide-y divide-white/50">
            {FLOW_STEPS.map((item) => (
              <div key={item.num} className="px-6 py-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white mb-3">
                  {item.num}
                </span>
                <p className="text-sm font-semibold text-slate-900 leading-5">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400 leading-5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Instagram API stats */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-slate-600">계정 현황 (Instagram API)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {workspaceStats.map((stat) => {
              const Icon = STAT_ICONS[stat.icon] ?? TrendingUp;
              return (
                <div key={stat.label} className="panel-surface px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(232,106,77,0.1)]">
                      <Icon className="h-4 w-4 text-[var(--accent-deep)]" />
                    </span>
                    <p className="text-xs font-semibold text-slate-400">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--accent-deep)] font-medium">{stat.delta}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent projects */}
        <section className="panel-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-base font-semibold text-slate-900">최근 작업</h2>
            </div>
            <span className="text-sm text-slate-400">{savedProjects.length}개 프로젝트</span>
          </div>

          <div className="space-y-3">
            {savedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="w-full rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,106,77,0.22)] hover:shadow-[0_12px_28px_rgba(232,106,77,0.08)] shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                onClick={onStartNew}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-11 w-11 shrink-0 rounded-[18px] shadow-[0_10px_22px_rgba(15,23,42,0.1)]"
                    style={{ background: `linear-gradient(135deg, ${project.colorFrom}, ${project.colorTo})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{project.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.date}
                      </span>
                      <span className="rounded-full bg-[rgba(248,244,239,0.9)] px-2 py-0.5 font-medium text-slate-600">
                        {project.type}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      project.status === '완료'
                        ? 'bg-[rgba(16,185,129,0.1)] text-emerald-700'
                        : 'bg-[rgba(248,244,239,0.9)] text-slate-600'
                    }`}
                  >
                    {project.status}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
