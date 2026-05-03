"use client";
import { useState, useEffect, useRef } from 'react';
import { WEATHER_DATA, WeatherData } from '@/constants/weatherData';
import { 
  Sun, CloudFog, ThermometerSun, Zap, Cloud, 
  CloudRain, CloudSnow, CloudLightning, Wind,
  Info, Calendar, Map, Users, Sparkles,
  TrendingUp, TrendingDown, Swords, Trophy
} from 'lucide-react';

export default function WeatherPage() {
  const [activeWeather, setActiveWeather] = useState<WeatherData>(WEATHER_DATA[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="weather-container">
      {/* Atmosphere Engine 3.0: High-Performance Canvas */}
      <WeatherCanvas weatherId={activeWeather.id} />
      
      <div className="content-wrapper">
        <header className="page-header">
          <div className="header-text">
            <h1>Weather Encyclopedia</h1>
            <p>Master the elements and optimize your activities based on the atmospheric conditions of IdleMMO.</p>
          </div>
          <div className="weather-selector">
            {WEATHER_DATA.map((w) => (
              <button 
                key={w.id}
                onClick={() => setActiveWeather(w)}
                className={`weather-btn ${activeWeather.id === w.id ? 'active' : ''}`}
                style={{ '--accent': w.theme.primary } as any}
              >
                {getWeatherIcon(w.theme.icon)}
                <span>{w.name}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="main-grid">
          {/* Active Weather Info */}
          <section className="active-info-panel">
            <div className="weather-hero">
              <div className="hero-icon" style={{ color: activeWeather.theme.primary }}>
                {getWeatherIcon(activeWeather.theme.icon, 80)}
              </div>
              <div className="hero-text">
                <h2 style={{ color: activeWeather.theme.primary }}>{activeWeather.name}</h2>
                <p className="description">{activeWeather.description}</p>
              </div>
            </div>

            <div className="impact-grid">
              {activeWeather.id === 'magic-storm' ? (
                <div className="mf-card">
                  <div className="card-header">
                    <Trophy size={18} />
                    <h3>Magic Find Bonuses</h3>
                  </div>
                  <div className="mf-stats">
                    <div className="mf-stat">
                      <span className="label">Battle MF</span>
                      <span className="value">+{activeWeather.magicFind?.battle}%</span>
                    </div>
                    <div className="mf-stat">
                      <span className="label">Dungeon MF</span>
                      <span className="value">+{activeWeather.magicFind?.dungeon}%</span>
                    </div>
                    <div className="mf-stat">
                      <span className="label">World Boss MF</span>
                      <span className="value">+{activeWeather.magicFind?.worldBoss}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="impact-card efficiency">
                    <div className="card-header">
                      <TrendingDown size={18} />
                      <h3>Efficiency Modifiers</h3>
                    </div>
                    <div className="stat-list">
                      {activeWeather.impacts.map((imp) => (
                        <div key={imp.skill} className="stat-row">
                          <span>{imp.skill}</span>
                          <span className={imp.efficiency && imp.efficiency < 0 ? 'neg' : imp.efficiency && imp.efficiency > 0 ? 'pos' : ''}>
                            {imp.efficiency === 0 ? '—' : imp.efficiency && imp.efficiency > 0 ? `+${imp.efficiency}%` : `${imp.efficiency}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="impact-card experience">
                    <div className="card-header">
                      <TrendingUp size={18} />
                      <h3>Experience Bonuses</h3>
                    </div>
                    <div className="stat-list">
                      {activeWeather.impacts.map((imp) => (
                        <div key={imp.skill} className="stat-row">
                          <span>{imp.skill}</span>
                          <span className={imp.experience && imp.experience > 0 ? 'pos' : ''}>
                            {imp.experience === 0 ? '—' : `+${imp.experience}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Mechanics Section */}
          <aside className="mechanics-panel">
            <div className="mechanics-card">
              <div className="card-header">
                <Info size={18} color="var(--text-accent)" />
                <h3>Weather Mechanics</h3>
              </div>
              <div className="mechanics-content">
                <div className="mech-item">
                  <Map size={16} />
                  <div>
                    <h4>Regional Geography</h4>
                    <p>Weather isn&apos;t global. It changes depending on where you are, based on the area&apos;s geography and the current season.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <Calendar size={16} />
                  <div>
                    <h4>Seasonal Dates</h4>
                    <p>Seasons follow real-world northern hemisphere dates. Winter (Dec-Feb) sees heavy snow in places like <strong>Skyreach Peak</strong>, which ease up in summer.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <TrendingUp size={16} />
                  <div>
                    <h4>Additive Modifiers</h4>
                    <p>Efficiency is additive. You can offset some of the negatives with things like <strong>potions</strong>.</p>
                  </div>
                </div>
                <div className="mech-item">
                  <Users size={16} />
                  <div>
                    <h4>Creature Behavior</h4>
                    <p>Some creatures show up more often in certain weather, while others become harder to find. Check enemy reactions in-game.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-tip">
              <Sparkles size={16} color="var(--text-accent)" />
              <p>Magic Storms are rare conditions that boost magic find for battles, dungeons, and world bosses.</p>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .weather-container {
          position: relative;
          min-height: calc(100vh - 40px);
          padding: 2rem;
          color: #fff;
          overflow: hidden;
          background: #020617;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header { margin-bottom: 2.5rem; text-align: center; }
        .header-text h1 { font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
        .header-text p { color: rgba(255,255,255,0.5); font-size: 1.1rem; max-width: 650px; margin: 0 auto; }

        @media (max-width: 600px) {
          .header-text h1 { font-size: 1.8rem; }
          .header-text p { font-size: 0.9rem; padding: 0 1rem; }
          .weather-selector { justify-content: flex-start; padding: 0.5rem 1rem; }
          .bento-grid-weather { padding: 0 1rem; }
        }

        .weather-selector {
          display: flex;
          gap: 0.85rem;
          margin-top: 2.5rem;
          padding: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .weather-selector::-webkit-scrollbar { display: none; }

        .weather-btn {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.85rem 1.75rem;
          border-radius: 18px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .weather-btn:hover { 
          background: rgba(255,255,255,0.08); 
          color: #fff;
          transform: translateY(-3px); 
          box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5);
        }
        .weather-btn.active {
          background: color-mix(in srgb, var(--accent), transparent 85%);
          border-color: color-mix(in srgb, var(--accent), transparent 30%);
          color: #fff;
          box-shadow: 0 12px 30px -10px color-mix(in srgb, var(--accent), transparent 50%);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2.5rem;
        }

        .active-info-panel {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 40px;
          padding: 3.5rem;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
        }

        .weather-hero { display: flex; align-items: center; gap: 3rem; margin-bottom: 4.5rem; }
        .hero-text h2 { font-size: 4.5rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.05em; }
        .hero-text .description { font-size: 1.3rem; color: rgba(255,255,255,0.6); line-height: 1.6; max-width: 650px; }

        .impact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        .impact-card, .mf-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 28px;
          padding: 2.5rem;
          transition: transform 0.3s ease;
        }
        .impact-card:hover { transform: scale(1.02); }

        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .card-header h3 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.9); }

        .stat-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .stat-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .stat-row span:first-child { color: rgba(255,255,255,0.4); }
        .stat-row .pos { color: #4ade80; }
        .stat-row .neg { color: #f87171; }

        .mf-stats { display: flex; flex-direction: column; gap: 0.85rem; }
        .mf-stat { 
          background: rgba(255,255,255,0.02); 
          padding: 1rem 1.25rem; 
          border-radius: 16px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          border: 1px solid rgba(255,255,255,0.02);
        }
        .mf-stat .label { font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .mf-stat .value { font-size: 1.1rem; font-weight: 800; color: #a78bfa; text-shadow: 0 0 15px rgba(167, 139, 250, 0.4); }

        .mechanics-panel { display: flex; flex-direction: column; gap: 2rem; }
        .bento-card-weather {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 28px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 600px) {
          .bento-card-weather { padding: 1.5rem; border-radius: 20px; }
          .modifiers-grid { grid-template-columns: 1fr; }
          .modifier-item { padding: 1rem; }
        }
        .mech-item { display: flex; gap: 1.25rem; }
        .mech-item h4 { color: #fff; font-size: 0.95rem; font-weight: 800; margin-bottom: 0.35rem; }
        .mech-item p { color: rgba(255,255,255,0.5); font-size: 0.85rem; line-height: 1.6; }
        .mech-item strong { color: var(--text-accent); }

        .mechanics-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 30px;
          padding: 2rem;
        }
        .mechanics-content { display: flex; flex-direction: column; gap: 2rem; }

        .weather-tip {
          background: linear-gradient(135deg, rgba(245, 176, 65, 0.08), rgba(245, 176, 65, 0.02));
          border: 1px solid rgba(245, 176, 65, 0.15);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }
        .weather-tip p { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }

        @media (max-width: 1100px) {
          .main-grid { grid-template-columns: 1fr; }
          .weather-hero { flex-direction: column; text-align: center; gap: 2rem; }
          .hero-text h2 { font-size: 3.5rem; }
          .active-info-panel { padding: 2.5rem; border-radius: 30px; }
          .impact-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .weather-container { padding: 1.25rem; }
          .header-text h1 { font-size: 2rem; }
          .hero-text h2 { font-size: 2.5rem; }
          .hero-text .description { font-size: 1.1rem; }
          .active-info-panel { padding: 1.5rem; }
          .weather-hero { gap: 1rem; }
          .impact-card, .mf-card { padding: 1.5rem; border-radius: 20px; }
        }
      `}</style>
    </main>
  );
}

/* --- CANVAS ENGINE --- */
function WeatherCanvas({ weatherId }: { weatherId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    const init = () => {
      particles = [];
      const isMobile = width < 768;
      // Adaptive particle scaling: Reduce particles on mobile for efficiency
      const multiplier = isMobile ? 0.45 : 1;
      
      const count = Math.floor((weatherId === 'storm' ? 350 : 
                   weatherId === 'rain' ? 250 : 
                   weatherId === 'snow' ? 200 : 
                   weatherId === 'magic-storm' ? 180 : 
                   weatherId === 'fog' ? 40 : 60) * multiplier);
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = () => {
      const isMobile = width < 768;
      const p: any = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0,
        opacity: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        wave: Math.random() * Math.PI * 2,
        vortexAngle: Math.random() * Math.PI * 2
      };

      if (weatherId === 'rain' || weatherId === 'storm') {
        p.vy = (Math.random() * 12 + 12) * (isMobile ? 0.8 : 1);
        p.vx = (weatherId === 'storm' ? 4 : 1.5) * (isMobile ? 0.8 : 1);
        p.size = Math.random() * 2 + 1;
      } else if (weatherId === 'snow') {
        p.vy = Math.random() * 1.5 + 0.8;
        p.vx = Math.random() * 2 - 1;
        p.size = Math.random() * 3.5 + 1.5;
        p.drift = Math.random() * 2;
      } else if (weatherId === 'magic-storm') {
        p.vx = (Math.random() - 0.5) * (isMobile ? 4 : 6);
        p.vy = (Math.random() - 0.5) * (isMobile ? 4 : 6);
        p.size = Math.random() * 4 + 1;
        p.pulse = Math.random() * 0.1;
        p.isFlare = Math.random() > 0.9;
      } else if (weatherId === 'windy') {
        p.vx = (Math.random() * 15 + 10) * (isMobile ? 0.7 : 1);
        p.vy = (Math.random() - 0.5) * 6;
        p.size = Math.random() * 6 + 2;
        p.isLeaf = Math.random() > 0.6;
        p.isDebris = !p.isLeaf && Math.random() > 0.5;
        p.isWisp = !p.isLeaf && !p.isDebris && Math.random() > 0.5;
        p.isCloud = !p.isLeaf && !p.isDebris && !p.isWisp;
        p.turbulence = Math.random() * 0.1 + 0.05;
      } else if (weatherId === 'fog') {
        p.vx = Math.random() * 0.4 + 0.1;
        p.vy = (Math.random() - 0.5) * 0.1;
        p.size = Math.random() * (isMobile ? 150 : 250) + 100;
        p.opacity = Math.random() * 0.08 + 0.02;
      } else if (weatherId === 'heatwave') {
        p.vy = Math.random() * -2 - 1;
        p.vx = (Math.random() - 0.5) * 1;
        p.size = Math.random() * 2 + 1;
        p.opacity = Math.random() * 0.3 + 0.1;
        p.waveFreq = Math.random() * 0.05 + 0.02;
      } else if (weatherId === 'clear') {
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.size = Math.random() * 1.5 + 0.5;
        p.opacity = Math.random() * 0.4 + 0.1;
        p.isGlint = Math.random() > 0.8;
      }
      
      return p;
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Global Effects
      if (weatherId === 'storm' && Math.random() > 0.985) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, 0, width, height);
      }
      
      if (weatherId === 'magic-storm' && Math.random() > 0.99) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }

      if (weatherId === 'clear') {
        // Subtle God Rays
        ctx.save();
        ctx.translate(width * 0.8, height * 0.1);
        ctx.rotate(Math.PI / 6);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, height * 1.5);
        rayGrad.addColorStop(0, 'rgba(251, 191, 36, 0.05)');
        rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = rayGrad;
        for (let i = 0; i < 3; i++) {
          ctx.rotate(0.1);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-100, height * 1.5);
          ctx.lineTo(100, height * 1.5);
          ctx.fill();
        }
        ctx.restore();
      }

      particles.forEach(p => {
        if (weatherId === 'rain' || weatherId === 'storm') {
          p.y += p.vy;
          p.x += p.vx;
          ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.stroke();
        } else if (weatherId === 'snow') {
          p.angle += 0.02;
          p.y += p.vy;
          p.x += Math.sin(p.angle) * p.drift;
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'magic-storm') {
          p.vortexAngle += 0.05;
          p.x += p.vx + Math.cos(p.vortexAngle) * 2;
          p.y += p.vy + Math.sin(p.vortexAngle) * 2;
          
          if (p.isFlare) {
            p.size = (Math.sin(Date.now() * 0.005) + 1.5) * 5;
            ctx.fillStyle = `rgba(167, 139, 250, 0.3)`;
          } else {
            ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
          }
          
          ctx.shadowBlur = p.isFlare ? 20 : 10;
          ctx.shadowColor = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (weatherId === 'windy') {
          p.angle += p.spin;
          p.wave += p.turbulence;
          const gustVy = Math.sin(p.wave) * 3;
          
          p.x += p.vx;
          p.y += p.vy + gustVy;
          
          if (p.isLeaf) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity})`;
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
            // Parallax Background Clouds
            const cloudSize = p.size * 20;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cloudSize);
            grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.05})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cloudSize, 0, Math.PI * 2);
            ctx.fill();
            p.x -= p.vx * 0.6; // Parallax effect (slower)
          } else {
            // High Speed Air Wisps
            ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 3, p.y - gustVy);
            ctx.stroke();
          }
        } else if (weatherId === 'fog') {
          p.x += p.vx;
          p.y += p.vy;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherId === 'heatwave') {
          p.y += p.vy;
          p.wave += p.waveFreq;
          p.x += Math.sin(p.wave) * 2;
          ctx.fillStyle = `rgba(248, 113, 113, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Shimmer line
          ctx.strokeStyle = `rgba(251, 191, 36, ${p.opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.sin(p.wave) * 10, p.y + 15);
          ctx.stroke();
        } else if (weatherId === 'clear') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.isGlint) {
            p.opacity = Math.abs(Math.sin(Date.now() * 0.002)) * 0.6 + 0.1;
          }
          ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Wrap around logic
        if (p.y > height + 100) p.y = -100;
        if (p.x > width + 100) p.x = -100;
        if (p.x < -100) p.x = width + 100;
        if (p.y < -100) p.y = height + 100;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    window.addEventListener('resize', resize);
    resize();
    update();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherId]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

function getWeatherIcon(icon: string, size = 18) {
  switch (icon) {
    case 'sun': return <Sun size={size} />;
    case 'cloud-fog': return <CloudFog size={size} />;
    case 'thermometer-sun': return <ThermometerSun size={size} />;
    case 'zap': return <Zap size={size} />;
    case 'cloud': return <Cloud size={size} />;
    case 'cloud-rain': return <CloudRain size={size} />;
    case 'cloud-snow': return <CloudSnow size={size} />;
    case 'cloud-lightning': return <CloudLightning size={size} />;
    case 'wind': return <Wind size={size} />;
    default: return <Sun size={size} />;
  }
}
