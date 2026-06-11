// ============================================================
// Posty — 클래퍼보드 마스코트 (HTML <canvas>).
//
// 디자인 레퍼런스: 둥근 흰색 슬레이트 바디 + 위쪽에 무지개색 줄무늬가
// 그려진 검은 클래퍼 바 두 개 (아래는 바디 상단에 고정, 위는 힌지로
// 열렸다 닫혔다). 양쪽 옆에 작은 흰색 손 두 개, 아래에 까만 발 두 개.
// 큰 점눈 + 흰색 스파클 하이라이트 + 분홍 볼터치 + W 미소.
//
// 클래퍼보드의 시그니처 모션 — "딱!" 하고 클래퍼 바가 닫혔다 열리는
// 동작이 박수(bothClap) / 신남(excitedFound) / 놀람(surprise) 라우틴에
// 자연스럽게 녹아 있다. (놀람 → 클래퍼 활짝 펼침, 박수 → 클래퍼 클랩)
//
// 외부 API 는 동일:
//   working?: boolean — true 면 detective 시 magnifier 스캔 강도 ↑
//   size?: number     — 한 변 px
//   variant?: 'detective' | 'logo'
// ============================================================

import { useEffect, useRef } from 'react';

type Variant = 'detective' | 'logo';

export function Posty({
  working = false,
  size = 56,
  variant = 'detective',
}: {
  working?: boolean;
  size?: number;
  variant?: Variant;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ working, variant, size });
  stateRef.current = { working, variant, size };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const setupCanvas = () => {
      const { size } = stateRef.current;
      const px = Math.round(size * dpr);
      if (canvas.width !== px) canvas.width = px;
      if (canvas.height !== px) canvas.height = px;
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
    };
    setupCanvas();

    // ── 파티클 풀 (스파클·하트·부스러기) ─────────────────────
    type Particle = { kind: 'sparkle' | 'heart' | 'crumb'; x: number; y: number; vx: number; vy: number; rot: number; vr: number; age: number; life: number; size: number };
    const particles: Particle[] = [];
    const emit = (kind: Particle['kind'], x: number, y: number, opts: Partial<Particle> = {}) => {
      particles.push({
        kind, x, y,
        vx: (Math.random() - 0.5) * 6, vy: -8 + Math.random() * -4,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 4,
        age: 0, life: 0.8 + Math.random() * 0.4,
        size: 1.2 + Math.random() * 0.9,
        ...opts,
      });
    };

    // ── 라우틴 ────────────────────────────────────────────────
    // 각 routine 은 (pose, t) 를 받아 pose 를 mutate. t = [0..1].
    // base pose 위에 얹히는 변화만 적용 → t=0/t=1 시점에 자연스럽게 base 로 수렴.
    type EyeShape = 'dot' | 'closed' | 'heart' | 'wide' | 'sparkle';
    type Pose = {
      bodyY: number; bodyScale: number; bodyTilt: number;
      clapperOpen: number;     // 0 = 완전히 닫힘, 1 = 기본 열림, 1.4 = 와이드 (놀람)
      blushAlpha: number;
      eyeL: { open: number; shape: EyeShape };
      eyeR: { open: number; shape: EyeShape };
      mouthOpen: number;       // 0 = W미소, 1 = O모양 (놀람)
      mouthSize: number;       // 0.9..1.15
      pawL: { raise: number; rot: number; isHigh: boolean };
      pawR: { raise: number; rot: number; isHigh: boolean };
      showPostit: boolean; postitWiggle: number;
      showMagnifier: boolean; magOffset: { x: number; y: number }; magRot: number; magGlint: number;
    };
    const newPose = (): Pose => ({
      bodyY: 0, bodyScale: 1, bodyTilt: 0,
      clapperOpen: 1,
      blushAlpha: 0.55,
      eyeL: { open: 1, shape: 'dot' },
      eyeR: { open: 1, shape: 'dot' },
      mouthOpen: 0, mouthSize: 1,
      pawL: { raise: 1, rot: 0, isHigh: false },
      pawR: { raise: 1, rot: 0, isHigh: false },
      showPostit: false, postitWiggle: 0,
      showMagnifier: false, magOffset: { x: 0, y: 0 }, magRot: 0, magGlint: 0.4,
    });

    type Routine = { name: string; duration: number; apply: (p: Pose, t: number, ctxTime: number) => void };
    // bell 곡선: 0..1..0
    const bell = (t: number) => Math.sin(t * Math.PI);
    // 윈도우: tMin~tMax 구간에서만 0..1..0, 밖에선 0
    const winBell = (t: number, tMin: number, tMax: number) => {
      if (t < tMin || t > tMax) return 0;
      return bell((t - tMin) / (tMax - tMin));
    };
    // easeOutBack(t) — 약간 튕기는 복귀
    const easeOutBack = (t: number) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // ─ 공용 routine ─
    const idle: Routine = {
      name: 'idle', duration: 3.0,
      apply: (p, t) => {
        p.bodyY = Math.sin(t * Math.PI * 2) * 1.2;
        // 클래퍼가 미세하게 호흡하듯 열렸다 닫혔다
        p.clapperOpen = 1 + Math.sin(t * Math.PI * 2) * 0.05;
        p.pawL.raise = 1 + Math.sin(t * Math.PI * 2 + 0.5) * 0.06;
        p.pawR.raise = 1 + Math.sin(t * Math.PI * 2) * 0.06;
        p.blushAlpha = 0.55;
      },
    };
    const waveLeft: Routine = {
      name: 'waveLeft', duration: 2.0,
      apply: (p, t) => {
        const w = bell(t);
        p.pawL.raise = 1 + 0.8 * w;
        p.pawL.rot = Math.sin(t * Math.PI * 4) * 0.55 * w;
        p.eyeL.open = 1 - 0.15 * w;
      },
    };
    const waveRight: Routine = {
      name: 'waveRight', duration: 2.0,
      apply: (p, t) => {
        const w = bell(t);
        p.pawR.raise = 1 + 0.8 * w;
        p.pawR.rot = -Math.sin(t * Math.PI * 4) * 0.55 * w;
        p.eyeR.open = 1 - 0.15 * w;
      },
    };
    // 클래퍼보드의 시그니처 동작 — "딱! 딱! 딱!" 클래퍼가 3 번 닫혔다 열린다.
    const bothClap: Routine = {
      name: 'bothClap', duration: 1.8,
      apply: (p, t, now) => {
        const env = bell(t);
        // 3 번 클랩: 닫힘(0) → 열림(1) → 닫힘 → 열림 → 닫힘 → 열림
        // cos 0~1 사이 진동을 envelope 로 깎아 라우틴 시작/끝에서 base 로 수렴
        const phase = t * Math.PI * 6;
        const closeStrength = (Math.cos(phase) + 1) / 2; // 0..1
        p.clapperOpen = 1 - 1.0 * closeStrength * env;
        // 손도 살짝 모여 박수 모션
        p.pawL.rot = 0.25 * closeStrength * env;
        p.pawR.rot = -0.25 * closeStrength * env;
        p.pawL.raise = 1 + 0.1 * env;
        p.pawR.raise = 1 + 0.1 * env;
        // 클랩 임팩트 → 스파클
        if (closeStrength > 0.88 && env > 0.5 && Math.random() < 0.45) {
          emit('sparkle', 60 + (Math.random() - 0.5) * 18, 48 + (Math.random() - 0.5) * 4, { vy: -10 - Math.random() * 6, life: 0.55 });
          void now;
        }
      },
    };
    const winkLeft: Routine = {
      name: 'winkLeft', duration: 1.6,
      apply: (p, t) => {
        const k = winBell(t, 0.3, 0.65);
        p.eyeL.open = 1 - k;
        p.mouthSize = 1 + 0.08 * bell(t);
      },
    };
    const winkRight: Routine = {
      name: 'winkRight', duration: 1.6,
      apply: (p, t) => {
        const k = winBell(t, 0.3, 0.65);
        p.eyeR.open = 1 - k;
        p.mouthSize = 1 + 0.08 * bell(t);
      },
    };
    const headTilt: Routine = {
      name: 'headTilt', duration: 2.6,
      apply: (p, t) => {
        const ph = t * Math.PI * 2;
        p.bodyTilt = Math.sin(ph) * 0.14 * bell(t);
      },
    };
    // 놀람 → 클래퍼가 활짝 열림 (와이드)
    const surprise: Routine = {
      name: 'surprise', duration: 1.5,
      apply: (p, t) => {
        const k = winBell(t, 0.2, 0.7);
        p.clapperOpen = 1 + 0.4 * k;   // 평소보다 더 활짝
        p.eyeL.open = 1 + 0.5 * k;
        p.eyeR.open = 1 + 0.5 * k;
        p.mouthOpen = k;
        p.mouthSize = 1 + 0.15 * k;
        p.pawL.raise = 1 + 0.5 * k;
        p.pawR.raise = 1 + 0.5 * k;
        p.bodyY = -2 * k;
      },
    };
    const heartEyes: Routine = {
      name: 'heartEyes', duration: 2.4,
      apply: (p, t) => {
        if (t > 0.2 && t < 0.85) {
          p.eyeL.shape = 'heart';
          p.eyeR.shape = 'heart';
        }
        p.blushAlpha = 0.55 + 0.35 * bell(t);
        p.mouthSize = 1 + 0.08 * bell(t);
        // 둥둥 떠다니는 하트
        if (t > 0.2 && t < 0.85 && Math.random() < 0.06) {
          emit('heart', 60 + (Math.random() - 0.5) * 30, 60 + (Math.random() - 0.5) * 10, {
            vx: (Math.random() - 0.5) * 3, vy: -8 - Math.random() * 4,
            life: 1.0,
          });
        }
      },
    };
    const holdPostit: Routine = {
      name: 'holdPostit', duration: 2.6,
      apply: (p, t) => {
        const k = winBell(t, 0.15, 0.95);
        p.showPostit = k > 0.05;
        p.postitWiggle = bell(t * 5) * k;
        p.pawL.raise = 1 + 0.8 * k;
        p.pawR.raise = 1 + 0.8 * k;
        p.pawL.rot = -0.18 * k;
        p.pawR.rot = 0.18 * k;
      },
    };
    // "삐끔" 숨었다 빼꼼 → 바디가 내려가고 클래퍼도 닫히며 숨었다 다시 튀어오른다
    const hidePeek: Routine = {
      name: 'hidePeek', duration: 2.2,
      apply: (p, t) => {
        if (t < 0.4) {
          const k = t / 0.4;
          p.bodyY = 30 * k;
          p.clapperOpen = 1 - 0.85 * k;
          p.eyeL.open = 1 - k * 0.6;
          p.eyeR.open = 1 - k * 0.6;
        } else if (t < 0.55) {
          p.bodyY = 30;
          p.clapperOpen = 0.15;
          p.eyeL.open = 0.4;
          p.eyeR.open = 0.4;
        } else {
          const k = (t - 0.55) / 0.45;
          p.bodyY = 30 * (1 - easeOutBack(k));
          p.clapperOpen = 0.15 + 0.85 * Math.min(1, k * 1.3);
          const o = Math.min(1, k * 1.3);
          p.eyeL.open = 0.4 + (1 - 0.4) * o;
          p.eyeR.open = 0.4 + (1 - 0.4) * o;
          if (k > 0.6 && k < 0.7 && Math.random() < 0.5) {
            emit('sparkle', 50 + Math.random() * 20, 50, { vy: -6 });
          }
        }
      },
    };
    const happyBounce: Routine = {
      name: 'happyBounce', duration: 1.8,
      apply: (p, t) => {
        const ph = t * Math.PI * 4;
        p.bodyY = -Math.max(0, Math.sin(ph)) * 6;
        p.bodyScale = 1 + 0.04 * Math.max(0, Math.sin(ph));
        // 점프할 때마다 클래퍼가 살짝 더 열림
        p.clapperOpen = 1 + 0.15 * Math.max(0, Math.sin(ph));
        p.mouthSize = 1 + 0.1 * bell(t);
      },
    };

    // ─ detective 전용 routine ─
    const scan: Routine = {
      name: 'scan', duration: 3.0,
      apply: (p, t) => {
        p.showMagnifier = true;
        // 8자 모양 Lissajous 스캔
        const ph = t * Math.PI * 2;
        p.magOffset.x = Math.sin(ph) * 9;
        p.magOffset.y = Math.sin(ph * 2) * 5;
        p.magRot = Math.sin(ph) * 0.2;
        p.magGlint = 0.5 + 0.4 * Math.sin(t * Math.PI * 6);
        // 오른손이 magnifier 들고 있는 포즈
        p.pawR.rot = -0.25;
        p.pawR.raise = 1.3;
        if (Math.random() < 0.04) {
          emit('sparkle', 95 + Math.random() * 10 - 5, 60 + Math.random() * 10 - 5, { vy: -4, life: 0.5 });
        }
      },
    };
    const excitedFound: Routine = {
      name: 'excitedFound', duration: 1.4,
      apply: (p, t) => {
        // "찾았다!" — 점프 + 클래퍼 박수 + 두 손 흔들
        p.showMagnifier = true;
        const env = bell(t);
        p.bodyY = -Math.max(0, Math.sin(t * Math.PI * 3)) * 5;
        // 빠른 클랩
        const phase = t * Math.PI * 8;
        p.clapperOpen = 1 - 0.65 * Math.max(0, Math.sin(phase)) * env;
        p.pawL.raise = 1 + 0.5 * env;
        p.pawR.raise = 1 + 0.5 * env;
        p.pawL.rot = Math.sin(t * Math.PI * 6) * 0.4 * env;
        p.pawR.rot = -Math.sin(t * Math.PI * 6) * 0.4 * env;
        p.mouthOpen = env * 0.6;
        p.mouthSize = 1 + 0.15 * env;
        if (t > 0.2 && t < 0.7 && Math.random() < 0.3) {
          emit('sparkle', 60 + (Math.random() - 0.5) * 40, 50 + (Math.random() - 0.5) * 20, { vy: -12 - Math.random() * 6 });
        }
      },
    };
    const lookAround: Routine = {
      name: 'lookAround', duration: 2.4,
      apply: (p, t) => {
        const ph = t * Math.PI * 2;
        p.bodyTilt = Math.sin(ph) * 0.08;
        p.showMagnifier = true;
        p.magOffset.x = Math.sin(ph) * 4;
      },
    };

    // ─ 라우틴 풀 ─
    const LOGO_POOL: Routine[] = [
      idle, idle,          // idle 비중 ↑
      waveLeft, waveRight, bothClap, bothClap,   // 클래퍼 클랩은 시그니처이므로 비중 ↑
      winkLeft, winkRight, headTilt,
      surprise, heartEyes, holdPostit, hidePeek, happyBounce,
    ];
    const DETECTIVE_POOL: Routine[] = [
      scan, scan, scan,    // 일하는 시간이 길어서 스캔 비중 ↑
      lookAround, excitedFound,
      waveLeft, waveRight, winkLeft, happyBounce,
    ];

    // ─ 라우틴 스케줄 ─
    let currentRoutine: Routine = idle;
    let routineStart = 0;
    let lastRoutine: Routine = idle;
    const pickRoutine = (pool: Routine[]): Routine => {
      for (let tries = 0; tries < 4; tries++) {
        const r = pool[Math.floor(Math.random() * pool.length)];
        if (r !== lastRoutine) return r;
      }
      return pool[Math.floor(Math.random() * pool.length)];
    };

    let raf = 0;
    let alive = true;
    const t0 = performance.now();
    let lastFrameMs = t0;

    const draw = (now: number) => {
      if (!alive) return;
      setupCanvas();
      const { working, variant } = stateRef.current;
      const t = (now - t0) / 1000;
      const dt = Math.max(0.001, Math.min(0.1, (now - lastFrameMs) / 1000));
      lastFrameMs = now;

      // 라우틴 진행
      const pool = variant === 'detective' ? DETECTIVE_POOL : LOGO_POOL;
      let inRoutine = t - routineStart;
      if (inRoutine >= currentRoutine.duration) {
        lastRoutine = currentRoutine;
        currentRoutine = pickRoutine(pool);
        routineStart = t;
        inRoutine = 0;
      }
      const rt = inRoutine / currentRoutine.duration;

      // pose 합성
      const pose = newPose();
      currentRoutine.apply(pose, rt, now);
      if (variant === 'detective' && !working) {
        pose.magGlint *= 0.5;
        pose.magOffset.x *= 0.4;
        pose.magOffset.y *= 0.4;
      }

      // ── 캔버스 좌표계 — viewBox 120×120 → DPR 픽셀 ──
      const W = canvas.width, H = canvas.height;
      ctx.setTransform(W / 120, 0, 0, H / 120, 0, 0);
      ctx.clearRect(0, 0, 120, 120);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // body 전체 변형 (bob/tilt/scale)
      ctx.translate(60, 60);
      ctx.rotate(pose.bodyTilt);
      ctx.translate(-60, -60 + pose.bodyY);
      ctx.translate(60, 100);
      ctx.scale(pose.bodyScale, pose.bodyScale);
      ctx.translate(-60, -100);

      // 그림자
      const shadowAlpha = Math.max(0, 0.18 - pose.bodyY * 0.005);
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
      ellipseFill(ctx, 60, 116, 28 - pose.bodyY * 0.15, 4);

      // ── 발 (바디 뒤에 살짝 가려지도록 먼저) ──
      drawFeet(ctx);

      // ── 슬레이트 바디 (둥근 흰 사각형) ──
      drawSlate(ctx);

      // ── 아래쪽 클래퍼 바 (바디 상단에 고정) ──
      drawClapperBar(ctx, /*y*/ 42, /*rotation*/ 0, /*hingeX*/ 0, /*hingeY*/ 0);

      // ── 위쪽 클래퍼 바 (힌지로 열렸다 닫혔다) ──
      // 닫힘 위치: y = 32 (아래 바 위에 딱 붙음). 힌지 = (28, 42) 모서리.
      // 열림: clapperOpen 1 일 때 약 -23° 회전 (왼쪽 위로 swing-up).
      // 캔버스 상단 클리핑을 피하기 위해 최대 각도는 -0.5 rad 로 제한.
      const clapAngle = -Math.min(0.5, Math.max(0, pose.clapperOpen) * 0.4);
      drawClapperBar(ctx, /*y*/ 32, clapAngle, /*hingeX*/ 28, /*hingeY*/ 42);

      // ── 힌지 핀 ──
      ctx.fillStyle = '#f5f5f5';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(28, 42, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // ── 얼굴 (슬레이트 바디 위에 그림) ──
      // 볼터치
      ctx.fillStyle = `rgba(244,168,150,${pose.blushAlpha.toFixed(3)})`;
      ellipseFill(ctx, 38, 82, 5.5, 3.6);
      ellipseFill(ctx, 82, 82, 5.5, 3.6);

      // 눈
      drawEye(ctx, 50, 76, pose.eyeL);
      drawEye(ctx, 70, 76, pose.eyeR);

      // 입
      drawMouth(ctx, pose);

      // 두 손 (양 옆)
      drawPaw(ctx, 18, 88, pose.pawL, +1);
      drawPaw(ctx, 102, 88, pose.pawR, -1);

      // 들고 있는 포스트잇 (두 손 사이로 올림)
      if (pose.showPostit) {
        drawPostit(ctx, 60, 78 - pose.pawL.raise * 6, pose.postitWiggle);
      }

      // 돋보기 (detective)
      if (variant === 'detective' && pose.showMagnifier) {
        drawMagnifier(ctx, 96 + pose.magOffset.x, 78 + pose.magOffset.y, pose.magRot, pose.magGlint);
      }

      // 파티클 업데이트 & 그리기
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age > p.life) { particles.splice(i, 1); continue; }
        if (p.kind === 'heart') p.vy += -2 * dt;
        else if (p.kind === 'sparkle') p.vy += 2 * dt;
        else p.vy += 18 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const fade = 1 - p.age / p.life;
        if (p.kind === 'heart') drawHeart(ctx, p.x, p.y, p.size + 0.5, `rgba(244,168,150,${fade.toFixed(3)})`);
        else if (p.kind === 'sparkle') drawSparkle(ctx, p.x, p.y, p.size, `rgba(255,235,165,${fade.toFixed(3)})`);
        else drawCrumb(ctx, p.x, p.y, p.size, p.rot, `rgba(255,228,94,${fade.toFixed(3)})`);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <span
      className={'posty' + (working ? ' working' : '')}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
      role="img"
      aria-label="Posty 클래퍼보드 마스코트"
    >
      <canvas ref={canvasRef} />
    </span>
  );
}

