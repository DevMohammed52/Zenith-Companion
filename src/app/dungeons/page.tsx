"use client";

import { Suspense } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MobileSortControls from "@/components/MobileSortControls";
import { LoadingState, NoResultsState } from "@/components/StateBlock";
import { useDungeonState } from "./hooks/useDungeonState";
import { DungeonHeader } from "./components/DungeonHeader";
import { DungeonCard, DungeonTableRow } from "./components/DungeonCard";
import { DungeonDetailsModal } from "./components/DungeonDetailsModal";
import { DungeonStyles } from "./components/DungeonStyles";
import { getDungeonKey } from "./types";

function DungeonsContent() {
  const state = useDungeonState();
  const {
    rows,
    activeProfile,
    completedRunsByDungeon,
    updateCompletedRuns,
    openDungeon,
    sortCol,
    sortDesc,
    handleSort,
    setSortDesc,
    getSortDirection,
    totalDungeonCount,
    setSearchTerm,
    setReadinessFilter,
  } = state;

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  const renderSortHeader = (col: string, label: string, align: "left" | "center" = "center") => (
    <th className={`sortable ${align === "left" ? "left-align" : ""}`} aria-sort={getSortDirection(col)}>
      <button type="button" className="dungeon-sort-button" onClick={() => handleSort(col)}>
        <span>{label}</span>
        {renderSortIcon(col)}
      </button>
    </th>
  );

  return (
    <main className="container dungeons-page">
      <DungeonHeader state={state} />

      <div className="dungeons-viewport" style={{ minHeight: "520px", contain: "layout" }}>
        <section className="table-wrapper dungeon-table-wrapper">
          <div className="desktop-only">
            <p className="dungeon-scroll-hint">Scroll table horizontally for completion and drop columns.</p>
            <div className="table-container dungeon-table">
              <table>
                <thead>
                  <tr>
                    {renderSortHeader("name", "Dungeon", "left")}
                    {renderSortHeader("location", "Location", "left")}
                    {renderSortHeader("readiness", "Profile")}
                    {renderSortHeader("netProfitPerRun", "EV / Run")}
                    {renderSortHeader("shardValue", "Gold / Shard")}
                    {renderSortHeader("runsInIdleAction", "Runs / Action")}
                    <th>Done</th>
                    {renderSortHeader("runsToDrop", "Runs / Drop")}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <DungeonTableRow
                      key={getDungeonKey(row)}
                      row={row}
                      hasProfile={Boolean(activeProfile)}
                      completedRuns={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                      onOpen={openDungeon}
                      onUpdateCompletedRuns={updateCompletedRuns}
                    />
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <NoResultsState
                          title="No dungeons match these filters"
                          description={`Loaded ${totalDungeonCount} dungeons, but none match the current filters.`}
                          action={
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm("");
                                setReadinessFilter("all");
                              }}
                            >
                              Reset filters
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-only">
            <MobileSortControls
              label="Sort Dungeons"
              value={sortCol}
              descending={sortDesc}
              onSort={handleSort}
              onToggleDirection={() => setSortDesc((prev) => !prev)}
              options={[
                { value: "netProfitPerRun", label: "EV / Run" },
                { value: "shardValue", label: "Gold / Shard" },
                { value: "runsInIdleAction", label: "Runs / Action" },
                { value: "readiness", label: "Profile Gap" },
                { value: "durationMins", label: "Duration" },
                { value: "name", label: "Name" },
              ]}
            />
            <div className="dungeon-mobile-grid">
              {rows.map((row) => (
                <DungeonCard
                  key={getDungeonKey(row)}
                  row={row}
                  hasProfile={Boolean(activeProfile)}
                  completedRuns={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                  onOpen={openDungeon}
                  onUpdateCompletedRuns={updateCompletedRuns}
                />
              ))}
              {rows.length === 0 && (
                <NoResultsState
                  title="No dungeons match these filters"
                  description={`Loaded ${totalDungeonCount} dungeons, but none match the current filters.`}
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setReadinessFilter("all");
                      }}
                    >
                      Reset filters
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </section>
      </div>

      <DungeonDetailsModal state={state} />
      <DungeonStyles />
    </main>
  );
}

export default function DungeonsPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading dungeons" description="Preparing dungeon drops, requirements, and EV estimates." />}>
      <DungeonsContent />
    </Suspense>
  );
}
