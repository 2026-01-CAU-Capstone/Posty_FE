import { Sparkles } from 'lucide-react';
import { sampleImages } from '../data/mockData';
import { StyleRecommendationCard } from './StyleRecommendationCard';

const skeletonCards = Array.from({ length: 4 }, (_, index) => index);

export function StyleRecommendationList({ styles, selectedStyleId, onSelect, isLoading }) {
  return (
    <section id="style-recommendations" className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">4단계. 추천 스타일</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            반응이 좋은 스타일 추천안 5개
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            각 카드는 점수, 퍼포먼스 이유, 비주얼 특성, 캡션 톤까지 포함해 실제 추천 엔진처럼
            비교할 수 있게 구성했습니다.
          </p>
        </div>

        <div className="rounded-[24px] border border-dashed border-[rgba(232,106,77,0.26)] bg-[rgba(255,244,236,0.84)] px-4 py-3 text-sm leading-6 text-slate-600">
          POSTY Style Fit = 업종 적합도 40% + 콘텐츠 형식 35% + 설명 키워드 25%
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {skeletonCards.map((item) => (
            <div key={item} className="rounded-[30px] border border-white/70 bg-white/82 p-5">
              <div className="flex items-center justify-between">
                <div className="skeleton h-9 w-28 rounded-full" />
                <div className="skeleton h-11 w-11 rounded-full" />
              </div>
              <div className="skeleton mt-4 h-48 rounded-[26px]" />
              <div className="skeleton mt-5 h-7 w-2/3 rounded-full" />
              <div className="skeleton mt-3 h-16 rounded-[20px]" />
              <div className="skeleton mt-4 h-28 rounded-[20px]" />
              <div className="skeleton mt-5 h-12 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {styles.map((style, index) => (
            <StyleRecommendationCard
              key={style.id}
              style={style}
              image={sampleImages[index % sampleImages.length]}
              isSelected={selectedStyleId === style.id}
              onSelect={() => onSelect(style.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        선택한 카드는 아래 생성 결과 섹션에 즉시 반영됩니다.
      </div>
    </section>
  );
}
