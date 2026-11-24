"use client";

import React, { useEffect, useRef, type CSSProperties } from "react";

const WEATHER_CANVAS_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: -1,
  pointerEvents: "none",
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  phase: number;
  speed: number;
  layer: number; // 0: deep, 1: mid, 2: foreground
  length?: number;
  rotation?: number;
  spin?: number;
  color?: string;
}

interface Streamline {
  x: number;
  y: number;
  length: number;
  width: number;
  speed: number;
  curve: number;
  alpha: number;
  maxAlpha: number;
  phase: number;
}

interface LightningFlash {
  active: boolean;
  intensity: number;
  decay: number;
  nextTriggerTime: number;
  boltPoints: { x: number; y: number }[] | null;
}

// Offscreen stamp generator for zero-allocation rendering
function createOffscreenCanvas(width: number, height: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function renderSoftBokehStamp(colorRgb: string, size: number) {
  const stamp = createOffscreenCanvas(size, size);
  const ctx = stamp.getContext("2d");
  if (!ctx) return stamp;
  const radius = size / 2;
  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${colorRgb}, 1)`);
  grad.addColorStop(0.35, `rgba(${colorRgb}, 0.7)`);
  grad.addColorStop(0.7, `rgba(${colorRgb}, 0.2)`);
  grad.addColorStop(1, `rgba(${colorRgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return stamp;
}

function renderCloudPuffStamp(colorRgb: string, size: number) {
  const stamp = createOffscreenCanvas(size, size);
  const ctx = stamp.getContext("2d");
  if (!ctx) return stamp;
  const radius = size / 2;
  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${colorRgb}, 0.5)`);
  grad.addColorStop(0.5, `rgba(${colorRgb}, 0.22)`);
  grad.addColorStop(0.8, `rgba(${colorRgb}, 0.06)`);
  grad.addColorStop(1, `rgba(${colorRgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return stamp;
}

export function WeatherCanvas({ weatherId }: { weatherId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastTime = performance.now();
    let isVisible = !document.hidden;
    let isHeroInView = window.scrollY < height * 1.35;
    let resizeTimer: number | null = null;

    // Camera parallax state (smoothed via lerp)
    let camX = 0;
    let camY = 0;
    let targetCamX = 0;
    let targetCamY = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Theme palette definition
    const themes: Record<string, {
      skyTop: string;
      skyBottom: string;
      glowColor: string;
      glowX: number;
      glowY: number;
      glowRadius: number;
      glowAlpha: number;
      accentColor: string;
      accentAlpha: number;
      hasMountains: boolean;
      mountainColor: string;
    }> = {
      clear: {
        skyTop: "#080b15",
        skyBottom: "#0f1629",
        glowColor: "245, 158, 11",
        glowX: 0.85,
        glowY: 0.1,
        glowRadius: 0.7,
        glowAlpha: 0.16,
        accentColor: "251, 191, 36",
        accentAlpha: 0.08,
        hasMountains: true,
        mountainColor: "#05070e",
      },
      rain: {
        skyTop: "#060a14",
        skyBottom: "#0b1220",
        glowColor: "59, 130, 246",
        glowX: 0.5,
        glowY: 0.2,
        glowRadius: 0.75,
        glowAlpha: 0.1,
        accentColor: "147, 197, 253",
        accentAlpha: 0.05,
        hasMountains: false,
        mountainColor: "#04070d",
      },
      storm: {
        skyTop: "#04060c",
        skyBottom: "#080c16",
        glowColor: "96, 165, 250",
        glowX: 0.6,
        glowY: 0.15,
        glowRadius: 0.85,
        glowAlpha: 0.12,
        accentColor: "191, 219, 254",
        accentAlpha: 0.06,
        hasMountains: false,
        mountainColor: "#030408",
      },
      "magic-storm": {
        skyTop: "#080616",
        skyBottom: "#0e0a26",
        glowColor: "147, 51, 234",
        glowX: 0.3,
        glowY: 0.25,
        glowRadius: 0.7,
        glowAlpha: 0.18,
        accentColor: "34, 211, 238",
        accentAlpha: 0.11,
        hasMountains: true,
        mountainColor: "#05030e",
      },
      snow: {
        skyTop: "#070a12",
        skyBottom: "#0d1322",
        glowColor: "148, 163, 184",
        glowX: 0.5,
        glowY: 0.1,
        glowRadius: 0.65,
        glowAlpha: 0.1,
        accentColor: "226, 232, 240",
        accentAlpha: 0.06,
        hasMountains: true,
        mountainColor: "#04070e",
      },
      heatwave: {
        skyTop: "#120707",
        skyBottom: "#1c0b0d",
        glowColor: "239, 68, 68",
        glowX: 0.5,
        glowY: 0.85,
        glowRadius: 0.75,
        glowAlpha: 0.16,
        accentColor: "245, 158, 11",
        accentAlpha: 0.1,
        hasMountains: false,
        mountainColor: "#0b0404",
      },
      fog: {
        skyTop: "#060911",
        skyBottom: "#0a101b",
        glowColor: "100, 116, 139",
        glowX: 0.5,
        glowY: 0.5,
        glowRadius: 0.95,
        glowAlpha: 0.12,
        accentColor: "148, 163, 184",
        accentAlpha: 0.07,
        hasMountains: false,
        mountainColor: "#04060b",
      },
      overcast: {
        skyTop: "#05080e",
        skyBottom: "#090d18",
        glowColor: "71, 85, 105",
        glowX: 0.5,
        glowY: 0.3,
        glowRadius: 0.8,
        glowAlpha: 0.09,
        accentColor: "148, 163, 184",
        accentAlpha: 0.05,
        hasMountains: false,
        mountainColor: "#04060c",
      },
      windy: {
        skyTop: "#050c0e",
        skyBottom: "#081519",
        glowColor: "34, 197, 94",
        glowX: 0.7,
        glowY: 0.3,
        glowRadius: 0.7,
        glowAlpha: 0.09,
        accentColor: "56, 189, 248",
        accentAlpha: 0.06,
        hasMountains: true,
        mountainColor: "#03080a",
      },
    };

    const theme = themes[weatherId] ?? themes.clear;

    // Broadcast ambient colors to container
    const container = canvas.parentElement;
    if (container) {
      container.style.setProperty("--weather-glow-rgb", theme.glowColor);
      container.style.setProperty("--weather-accent-rgb", theme.accentColor);
    }

    // Pre-rendered offscreen stamp cache
    let bokehStamp: HTMLCanvasElement | null = null;
    let cloudStamp: HTMLCanvasElement | null = null;
    let flareStamp: HTMLCanvasElement | null = null;

    const buildStamps = () => {
      bokehStamp = renderSoftBokehStamp(theme.accentColor, 48);
      cloudStamp = renderCloudPuffStamp(theme.glowColor, 128);
      flareStamp = renderSoftBokehStamp(theme.glowColor, 64);
    };

    // Parallax Mountain Ridge Silhouettes (Deep Horizon Plane)
    let mountainPoints: { x: number; y: number }[] = [];
    const buildMountains = () => {
      mountainPoints = [];
      const segments = 12;
      const baseHeight = height * 0.78;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * (width + 100) - 50;
        // Natural pseudo-random ridge profile
        const peak = Math.sin(i * 1.4) * 45 + Math.cos(i * 2.8) * 25;
        mountainPoints.push({ x, y: baseHeight + peak });
      }
    };

    // Elements
    let particles: Particle[] = [];
    let streamlines: Streamline[] = [];
    const lightning: LightningFlash = {
      active: false,
      intensity: 0,
      decay: 0.9,
      nextTriggerTime: performance.now() + 3500 + Math.random() * 4500,
      boltPoints: null,
    };

    const sunbeams = [
      { angle: 0.68, width: 160, alpha: 0.055, speed: 0.1, offset: 0 },
      { angle: 0.76, width: 240, alpha: 0.042, speed: 0.07, offset: 2.1 },
      { angle: 0.84, width: 200, alpha: 0.048, speed: 0.12, offset: 4.3 },
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStamps();
      buildMountains();
      init();
    };

    const init = () => {
      particles = [];
      streamlines = [];
      const isMobile = width < 768;

      if (weatherId === "clear") {
        // Multi-depth floating golden sun motes
        const count = isMobile ? 18 : 32;
        for (let i = 0; i < count; i++) {
          const layer = i < count * 0.4 ? 0 : i < count * 0.75 ? 1 : 2;
          const size = layer === 2 ? Math.random() * 8 + 6 : layer === 1 ? Math.random() * 2 + 1.2 : Math.random() * 1.2 + 0.6;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (layer === 2 ? 8 : 12),
            vy: -Math.random() * (layer === 2 ? 14 : 8) - 4,
            size,
            alpha: 0,
            maxAlpha: layer === 2 ? Math.random() * 0.25 + 0.1 : Math.random() * 0.5 + 0.2,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.6 + 0.4,
            layer,
          });
        }
      } else if (weatherId === "rain" || weatherId === "storm") {
        // Multi-plane rain threads + lens droplets
        const count = weatherId === "storm" ? (isMobile ? 48 : 80) : isMobile ? 36 : 60;
        for (let i = 0; i < count; i++) {
          const layer = Math.random();
          const speedFactor = 0.55 + layer * 0.9;
          const isNear = layer > 0.8;
          particles.push({
            x: Math.random() * (width + 300) - 150,
            y: Math.random() * height,
            vx: (weatherId === "storm" ? 150 : 70) * speedFactor,
            vy: (weatherId === "storm" ? 980 : 750) * speedFactor,
            size: isNear ? 1.8 : 0.8 + layer * 0.8,
            length: (weatherId === "storm" ? 32 : 22) * speedFactor * (isNear ? 1.4 : 1),
            alpha: 0.1 + layer * 0.25,
            maxAlpha: 0.1 + layer * 0.25,
            phase: 0,
            speed: speedFactor,
            layer: isNear ? 2 : layer > 0.4 ? 1 : 0,
          });
        }
      } else if (weatherId === "snow") {
        // Multi-depth soft bokeh snowflakes
        const count = isMobile ? 30 : 54;
        for (let i = 0; i < count; i++) {
          const layer = Math.floor(Math.random() * 3);
          const size = layer === 2 ? Math.random() * 12 + 8 : layer === 1 ? Math.random() * 2.5 + 1.8 : Math.random() * 1.2 + 0.8;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 16,
            vy: (layer + 1) * 24 + Math.random() * 18,
            size,
            alpha: layer === 2 ? 0.2 : layer === 1 ? 0.48 : 0.25,
            maxAlpha: layer === 2 ? 0.2 : layer === 1 ? 0.48 : 0.25,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.6 + 0.6,
            layer,
          });
        }
      } else if (weatherId === "magic-storm") {
        // Cosmic stardust & plasma motes
        const count = isMobile ? 26 : 46;
        for (let i = 0; i < count; i++) {
          const layer = Math.floor(Math.random() * 3);
          const isCyan = Math.random() > 0.5;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (layer === 2 ? 28 : 18),
            vy: (Math.random() - 0.5) * (layer === 2 ? 28 : 18),
            size: layer === 2 ? Math.random() * 10 + 6 : Math.random() * 2.5 + 1.2,
            alpha: 0,
            maxAlpha: layer === 2 ? 0.22 : 0.55,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.8 + 0.4,
            layer,
            color: isCyan ? "34, 211, 238" : "167, 139, 250",
          });
        }
      } else if (weatherId === "heatwave") {
        // Rising thermal embers
        const count = isMobile ? 22 : 38;
        for (let i = 0; i < count; i++) {
          const layer = Math.floor(Math.random() * 3);
          particles.push({
            x: Math.random() * width,
            y: height + Math.random() * 120,
            vx: (Math.random() - 0.5) * 28,
            vy: -Math.random() * 50 - 30,
            size: layer === 2 ? Math.random() * 8 + 4 : Math.random() * 2.2 + 1,
            alpha: 0,
            maxAlpha: layer === 2 ? 0.35 : 0.65,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.8 + 0.4,
            layer,
            color: Math.random() > 0.4 ? "251, 146, 60" : "239, 68, 68",
          });
        }
      } else if (weatherId === "windy") {
        // Aerodynamic streamlines
        const streamCount = isMobile ? 4 : 7;
        for (let i = 0; i < streamCount; i++) {
          streamlines.push({
            x: -Math.random() * width,
            y: Math.random() * height,
            length: Math.random() * 320 + 200,
            width: Math.random() * 1.8 + 0.8,
            speed: Math.random() * 320 + 240,
            curve: (Math.random() - 0.5) * 45,
            alpha: 0,
            maxAlpha: Math.random() * 0.22 + 0.08,
            phase: Math.random() * Math.PI * 2,
          });
        }

        // Tumble leaves
        const leafCount = isMobile ? 8 : 15;
        for (let i = 0; i < leafCount; i++) {
          const layer = Math.random() > 0.7 ? 2 : 1;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.random() * 140 + 90,
            vy: Math.random() * 45 + 20,
            size: layer === 2 ? Math.random() * 7 + 5 : Math.random() * 3.5 + 2.5,
            alpha: layer === 2 ? 0.35 : 0.55,
            maxAlpha: 0.6,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.6 + 0.8,
            layer,
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 4.5,
          });
        }
      } else if (weatherId === "fog" || weatherId === "overcast") {
        // Volumetric mist puffs
        const count = isMobile ? 5 : 9;
        for (let i = 0; i < count; i++) {
          const layer = i % 3;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (layer + 1) * 6 + Math.random() * 4,
            vy: (Math.random() - 0.5) * 2,
            size: (layer === 2 ? 260 : layer === 1 ? 200 : 140),
            alpha: 0,
            maxAlpha: weatherId === "fog" ? (layer === 2 ? 0.07 : 0.11) : (layer === 2 ? 0.04 : 0.07),
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.3 + 0.2,
            layer,
          });
        }
      }
    };

    const generateLightningBolt = (startX: number, startY: number, endY: number) => {
      const points = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      while (currentY < endY) {
        currentY += Math.random() * 45 + 25;
        currentX += (Math.random() - 0.5) * 65;
        points.push({ x: currentX, y: currentY });
      }
      return points;
    };

    // Deep Horizon Rendering (Plane 1 - 0.04x parallax offset)
    const drawDeepHorizon = (now: number, pX: number, pY: number) => {
      const t = now * 0.001;

      // Base atmospheric gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, theme.skyTop);
      skyGrad.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant mountain silhouette (Clear, Snow, Magic Storm, Windy)
      if (theme.hasMountains && mountainPoints.length > 1) {
        ctx.save();
        ctx.fillStyle = theme.mountainColor;
        ctx.beginPath();
        ctx.moveTo(-60 + pX * 0.03, height);
        mountainPoints.forEach((pt) => {
          ctx.lineTo(pt.x + pX * 0.03, pt.y + pY * 0.02);
        });
        ctx.lineTo(width + 60 + pX * 0.03, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Celestial primary atmospheric bloom
      const pulse = 1 + Math.sin(t * 0.3) * 0.07;
      const gX = width * theme.glowX + pX * 0.04 + Math.cos(t * 0.2) * 25;
      const gY = height * theme.glowY + pY * 0.04 + Math.sin(t * 0.25) * 20;
      const gRadius = Math.max(width, height) * theme.glowRadius * pulse;

      const radialGrad = ctx.createRadialGradient(gX, gY, 0, gX, gY, gRadius);
      radialGrad.addColorStop(0, `rgba(${theme.glowColor}, ${theme.glowAlpha})`);
      radialGrad.addColorStop(0.5, `rgba(${theme.glowColor}, ${theme.glowAlpha * 0.3})`);
      radialGrad.addColorStop(1, `rgba(${theme.glowColor}, 0)`);
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary counter-bloom
      const aX = width * (1 - theme.glowX) - pX * 0.04 + Math.sin(t * 0.18) * 35;
      const aY = height * (1 - theme.glowY) - pY * 0.04 + Math.cos(t * 0.22) * 25;
      const aRadius = Math.max(width, height) * 0.55;
      const accentGrad = ctx.createRadialGradient(aX, aY, 0, aX, aY, aRadius);
      accentGrad.addColorStop(0, `rgba(${theme.accentColor}, ${theme.accentAlpha})`);
      accentGrad.addColorStop(1, `rgba(${theme.accentColor}, 0)`);
      ctx.fillStyle = accentGrad;
      ctx.fillRect(0, 0, width, height);
    };

    // Clear Weather (Sunbeams + Motes with bokeh)
    const renderClearWeather = (now: number, dt: number, pX: number, pY: number) => {
      const t = now * 0.001;

      // Volumetric Sunbeam Shafts (Midground - 0.22x parallax)
      ctx.save();
      const originX = width * 0.9 + pX * 0.18;
      const originY = -50 + pY * 0.12;
      sunbeams.forEach((beam) => {
        const angle = beam.angle + Math.sin(t * beam.speed + beam.offset) * 0.035;
        const beamAlpha = beam.alpha * (0.85 + Math.sin(t * 0.35 + beam.offset) * 0.15);
        const length = height * 1.6;

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        const x1 = originX - Math.cos(angle - 0.09) * length;
        const y1 = originY + Math.sin(angle - 0.09) * length;
        const x2 = originX - Math.cos(angle + 0.09) * length;
        const y2 = originY + Math.sin(angle + 0.09) * length;
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();

        const grad = ctx.createRadialGradient(originX, originY, 0, originX, originY, length);
        grad.addColorStop(0, `rgba(245, 158, 11, ${beamAlpha})`);
        grad.addColorStop(0.5, `rgba(251, 191, 36, ${beamAlpha * 0.45})`);
        grad.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = grad;
        ctx.fill();
      });
      ctx.restore();

      // Golden light motes across parallax planes
      particles.forEach((p) => {
        p.x += p.vx * dt + Math.sin(t * p.speed + p.phase) * 0.4;
        p.y += p.vy * dt;
        p.phase += dt * p.speed;
        p.alpha = Math.sin(p.phase) * p.maxAlpha;

        if (p.alpha > 0.01) {
          const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
          const drawX = p.x + pX * depthOffset;
          const drawY = p.y + pY * depthOffset;

          if (p.layer === 2 && bokehStamp) {
            // Lens foreground bokeh
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(bokehStamp, drawX - p.size, drawY - p.size, p.size * 2, p.size * 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
            ctx.fill();
          }
        }

        if (p.y < -30) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 15;
        if (p.x > width + 30) p.x = -15;
      });
    };

    // Rain Weather (Rain sheets + crisp streaks + glass condensation)
    const renderRainWeather = (now: number, dt: number, pX: number, pY: number) => {
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
        const drawX = p.x + pX * depthOffset;
        const drawY = p.y + pY * depthOffset;

        ctx.strokeStyle = weatherId === "storm"
          ? `rgba(186, 230, 253, ${p.alpha})`
          : `rgba(147, 197, 253, ${p.alpha})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX - (p.vx / p.vy) * (p.length || 20), drawY - (p.length || 20));
        ctx.stroke();

        if (p.y > height + 40 || p.x > width + 100) {
          p.y = -40;
          p.x = Math.random() * (width + 200) - 100;
        }
      });
    };

    // Storm Weather (Sheet lightning + bolts + heavy rain)
    const renderStormWeather = (now: number, dt: number, pX: number, pY: number) => {
      if (!lightning.active && now > lightning.nextTriggerTime) {
        lightning.active = true;
        lightning.intensity = Math.random() * 0.32 + 0.14;
        lightning.decay = 0.88;
        lightning.nextTriggerTime = now + 4000 + Math.random() * 5500;

        if (Math.random() < 0.28) {
          lightning.boltPoints = generateLightningBolt(
            width * (0.2 + Math.random() * 0.6) + pX * 0.05,
            height * 0.05,
            height * (0.45 + Math.random() * 0.3)
          );
        } else {
          lightning.boltPoints = null;
        }
      }

      if (lightning.active) {
        ctx.fillStyle = `rgba(186, 230, 253, ${lightning.intensity * 0.55})`;
        ctx.fillRect(0, 0, width, height);

        if (lightning.boltPoints && lightning.boltPoints.length > 1) {
          ctx.save();
          ctx.strokeStyle = `rgba(224, 242, 254, ${lightning.intensity * 1.3})`;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(lightning.boltPoints[0].x, lightning.boltPoints[0].y);
          for (let i = 1; i < lightning.boltPoints.length; i++) {
            ctx.lineTo(lightning.boltPoints[i].x, lightning.boltPoints[i].y);
          }
          ctx.stroke();
          ctx.restore();
        }

        lightning.intensity *= lightning.decay;
        if (lightning.intensity < 0.01) {
          lightning.active = false;
          lightning.boltPoints = null;
        }
      }

      renderRainWeather(now, dt, pX, pY);
    };

    // Snow Weather (Multi-depth bokeh snowflakes)
    const renderSnowWeather = (now: number, dt: number, pX: number, pY: number) => {
      const t = now * 0.001;

      particles.forEach((p) => {
        p.y += p.vy * dt;
        p.x += Math.sin(t * p.speed + p.phase) * (p.layer + 1) * 16 * dt;

        const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
        const drawX = p.x + pX * depthOffset;
        const drawY = p.y + pY * depthOffset;

        if (p.layer === 2 && bokehStamp) {
          // Large soft out-of-focus snowflake
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.drawImage(bokehStamp, drawX - p.size, drawY - p.size, p.size * 2, p.size * 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha})`;
          ctx.fill();
        }

        if (p.y > height + 30) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 15;
        if (p.x > width + 30) p.x = -15;
      });
    };

    // Magic Storm (Cosmic aurora ribbons + swirling stardust)
    const renderMagicStormWeather = (now: number, dt: number, pX: number, pY: number) => {
      const t = now * 0.001;

      // Arcane plasma curves (Midground - 0.22x parallax)
      ctx.save();
      const waveAlpha = 0.05 + Math.sin(t * 0.45) * 0.02;
      const grad = ctx.createLinearGradient(0, height * 0.2 + pY * 0.15, width, height * 0.65 + pY * 0.15);
      grad.addColorStop(0, "rgba(147, 51, 234, 0)");
      grad.addColorStop(0.5, `rgba(147, 51, 234, ${waveAlpha})`);
      grad.addColorStop(1, "rgba(34, 211, 238, 0)");

      ctx.beginPath();
      ctx.moveTo(0, height * 0.35 + Math.sin(t * 0.4) * 45 + pY * 0.15);
      ctx.bezierCurveTo(
        width * 0.3 + pX * 0.15, height * 0.2 + Math.cos(t * 0.3) * 65 + pY * 0.15,
        width * 0.7 + pX * 0.15, height * 0.5 + Math.sin(t * 0.35) * 55 + pY * 0.15,
        width, height * 0.3 + Math.cos(t * 0.4) * 45 + pY * 0.15
      );
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Swirling stardust
      particles.forEach((p) => {
        p.phase += dt * p.speed;
        p.alpha = Math.sin(p.phase) * p.maxAlpha;
        p.x += p.vx * dt + Math.cos(p.phase) * 20 * dt;
        p.y += p.vy * dt + Math.sin(p.phase) * 20 * dt;

        if (p.alpha > 0.01) {
          const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
          const drawX = p.x + pX * depthOffset;
          const drawY = p.y + pY * depthOffset;

          if (p.layer === 2 && flareStamp) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(flareStamp, drawX - p.size, drawY - p.size, p.size * 2, p.size * 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color || "167, 139, 250"}, ${p.alpha})`;
            ctx.fill();
          }
        }

        if (p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
        }
      });
    };

    // Heatwave (Thermal mirage shimmer + rising embers)
    const renderHeatwaveWeather = (now: number, dt: number, pX: number, pY: number) => {
      const t = now * 0.001;

      // Thermal mirage shimmer band
      ctx.save();
      const shimmerHeight = height * 0.38;
      const mirageGrad = ctx.createLinearGradient(0, height - shimmerHeight, 0, height);
      mirageGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
      mirageGrad.addColorStop(1, "rgba(245, 158, 11, 0.08)");
      ctx.fillStyle = mirageGrad;
      ctx.fillRect(0, height - shimmerHeight, width, shimmerHeight);
      ctx.restore();

      // Rising embers
      particles.forEach((p) => {
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(t * 1.5 + p.phase) * 22 * dt;
        p.phase += dt * p.speed;

        const progress = Math.max(0, p.y / height);
        p.alpha = Math.sin(p.phase) * p.maxAlpha * progress;

        if (p.alpha > 0.01) {
          const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
          const drawX = p.x + pX * depthOffset;
          const drawY = p.y + pY * depthOffset;

          if (p.layer === 2 && flareStamp) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(flareStamp, drawX - p.size, drawY - p.size, p.size * 2, p.size * 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color || "251, 146, 60"}, ${p.alpha})`;
            ctx.fill();
          }
        }

        if (p.y < height * 0.12 || p.x < -30 || p.x > width + 30) {
          p.y = height + 10 + Math.random() * 50;
          p.x = Math.random() * width;
        }
      });
    };

    // Windy Weather (Streamlines + 3D tumbling leaves)
    const renderWindyWeather = (now: number, dt: number, pX: number, pY: number) => {
      // Streamlines
      streamlines.forEach((s) => {
        s.x += s.speed * dt;
        s.phase += dt * 1.2;
        s.alpha = Math.max(0, Math.sin(s.phase) * s.maxAlpha);

        if (s.alpha > 0.005) {
          const drawX = s.x + pX * 0.22;
          const drawY = s.y + pY * 0.22;
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${s.alpha})`;
          ctx.lineWidth = s.width;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.quadraticCurveTo(drawX + s.length * 0.5, drawY + s.curve, drawX + s.length, drawY);
          ctx.stroke();
          ctx.restore();
        }

        if (s.x > width + 120) {
          s.x = -s.length - Math.random() * 220;
          s.y = Math.random() * height;
        }
      });

      // 3D tumbling leaves
      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotation !== undefined && p.spin !== undefined) {
          p.rotation += p.spin * dt;
        }

        const depthOffset = p.layer === 2 ? 0.75 : 0.25;
        const drawX = p.x + pX * depthOffset;
        const drawY = p.y + pY * depthOffset;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(p.rotation || 0);
        // 3D tumble perspective scaling
        const scaleY = Math.cos((p.rotation || 0) * 1.5) * 0.65 + 0.35;
        ctx.scale(1, Math.max(0.18, Math.abs(scaleY)));

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha})`;
        ctx.fill();
        ctx.restore();

        if (p.x > width + 40 || p.y > height + 40) {
          p.x = -40;
          p.y = Math.random() * (height * 0.75);
        }
      });
    };

    // Fog & Overcast Weather (Layered volumetric mist masses)
    const renderFogWeather = (now: number, dt: number, pX: number, pY: number) => {
      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.phase += dt * p.speed;
        p.alpha = (Math.sin(p.phase) * 0.5 + 0.5) * p.maxAlpha;

        if (p.alpha > 0.005) {
          const depthOffset = p.layer === 2 ? 0.75 : p.layer === 1 ? 0.22 : 0.05;
          const drawX = p.x + pX * depthOffset;
          const drawY = p.y + pY * depthOffset;

          if (cloudStamp) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(cloudStamp, drawX - p.size, drawY - p.size, p.size * 2, p.size * 2);
            ctx.restore();
          }
        }

        if (p.x > width + p.size) {
          p.x = -p.size;
          p.y = Math.random() * height;
        }
      });
    };

    const drawStaticReducedMotionFrame = () => {
      drawDeepHorizon(0, 0, 0);
      if (weatherId === "clear") {
        renderClearWeather(1000, 0, 0, 0);
      } else if (weatherId === "snow") {
        renderSnowWeather(1000, 0, 0, 0);
      } else if (weatherId === "magic-storm") {
        renderMagicStormWeather(1000, 0, 0, 0);
      }
    };

    const frame = (time: number) => {
      if (!isVisible || !isHeroInView) {
        lastTime = time;
        animId = requestAnimationFrame(frame);
        return;
      }

      const dt = Math.min((time - lastTime) * 0.001, 0.1);
      lastTime = time;

      // Smooth camera lerp towards target
      camX += (targetCamX - camX) * 0.045;
      camY += (targetCamY - camY) * 0.045;

      ctx.clearRect(0, 0, width, height);

      // Plane 1: Deep Horizon
      drawDeepHorizon(time, camX, camY);

      // Plane 2 & 3: Weather System
      if (weatherId === "clear") {
        renderClearWeather(time, dt, camX, camY);
      } else if (weatherId === "rain") {
        renderRainWeather(time, dt, camX, camY);
      } else if (weatherId === "storm") {
        renderStormWeather(time, dt, camX, camY);
      } else if (weatherId === "snow") {
        renderSnowWeather(time, dt, camX, camY);
      } else if (weatherId === "magic-storm") {
        renderMagicStormWeather(time, dt, camX, camY);
      } else if (weatherId === "heatwave") {
        renderHeatwaveWeather(time, dt, camX, camY);
      } else if (weatherId === "windy") {
        renderWindyWeather(time, dt, camX, camY);
      } else if (weatherId === "fog" || weatherId === "overcast") {
        renderFogWeather(time, dt, camX, camY);
      }

      animId = requestAnimationFrame(frame);
    };

    const onMouseMove = (e: MouseEvent) => {
      // Normalize cursor coordinate between -1 and +1, scaled to max 35px parallax travel
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      targetCamX = normX * 35;
      targetCamY = normY * 25;
    };

    const onMouseLeave = () => {
      targetCamX = 0;
      targetCamY = 0;
    };

    const onScroll = () => {
      isHeroInView = window.scrollY < height * 1.35;
    };

    const onVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) lastTime = performance.now();
    };

    const onResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (reducedMotion) drawStaticReducedMotionFrame();
      }, 100);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    if (reducedMotion) {
      drawStaticReducedMotionFrame();
    } else {
      animId = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
    };
  }, [weatherId]);

  return <canvas ref={canvasRef} className="weather-canvas" aria-hidden="true" style={WEATHER_CANVAS_STYLE} />;
}
