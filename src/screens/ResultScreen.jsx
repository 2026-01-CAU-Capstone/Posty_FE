import { Bookmark, CheckCircle2, Download, Film, Hash, Home, RefreshCcw, Sparkles } from 'lucide-react';
import { MockScenePreview } from '../components/MockScenePreview';
import { ReelFlowCard } from '../components/ReelFlowCard';
import { HashtagCard } from '../components/HashtagCard';

const EDIT_ICON_MAP = ['크롭', '톤 조정', '밝기/대비'];

const TABS = [
  { id: 'preview', label: '게시물 미리보기' },
  { id: 'hashtags', label: '해시태그', icon: Hash },
  { id: 'reel', label: '릴스 플로우', icon: Film },
];

export function ResultScreen({
  currentImage,
  uploadedImageUrl,
  selectedStyle,
  captionIndex,
  contentType,
  resultTab,
  onResultTabChange,
  onRegenerateCaption,
  onSaveDraft,
  onExport,
  onBack,
  onGoHome,
}) {
  const visibleTabs = contentType === 'reel' ? TABS : TABS.filter((t) => t.id !== 'reel');
  const currentCaption = selectedStyle.captions[captionIndex];

  // Build intuitive edit direction items
  const editSteps = [
    {
      label: `크롭 방식`,
      value: selectedStyle.preview.crop,
      tip: cropTip(selectedStyle.preview.crop),
    },
    {
      label: `색감·톤`,
      value: selectedStyle.preview.tone,
      tip: `브랜드 무드와 통일감 있는 ${selectedStyle.preview.tone} 필터를 적용해요`,
    },
    {
      label: `대비 강도`,
      value: selectedStyle.preview.contrast,
      tip: contrastTip(selectedStyle.preview.contrast),
    },
  ].concat(
    selectedStyle.preview.adjustments.map((adj, i) => ({
      label: `포인트 ${i + 1}`,
      value: null,
      tip: adj,
    }))
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[rgba(124,96,74,0.1)] bg-[rgba(247,242,236,0.88)] backdrop-blur-xl px-6 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            onClick={onBack}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(124,96,74,0.14)] bg-white/80 text-base">←</span>
            스타일 재선택
          </button>

          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: selectedStyle.accent }} />
            <span className="text-sm font-semibold text-slate-900">{selectedStyle.name}</span>
            <span className="soft-badge bg-white/90 text-slate-500 text-xs">{selectedStyle.badge}</span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            onClick={onGoHome}
          >
            <Home className="h-4 w-4" />
            홈
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[rgba(124,96,74,0.1)] bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex gap-1">
            {visibleTabs.map((tab) => {
              const isActive = resultTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-[var(--accent)] text-[var(--accent-deep)]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => onResultTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto w-full max-w-4xl px-6 py-8 flex-1">

        {/* ── 게시물 미리보기 탭 ── */}
        {resultTab === 'preview' && (
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            {/* Instagram post mock – result only */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">완성된 게시물</p>
              <MockScenePreview
                image={currentImage}
                uploadedImageUrl={uploadedImageUrl}
                accent={selectedStyle.accent}
                filterStyle={selectedStyle.editedFilterStyle}
                overlayText={selectedStyle.preview.overlayText}
                caption={currentCaption.split('\n')[0]}
              />
            </div>

            {/* Caption + edit direction */}
            <div className="space-y-6">
              {/* Caption */}
              <div className="panel-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">게시물 설명 (캡션)</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedStyle.captionTone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {captionIndex + 1} / {selectedStyle.captions.length}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-full border border-[rgba(124,96,74,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[rgba(248,244,239,0.9)] transition-colors"
                      onClick={onRegenerateCaption}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      다른 버전
                    </button>
                  </div>
                </div>

                <div className="rounded-[22px] bg-[rgba(248,244,239,0.7)] px-5 py-5">
                  <p className="whitespace-pre-line text-[14.5px] leading-8 text-slate-700">{currentCaption}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {selectedStyle.captionGuides.map((guide) => (
                    <div
                      key={guide}
                      className="rounded-[18px] bg-[rgba(255,244,236,0.7)] px-3 py-3 text-xs leading-5 text-slate-600"
                    >
                      <Sparkles className="mb-1.5 h-3.5 w-3.5 text-[var(--accent)]" />
                      {guide}
                    </div>
                  ))}
                </div>
              </div>

              {/* Editing direction – intuitive */}
              <div className="panel-surface p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  <p className="text-sm font-semibold text-slate-900">이미지 편집 방향</p>
                </div>
                <div className="space-y-2">
                  {editSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-[18px] bg-[rgba(248,244,239,0.7)] px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">{step.label}</span>
                          {step.value && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-[rgba(124,96,74,0.1)]">
                              {step.value}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{step.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 해시태그 탭 ── */}
        {resultTab === 'hashtags' && (
          <HashtagCard
            hashtags={selectedStyle.hashtags}
            onTryAnotherStyle={onBack}
            onSaveDraft={onSaveDraft}
            onExport={onExport}
          />
        )}

        {/* ── 릴스 플로우 탭 ── */}
        {resultTab === 'reel' && contentType === 'reel' && (
          <ReelFlowCard flow={selectedStyle.reelFlow} />
        )}
      </main>

      {/* Bottom bar */}
      <div className="sticky bottom-0 border-t border-[rgba(124,96,74,0.1)] bg-[rgba(247,242,236,0.92)] backdrop-blur-xl px-6 py-4">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            완성된 콘텐츠 방향
          </div>
          <div className="flex items-center gap-3">
            {resultTab === 'preview' && (
              <button type="button" className="btn-secondary py-2.5 px-5" onClick={onRegenerateCaption}>
                <RefreshCcw className="h-4 w-4" />
                캡션 재생성
              </button>
            )}
            <button type="button" className="btn-secondary py-2.5 px-5" onClick={onSaveDraft}>
              <Bookmark className="h-4 w-4" />
              초안 저장
            </button>
            <button type="button" className="btn-primary py-2.5 px-5" onClick={onExport}>
              <Download className="h-4 w-4" />
              내보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers for intuitive copy
function cropTip(crop) {
  if (crop?.includes('4:5')) return '피드에서 더 크게 보이는 4:5 세로 비율 — 스크롤을 멈추는 효과가 있어요';
  if (crop?.includes('1:1')) return '피드에서 깔끔하게 보이는 정방형 — 브랜드 통일감에 좋아요';
  if (crop?.includes('9:16')) return '릴스·스토리 최적화 세로 비율 — 전체화면 몰입감을 줘요';
  return `${crop} 비율로 크롭해요`;
}

function contrastTip(contrast) {
  if (!contrast) return '자연스러운 대비로 설정해요';
  if (contrast.includes('soft') || contrast.includes('low')) return '대비를 낮게 유지해 부드럽고 자연스러운 느낌을 만들어요';
  if (contrast.includes('high')) return '대비를 높여 시선을 끌고 선명한 인상을 남겨요';
  return `대비를 ${contrast}으로 조정해요`;
}
