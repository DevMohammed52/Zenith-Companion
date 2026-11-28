"use client";

import { useEffect, useRef } from "react";

interface WeatherMiniCanvasProps {
  condition: string;
  isMagicStorm?: boolean;
  className?: string;
}

type WeatherMode =
  | "rain"
  | "storm"
  | "magic"
  | "snow"
  | "fog"
  | "overcast"
  | "wind"
  | "heat"
  | "clear";

interface MiniParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  width?: number;
  height?: number;
  alpha: number;
  phase: number;
  len: number;
  rot: number;
  vRot: number;
  color: string;
}

function normalizeCondition(raw: string, isMagicStorm?: boolean): WeatherMode {
  if (isMagicStorm) return "magic";
  const k = raw.toLowerCase();
  if (k.includes("magic storm")) return "magic";
  if (k.includes("storm") || k.includes("thunder")) return "storm";
  if (k.includes("rain")) return "rain";
  if (k.includes("snow") || k.includes("blizzard")) return "snow";
  if (k.includes("fog") || k.includes("mist")) return "fog";
  if (k.includes("overcast") || k.includes("cloud")) return "overcast";
  if (k.includes("wind")) return "wind";
  if (k.includes("heat") || k.includes("drought")) return "heat";
  return "clear";
}

function buildBoltPath(w: number, h: number): Array<{ x: number; y: number }> {
  const startX = w * (0.28 + Math.random() * 0.52);
  const pts = [{ x: startX, y: 0 }];
  let x = startX;
  let y = 0;
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    x += (Math.random() - 0.5) * 44;
    y = (h * 0.78 * i) / steps;
    pts.push({ x, y });
  }
  return pts;
}

