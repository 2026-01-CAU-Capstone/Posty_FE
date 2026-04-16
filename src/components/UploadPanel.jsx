import { ImagePlus, RefreshCcw, Sparkles, UploadCloud } from 'lucide-react';
import { MockScenePreview } from './MockScenePreview';

export function UploadPanel({ image, onCycleImage }) {
  return (
    <section className="panel-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">1단계. 이미지 입력</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            콘텐츠 이미지 업로드
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            JPG, PNG, HEIC 파일을 드래그하거나 클릭해서 업로드하세요. 샘플 이미지로 전체
            흐름을 미리 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/78 px-4 py-2 text-sm text-slate-600 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          드래그 앤 드롭 UI
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <button type="button" className="drop-zone text-left" onClick={onCycleImage}>
          <div className="pointer-events-none">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)]">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    이미지를 드래그하거나 클릭해서 업로드하세요
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    JPG, PNG, HEIC 지원 · 최대 10MB · 샘플 이미지로 바로 확인 가능
                  </p>
                </div>
              </div>

              <span className="soft-badge bg-[rgba(18,23,31,0.92)] text-white">
                <RefreshCcw className="h-3.5 w-3.5" />
                샘플 이미지 교체
              </span>
            </div>

            <MockScenePreview
              image={image}
              accent="#E86A4D"
              label="업로드 준비 완료"
              caption="드롭존 미리보기"
            />
          </div>
        </button>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(232,106,77,0.1)] text-[var(--accent-deep)]">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">현재 샘플 파일</p>
                <p className="mt-1 text-sm text-slate-500">{image.fileName}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-[rgba(248,244,239,0.9)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">촬영 포인트</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{image.subject}</p>
              </div>
              <div className="rounded-2xl bg-[rgba(248,244,239,0.9)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">비주얼 무드</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{image.note}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(232,106,77,0.16)] bg-[rgba(255,244,236,0.86)] p-5">
            <p className="text-sm font-semibold text-slate-900">추천 입력 힌트</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['4:5 세로 비율', '자연광 컷', '브랜드 무드 강조', '저장 유도형 구성'].map((chip) => (
                <span key={chip} className="chip-base bg-white text-slate-700">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
