"use client";

import { useEffect, useRef } from "react";

interface StarMote {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  depth: number; // 0: deep star, 1: constellation node, 2: foreground ember
  color: "gold" | "cyan" | "silver";
  vx: number;
  vy: number;
}

export function LoreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame = 0;
    let paused = document.hidden;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Camera parallax state
    let targetCamX = 0;
    let targetCamY = 0;
    let camX = 0;
    let camY = 0;
    let mouseActive = false;
    let mouseTimer: ReturnType<typeof setTimeout> | null = null;

    // Offscreen stamps for GPU-accelerated blitting
    let goldStamp: HTMLCanvasElement | null = null;
    let cyanStamp: HTMLCanvasElement | null = null;
    let silverStamp: HTMLCanvasElement | null = null;

    const createStarStamp = (color: string): HTMLCanvasElement => {
      const stamp = document.createElement("canvas");
      stamp.width = 32;
      stamp.height = 32;
      const sCtx = stamp.getContext("2d");
      if (!sCtx) return stamp;

      const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, color);
      grad.addColorStop(0.35, color.replace("1)", "0.38)"));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 32, 32);
      return stamp;
    };

    goldStamp = createStarStamp("rgba(245, 176, 65, 1)");
    cyanStamp = createStarStamp("rgba(56, 189, 248, 1)");
    silverStamp = createStarStamp("rgba(248, 250, 252, 1)");

    let stars: StarMote[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const isMobile = width < 768;
      const totalCount = isMobile ? (reducedMotion ? 12 : 36) : reducedMotion ? 24 : 72;

      stars = Array.from({ length: totalCount }, (_, i) => {
        // First 25% are constellation nodes, 60% are deep stars, 15% are foreground embers
        const depth = i < totalCount * 0.25 ? 1 : i < totalCount * 0.85 ? 0 : 2;
        const colorType: "gold" | "cyan" | "silver" =
          i % 5 === 0 ? "gold" : i % 7 === 0 ? "cyan" : "silver";

        const size =
          depth === 2
            ? Math.random() * 2.2 + 1.8
            : depth === 1
            ? Math.random() * 1.6 + 1.2
            : Math.random() * 1.1 + 0.6;

        const baseAlpha =
          depth === 2
            ? Math.random() * 0.35 + 0.2
            : depth === 1
            ? Math.random() * 0.45 + 0.35
            : Math.random() * 0.3 + 0.15;

        const x = Math.random() * width;
        const y = Math.random() * height;

        return {
          x,
          y,
          baseX: x,
          baseY: y,
          size,
          alpha: baseAlpha,
          baseAlpha,
          pulseSpeed: Math.random() * 0.02 + 0.008,
          pulsePhase: Math.random() * Math.PI * 2,
          depth,
          color: colorType,
          vx: (Math.random() - 0.5) * (depth === 2 ? 0.22 : 0.08),
          vy: (Math.random() - 0.5) * (depth === 2 ? 0.22 : 0.08) - (depth === 2 ? 0.05 : 0),
        };
      });
    };

    let modalOpen = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (modalOpen || paused) return;
      mouseActive = true;
      if (mouseTimer) clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        mouseActive = false;
      }, 3000);

      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      targetCamX = normX * 22;
      targetCamY = normY * 18;
    };

    let tick = 0;

    const draw = () => {
      if (paused || modalOpen) return;
      ctx.clearRect(0, 0, width, height);

      tick += 1;

      // Autonomic breathing camera when mouse is idle
      if (!mouseActive) {
        targetCamX = Math.sin(tick * 0.006) * 10;
        targetCamY = Math.cos(tick * 0.004) * 8;
      }

      // Smooth camera lerp
      camX += (targetCamX - camX) * 0.04;
      camY += (targetCamY - camY) * 0.04;

      // Constellation leylines between depth 1 nodes
      const constellationNodes = stars.filter((s) => s.depth === 1);
      const leylineMaxDist = width < 768 ? 90 : 130;

      ctx.lineWidth = 1;
      for (let i = 0; i < constellationNodes.length; i += 1) {
        const a = constellationNodes[i];
        const ax = a.x + camX * 0.5;
        const ay = a.y + camY * 0.5;

        for (let j = i + 1; j < constellationNodes.length; j += 1) {
          const b = constellationNodes[j];
          const bx = b.x + camX * 0.5;
          const by = b.y + camY * 0.5;

          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < leylineMaxDist) {
            const lineAlpha = (1 - dist / leylineMaxDist) * 0.16 * Math.min(a.alpha, b.alpha);
            ctx.strokeStyle = `rgba(245, 176, 65, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // Render stars & embers
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];

        // Drift motion
        s.x += s.vx;
        s.y += s.vy;
        s.pulsePhase += s.pulseSpeed;
        s.alpha = s.baseAlpha + Math.sin(s.pulsePhase) * 0.15;

        // Wrap around boundaries
        if (s.x < -40) s.x = width + 40;
        if (s.x > width + 40) s.x = -40;
        if (s.y < -40) s.y = height + 40;
        if (s.y > height + 40) s.y = -40;

        // Apply depth parallax
        const depthFactor = s.depth === 2 ? 1.0 : s.depth === 1 ? 0.5 : 0.18;
        const renderX = s.x + camX * depthFactor;
        const renderY = s.y + camY * depthFactor;

        // Draw soft glow stamp
        const stamp =
          s.color === "gold" ? goldStamp : s.color === "cyan" ? cyanStamp : silverStamp;

        if (stamp) {
          ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
          const stampRadius = s.size * (s.depth === 2 ? 6 : 4);
          ctx.drawImage(
            stamp,
            renderX - stampRadius,
            renderY - stampRadius,
            stampRadius * 2,
            stampRadius * 2,
          );
        }

        // Draw crisp core
        ctx.fillStyle =
          s.color === "gold"
            ? "rgba(255, 230, 160, 0.9)"
            : s.color === "cyan"
            ? "rgba(210, 245, 255, 0.9)"
            : "rgba(255, 255, 255, 0.95)";
        ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha * 1.4));
        ctx.beginPath();
        ctx.arc(renderX, renderY, s.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const handleVisibilityChange = () => {
      paused = document.hidden;
      if (paused) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (!reducedMotion && stars.length > 0 && !animationFrame) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const checkModalState = () => {
      const isHidden = document.body.style.overflow === "hidden";
      if (isHidden !== modalOpen) {
        modalOpen = isHidden;
        if (modalOpen) {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
          }
        } else if (!paused && !reducedMotion && stars.length > 0 && !animationFrame) {
          animationFrame = requestAnimationFrame(draw);
        }
      }
    };

    const bodyObserver = new MutationObserver(() => {
      checkModalState();
    });
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      bodyObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrame);
      if (mouseTimer) clearTimeout(mouseTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}
