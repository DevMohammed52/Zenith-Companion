"use client";

import { useEffect, useState } from "react";
import { Icon, Tab, TabList, Tabs } from "@/components/ui";
import { useForgeLessons, type UseForgeLessonsReturn } from "../hooks/useForgeLessons";
import { LessonHeaderControls } from "./lessons/LessonHeaderControls";
import { LessonTargetGoalCard } from "./lessons/LessonTargetGoalCard";
import { LessonQueueReview } from "./lessons/LessonQueueReview";
import { MaterialCatalogPicker } from "./lessons/MaterialCatalogPicker";
import { InventoryOptimizer } from "./lessons/InventoryOptimizer";
import styles from "../Forge.module.css";

type LessonSubView = "catalog" | "planner" | "session" | "inventory";

export function ForgeLessonsTab({ lessons: externalLessons }: { lessons?: UseForgeLessonsReturn }) {
  const internalLessons = useForgeLessons();
  const lessons = externalLessons || internalLessons;
  const [activeSubView, setActiveSubView] = useState<LessonSubView>("catalog");

  const queuedCount = lessons.queuedItems.length;
  const ownedCount = Object.keys(lessons.ownedMaterials || {}).length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sub = params.get("view");
    if (sub === "catalog" || sub === "planner" || sub === "session" || sub === "inventory") {
      setActiveSubView(sub);
    }
  }, []);

  const handleSubViewChange = (view: string) => {
    const typed = view as LessonSubView;
    setActiveSubView(typed);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (typed === "catalog") url.searchParams.delete("view");
      else url.searchParams.set("view", typed);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div
      className={styles.lessonsWorkspace}
      id="forge-tab-panel-lessons"
      role="tabpanel"
      aria-labelledby="forge-tab-lessons"
    >
      <LessonHeaderControls
        lessons={lessons}
        onOpenQueueTab={() => handleSubViewChange("session")}
      />

      <div className={styles.subTabsRow}>
        <Tabs
          value={activeSubView}
          onValueChange={handleSubViewChange}
          variant="pill"
          sharedPanelId="forge-lessons-panel"
          className={styles.subTabsContainer}
        >
          <TabList aria-label="Forge lesson workspace views" className={styles.subTabsList}>
            <Tab
              value="catalog"
              icon={<Icon name="filter" size="sm" aria-hidden="true" />}
              badge={lessons.allCalculatedMaterials.length}
            >
              Materials
            </Tab>
            <Tab
              value="planner"
              icon={<Icon name="map" size="sm" aria-hidden="true" />}
            >
              Goal Planner
            </Tab>
            <Tab
              value="session"
              icon={<Icon name="craftingQueue" size="sm" aria-hidden="true" />}
              badge={queuedCount > 0 ? queuedCount : undefined}
            >
              Session Queue
            </Tab>
            <Tab
              value="inventory"
              icon={<Icon name="items" size="sm" aria-hidden="true" />}
              badge={ownedCount > 0 ? ownedCount : undefined}
            >
              My Stock
            </Tab>
          </TabList>
        </Tabs>
      </div>

      {/* All 4 panels kept mounted with hidden attribute for SSR & instant zero-CLS tab switching */}
      <div id="forge-lessons-panel">
        <div className={styles.subTabPanel} hidden={activeSubView !== "catalog"}>
          <MaterialCatalogPicker
            lessons={lessons}
            onOpenQueueTab={() => handleSubViewChange("session")}
          />
        </div>

        <div className={styles.subTabPanel} hidden={activeSubView !== "planner"}>
          <LessonTargetGoalCard
            lessons={lessons}
            onSwitchSubView={handleSubViewChange}
          />
        </div>

        <div className={styles.subTabPanel} hidden={activeSubView !== "session"}>
          <LessonQueueReview
            lessons={lessons}
            onSwitchSubView={handleSubViewChange}
          />
        </div>

        <div className={styles.subTabPanel} hidden={activeSubView !== "inventory"}>
          <InventoryOptimizer
            lessons={lessons}
            onSwitchSubView={handleSubViewChange}
          />
        </div>
      </div>
    </div>
  );
}