export function WeatherMiniCanvas({ condition, isMagicStorm, className }: WeatherMiniCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mode = normalizeCondition(condition, isMagicStorm);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    let width = 0;
    let height = 0;
    let animId = 0;
    let lastTime = performance.now();
    let flashAlpha = 0;
    let activeBolt: Array<{ x: number; y: number }> | null = null;
    let nextFlashAt = performance.now() + 1400;
    let visible = !document.hidden;
    let particles: MiniParticle[] = [];

    const seedParticles = (w: number, h: number) => {
      const count =
        mode === "rain" || mode === "storm"
          ? 52
          : mode === "snow"
            ? 42
            : mode === "fog"
              ? 16
              : mode === "overcast"
                ? 14
                : mode === "wind"
                  ? 26
                  : mode === "heat"
                    ? 36
                    : mode === "magic"
                      ? 38
                      : 30;

      const items: MiniParticle[] = [];
      for (let i = 0; i < count; i++) {
        if (mode === "rain" || mode === "storm") {
          items.push({
            x: Math.random() * (w + 70) - 20,
            y: Math.random() * h,
            vx: mode === "storm" ? -115 : -62,
            vy: mode === "storm" ? 420 + Math.random() * 140 : 300 + Math.random() * 110,
            size: mode === "storm" ? 1.2 + Math.random() * 0.7 : 1 + Math.random() * 0.6,
            alpha: 0.42 + Math.random() * 0.34,
            phase: Math.random() * Math.PI * 2,
            len: 14 + Math.random() * 14,
            rot: 0,
            vRot: 0,
            color: mode === "storm" ? "186, 215, 255" : "148, 197, 255",
          });
        } else if (mode === "magic") {
          const palettePick = i % 3;
          const arcane =
            palettePick === 0
              ? "192, 132, 252"
              : palettePick === 1
                ? "250, 204, 21"
                : "232, 121, 249";
          items.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 26,
            vy: -18 - Math.random() * 28,
            size: 1.8 + Math.random() * 2.8,
            alpha: 0.5 + Math.random() * 0.42,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: arcane,
          });
        } else if (mode === "snow") {
          items.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -10 + Math.random() * 22,
            vy: 22 + Math.random() * 28,
            size: 1.4 + Math.random() * 2.3,
            alpha: 0.42 + Math.random() * 0.38,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: "226, 232, 240",
          });
        } else if (mode === "fog") {
          // Layered drifting mist clouds concentrated in the lower/mid region
          const bandY = h * (0.42 + Math.random() * 0.58);
          items.push({
            x: Math.random() * (w + 120) - 60,
            y: bandY,
            vx: 14 + Math.random() * 18,
            vy: 0,
            size: 46 + Math.random() * 48,
            width: 110 + Math.random() * 90,
            height: 36 + Math.random() * 26,
            alpha: 0.14 + Math.random() * 0.1,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: i % 2 === 0 ? "186, 204, 224" : "148, 163, 184",
          });
        } else if (mode === "overcast") {
          // Heavy upper-sky storm clouds drifting slowly across the canopy
          const bandY = h * (0.04 + Math.random() * 0.48);
          items.push({
            x: Math.random() * (w + 140) - 70,
            y: bandY,
            vx: 10 + Math.random() * 14,
            vy: 0,
            size: 54 + Math.random() * 44,
            width: 120 + Math.random() * 110,
            height: 38 + Math.random() * 24,
            alpha: 0.16 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: i % 3 === 0 ? "203, 213, 225" : "100, 116, 139",
          });
        } else if (mode === "wind") {
          const isRibbon = i < 12;
          items.push({
            x: Math.random() * (w + 120) - 60,
            y: Math.random() * h,
            vx: isRibbon ? 175 + Math.random() * 125 : 135 + Math.random() * 90,
            vy: isRibbon ? (Math.random() - 0.5) * 14 : 16 + Math.random() * 24,
            size: isRibbon ? 1.5 + Math.random() * 0.8 : 2.2 + Math.random() * 1.8,
            alpha: isRibbon ? 0.34 + Math.random() * 0.24 : 0.45 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
            len: isRibbon ? 95 + Math.random() * 85 : 0,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 5.5,
            color: isRibbon ? "186, 230, 253" : "134, 239, 172",
          });
        } else if (mode === "heat") {
          items.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 20,
            vy: -24 - Math.random() * 30,
            size: 1.5 + Math.random() * 2.4,
            alpha: 0.42 + Math.random() * 0.44,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: i % 3 === 0 ? "248, 113, 113" : "251, 146, 60",
          });
        } else {
          // Clear: twinkling golden pollen & sun motes paired with sunbeams
          items.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 6 + (Math.random() - 0.5) * 10,
            vy: -6 - Math.random() * 10,
            size: 1.6 + Math.random() * 2.2,
            alpha: 0.38 + Math.random() * 0.42,
            phase: Math.random() * Math.PI * 2,
            len: 0,
            rot: 0,
            vRot: 0,
            color: i % 2 === 0 ? "253, 224, 71" : "251, 191, 36",
          });
        }
      }
      particles = items;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles(width, height);
    };

    const drawClearSunbeams = (now: number) => {
      const t = now * 0.0005;
      for (let i = 0; i < 3; i++) {
        const sweep = Math.sin(t + i * 1.4) * 26;
        const topX = width * (0.58 + i * 0.16) + sweep;
        const botX = topX - width * 0.36;
        const grad = ctx.createLinearGradient(topX, 0, botX, height);
        grad.addColorStop(0, "rgba(253, 224, 71, 0.14)");
        grad.addColorStop(0.55, "rgba(251, 191, 36, 0.055)");
        grad.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(topX - 18, 0);
        ctx.lineTo(topX + 26, 0);
        ctx.lineTo(botX + 64, height);
        ctx.lineTo(botX - 48, height);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawHeatWaves = (now: number) => {
      const glow = ctx.createLinearGradient(0, height * 0.45, 0, height);
      glow.addColorStop(0, "rgba(251, 146, 60, 0)");
      glow.addColorStop(1, "rgba(239, 68, 68, 0.18)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      ctx.lineWidth = 1.6;
      for (let row = 0; row < 4; row++) {
        const baseY = height * (0.48 + row * 0.13);
        ctx.strokeStyle = `rgba(251, 146, 60, ${0.14 + row * 0.03})`;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 14) {
          const waveY = baseY + Math.sin(x * 0.035 + now * 0.0045 + row * 1.5) * 4.2;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    };

    const drawMagicAmbient = (now: number) => {
      const pulse = 0.09 + 0.045 * Math.sin(now * 0.0022);
      const aura = ctx.createRadialGradient(width * 0.72, height * 0.35, 10, width * 0.72, height * 0.35, width * 0.65);
      aura.addColorStop(0, `rgba(192, 132, 252, ${pulse + 0.06})`);
      aura.addColorStop(0.55, `rgba(139, 92, 246, ${pulse * 0.5})`);
      aura.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);
    };

    const drawFrame = (now: number, stepPhysics: boolean) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      if (mode === "clear") {
        drawClearSunbeams(now);
      } else if (mode === "heat") {
        drawHeatWaves(now);
      } else if (mode === "magic") {
        drawMagicAmbient(now);
      }

      if ((mode === "storm" || mode === "magic") && stepPhysics) {
        if (now >= nextFlashAt) {
          flashAlpha = mode === "magic" ? 0.24 : 0.26;
          activeBolt = buildBoltPath(width, height);
          nextFlashAt = now + 2200 + Math.random() * 3400;
        }
        if (flashAlpha > 0.006) {
          ctx.fillStyle = mode === "magic"
            ? `rgba(192, 132, 252, ${flashAlpha * 0.65})`
            : `rgba(186, 230, 253, ${flashAlpha * 0.75})`;
          ctx.fillRect(0, 0, width, height);

          if (activeBolt && flashAlpha > 0.08) {
            ctx.strokeStyle = mode === "magic"
              ? `rgba(250, 204, 21, ${Math.min(0.95, flashAlpha * 3.4)})`
              : `rgba(224, 242, 254, ${Math.min(0.95, flashAlpha * 3.6)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            activeBolt.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
          }

          flashAlpha *= 0.86;
          if (flashAlpha <= 0.01) activeBolt = null;
        }
      }

      for (const p of particles) {
        if (stepPhysics) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.phase += dt * 1.9;
          p.rot += p.vRot * dt;
          if (mode === "snow") p.x += Math.sin(p.phase) * 15 * dt;
          if (mode === "wind" && p.len === 0) p.y += Math.sin(p.phase * 1.5) * 18 * dt;
          if (mode === "heat") p.x += Math.sin(p.phase * 2) * 14 * dt;

          const padX = Math.max(p.len || 0, p.width || p.size) + 40;
          if (p.y > height + 30) {
            p.y = -18;
            p.x = Math.random() * (width + 40);
          } else if (p.y < -30) {
            p.y = height + 16;
            p.x = Math.random() * width;
          }
          if (p.x > width + padX) p.x = -padX * 0.7;
          if (p.x < -padX) p.x = width + padX * 0.5;
        }

        if (mode === "rain" || mode === "storm") {
          ctx.strokeStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.032, p.y + p.len);
          ctx.stroke();
        } else if (mode === "wind") {
          if (p.len > 0) {
            const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.len, p.y);
            grad.addColorStop(0, `rgba(${p.color}, 0)`);
            grad.addColorStop(0.5, `rgba(${p.color}, ${p.alpha})`);
            grad.addColorStop(1, `rgba(${p.color}, 0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.bezierCurveTo(
              p.x + p.len * 0.35,
              p.y + Math.sin(p.phase) * 12,
              p.x + p.len * 0.7,
              p.y - Math.cos(p.phase) * 10,
              p.x + p.len,
              p.y,
            );
            ctx.stroke();
          } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else if (mode === "fog" || mode === "overcast") {
          const rx = (p.width || p.size * 2) * 0.5;
          const ry = (p.height || p.size) * 0.5;
          ctx.save();
          ctx.translate(p.x, p.y + Math.sin(p.phase * 0.6) * 4);
          ctx.scale(1, ry / Math.max(1, rx));
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
          grad.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
          grad.addColorStop(0.55, `rgba(${p.color}, ${p.alpha * 0.45})`);
          grad.addColorStop(1, `rgba(${p.color}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (mode === "magic") {
          const pulse = 0.68 + 0.32 * Math.sin(p.phase);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2);
          glow.addColorStop(0, `rgba(${p.color}, ${p.alpha * pulse})`);
          glow.addColorStop(0.4, `rgba(${p.color}, ${p.alpha * 0.35 * pulse})`);
          glow.addColorStop(1, `rgba(${p.color}, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const pulse = 0.68 + 0.32 * Math.sin(p.phase);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha * pulse})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (stepPhysics && visible && !reducedMotion) {
        animId = requestAnimationFrame((ts) => drawFrame(ts, true));
      }
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !reducedMotion) {
        lastTime = performance.now();
        animId = requestAnimationFrame((ts) => drawFrame(ts, true));
      } else {
        cancelAnimationFrame(animId);
      }
    };

    const onResize = () => {
      resize();
      if (reducedMotion) drawFrame(performance.now(), false);
    };

    resize();
    if (reducedMotion) {
      drawFrame(performance.now(), false);
    } else {
      animId = requestAnimationFrame((ts) => drawFrame(ts, true));
    }

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
