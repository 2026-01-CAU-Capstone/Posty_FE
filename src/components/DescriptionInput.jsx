import { LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';

export function DescriptionInput({
  description,
  onDescriptionChange,
  contentTypes,
  contentType,
  onContentTypeChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onAnalyze,
  isAnalyzing,
}) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">2단계. 설명 입력</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            설명만 입력하면 스타일 스코어링 준비 완료
          </h2>
        </div>
        <span className="soft-badge bg-white/90 text-slate-700">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          스타일 스코어링 준비
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="description" className="text-sm font-semibold text-slate-900">
              게시물 설명
            </label>
            <span className="text-sm text-slate-400">{description.length}자</span>
          </div>
          <div className="textarea-shell">
            <textarea
              id="description"
              className="h-40 w-full resize-none bg-transparent text-base leading-7 text-slate-700 outline-none"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="예: 따뜻한 카페 무드, 저장을 유도할 감성적인 톤, 디저트와 공간감을 함께 보여주고 싶어요."
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-semibold text-slate-900">콘텐츠 유형</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {contentTypes.map((type) => {
                const isActive = contentType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`rounded-[26px] border px-4 py-4 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-[rgba(232,106,77,0.35)] bg-[rgba(255,244,236,0.9)] shadow-[0_18px_36px_rgba(232,106,77,0.12)]'
                        : 'border-white/70 bg-white/78 hover:-translate-y-0.5 hover:border-[rgba(15,23,42,0.08)] hover:bg-white'
                    }`}
                    onClick={() => onContentTypeChange(type.id)}
                  >
                    <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{type.helper}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">업종/계정 카테고리</p>
            <div className="mt-3 flex flex-wrap gap-2">
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

            <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(15,23,42,0.1)] bg-[rgba(248,244,239,0.76)] px-4 py-3 text-sm leading-6 text-slate-600">
              선택한 카테고리와 설명 키워드가 스타일 추천 점수에 함께 반영됩니다.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[rgba(18,23,31,0.95)] px-5 py-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.16)]">
          <div>
            <p className="text-sm font-semibold">추천 스타일 분석을 실행할까요?</p>
            <p className="mt-1 text-sm text-white/68">
              업로드한 이미지와 설명을 기반으로 최적 스타일을 즉시 분석합니다.
            </p>
          </div>

          <button type="button" className="btn-primary-light" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <WandSparkles className="h-4 w-4" />
                스타일 분석하기
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
