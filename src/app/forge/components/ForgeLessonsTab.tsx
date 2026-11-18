"use client";

import { useState } from "react";
import { BookOpen, Compass, Flame, Package, SlidersHorizontal, Sparkles } from "lucide-react";
import { useForgeLessons, type UseForgeLessonsReturn } from "../hooks/useForgeLessons";
import { LessonHeaderControls } from "./lessons/LessonHeaderControls";
import { LessonTargetGoalCard } from "./lessons/LessonTargetGoalCard";
import { LessonQueueReview } from "./lessons/LessonQueueReview";
import { MaterialCatalogPicker } from "./lessons/MaterialCatalogPicker";
import { InventoryOptimizer } from "./lessons/InventoryOptimizer";

export type LessonSubView = "session" | "planner" | "catalog" | "inventory";

const SUBVIEWS: Array<{ id: LessonSubView; label: string; icon: any; hint: string }> = [
  { id: "session", label: "Session Queue", icon: Flame, hint: "Active lesson training queue" },
  { id: "planner", label: "Goal Planner", icon: Compass, hint: "Level progression routes" },
  { id: "catalog", label: "Materials", icon: SlidersHorizontal, hint: "91 lesson materials database" },
  { id: "inventory", label: "My Stock", icon: Package, hint: "Owned items & valuation" },
];

export function ForgeLessonsTab({ lessons: externalLessons }: { lessons?: UseForgeLessonsReturn } = {}) {
  const fallbackLessons = useForgeLessons();
  const lessons = externalLessons || fallbackLessons;
  const [activeSubView, setActiveSubView] = useState<LessonSubView>("session");

  const queuedCount = lessons.sessionSummary.queuedItems.length;
  const ownedCount = Object.keys(lessons.ownedMaterials).length;

  return (
    <div
      className="forge-lessons-tab"
      id="forge-tab-panel-lessons"
      role="tabpanel"
      aria-labelledby="forge-tab-lessons"
      style={{ minHeight: "420px", contain: "layout" }}
    >
      {/* 4-View Segmented Switcher */}
      <nav className="lesson-segmented-nav" aria-label="Forge lesson sections" role="tablist">
        {SUBVIEWS.map((view) => {
          const isActive = activeSubView === view.id;
          const Icon = view.icon;
          let badge: string | number | null = null;
          if (view.id === "session" && queuedCount > 0) badge = queuedCount;
          if (view.id === "inventory" && ownedCount > 0) badge = ownedCount;
          if (view.id === "catalog") badge = 91;

          return (
            <button
              key={view.id}
              id={`lesson-subtab-${view.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`lesson-panel-${view.id}`}
              className={`lesson-segment-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveSubView(view.id)}
            >
              <Icon size={14} className="segment-icon" aria-hidden="true" />
              <span className="segment-label">{view.label}</span>
              {badge !== null && <span className="segment-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sub-view Panels: all rendered for SSR contracts, active shown with CSS */}
      <div
        id="lesson-panel-session"
        role="tabpanel"
        aria-labelledby="lesson-subtab-session"
        className={`lesson-subview-panel ${activeSubView === "session" ? "active" : "hidden"}`}
      >
        <LessonHeaderControls lessons={lessons} />
        <LessonQueueReview lessons={lessons} />
      </div>

      <div
        id="lesson-panel-planner"
        role="tabpanel"
        aria-labelledby="lesson-subtab-planner"
        className={`lesson-subview-panel ${activeSubView === "planner" ? "active" : "hidden"}`}
      >
        <LessonTargetGoalCard lessons={lessons} />
      </div>

      <div
        id="lesson-panel-catalog"
        role="tabpanel"
        aria-labelledby="lesson-subtab-catalog"
        className={`lesson-subview-panel ${activeSubView === "catalog" ? "active" : "hidden"}`}
      >
        <MaterialCatalogPicker lessons={lessons} />
      </div>

      <div
        id="lesson-panel-inventory"
        role="tabpanel"
        aria-labelledby="lesson-subtab-inventory"
        className={`lesson-subview-panel ${activeSubView === "inventory" ? "active" : "hidden"}`}
      >
        <InventoryOptimizer lessons={lessons} />
      </div>
    </div>
  );
}
