import React from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import styles from "../Weather.module.css";

export function WeatherMechanicsAside() {
  return (
    <aside className={styles.mechanicsPanel}>
      <Card variant="default" className={styles.mechanicsCard}>
        <div className={styles.cardHeader}>
          <Icon name="info" size="md" />
          <h3>Weather Mechanics</h3>
        </div>
        <div className={styles.mechanicsContent}>
          <div className={styles.mechItem}>
            <Icon name="map" size="sm" />
            <div>
              <h4>Regional Geography</h4>
              <p>Weather is regional. It rotates based on area geography and northern hemisphere seasons.</p>
            </div>
          </div>
          <div className={styles.mechItem}>
            <Icon name="calendar" size="sm" />
            <div>
              <h4>Seasonal Dates</h4>
              <p>Seasons follow northern hemisphere dates. Winter (Dec&ndash;Feb) brings snow to mountain areas like <strong>Skyreach Peak</strong>.</p>
            </div>
          </div>
          <div className={styles.mechItem}>
            <Icon name="skillProfit" size="sm" />
            <div>
              <h4>Additive Modifiers</h4>
              <p>Modifiers sum directly. For example, a +10% bonus and a -5% penalty result in a net +5% modifier.</p>
            </div>
          </div>
          <div className={styles.mechItem}>
            <Icon name="timer" size="sm" />
            <div>
              <h4>Action Start Lock-in</h4>
              <p>Idle tasks snapshot weather at the moment the action begins. Modifiers remain active for the full session until restarted.</p>
            </div>
          </div>
          <div className={styles.mechItem}>
            <Icon name="combat" size="sm" />
            <div>
              <h4>Creature Reactions</h4>
              <p>Enemies that love or like a weather condition spawn more often during active windows.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="default" className={styles.mechanicsCard}>
        <div className={styles.tipContent}>
          <Icon name="weatherMagicStorm" size="md" />
          <p>Magic Storms are rare worldwide conditions that grant Magic Find bonuses across battles, dungeons, and world bosses.</p>
        </div>
      </Card>
    </aside>
  );
}
