import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  buildStyleRecommendations,
  categoryOptions,
  contentTypeOptions,
  defaultDescription,
  getAnalysisResult,
  sampleImages,
  savedProjects,
  workspaceStats,
} from './data/mockData';
import { DashboardScreen } from './screens/DashboardScreen';
import { UploadScreen } from './screens/UploadScreen';
import { InputScreen } from './screens/InputScreen';
import { AnalyzingScreen } from './screens/AnalyzingScreen';
import { StylePickScreen } from './screens/StylePickScreen';
import { ResultScreen } from './screens/ResultScreen';

const DEFAULT_CATEGORIES = ['카페', '데일리 라이프'];
const DEFAULT_CONTENT_TYPE = 'reel';

function buildInitialStyles() {
  return buildStyleRecommendations({
    contentType: DEFAULT_CONTENT_TYPE,
    selectedCategories: DEFAULT_CATEGORIES,
    description: defaultDescription,
  });
}

function App() {
  // Navigation
  const [step, setStep] = useState('home'); // 'home' | 'upload' | 'input' | 'analyzing' | 'styles' | 'result'

  // Form state
  const [description, setDescription] = useState(defaultDescription);
  const [contentType, setContentType] = useState(DEFAULT_CONTENT_TYPE);
  const [selectedCategories, setSelectedCategories] = useState(DEFAULT_CATEGORIES);
  const [imageIndex, setImageIndex] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // real uploaded photo URL

  // Analysis results
  const [analysis, setAnalysis] = useState(() =>
    getAnalysisResult(DEFAULT_CATEGORIES, DEFAULT_CONTENT_TYPE)
  );
  const [recommendedStyles, setRecommendedStyles] = useState(buildInitialStyles);
  const [selectedStyleId, setSelectedStyleId] = useState(() => buildInitialStyles()[0].id);
  const [captionIndex, setCaptionIndex] = useState(0);

  // Result tab
  const [resultTab, setResultTab] = useState('preview');

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  const currentImage = sampleImages[imageIndex];
  const selectedStyle =
    recommendedStyles.find((s) => s.id === selectedStyleId) ?? recommendedStyles[0];

  const showToast = (msg) => setToastMessage(msg);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const t = window.setTimeout(() => setToastMessage(''), 2600);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  // Handlers
  const handleToggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleStartAnalysis = () => {
    setStep('analyzing');
    window.setTimeout(() => {
      const nextAnalysis = getAnalysisResult(selectedCategories, contentType);
      const nextStyles = buildStyleRecommendations({
        contentType,
        selectedCategories,
        description,
      });
      setAnalysis(nextAnalysis);
      setRecommendedStyles(nextStyles);
      setSelectedStyleId(nextStyles[0].id);
      setCaptionIndex(0);
      setStep('styles');
      showToast(`"${nextAnalysis.category}" 기준으로 ${nextStyles.length}개 스타일을 추천했어요.`);
    }, 1600);
  };

  const handleSelectStyle = (styleId) => {
    setSelectedStyleId(styleId);
    setCaptionIndex(0);
  };

  const handleConfirmStyle = () => {
    setResultTab('preview');
    setStep('result');
    showToast(`"${selectedStyle.name}" 스타일로 콘텐츠를 생성했어요.`);
  };

  const handleCycleImage = () => {
    setImageIndex((prev) => (prev + 1) % sampleImages.length);
    showToast('샘플 이미지 무드를 교체했어요.');
  };

  const handleImageUpload = (file) => {
    // Revoke previous object URL to prevent memory leak
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    if (file) {
      setUploadedImageUrl(URL.createObjectURL(file));
      showToast('사진을 업로드했어요. 이 이미지로 스타일을 분석합니다.');
    } else {
      setUploadedImageUrl(null);
    }
  };

  const handleRegenerateCaption = () => {
    setCaptionIndex((prev) => (prev + 1) % selectedStyle.captions.length);
    showToast('같은 스타일 톤으로 캡션을 새로 제안했어요.');
  };

  const handleSaveDraft = () => {
    showToast('현재 결과를 초안으로 저장했어요.');
  };

  const handleExport = () => {
    showToast('내보내기 버튼을 눌렀어요. 실제 파일 생성 없이 MVP 흐름만 시연합니다.');
  };

  // Shared props for all screens
  const sharedProps = {
    currentImage,
    description,
    contentType,
    selectedCategories,
    analysis,
    recommendedStyles,
    selectedStyleId,
    selectedStyle,
    captionIndex,
    resultTab,
    savedProjects,
    workspaceStats,
    contentTypes: contentTypeOptions,
    categories: categoryOptions,
    uploadedImageUrl,
    // handlers
    onDescriptionChange: setDescription,
    onContentTypeChange: setContentType,
    onToggleCategory: handleToggleCategory,
    onCycleImage: handleCycleImage,
    onImageUpload: handleImageUpload,
    onSelectStyle: handleSelectStyle,
    onConfirmStyle: handleConfirmStyle,
    onRegenerateCaption: handleRegenerateCaption,
    onSaveDraft: handleSaveDraft,
    onExport: handleExport,
    onResultTabChange: setResultTab,
    // navigation
    onGoHome: () => setStep('home'),
    onStartNew: () => setStep('upload'),
    onGoToInput: () => setStep('input'),
    onGoToAnalyze: handleStartAnalysis,
    onBack: () => {
      const prev = { upload: 'home', input: 'upload', styles: 'input', result: 'styles' };
      setStep(prev[step] ?? 'home');
    },
  };

  return (
    <div className="min-h-screen">
      {step === 'home' && <DashboardScreen {...sharedProps} />}
      {step === 'upload' && <UploadScreen {...sharedProps} />}
      {step === 'input' && (
        <InputScreen
          {...sharedProps}
          onBack={() => setStep('upload')}
          onGoToAnalyze={handleStartAnalysis}
        />
      )}
      {step === 'analyzing' && <AnalyzingScreen />}
      {step === 'styles' && (
        <StylePickScreen
          {...sharedProps}
          onBack={() => setStep('input')}
        />
      )}
      {step === 'result' && (
        <ResultScreen
          {...sharedProps}
          onBack={() => setStep('styles')}
          onGoHome={() => setStep('home')}
        />
      )}

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm px-4">
          <div className="toast-card flex items-start gap-3 rounded-3xl px-5 py-4 text-sm text-white shadow-[0_24px_60px_rgba(15,23,42,0.26)]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(255,255,255,0.88)]" />
            <p className="leading-6">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
