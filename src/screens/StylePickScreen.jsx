import { Check, Sparkles, Target, Users2 } from 'lucide-react';
import { sampleImages } from '../data/mockData';
import { MockScenePreview } from '../components/MockScenePreview';
import { StepNav } from './UploadScreen';

export function StylePickScreen({
  analysis,
  recommendedStyles,
  selectedStyleId,
  uploadedImageUrl,
  onSelectStyle,
  onConfirmStyle,
  onGoHome,
  onBack,
}) {
  const selectedStyle = recommendedStyles.find((s) => s.id === selectedStyleId) ?? recommendedStyles[0];

  return (
    <div className="min-h-screen flex flex-col">
      <StepNav currentStep={3} steps={['이미지', '설명', '분석', '스타일', '완성']} onGoHome={onGoHome} onBack={onBack} />

      {/* Analysis quick summary */}
      <div className="border-b border-[rgba(124,96,74,0.1)] bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-3 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Target className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="font-semibold text-slate-700">{analysis.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users2 className="h-3.5 w-3.5 text-[var(--accent)]" />
            {analysis.audience}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            {analysis.tone}
          </span>
          <span className="ml-auto text-xs text-slate-400">
            최적 업로드: <span className="font-medium text-slate-600">{analysis.optimalTime}</span>
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-6 py-8 flex-1">
        <div className="mb-6">
          <p className="section-kicker">4단계 / 스타일 선택</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            반응이 좋은 스타일 {recommendedStyles.length}개를 추천했어요
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-6">
            카드를 클릭해 스타일을 선택하세요. 선택 후 아래 버튼으로 콘텐츠를 생성합니다.
          </p>
        </div>

        {/* Style cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedStyles.map((style, index) => {
            const isSelected = style.id === selectedStyleId;
            const image = sampleImages[index % sampleImages.length];

            return (
              <button
                key={style.id}
                type="button"
                className={`style-card text-left transition-all duration-200 ${
                  isSelected ? 'style-card-selected' : 'hover:-translate-y-1'
                }`}
                onClick={() => onSelectStyle(style.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="soft-badge bg-white text-slate-700 text-xs">{style.badge}</span>
                  <div className="flex items-center gap-2">
                    <div className="score-bubble score-bubble--small">
                      <span>{style.score}</span>
                    </div>
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_6px_14px_rgba(232,106,77,0.4)]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <MockScenePreview
                    image={image}
                    uploadedImageUrl={uploadedImageUrl}
                    accent={style.accent}
                    filterStyle={style.editedFilterStyle}
                    overlayText={style.preview.overlayText}
                    compact
                    label={style.subtitle}
                    caption={style.captions[0].split('\n')[0]}
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-semibold tracking-tight text-slate-900">{style.name}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{style.summary}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {style.visualCharacteristics.slice(0, 2).map((c) => (
                    <span key={c} className="chip-base text-xs bg-[rgba(248,244,239,0.9)] text-slate-600">{c}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 border-t border-[rgba(124,96,74,0.1)] bg-[rgba(247,242,236,0.92)] backdrop-blur-xl px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">선택된 스타일</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{selectedStyle.name}</p>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0 py-3 px-7"
            onClick={onConfirmStyle}
          >
            <Check className="h-4 w-4" />
            이 스타일로 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
