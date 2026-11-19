"use client";

import React, { useEffect, useRef, type CSSProperties } from "react";

type WeatherParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  angle: number;
  spin: number;
  wave: number;
  vortexAngle: number;
  layer: number;
  length: number;
  life: number;
  kind?: "drop" | "flake" | "mist" | "spark" | "ray" | "leaf" | "wisp" | "cloud" | "ember";
  color?: string;
  drift?: number;
  pulse?: number;
  isFlare?: boolean;
  isLeaf?: boolean;
  isDebris?: boolean;
  isWisp?: boolean;
  isCloud?: boolean;
  turbulence?: number;
  waveFreq?: number;
  isGlint?: boolean;
};

/* --- CANVAS ATMOSPHERE ENGINE --- */
const WEATHER_CANVAS_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
};

export function WeatherCanvas({ weatherId }: { weatherId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawCtx = ctx;

    let animationFrameId = 0;
    let particles: WeatherParticle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let resizeFrameId: number | null = null;
    let isVisible = !document.hidden;
    let isHeroInView = window.scrollY < window.innerHeight * 1.15;
    let isActivelyScrolling = false;
    let lastScrollAt = 0;
    let scrollIdleTimeout: number | null = null;
    let frameSkip = 0;
    let lastPaintAt = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countByWeather: Record<string, number> = {
      clear: 82,
      fog: 56,
      heatwave: 96,
      "magic-storm": 150,
      overcast: 64,
      rain: 230,
      snow: 190,
      storm: 280,
      windy: 120,
    };

    const weatherPalette: Record<string, { base: string; glow: string; haze: string; shadow: string }> = {
      clear: { base: "251, 191, 36", glow: "245, 158, 11", haze: "56, 189, 248", shadow: "15, 23, 42" },
      fog: { base: "148, 163, 184", glow: "203, 213, 225", haze: "100, 116, 139", shadow: "15, 23, 42" },
      heatwave: { base: "248, 113, 113", glow: "251, 146, 60", haze: "251, 191, 36", shadow: "69, 10, 10" },
      "magic-storm": { base: "167, 139, 250", glow: "139, 92, 246", haze: "34, 211, 238", shadow: "49, 46, 129" },
      overcast: { base: "148, 163, 184", glow: "71, 85, 105", haze: "203, 213, 225", shadow: "2, 6, 23" },
      rain: { base: "96, 165, 250", glow: "59, 130, 246", haze: "125, 211, 252", shadow: "8, 47, 73" },
      snow: { base: "226, 232, 240", glow: "255, 255, 255", haze: "147, 197, 253", shadow: "15, 23, 42" },
      storm: { base: "56, 189, 248", glow: "125, 211, 252", haze: "129, 140, 248", shadow: "12, 18, 36" },
      windy: { base: "74, 222, 128", glow: "34, 197, 94", haze: "187, 247, 208", shadow: "5, 46, 22" },
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      init();
    };

    const scheduleResize = () => {
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null;
        resize();
        isHeroInView = window.scrollY < height * 1.15;
        if (reducedMotion) drawReducedMotionFrame();
      });
    };

    const handleScroll = () => {
      isHeroInView = window.scrollY < height * 1.15;
      isActivelyScrolling = true;
      lastScrollAt = performance.now();
      if (scrollIdleTimeout !== null) window.clearTimeout(scrollIdleTimeout);
      scrollIdleTimeout = window.setTimeout(() => {
        isActivelyScrolling = false;
        scrollIdleTimeout = null;
      }, 140);
    };

    const init = () => {
      particles = [];
      const isMobile = width < 768;
      const multiplier = reducedMotion ? 0.16 : isMobile ? 0.38 : 1;
      const count = Math.floor((countByWeather[weatherId] ?? 72) * multiplier);
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = (seedFromEdge = false): WeatherParticle => {
      const isMobile = width < 768;
      const p: WeatherParticle = {
        x: seedFromEdge ? Math.random() * width : Math.random() * width,
        y: seedFromEdge ? -80 - Math.random() * 160 : Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0,
        opacity: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        wave: Math.random() * Math.PI * 2,
        vortexAngle: Math.random() * Math.PI * 2,
        layer: Math.random(),
        length: 0,
        life: Math.random(),
      };

      if (weatherId === 'rain' || weatherId === 'storm') {
        p.kind = "drop";
        p.vy = (Math.random() * 16 + (weatherId === 'storm' ? 16 : 11)) * (isMobile ? 0.8 : 1);
        p.vx = (weatherId === 'storm' ? 5.5 : 2.1) * (isMobile ? 0.8 : 1) * (0.7 + p.layer);
        p.size = Math.random() * 1.4 + 0.65 + p.layer * 1.1;
        p.length = Math.random() * 20 + (weatherId === 'storm' ? 18 : 10);
        p.opacity = Math.random() * 0.32 + 0.16;
      } else if (weatherId === 'snow') {
        p.kind = "flake";
        p.vy = Math.random() * 1.35 + 0.45 + p.layer * 0.65;
        p.vx = Math.random() * 1.5 - 0.75;
        p.size = Math.random() * 3.6 + 1.1 + p.layer * 1.3;
        p.drift = Math.random() * 1.75 + 0.4;
        p.opacity = Math.random() * 0.5 + 0.22;
      } else if (weatherId === 'magic-storm') {
        p.kind = Math.random() > 0.78 ? "ray" : "spark";
        p.vx = (Math.random() - 0.5) * (isMobile ? 3.2 : 5.2);
        p.vy = (Math.random() - 0.5) * (isMobile ? 3.2 : 5.2);
        p.size = Math.random() * 3.8 + 1.1 + p.layer * 2;
        p.pulse = Math.random() * 0.12 + 0.03;
        p.isFlare = Math.random() > 0.9;
      } else if (weatherId === 'windy') {
        p.kind = Math.random() > 0.62 ? "leaf" : Math.random() > 0.42 ? "wisp" : "cloud";
        p.vx = (Math.random() * 11 + 7) * (isMobile ? 0.7 : 1) * (0.65 + p.layer);
        p.vy = (Math.random() - 0.5) * 4;
        p.size = Math.random() * 5 + 2 + p.layer * 3;
        p.length = Math.random() * 80 + 60;
        p.isLeaf = p.kind === "leaf";
        p.isWisp = p.kind === "wisp";
        p.isCloud = p.kind === "cloud";
        p.turbulence = Math.random() * 0.08 + 0.035;
      } else if (weatherId === 'fog') {
        p.kind = "mist";
        p.vx = Math.random() * 0.26 + 0.06;
        p.vy = (Math.random() - 0.5) * 0.08;
        p.size = Math.random() * (isMobile ? 130 : 260) + (isMobile ? 100 : 140);
        p.opacity = Math.random() * 0.055 + 0.025;
      } else if (weatherId === 'heatwave') {
        p.kind = Math.random() > 0.55 ? "ember" : "ray";
        p.vy = Math.random() * -1.6 - 0.45;
        p.vx = (Math.random() - 0.5) * 1;
        p.size = Math.random() * 2.3 + 0.8 + p.layer;
        p.opacity = Math.random() * 0.28 + 0.08;
        p.length = Math.random() * 48 + 18;
        p.waveFreq = Math.random() * 0.05 + 0.02;
      } else if (weatherId === 'overcast') {
        p.kind = "cloud";
        p.vx = Math.random() * 0.32 + 0.06;
        p.vy = (Math.random() - 0.5) * 0.05;
        p.size = Math.random() * (isMobile ? 120 : 240) + 120;
        p.opacity = Math.random() * 0.045 + 0.022;
      } else if (weatherId === 'clear') {
        p.kind = Math.random() > 0.82 ? "ray" : "spark";
        p.vx = (Math.random() - 0.5) * 0.42;
        p.vy = (Math.random() - 0.5) * 0.36;
        p.size = Math.random() * 1.7 + 0.45 + p.layer * 0.8;
        p.opacity = Math.random() * 0.36 + 0.08;
        p.isGlint = Math.random() > 0.8;
      }
      
      return p;
    };

    const drawSoftOrb = (x: number, y: number, radius: number, color: string, alpha: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
      gradient.addColorStop(0.45, `rgba(${color}, ${alpha * 0.35})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawAtmosphere = (now: number, intensity = 1) => {
      const palette = weatherPalette[weatherId] ?? weatherPalette.clear;
      const t = now * 0.001;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const vertical = ctx.createLinearGradient(0, 0, width, height);
      vertical.addColorStop(0, `rgba(${palette.shadow}, ${0.16 * intensity})`);
      vertical.addColorStop(0.45, `rgba(${palette.base}, ${0.055 * intensity})`);
      vertical.addColorStop(1, `rgba(${palette.shadow}, ${0.24 * intensity})`);
      ctx.fillStyle = vertical;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "screen";
      const driftX = Math.sin(t * 0.18) * width * 0.04;
      drawSoftOrb(width * 0.78 + driftX, height * 0.08, Math.min(width, height) * 0.52, palette.glow, weatherId === "clear" ? 0.16 : 0.08);
      drawSoftOrb(width * 0.18 - driftX, height * 0.62, Math.min(width, height) * 0.62, palette.base, 0.06);

      if (weatherId === "clear") {
        ctx.translate(width * 0.74, -height * 0.08);
        ctx.rotate(-0.16 + Math.sin(t * 0.12) * 0.025);
        for (let i = 0; i < 5; i++) {
          const ray = ctx.createLinearGradient(0, 0, 0, height * 1.45);
          ray.addColorStop(0, "rgba(251, 191, 36, 0.10)");
          ray.addColorStop(0.45, "rgba(251, 191, 36, 0.035)");
          ray.addColorStop(1, "rgba(251, 191, 36, 0)");
          ctx.fillStyle = ray;
          ctx.beginPath();
          ctx.moveTo(i * 58 - 130, 0);
          ctx.lineTo(i * 58 - 220, height * 1.45);
          ctx.lineTo(i * 58 - 70, height * 1.45);
          ctx.fill();
        }
      } else if (weatherId === "heatwave") {
        for (let i = 0; i < 8; i++) {
          const x = (i / 8) * width + Math.sin(t * 0.9 + i) * 18;
          const shimmer = ctx.createLinearGradient(x, 0, x + 34, height);
          shimmer.addColorStop(0, "rgba(251, 146, 60, 0)");
          shimmer.addColorStop(0.5, "rgba(251, 191, 36, 0.055)");
          shimmer.addColorStop(1, "rgba(248, 113, 113, 0)");
          ctx.fillStyle = shimmer;
          ctx.fillRect(x - 16, 0, 46, height);
        }
      } else if (weatherId === "magic-storm") {
        drawSoftOrb(width * 0.5 + Math.sin(t * 0.3) * 70, height * 0.34, Math.min(width, height) * 0.46, "167, 139, 250", 0.18);
        drawSoftOrb(width * 0.7, height * 0.74, Math.min(width, height) * 0.34, "34, 211, 238", 0.08);
      } else if (weatherId === "storm") {
        const flash = Math.sin(t * 7.7) > 0.985 ? 0.2 : 0;
        if (flash) {
          ctx.fillStyle = `rgba(226, 232, 240, ${flash})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (weatherId === "fog" || weatherId === "overcast") {
        ctx.globalCompositeOperation = "source-over";
        const veil = ctx.createLinearGradient(0, height * 0.1, width, height * 0.88);
        veil.addColorStop(0, `rgba(${palette.haze}, ${weatherId === "fog" ? 0.07 : 0.04})`);
        veil.addColorStop(0.55, `rgba(${palette.base}, ${weatherId === "fog" ? 0.11 : 0.07})`);
        veil.addColorStop(1, "rgba(2, 6, 23, 0)");
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    };

    const recycleParticle = (p: WeatherParticle) => {
      const next = createParticle(true);
      Object.assign(p, next);
      if (weatherId === "rain" || weatherId === "storm") {
        p.x = Math.random() * (width + 220) - 110;
        p.y = -80 - Math.random() * 160;
      } else if (weatherId === "windy") {
        p.x = -140 - Math.random() * 220;
        p.y = Math.random() * height;
      } else if (weatherId === "heatwave") {
        p.x = Math.random() * width;
        p.y = height + 60 + Math.random() * 120;
      }
    };

    const update = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(update);
        return;
      }
      if (isActivelyScrolling && performance.now() - lastScrollAt > 180) {
        isActivelyScrolling = false;
      }
      if (isActivelyScrolling) {
        frameSkip = (frameSkip + 1) % 2;
        if (frameSkip !== 0) {
          animationFrameId = requestAnimationFrame(update);
          return;
        }
      }
      if (!isHeroInView) {
        frameSkip = (frameSkip + 1) % 3;
        if (frameSkip !== 0) {
          animationFrameId = requestAnimationFrame(update);
          return;
        }
      }

      const now = performance.now();
      const targetFrameMs = width < 768 ? 32 : 16;
      if (now - lastPaintAt < targetFrameMs) {
        animationFrameId = requestAnimationFrame(update);
        return;
      }
      lastPaintAt = now;
      ctx.clearRect(0, 0, width, height);
      drawAtmosphere(now);

      particles.forEach(p => {
        if (weatherId === 'rain' || weatherId === 'storm') {
          p.y += p.vy;
          p.x += p.vx;
          ctx.strokeStyle = weatherId === "storm"
            ? `rgba(125, 211, 252, ${p.opacity + 0.08})`
            : `rgba(96, 165, 250, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.9, p.y + p.length);
          ctx.stroke();
          if (p.layer > 0.82 && weatherId === "rain") {
            ctx.strokeStyle = `rgba(191, 219, 254, ${p.opacity * 0.24})`;
            ctx.beginPath();
            ctx.ellipse(p.x, height - 12 - p.layer * 18, p.size * 8, p.size * 1.7, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (weatherId === 'snow') {
          p.angle += 0.02;
          p.y += p.vy;
          p.x += Math.sin(p.angle) * (p.drift ?? 0);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.shadowBlur = p.layer > 0.7 ? 10 : 0;
          ctx.shadowColor = "#dbeafe";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (weatherId === 'magic-storm') {
          p.vortexAngle += 0.035 + (p.pulse ?? 0);
          p.x += p.vx + Math.cos(p.vortexAngle) * (1.2 + p.layer * 2.5);
          p.y += p.vy + Math.sin(p.vortexAngle) * (1.2 + p.layer * 2.5);
          
          if (p.kind === "ray") {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.11 + p.opacity * 0.24})`;
            ctx.lineWidth = 1 + p.layer * 1.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.quadraticCurveTo(p.x + Math.sin(p.wave) * 28, p.y - 22, p.x + p.vx * 12, p.y + p.vy * 12);
            ctx.stroke();
          } else {
            const pulse = Math.abs(Math.sin(now * 0.004 + p.wave));
            ctx.fillStyle = p.isFlare
              ? `rgba(167, 139, 250, ${0.18 + pulse * 0.22})`
              : `rgba(167, 139, 250, ${p.opacity})`;
            ctx.shadowBlur = p.isFlare ? 24 : 12;
            ctx.shadowColor = p.layer > 0.65 ? "#22d3ee" : "#8b5cf6";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + pulse * (p.isFlare ? 5 : 1.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (weatherId === 'windy') {
          p.angle += p.spin;
          p.wave += p.turbulence ?? 0;
          const gustVy = Math.sin(p.wave) * 3;
          
          p.x += p.vx;
          p.y += p.vy + gustVy;
          
          if (p.isLeaf) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity + 0.08})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (p.isDebris) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
            ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
            ctx.restore();
          } else if (p.isCloud) {
            const cloudSize = p.size * 22;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cloudSize);
            grad.addColorStop(0, `rgba(187, 247, 208, ${p.opacity * 0.08})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cloudSize, 0, Math.PI * 2);
            ctx.fill();
            p.x -= p.vx * 0.68;
          } else {
            ctx.strokeStyle = `rgba(187, 247, 208, ${p.opacity * 0.34})`;
            ctx.lineWidth = 1 + p.layer * 1.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.bezierCurveTo(p.x - p.length * 0.2, p.y - 12, p.x - p.length * 0.65, p.y + 18, p.x - p.length, p.y - gustVy);
            ctx.stroke();
          }
        } else if (weatherId === 'fog' || weatherId === 'overcast') {
          p.x += p.vx;
          p.y += p.vy;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, weatherId === "fog" ? `rgba(203, 213, 225, ${p.opacity})` : `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(0.55, `rgba(148, 163, 184, ${p.opacity * 0.35})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.4, p.size * 0.55, Math.sin(p.wave) * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'heatwave') {
          p.y += p.vy;
          p.wave += p.waveFreq ?? 0;
          p.x += Math.sin(p.wave) * (1.2 + p.layer * 2.4);
          if (p.kind === "ember") {
            ctx.fillStyle = `rgba(251, 146, 60, ${p.opacity})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#fb923c";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.48})`;
            ctx.lineWidth = 1 + p.layer;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.bezierCurveTo(p.x + 12, p.y + p.length * 0.25, p.x - 10, p.y + p.length * 0.65, p.x + Math.sin(p.wave) * 18, p.y + p.length);
            ctx.stroke();
          }
        } else if (weatherId === 'clear') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.isGlint) {
            p.opacity = Math.abs(Math.sin(now * 0.002 + p.wave)) * 0.48 + 0.08;
          }
          if (p.kind === "ray") {
            ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.32})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size * 4, p.y);
            ctx.lineTo(p.x + p.size * 4, p.y);
            ctx.moveTo(p.x, p.y - p.size * 4);
            ctx.lineTo(p.x, p.y + p.size * 4);
            ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (p.y > height + 130 || p.x > width + 180 || p.x < -180 || p.y < -160) recycleParticle(p);
      });

      animationFrameId = requestAnimationFrame(update);
    };

    function drawReducedMotionFrame() {
      drawCtx.clearRect(0, 0, width, height);
      drawAtmosphere(performance.now(), 0.72);
      particles.forEach((p) => {
        const size = weatherId === 'fog' || weatherId === "overcast" ? Math.min(p.size, 150) : Math.max(p.size, 2);
        const gradient = drawCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        const color = weatherId === 'rain' || weatherId === 'storm'
          ? '56, 189, 248'
          : weatherId === 'snow'
            ? '255, 255, 255'
            : weatherId === 'magic-storm'
              ? '167, 139, 250'
              : weatherId === 'heatwave'
                ? '251, 191, 36'
                : weatherId === 'windy'
                  ? '148, 163, 184'
                  : weatherId === 'fog' || weatherId === "overcast"
                    ? '148, 163, 184'
                  : '251, 191, 36';
        gradient.addColorStop(0, `rgba(${color}, ${Math.min(p.opacity, 0.16)})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        drawCtx.fillStyle = gradient;
        drawCtx.beginPath();
        drawCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
        drawCtx.fill();
      });
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    window.addEventListener('resize', scheduleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resize();
    if (reducedMotion) {
      drawReducedMotionFrame();
    } else {
      update();
    }

    return () => {
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (scrollIdleTimeout !== null) window.clearTimeout(scrollIdleTimeout);
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherId]);

  return <canvas ref={canvasRef} className="weather-canvas" aria-hidden="true" style={WEATHER_CANVAS_STYLE} />;
}

