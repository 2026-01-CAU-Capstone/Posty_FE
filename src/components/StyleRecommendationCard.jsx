import { Check, Sparkles } from 'lucide-react';
import { MockScenePreview } from './MockScenePreview';

export function StyleRecommendationCard({ style, isSelected, onSelect, image }) {
  return (
    <article className={`style-card ${isSelected ? 'style-card-selected' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="soft-badge bg-white text-slate-700">{style.badge}</span>
        <div className="score-bubble score-bubble--small">
          <span>{style.score}</span>
        </div>
      </div>

      <div className="mt-4">
        <MockScenePreview
          image={image}
          accent={style.accent}
          filterStyle={style.editedFilterStyle}
          overlayText={style.preview.overlayText}
          compact
          label={style.subtitle}
          caption={style.fitReason}
        />
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{style.subtitle}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{style.name}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{style.summary}</p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-[24px] bg-[rgba(248,244,239,0.82)] px-4 py-4 text-sm leading-6 text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">왜 잘 먹히는가</p>
          <p className="mt-2">{style.whyPerforms}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/72 bg-white/84 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">시각 특징</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {style.visualCharacteristics.map((item) => (
                <span key={item} className="chip-base bg-[rgba(248,244,239,0.9)] text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/72 bg-white/84 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">캡션 톤</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{style.captionTone}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              {style.fitReason}
            </div>
          </div>
        </div>
      </div>

      <button type="button" className={isSelected ? 'btn-select-active' : 'btn-select'} onClick={onSelect}>
        {isSelected ? (
          <>
            <Check className="h-4 w-4" />
            현재 선택됨
          </>
        ) : (
          '이 스타일 선택'
        )}
      </button>
    </article>
  );
}
