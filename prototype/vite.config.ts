import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // PostCSS 설정을 인라인(빈 플러그인)으로 고정 — 이게 없으면 Vite 가 상위 폴더의
  // postcss.config.js(상위 mockup 프로젝트용, tailwindcss 의존)를 주워와 prototype 빌드가
  // "Cannot find module 'tailwindcss'" 로 실패한다. prototype 은 순수 CSS(styles.css)라
  // PostCSS 플러그인이 필요 없으므로 빈 설정으로 탐색을 차단한다.
  css: { postcss: { plugins: [] } },
});
