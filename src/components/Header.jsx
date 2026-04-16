import { ArrowRight, BarChart3, PlayCircle, Sparkles, WandSparkles } from 'lucide-react';

const heroStats = [
  { label: '평균 저장 유도율', value: '+24%' },
  { label: '추천 스타일 수', value: '5개' },
  { label: '모의 완주율', value: '71%' },
];

export function Header({ analysis, selectedStyle, onStart, onExplore }) {
  return (
    <header className="panel-surface hero-panel overflow-hidden px-6 py-6 sm:px-7 lg:px-8">
      <div className="hero-orb" />
      <div className="hero-orb hero-orb-secondary" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="logo-emblem">
              <span className="logo-emblem__inner">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                POSTY Studio
              </p>
              <p className="mt-1 text-sm text-slate-500">인스타그램 콘텐츠 생성 데모</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="soft-badge bg-white/90 text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              투자자 데모용
            </span>
            <span className="soft-badge bg-[rgba(18,23,31,0.88)] text-white">
              <WandSparkles className="h-3.5 w-3.5 text-[rgba(255,255,255,0.82)]" />
              프론트엔드 전용
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="section-kicker">AI 인스타 콘텐츠 랩</p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl">
                이미지 한 장을 업로드하면,
                <br />
                <span className="font-display text-[1.05em] font-medium italic text-[var(--accent-deep)]">
                  반응이 나는 인스타 콘텐츠 방향
                </span>
                으로 바로 연결합니다.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                이미지와 설명을 업로드하고, 높은 반응의 인스타그램 스타일을 추천받아 최적화된
                콘텐츠를 생성하세요.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" onClick={onStart}>
                스타일 분석 시작
                <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" className="btn-secondary" onClick={onExplore}>
                추천 스타일 보기
                <PlayCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="metric-tile">
                  <p className="metric-label">{item.label}</p>
                  <p className="metric-value">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[30px] border border-white/75 bg-white/86 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    현재 추천 스타일
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedStyle.name}</h2>
                </div>
                <div className="score-bubble">
                  <span>{selectedStyle.score}</span>
                </div>
              </div>

              <div
                className="mt-5 h-40 rounded-[26px]"
                style={{
                  background: `${selectedStyle.gradient}, radial-gradient(circle at 72% 20%, rgba(255,255,255,0.55), transparent 30%)`,
                }}
              >
                <div className="flex h-full flex-col justify-between rounded-[26px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.02)_100%)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="soft-badge bg-white/78 text-slate-700">{selectedStyle.badge}</span>
                    <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {analysis.tone}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-white/85">{selectedStyle.summary}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedStyle.captionTone}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-[30px] border border-white/72 bg-[rgba(18,23,31,0.94)] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-center gap-2 text-sm text-white/72">
                <BarChart3 className="h-4 w-4" />
                라이브 분석 하이라이트
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">분석 카테고리</p>
                  <p className="mt-2 text-lg font-semibold">{analysis.category}</p>
                </div>
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">타깃 오디언스</p>
                  <p className="mt-2 text-lg font-semibold">{analysis.audience}</p>
                </div>
                <div className="rounded-[24px] bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">추천 업로드 시간</p>
                  <p className="mt-2 text-lg font-semibold">{analysis.optimalTime}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </header>
  );
}
