import { useEffect, useState } from 'react';

const ANALYSIS_STEPS = [
  '이미지 무드 감지 중...',
  '업종·카테고리 신호 분석 중...',
  '콘텐츠 형식 가중치 계산 중...',
  '스타일 점수 산출 중...',
];

export function AnalyzingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
    }, 320);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Spinning logo */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-[28px] bg-slate-900 shadow-[0_20px_48px_rgba(15,23,42,0.2)]" />
          <div className="absolute inset-0 rounded-[28px] border-2 border-[var(--accent)] opacity-30 animate-ping" />
          <div className="relative z-10 flex h-full items-center justify-center">
            <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Noto Serif KR, serif' }}>P</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">AI 분석 중</h2>
          <p className="text-sm text-slate-500">최적 스타일 조합을 계산하고 있어요</p>
        </div>

        {/* Steps */}
        <div className="panel-surface p-5 text-left space-y-3">
          {ANALYSIS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span
                className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  i < activeIndex
                    ? 'bg-[var(--accent)] text-white'
                    : i === activeIndex
                    ? 'bg-slate-900 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                {i < activeIndex ? '✓' : i + 1}
              </span>
              <span
                className={`text-sm transition-all duration-300 ${
                  i <= activeIndex ? 'text-slate-700 font-medium' : 'text-slate-300'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">잠시만 기다려 주세요...</p>
      </div>
    </div>
  );
}
