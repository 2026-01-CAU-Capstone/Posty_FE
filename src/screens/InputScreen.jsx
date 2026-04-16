import { LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';
import { StepNav } from './UploadScreen';

export function InputScreen({
  description,
  onDescriptionChange,
  contentTypes,
  contentType,
  onContentTypeChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onGoHome,
  onBack,
  onGoToAnalyze,
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <StepNav currentStep={1} steps={['이미지', '설명', '분석', '스타일', '완성']} onGoHome={onGoHome} onBack={onBack} />

      <main className="mx-auto w-full max-w-2xl px-6 py-8 flex-1 space-y-6">
        <div>
          <p className="section-kicker">2단계 / 설명 입력</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            어떤 콘텐츠를 만들고 싶나요?
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            무드, 목적, 업종 등 자유롭게 설명해 주세요. 설명이 구체적일수록 추천 정확도가 높아집니다.
          </p>
        </div>

        {/* Description */}
        <div className="panel-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="description" className="text-sm font-semibold text-slate-900">
              게시물 설명
            </label>
            <span className="text-xs text-slate-400">{description.length}자</span>
          </div>
          <div className="textarea-shell">
            <textarea
              id="description"
              className="h-36 w-full resize-none bg-transparent text-[15px] leading-7 text-slate-700 outline-none"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="예: 따뜻한 카페 무드, 저장을 유도할 감성적인 톤, 디저트와 공간감을 함께 보여주고 싶어요."
            />
          </div>
        </div>

        {/* Content type */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">콘텐츠 유형</p>
          <div className="grid grid-cols-2 gap-3">
            {contentTypes.map((type) => {
              const isActive = contentType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`rounded-[24px] border px-5 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-[rgba(232,106,77,0.35)] bg-[rgba(255,244,236,0.9)] shadow-[0_16px_32px_rgba(232,106,77,0.12)]'
                      : 'border-white/70 bg-white/78 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                  onClick={() => onContentTypeChange(type.id)}
                >
                  <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{type.helper}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="panel-surface p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-sm font-semibold text-slate-900">업종 / 계정 카테고리</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  className={`chip-base ${
                    isActive
                      ? 'chip-active'
                      : 'bg-white/82 text-slate-600 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                  onClick={() => onToggleCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 leading-5">
            선택한 카테고리와 설명이 스타일 추천 점수에 함께 반영됩니다.
          </p>
        </div>

        {/* Analyze CTA */}
        <div className="rounded-[28px] bg-[rgba(18,23,31,0.95)] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-[0_24px_50px_rgba(15,23,42,0.16)]">
          <div>
            <p className="text-sm font-semibold">추천 스타일 분석을 실행할까요?</p>
            <p className="mt-1 text-xs text-white/60 leading-5">
              이미지와 설명을 기반으로 최적 스타일을 즉시 분석합니다.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary-light shrink-0 w-full sm:w-auto justify-center py-3 px-6"
            onClick={onGoToAnalyze}
          >
            <WandSparkles className="h-4 w-4" />
            스타일 분석 시작
          </button>
        </div>
      </main>
    </div>
  );
}
