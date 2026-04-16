import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ImagePlus, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';

const STEPS = ['이미지', '설명', '분석', '스타일', '완성'];
const ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,image/webp';

export function UploadScreen({ currentImage, onCycleImage, onGoHome, onGoToInput, uploadedImageUrl, onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };
  const handleClear = (e) => {
    e.stopPropagation();
    onImageUpload(null);
  };

  const hasUpload = Boolean(uploadedImageUrl);

  return (
    <div className="min-h-screen flex flex-col">
      <StepNav currentStep={0} steps={STEPS} onGoHome={onGoHome} />

      <main className="mx-auto w-full max-w-2xl px-6 py-8 flex-1 space-y-5">
        <div>
          <p className="section-kicker">1단계 / 이미지 업로드</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            게시할 사진을 올려주세요
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            JPG, PNG, HEIC, WEBP 파일을 드래그하거나 클릭해서 업로드하세요. 최대 10MB.
          </p>
        </div>

        {/* ── 업로드 존 ── */}
        {!hasUpload ? (
          <div
            className={`relative rounded-[28px] border-2 border-dashed transition-all duration-200 cursor-pointer
              ${isDragging
                ? 'border-[var(--accent)] bg-[rgba(232,106,77,0.05)] scale-[1.01]'
                : 'border-[rgba(124,96,74,0.22)] bg-white/60 hover:border-[var(--accent)] hover:bg-[rgba(232,106,77,0.03)]'
              }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] transition-colors ${
                isDragging ? 'bg-[var(--accent)] text-white' : 'bg-slate-900 text-white'
              } shadow-[0_16px_32px_rgba(15,23,42,0.18)]`}>
                <UploadCloud className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {isDragging ? '여기에 놓으세요' : '클릭하거나 드래그해서 업로드'}
                </p>
                <p className="mt-1.5 text-sm text-slate-400">JPG · PNG · HEIC · WEBP · 최대 10MB</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── 업로드된 사진 → Instagram 포스트 스타일 ── */
          <div className="relative">
            <button
              type="button"
              onClick={handleClear}
              className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <InstagramPostFrame imageUrl={uploadedImageUrl} profile={currentImage} />
          </div>
        )}

        {/* ── 샘플 이미지 옵션 (업로드 전에만) ── */}
        {!hasUpload && (
          <div className="rounded-[24px] border border-[rgba(124,96,74,0.12)] bg-white/70 px-5 py-4">
            <p className="mb-3 text-xs font-semibold text-slate-400">또는 샘플 이미지로 시작하기</p>
            <button
              type="button"
              className="flex w-full items-center gap-3 text-left transition-all duration-200 hover:opacity-80"
              onClick={onCycleImage}
            >
              {currentImage.src ? (
                <img
                  src={currentImage.src}
                  alt={currentImage.label}
                  className="h-12 w-12 shrink-0 rounded-[14px] border border-white/50 shadow-sm object-cover"
                />
              ) : (
                <div
                  className="h-12 w-12 shrink-0 rounded-[14px] border border-white/50 shadow-sm"
                  style={{ background: currentImage.background }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentImage.label}</p>
                <p className="text-xs text-slate-400 truncate">{currentImage.subject}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(124,96,74,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                <RefreshCcw className="h-3.5 w-3.5" />
                다른 샘플
              </span>
            </button>
          </div>
        )}

        {/* ── 업로드 완료 상태 표시 ── */}
        {hasUpload && (
          <div className="flex items-center gap-3 rounded-[20px] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">업로드 완료</p>
              <p className="text-xs text-emerald-600">이 사진으로 스타일 분석을 시작합니다</p>
            </div>
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[rgba(248,244,239,0.9)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              다시 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* ── 다음 버튼 ── */}
        <button
          type="button"
          className="btn-primary w-full justify-center py-4 text-base"
          onClick={onGoToInput}
        >
          {hasUpload ? '업로드 완료 — 설명 입력으로' : '샘플로 계속하기'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </main>
    </div>
  );
}

/* ── 인스타그램 포스트 프레임 ── */
function InstagramPostFrame({ imageUrl, profile }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[rgba(219,219,219,0.65)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] p-[2px]">
            <div className="h-full w-full rounded-full bg-white p-[1.5px]">
              <div className="h-full w-full rounded-full overflow-hidden">
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold leading-tight text-[#262626]">내 계정</p>
            <p className="text-[11px] leading-tight text-[#737373]">게시 예정</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#262626]" />
      </div>

      {/* Photo */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-[#fafafa]">
        <img
          src={imageUrl}
          alt="업로드된 사진"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Actions */}
      <div className="px-3 pt-2.5 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-[22px] w-[22px] text-[#262626]" />
            <MessageCircle className="h-[22px] w-[22px] text-[#262626]" />
            <Send className="h-[22px] w-[22px] text-[#262626]" />
          </div>
          <Bookmark className="h-[22px] w-[22px] text-[#262626]" />
        </div>
        <p className="text-[12.5px] font-semibold text-[#262626]">좋아요 0개</p>
        <p className="text-[12.5px] text-[#737373]">캡션이 곧 생성됩니다...</p>
        <p className="text-[11px] text-[#8E8E8E]">방금 전</p>
      </div>
    </div>
  );
}

function StepNav({ currentStep, steps, onGoHome }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(124,96,74,0.1)] bg-[rgba(247,242,236,0.88)] backdrop-blur-xl px-6 py-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          onClick={onGoHome}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(124,96,74,0.14)] bg-white/80 text-slate-500">
            ←
          </span>
          홈
        </button>

        <div className="flex items-center gap-1.5">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  i === currentStep
                    ? 'bg-slate-900 text-white'
                    : i < currentStep
                    ? 'bg-[rgba(232,106,77,0.12)] text-[var(--accent-deep)]'
                    : 'text-slate-300'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    i === currentStep
                      ? 'bg-white/20 text-white'
                      : i < currentStep
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-3 ${i < currentStep ? 'bg-[var(--accent)]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="w-16" />
      </div>
    </header>
  );
}

export { StepNav };
