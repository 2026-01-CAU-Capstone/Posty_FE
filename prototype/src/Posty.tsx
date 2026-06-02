// ============================================================
// Posty — 안경 쓴 꿀색 곰돌이 탐정 마스코트 (인라인 SVG, 오리지널 디자인).
// working=true → 돋보기로 "관찰하는" 애니메이션 (몸 흔들 + 돋보기 스캔 + 눈 깜빡 + 렌즈 반짝).
// 로고(정적)와 작업 중(애니메이션) 둘 다 같은 컴포넌트.
// ============================================================

export function Posty({ working = false, size = 56 }: { working?: boolean; size?: number }) {
  return (
    <span
      className={'posty' + (working ? ' working' : '')}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Posty 곰돌이 마스코트"
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <g className="posty-body">
          {/* 셔츠 (머리 아래로 살짝) */}
          <path d="M36 92 Q36 84 46 84 L74 84 Q84 84 84 92 L84 112 L36 112 Z" fill="#e7a3aa" />
          <path d="M52 84 Q60 92 68 84" fill="none" stroke="#cf838b" strokeWidth="2.5" />

          {/* 귀 */}
          <circle cx="40" cy="28" r="11" fill="#f1c873" />
          <circle cx="40" cy="29" r="5.5" fill="#e3b365" />
          <circle cx="80" cy="28" r="11" fill="#f1c873" />
          <circle cx="80" cy="29" r="5.5" fill="#e3b365" />

          {/* 머리 */}
          <circle cx="60" cy="54" r="33" fill="#f1c873" stroke="#cda340" strokeWidth="2" />

          {/* 주둥이 */}
          <ellipse cx="60" cy="65" rx="15" ry="11" fill="#f8dca2" />
          <ellipse cx="60" cy="60" rx="5" ry="3.6" fill="#5a4636" />
          <path d="M53 67 Q60 73 67 67" fill="none" stroke="#5a4636" strokeWidth="2" strokeLinecap="round" />

          {/* 눈 (안경 뒤) */}
          <g className="posty-eye eye-l"><circle cx="51" cy="49" r="3.1" fill="#3a2e28" /></g>
          <g className="posty-eye eye-r"><circle cx="69" cy="49" r="3.1" fill="#3a2e28" /></g>

          {/* 안경 */}
          <g className="posty-glasses">
            <line x1="41" y1="47" x2="33" y2="43" stroke="#4c4658" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="79" y1="47" x2="87" y2="43" stroke="#4c4658" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="51" cy="49" r="10" fill="rgba(255,255,255,0.10)" stroke="#4c4658" strokeWidth="2.6" />
            <circle cx="69" cy="49" r="10" fill="rgba(255,255,255,0.10)" stroke="#4c4658" strokeWidth="2.6" />
            <path d="M59 47 Q60 45 61 47" fill="none" stroke="#4c4658" strokeWidth="2.4" />
          </g>

          {/* 돋보기 + 잡은 손 (관찰) */}
          <g className="posty-magnifier">
            <line x1="80" y1="76" x2="90" y2="64" stroke="#8f7cd6" strokeWidth="5" strokeLinecap="round" />
            <circle cx="90" cy="60" r="12" fill="rgba(185,168,240,0.16)" stroke="#b9a8f0" strokeWidth="3.5" />
            <path className="posty-glint" d="M85 56 Q90 53 95 57" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            <circle cx="78" cy="80" r="8" fill="#f1c873" stroke="#cda340" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </span>
  );
}
