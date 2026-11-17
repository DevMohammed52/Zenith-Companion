"use client";

import { useForgeLessons, type UseForgeLessonsReturn } from "../hooks/useForgeLessons";
import { LessonHeaderControls } from "./lessons/LessonHeaderControls";
import { LessonTargetGoalCard } from "./lessons/LessonTargetGoalCard";
import { LessonQueueReview } from "./lessons/LessonQueueReview";
import { MaterialCatalogPicker } from "./lessons/MaterialCatalogPicker";
import { InventoryOptimizer } from "./lessons/InventoryOptimizer";

export function ForgeLessonsTab({ lessons: externalLessons }: { lessons?: UseForgeLessonsReturn } = {}) {
  const fallbackLessons = useForgeLessons();
  const lessons = externalLessons || fallbackLessons;

  return (
    <div
      className="forge-lessons-tab"
      id="forge-tab-panel-lessons"
      role="tabpanel"
      aria-labelledby="forge-tab-lessons"
      style={{ minHeight: "420px", contain: "layout" }}
    >
      <LessonHeaderControls lessons={lessons} />
      <LessonTargetGoalCard lessons={lessons} />
      <LessonQueueReview lessons={lessons} />
      <InventoryOptimizer lessons={lessons} />
      <MaterialCatalogPicker lessons={lessons} />
    </div>
  );
}
