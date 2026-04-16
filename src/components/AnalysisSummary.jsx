import { Clock3, Layers3, Sparkles, Target, Users2 } from 'lucide-react';

const summaryBlocks = [
  { key: 'category', label: '감지 카테고리', icon: Target },
  { key: 'audience', label: '타깃 오디언스', icon: Users2 },
  { key: 'tone', label: '추천 톤', icon: Sparkles },
];

export function AnalysisSummary({ analysis, contentType, isLoading }) {
  if (isLoading) {
    return (
      <section className="panel-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-kicker">3단계. 스타일 분석</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              스타일 분석 중입니다
            </h2>
          </div>
          <div className="skeleton h-11 w-28 rounded-full" />
        </div>

        <div className="mt-6 grid gap-4">
          <div className="skeleton h-28 rounded-[28px]" />
          <div className="skeleton h-28 rounded-[28px]" />
          <div className="skeleton h-28 rounded-[28px]" />
          <div className="skeleton h-40 rounded-[28px]" />
        </div>
      </section>
    );
  }

  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">3단계. 스타일 분석</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            업로드 콘텐츠 분석 요약
          </h2>
        </div>
        <span className="soft-badge bg-[rgba(255,244,236,0.86)] text-[var(--accent-deep)]">
          {contentType === 'reel' ? '릴스 분석 모드' : '포스트 분석 모드'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summaryBlocks.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="rounded-[28px] border border-white/75 bg-white/82 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(18,23,31,0.06)] text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{analysis[item.key]}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-[30px] border border-white/72 bg-[rgba(248,244,239,0.84)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Layers3 className="h-4 w-4 text-[var(--accent)]" />
          스타일 키워드
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.keywords.map((keyword) => (
            <span key={keyword} className="chip-base bg-white text-slate-700">
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/75 bg-white/84 p-5 shadow-[0_18px_32px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            추천 산업/계정 유형
          </p>
          <p className="mt-3 text-base leading-7 text-slate-700">{analysis.industryAccounts}</p>
          <div className="mt-4 rounded-[24px] bg-[rgba(255,244,236,0.82)] px-4 py-4 text-sm leading-6 text-slate-600">
            {analysis.insight}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/75 bg-white/84 p-5 shadow-[0_18px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Clock3 className="h-4 w-4" />
            발행 가이드
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] bg-[rgba(18,23,31,0.94)] px-4 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-white/48">추천 업로드 시간</p>
              <p className="mt-2 text-lg font-semibold">{analysis.optimalTime}</p>
            </div>
            <div className="rounded-[22px] bg-[rgba(248,244,239,0.82)] px-4 py-4 text-slate-700">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">예상 반응 포인트</p>
              <p className="mt-2 text-base font-semibold">{analysis.responseSignal}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
