"use client";

import { BackToTop } from "@/components/ui/BackToTop";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useHousingState } from "./hooks/useHousingState";
import { HousingHeader } from "./components/HousingHeader";
import { HousingOverviewTab } from "./components/HousingOverviewTab";
import { HousingSetupTab } from "./components/HousingSetupTab";
import { HousingComponentsTab } from "./components/HousingComponentsTab";
import { HousingProfitTab } from "./components/HousingProfitTab";
import { HousingGuestTab } from "./components/HousingGuestTab";
import styles from "./page.module.css";

export default function HousingPage() {
  const state = useHousingState();
  const { loaded, activeProfile, undoHousing, restoreHousingUndo, activeHousingTab } = state;

  return (
    <main className={`container housing-page ${styles.housingPage}`} aria-labelledby="housing-page-title">
      <HousingHeader state={state} />

      {!loaded ? (
        <div className="housing-tab-viewport" style={{ minHeight: "520px", contain: "layout" }}>
          <Skeleton variant="rectangular" width="100%" height={260} />
        </div>
      ) : !activeProfile ? (
        <section className="housing-panel empty-panel">
          <Icon name="dungeon" size="xl" aria-hidden="true" />
          <h2>Create or select a profile first</h2>
          <p>Housing is stored per character profile so alts and mains do not share house setups.</p>
        </section>
      ) : (
        <div className="housing-tab-viewport" style={{ minHeight: "520px", contain: "layout" }}>
          {undoHousing && (
            <div className="housing-undo-toast" role="status" aria-live="polite">
              <span>{undoHousing.label}</span>
              <button type="button" onClick={restoreHousingUndo}>Undo</button>
            </div>
          )}

          {activeHousingTab === "overview" && <HousingOverviewTab state={state} />}
          <HousingSetupTab state={state} />
          {activeHousingTab === "components" && <HousingComponentsTab state={state} />}
          {activeHousingTab === "profit" && <HousingProfitTab state={state} />}
          {activeHousingTab === "guest" && <HousingGuestTab state={state} />}
        </div>
      )}

      <BackToTop />
    </main>
  );
}
