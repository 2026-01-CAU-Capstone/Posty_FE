import { CheckCircle2, LayoutTemplate, Sparkles } from 'lucide-react';
import { MockScenePreview } from './MockScenePreview';

export function GeneratedPreview({ image, style }) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">5단계. 편집 미리보기</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            원본 대비 편집 방향 미리보기
          </h3>
        </div>
        <span className="soft-badge bg-white/90 text-slate-700">
          <LayoutTemplate className="h-3.5 w-3.5 text-[var(--accent)]" />
          스타일 적용 예상
        </span>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>원본 이미지</span>
            <span>{image.fileName}</span>
          </div>
          <MockScenePreview
            image={image}
            accent="#D8C3B0"
            filterStyle={style.filterStyle}
            label="원본 이미지"
            caption="원본 촬영 컷"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>스타일 적용 결과</span>
            <span>{style.name}</span>
          </div>
          <MockScenePreview
            image={image}
            accent={style.accent}
            filterStyle={style.editedFilterStyle}
            overlayText={style.preview.overlayText}
            label="스타일 적용안"
            caption={style.captionTone}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/75 bg-white/82 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            이미지 편집 방향
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              `크롭: ${style.preview.crop}`,
              `톤: ${style.preview.tone}`,
              `대비: ${style.preview.contrast}`,
              `오버레이 텍스트: ${style.preview.overlayText}`,
            ].map((item) => (
              <span key={item} className="chip-base bg-[rgba(248,244,239,0.9)] text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/75 bg-white/82 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
            적용 포인트
          </div>
          <div className="mt-4 space-y-3">
            {style.preview.adjustments.map((adjustment) => (
              <div
                key={adjustment}
                className="rounded-[20px] bg-[rgba(248,244,239,0.86)] px-4 py-3 text-sm text-slate-600"
              >
                {adjustment}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
