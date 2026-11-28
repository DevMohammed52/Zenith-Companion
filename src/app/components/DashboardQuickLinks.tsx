"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { Skeleton } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { WeatherMiniCanvas } from "./WeatherMiniCanvas";
import type { LiveBossPulse, LiveWeatherPulse } from "../types";
import styles from "../page.module.css";

interface DashboardQuickLinksProps {
  liveBossPulse: LiveBossPulse | null;
  worldWeatherPulse: LiveWeatherPulse | null;
}

export function DashboardQuickLinks({
  liveBossPulse,
  worldWeatherPulse,
}: DashboardQuickLinksProps) {
  const slides = worldWeatherPulse?.slides || [];
  const [zoneIndex, setZoneIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setZoneIndex((prev) => (prev + 1) % slides.length);
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  const currentSlide = slides.length > 0 ? slides[zoneIndex % slides.length] : null;

  return (
    <div className={styles.bentoSideStack}>
      {/* World Boss Card */}
      <Link href="/bosses" className={styles.bossSceneCard} aria-label="World boss">
        {liveBossPulse?.locationImageUrl && (
          <GameImage
            src={liveBossPulse.locationImageUrl}
            alt=""
            width={640}
            height={280}
            loading="eager"
            className={styles.bossZoneBg}
          />
        )}
        <div className={styles.bossZoneScrim} aria-hidden="true" />

        <header className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <Icon name="boss" size="md" className={styles.panelIcon} aria-hidden="true" />
            <h2 className={styles.panelTitle}>World Boss</h2>
          </div>
          <span className={styles.textActionLink}>
            All bosses
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </span>
        </header>

        {!liveBossPulse ? (
          <Skeleton height={112} />
        ) : (
          <div className={styles.bossSceneBody}>
            <div className={styles.bossInfoCol}>
              <div className={styles.bossTitleRow}>
                <h3 className={styles.bossName}>
                  {liveBossPulse.name} (Lv. {liveBossPulse.level})
                </h3>
                {liveBossPulse.isActiveNow && <span className={styles.liveBadge}>Live now</span>}
              </div>
              <span className={styles.bossZoneLabel}>{liveBossPulse.locationName}</span>
              <span className={styles.bossCountdownValue}>{liveBossPulse.countdownLabel}</span>
            </div>

            <div className={styles.bossFloatWrap}>
              <span className={styles.bossFloorGlow} aria-hidden="true" />
              <GameImage
                src={liveBossPulse.imageUrl}
                alt={liveBossPulse.name}
                width={108}
                height={108}
                loading="eager"
                className={styles.bossBorderlessSprite}
                fallback={<Icon name="boss" size="xl" aria-hidden="true" />}
              />
            </div>
          </div>
        )}
      </Link>

      {/* Current Weather (Rotates Bluebell Hollow -> The Citadel) */}
      <article
        className={styles.weatherCard}
        aria-label="Current weather"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {currentSlide?.zoneImageUrl && (
          <GameImage
            src={currentSlide.zoneImageUrl}
            alt=""
            width={640}
            height={280}
            loading="eager"
            className={styles.weatherZoneBg}
          />
        )}
        {currentSlide && (
          <WeatherMiniCanvas
            condition={currentSlide.condition}
            isMagicStorm={currentSlide.isMagicStorm}
            className={styles.weatherCanvasBg}
          />
        )}
        <div className={styles.weatherCardScrim} aria-hidden="true" />

        <header className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <Icon name="weather" size="md" className={styles.panelIcon} aria-hidden="true" />
            <h2 className={styles.panelTitle}>Current Weather</h2>
          </div>
          <Link href="/weather" className={styles.textActionLink}>
            All zones
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
        </header>

        <div className={styles.weatherStage}>
          {!currentSlide ? (
            <Skeleton height={116} />
          ) : (
            <>
              <Link
                href={`/weather?weather=${encodeURIComponent(currentSlide.condition.toLowerCase().replace(/\s+/g, "-"))}`}
                className={styles.weatherZoneLink}
              >
                <div className={styles.weatherZoneTop}>
                  <strong className={styles.weatherZoneTitle}>{currentSlide.zoneName}</strong>
                  <span
                    className={
                      currentSlide.isMagicStorm
                        ? `${styles.weatherConditionPill} ${styles.weatherStormPill}`
                        : styles.weatherConditionPill
                    }
                  >
                    <Icon name={currentSlide.icon} size="xs" aria-hidden="true" />
                    <span>{currentSlide.condition}</span>
                  </span>
                </div>

                <span className={styles.weatherBuffLine}>
                  {currentSlide.buffs.length > 0
                    ? currentSlide.buffs.join(" | ")
                    : currentSlide.nextChangeLabel || "Forecast updated"}
                </span>
              </Link>

              <div className={styles.weatherControlsRow}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <div className={styles.weatherDots} aria-hidden="true">
                    {slides.map((slide, idx) => (
                      <span
                        key={slide.zoneId}
                        className={
                          idx === zoneIndex % slides.length
                            ? `${styles.weatherDotBtn} ${styles.weatherDotBtnActive}`
                            : styles.weatherDotBtn
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoneIndex((prev) => (prev + 1) % slides.length)}
                    aria-label="Next location weather"
                    className={styles.weatherNextBtn}
                  >
                    <Icon name="chevronRight" size="xs" aria-hidden="true" />
                  </button>
                </div>

                <span className={styles.weatherMetaFoot}>
                  {worldWeatherPulse?.upcomingStormLocation
                    ? `Next Magic Storm: ${worldWeatherPulse.upcomingStormLocation}`
                    : `${(zoneIndex % slides.length) + 1} / ${slides.length}`}
                </span>
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
