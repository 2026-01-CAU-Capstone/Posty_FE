// ============================================================
// Posty — 쿼카(quokka) 마스코트 (인라인 SVG, 오리지널 디자인).
//
// variant:
//   'detective' (기본) — 돋보기를 든 쿼카. working=true 면 돋보기로 "관찰하는"
//                        애니메이션 (몸 흔들 + 돋보기 스캔 + 눈 깜빡 + 렌즈 반짝).
//                        영상 생성/분석 단계에서 사용.
//   'logo'             — 포스트잇을 오물오물 씹고 있는 쿼카. 헤더 로고용.
//                        (working 이면 가볍게 bob)
// ============================================================

export function Posty({
  working = false,
  size = 56,
  variant = 'detective',
}: {
  working?: boolean;
  size?: number;
  variant?: 'detective' | 'logo';
}) {
  return (
    <span
      className={'posty' + (working ? ' working' : '') + (variant === 'logo' ? ' chewing' : '')}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Posty 쿼카 마스코트"
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <g className="posty-body">
          {/* ---- 몸통 (둥근 쿼카 몸) ---- */}
          <path d="M34 96 Q34 82 48 82 L72 82 Q86 82 86 96 L86 114 L34 114 Z" fill="#a9824f" />
          {/* 배 (밝은 색) */}
          <ellipse cx="60" cy="102" rx="16" ry="13" fill="#d8b483" />

          {/* ---- 귀 (작고 둥근 쿼카 귀) ---- */}
          <circle cx="42" cy="30" r="10" fill="#9c763f" />
          <circle cx="42" cy="31" r="5" fill="#caa06a" />
          <circle cx="78" cy="30" r="10" fill="#9c763f" />
          <circle cx="78" cy="31" r="5" fill="#caa06a" />

          {/* ---- 머리 ---- */}
          <circle cx="60" cy="52" r="32" fill="#b78a55" stroke="#90692f" strokeWidth="2" />

          {/* ---- 볼터치 ---- */}
          <ellipse cx="42" cy="60" rx="6" ry="4" fill="#e69aa0" opacity="0.55" />
          <ellipse cx="78" cy="60" rx="6" ry="4" fill="#e69aa0" opacity="0.55" />

          {/* ---- 주둥이 영역 (밝은 색) ---- */}
          <ellipse cx="60" cy="63" rx="16" ry="13" fill="#e3c79a" />

          {/* ---- 코 ---- */}
          <ellipse cx="60" cy="56" rx="4.6" ry="3.2" fill="#4a3526" />
          <line x1="60" y1="59" x2="60" y2="63" stroke="#4a3526" strokeWidth="2" strokeLinecap="round" />

          {/* ---- 입 (쿼카 특유의 미소) ---- */}
          <g className="posty-mouth">
            <path d="M50 65 Q60 74 70 65" fill="none" stroke="#6b4a30" strokeWidth="2.4" strokeLinecap="round" />
          </g>

          {/* ---- 포스트잇 (logo 변형에서만 — 입에 물고 오물오물) ---- */}
          {variant === 'logo' && (
            <g className="posty-postit">
              {/* 입 밖으로 삐져나온 포스트잇 한 조각 */}
              <g transform="rotate(-12 66 70)">
                <rect x="58" y="62" width="20" height="18" rx="2" fill="#ffe45e" stroke="#e6c63d" strokeWidth="1.4" />
                {/* 접힌 모서리 */}
                <path d="M72 62 L78 62 L78 68 Z" fill="#f5d84a" />
                {/* 메모 줄 */}
                <line x1="61" y1="68" x2="74" y2="68" stroke="#cfa92e" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="61" y1="72" x2="72" y2="72" stroke="#cfa92e" strokeWidth="1.2" strokeLinecap="round" />
              </g>
              {/* 씹는 부스러기 */}
              <circle className="posty-crumb posty-crumb-1" cx="50" cy="74" r="1.6" fill="#ffe45e" />
              <circle className="posty-crumb posty-crumb-2" cx="73" cy="78" r="1.4" fill="#ffe45e" />
            </g>
          )}

          {/* ---- 눈 ---- */}
          <g className="posty-eye eye-l"><circle cx="50" cy="48" r="4" fill="#3a2a1e" /><circle cx="51.4" cy="46.6" r="1.2" fill="#fff" /></g>
          <g className="posty-eye eye-r"><circle cx="70" cy="48" r="4" fill="#3a2a1e" /><circle cx="71.4" cy="46.6" r="1.2" fill="#fff" /></g>

          {/* ---- 돋보기 + 잡은 손 (detective 변형에서만) ---- */}
          {variant === 'detective' && (
            <g className="posty-magnifier">
              <line x1="80" y1="76" x2="90" y2="64" stroke="#8f7cd6" strokeWidth="5" strokeLinecap="round" />
              <circle cx="90" cy="60" r="12" fill="rgba(185,168,240,0.16)" stroke="#b9a8f0" strokeWidth="3.5" />
              <path className="posty-glint" d="M85 56 Q90 53 95 57" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
              {/* 잡은 앞발 */}
              <circle cx="78" cy="80" r="8" fill="#a9824f" stroke="#90692f" strokeWidth="1.5" />
            </g>
          )}
        </g>
      </svg>
    </span>
  );
}
