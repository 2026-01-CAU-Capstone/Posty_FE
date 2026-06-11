# Posty_FE

Posty 프런트엔드 — 레퍼런스 릴스의 편집 스타일로 내 영상을 자동 편집하는 마법사 UI (Vite + React + TypeScript).

백엔드는 별도 저장소 [**Posty_BE**](https://github.com/2026-01-CAU-Capstone/Posty_BE) 입니다. 이 앱은 HTTP 로만 백엔드와 통신합니다.

## 빠른 시작

필요: **Node 18+**

```bash
npm install
npm run dev        # → http://localhost:5173
```

백엔드(Posty_BE)를 `:8787` 에 띄워두면 화면 헤더에 **"백엔드 연결됨"** 배지가 보입니다.

## 백엔드 주소 변경

기본값은 `http://localhost:8787`. 다른 주소(배포된 백엔드 등)를 쓰려면 환경변수 `VITE_API_BASE` 를 설정합니다.

`.env.local` (커밋되지 않음, `.env.example` 참고):

```
VITE_API_BASE=https://your-backend.example.com
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (`:5173`, HMR) |
| `npm run build` | 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run typecheck` | 타입 체크 (`tsc --noEmit`) |

## 배포

`npm run build` 로 정적 파일(`dist/`)을 만들어 Vercel / Netlify / 정적 호스팅에 올리면 됩니다.
빌드 시 백엔드 주소를 `VITE_API_BASE` 로 지정하세요 (예: 빌드 환경변수).

## 구조

```
src/
├── main.tsx      진입점
├── App.tsx       8단계 마법사 (레퍼런스 → 소스 → 분석 → 옵션 → 편집 → 자막 → BGM → 완성)
├── Posty.tsx     클래퍼보드 마스코트 (canvas 애니메이션)
├── api.ts        백엔드 HTTP 클라이언트
└── styles.css
```
