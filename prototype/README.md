# prototype/ — Posty 마법사 UI (Vite + React TSX)

posty-prototype 모노레포에서 분리해 가져온 프런트엔드. **Posty_BE** (`feat/#5-split-fe-be`) 의 Hono API(`:8787`) 와 HTTP 로만 통신한다.

## 구성

- `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`
- `src/App.tsx` — 4-step 마법사 (레퍼런스 → 소스 → 옵션 → 생성)
- `src/Posty.tsx` — 곰돌이 마스코트 SVG (`working` prop 으로 애니메이션)
- `src/api.ts` — Hono 백엔드 HTTP 클라이언트
- `src/main.tsx`, `src/styles.css`

## 백엔드 주소

`src/api.ts` 가 읽는 환경변수:

```
VITE_API_BASE=http://localhost:8787    # 기본값
```

## 실행

```bash
npm install
npm run dev    # http://localhost:5173
```

별도 터미널에서 [Posty_BE](https://github.com/2026-01-CAU-Capstone/Posty_BE) 의 backend(`:8787`) 가 떠 있어야 한다. 화면 상단의 "백엔드 연결됨" 초록 배지로 확인.

## 흐름

1. **레퍼런스** (IG URL 또는 파일) → "분석 시작하고 다음 →" → Stage 0 (Gemini Pro 영상 분석) 백그라운드 시작
2. 분석 도는 동안 **소스 영상** 추가 + **편집 옵션** (자막 언어/빈도, 톤, 키워드 등) 입력
3. **✨ 영상 생성** → Stage 1~4 실행. 진행률 + ETA + Posty 애니메이션
4. 완료 → 미리보기 + 다운로드

## 메모

- 이 디렉토리는 `develop` 의 루트 frontend(Vite + Tailwind + JSX 구조) 와 별개 구현이다. 추후 통합 여부는 팀과 조율.
- 자세한 백엔드 파이프라인 구조는 Posty_BE 의 `read.md` / `PIPELINE.md` 참고.
