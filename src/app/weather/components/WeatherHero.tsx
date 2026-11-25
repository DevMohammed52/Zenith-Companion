import React from "react";
import type { WeatherData } from "@/constants/weatherData";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatPercent, getWeatherConcept } from "../types";
import styles from "../Weather.module.css";

export function WeatherHero({ activeWeather }: { activeWeather: WeatherData }) {
  const getBadgeVariant = (val: number | null): BadgeVariant => {
    if (!val) return "neutral";
    return val > 0 ? "success" : "danger";
  };

  return (
    <>
      <Card variant="elevated" className={styles.heroCard}>
        <div className={styles.heroRow}>
          <div
            className={styles.heroIconShell}
            style={{ color: activeWeather.theme.primary }}
            aria-hidden="true"
          >
            <Icon
              name={getWeatherConcept(activeWeather.id)}
              size={48}
            />
          </div>
          <div className={styles.heroText}>
            <h2 className={styles.heroTitle} style={{ color: activeWeather.theme.primary }}>
              {activeWeather.name}
            </h2>
            <p className={styles.heroDesc}>{activeWeather.description}</p>
          </div>
        </div>
      </Card>

      <div>
        {activeWeather.id === "magic-storm" ? (
          <Card variant="default" className={styles.impactCard} accent="legendary">
            <div className={styles.cardHeader}>
              <Icon name="weatherMagicStorm" size="md" />
              <h3>Magic Find Bonuses</h3>
            </div>
            <div className={styles.mfStatsGrid}>
              <div className={styles.mfStatTile}>
                <span className={styles.mfStatLabel}>Battle MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.battle}%
                </Badge>
              </div>
              <div className={styles.mfStatTile}>
                <span className={styles.mfStatLabel}>Dungeon MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.dungeon}%
                </Badge>
              </div>
              <div className={styles.mfStatTile}>
                <span className={styles.mfStatLabel}>World Boss MF</span>
                <Badge variant="legendary" size="md">
                  +{activeWeather.magicFind?.worldBoss}%
                </Badge>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="default" className={styles.impactCard}>
            <div className={styles.cardHeader}>
              <Icon name="skillProfit" size="md" />
              <h3>Skill Modifiers</h3>
            </div>
            <div className={styles.modifierList}>
              {activeWeather.impacts.map((imp) => (
                <div key={imp.skill} className={styles.modifierRow}>
                  <span className={styles.modifierSkill}>{imp.skill}</span>
                  <div className={styles.modifierBadges}>
                    <Badge variant={getBadgeVariant(imp.efficiency)} size="sm">
                      Eff {formatPercent(imp.efficiency)}
                    </Badge>
                    <Badge variant={getBadgeVariant(imp.experience)} size="sm">
                      XP {formatPercent(imp.experience)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