// ============================================================
// 헬퍼 — viewBox 120×120 기준 좌표계
// ============================================================
function ellipseFill(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

// 둥근 흰색 슬레이트 바디
function drawSlate(ctx: CanvasRenderingContext2D) {
  // 본체 — 부드러운 라운드 사각형
  ctx.fillStyle = '#fbfbfb';
  ctx.strokeStyle = 'rgba(48,32,28,0.18)';
  ctx.lineWidth = 1.4;
  roundedRect(ctx, 20, 50, 80, 60, 8);
  ctx.fill();
  ctx.stroke();

  // 살짝 안쪽 밝은 하이라이트 (왼쪽 위)
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(36, 60, 12, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

// 발 (까만 콩 두 개)
function drawFeet(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1c1c1c';
  ellipseFill(ctx, 46, 112, 6, 4);
  ellipseFill(ctx, 74, 112, 6, 4);
}

// 클래퍼 바 — 검은 라운드 사각형 + 무지개색 사선 줄무늬
// y = 사각형 top (회전 전 좌표).
// rotation 이 0 이 아니면 (hingeX, hingeY) 를 축으로 회전.
function drawClapperBar(ctx: CanvasRenderingContext2D, y: number, rotation: number, hingeX: number, hingeY: number) {
  const x = 18, w = 84, h = 10, r = 3;
  ctx.save();
  if (rotation !== 0) {
    ctx.translate(hingeX, hingeY);
    ctx.rotate(rotation);
    ctx.translate(-hingeX, -hingeY);
  }
  // 검은 바
  ctx.fillStyle = '#1c1c1c';
  roundedRect(ctx, x, y, w, h, r);
  ctx.fill();

  // 줄무늬 (사선) — 클립 후 평행사변형으로 칠하기
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const STRIPES = ['#fbfbfb', '#5cba60', '#f0c93a', '#4fa9d6', '#d6533a'];
  const numStripes = 7;
  const sw = (w + h) / numStripes; // 사선이라 horizontal extent 가 더 길어짐
  const slant = h; // 사선 기울기
  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = STRIPES[i % STRIPES.length];
    const x0 = x - slant + i * sw;
    ctx.beginPath();
    ctx.moveTo(x0, y + h);
    ctx.lineTo(x0 + sw, y + h);
    ctx.lineTo(x0 + sw + slant, y);
    ctx.lineTo(x0 + slant, y);
    ctx.closePath();
    ctx.fill();
  }
  // 바 윗변에 살짝 어두운 라인
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
  ctx.restore();

  // 외곽 outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  roundedRect(ctx, x + 0.4, y + 0.4, w - 0.8, h - 0.8, Math.max(0.5, r - 0.3));
  ctx.stroke();

  ctx.restore();
}

function drawEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, eye: { open: number; shape: 'dot' | 'closed' | 'heart' | 'wide' | 'sparkle' }) {
  const o = Math.max(0, Math.min(1.5, eye.open));
  if (eye.shape === 'heart') {
    drawHeart(ctx, cx, cy, 3.6, '#d6536b');
    return;
  }
  if (o < 0.1 || eye.shape === 'closed') {
    // 감은 눈 — 곡선
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, cy);
    ctx.quadraticCurveTo(cx, cy + 2.6, cx + 3.5, cy);
    ctx.stroke();
    return;
  }
  // 큰 점눈 — 클래퍼보드 마스코트의 시그니처: 동그란 큰 눈
  ctx.fillStyle = '#1a1410';
  const rx = 3.4 * (eye.shape === 'wide' ? 1.1 : 1) * Math.min(1, o);
  const ry = 4.0 * Math.min(1.3, o);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // 하이라이트 — 큰 거 1 + 작은 거 1 (반짝반짝)
  if (o > 0.4) {
    const a = (o - 0.4) / 0.6;
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(cx + 1.0, cy - 1.4, 1.1, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 1.1, cy + 1.0, 0.55, 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 시그니처 W 미소 또는 (놀랐을 때) O 모양 입
function drawMouth(ctx: CanvasRenderingContext2D, pose: { mouthOpen: number; mouthSize: number }) {
  const cx = 60, cy = 90;
  const s = pose.mouthSize;
  const open = pose.mouthOpen;

  if (open > 0.15) {
    // O 모양 (놀람)
    const ry = 3 + 3.5 * open;
    const rx = 3.2 + 1.2 * open;
    ctx.fillStyle = '#3a261c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * s, ry * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // 안쪽 빨간 혀
    ctx.fillStyle = '#d6536b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * s * 0.35, rx * s * 0.55, ry * s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // W 미소
  ctx.strokeStyle = '#3a261c';
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const w = 7 * s;
  ctx.moveTo(cx - w, cy - 1);
  ctx.quadraticCurveTo(cx - w / 2, cy + 3, cx - 1.2, cy + 0.4);
  ctx.quadraticCurveTo(cx, cy - 0.8, cx + 1.2, cy + 0.4);
  ctx.quadraticCurveTo(cx + w / 2, cy + 3, cx + w, cy - 1);
  ctx.stroke();
}

// 작은 흰 손 — 클래퍼보드 옆에 동그란 손 nub
function drawPaw(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, paw: { raise: number; rot: number }, side: 1 | -1) {
  const raise = 7 * Math.max(0.2, paw.raise);
  // 손이 바디 중심을 향해 살짝 안쪽으로 들어오도록 baseX 보정
  ctx.save();
  ctx.translate(baseX, baseY - raise);
  ctx.rotate(paw.rot * side);
  // 손 (둥근 흰색 nub + 검은 outline)
  ctx.fillStyle = '#fdfdfd';
  ctx.strokeStyle = 'rgba(48,32,28,0.4)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 살짝 안쪽 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.arc(0.5, 0.8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 포스트잇 — 손이 들어 올리는 작은 노란 메모지
function drawPostit(ctx: CanvasRenderingContext2D, cx: number, cy: number, wiggle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08 + wiggle * 0.04);
  ctx.fillStyle = '#ffe45e';
  ctx.strokeStyle = '#e6c63d';
  ctx.lineWidth = 1.2;
  roundedRect(ctx, -10, -8, 20, 16, 2);
  ctx.fill(); ctx.stroke();
  // 접힌 모서리
  ctx.fillStyle = '#f5d84a';
  ctx.beginPath();
  ctx.moveTo(5, -8); ctx.lineTo(10, -8); ctx.lineTo(10, -3); ctx.closePath();
  ctx.fill();
  // 메모 줄
  ctx.strokeStyle = '#b88a1f';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-7, -2); ctx.lineTo(7, -2);
  ctx.moveTo(-7, 2); ctx.lineTo(5, 2);
  ctx.stroke();
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// 돋보기 (detective)
function drawMagnifier(ctx: CanvasRenderingContext2D, cx: number, cy: number, rot: number, glint: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.translate(-cx, -cy);
  // 손잡이
  ctx.strokeStyle = '#8f7cd6';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy + 7);
  ctx.lineTo(cx + 14, cy + 14);
  ctx.stroke();
  // 렌즈 ring
  ctx.strokeStyle = '#b9a8f0';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(185,168,240,0.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 반짝임
  ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, glint)).toFixed(3)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3);
  ctx.quadraticCurveTo(cx, cy - 6, cx + 4, cy - 3);
  ctx.stroke();
  ctx.restore();
}

// 파티클: 작은 다이아몬드 빛
function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.quadraticCurveTo(0, 0, r * 1.5, 0);
  ctx.quadraticCurveTo(0, 0, 0, r * 2);
  ctx.quadraticCurveTo(0, 0, -r * 1.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 파티클: 작은 하트
function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill = '#d6536b') {
  ctx.fillStyle = fill;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(r / 4, r / 4);
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.bezierCurveTo(-5, -1, -5, -5, 0, -2);
  ctx.bezierCurveTo(5, -5, 5, -1, 0, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 파티클: 노란 부스러기
function drawCrumb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number, fill: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
