"use client";

import { Suspense } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MobileSortControls from "@/components/MobileSortControls";
import { LoadingState, NoResultsState } from "@/components/StateBlock";
import { useBossState } from "./hooks/useBossState";
import { BossHeader } from "./components/BossHeader";
import { BossCard, BossTableRow } from "./components/BossCard";
import { BossDetailsModal } from "./components/BossDetailsModal";
import { WorldBossRoutinePlanner } from "./components/WorldBossRoutinePlanner";
import { BossStyles } from "./components/BossStyles";
import { getBossKey } from "./types";

function BossesContent() {
    const state = useBossState();
    const {
        activeBossView,
        rows,
        now,
        openBoss,
        sortCol,
        sortDesc,
        handleSort,
        setSortDesc,
        getSortDirection,
        totalBossCount,
        setSearchTerm,
        setSelectedPhase,
    } = state;

    const renderSortIcon = (col: string) => {
        if (sortCol !== col) return null;
        return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <main className="container bosses-page">
            <BossHeader state={state} />

            <div className="bosses-viewport" style={{ minHeight: "520px", contain: "layout" }}>
                {activeBossView === "planner" && <WorldBossRoutinePlanner state={state} />}

                {activeBossView === "details" && (
                    <section className="table-wrapper">
                        <div className="desktop-only">
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th aria-sort={getSortDirection("name")} className="sortable left-align">
                                                <button aria-label="Sort by Boss" className="boss-sort-button" onClick={() => handleSort("name")} type="button">
                                                    <span>Boss</span>
                                                    {renderSortIcon("name")}
                                                </button>
                                            </th>
                                            <th aria-sort={getSortDirection("location")} className="sortable left-align">
                                                <button aria-label="Sort by Location" className="boss-sort-button" onClick={() => handleSort("location")} type="button">
                                                    <span>Location</span>
                                                    {renderSortIcon("location")}
                                                </button>
                                            </th>
                                            <th aria-sort={getSortDirection("level")} className="sortable">
                                                <button aria-label="Sort by Level" className="boss-sort-button" onClick={() => handleSort("level")} type="button">
                                                    <span>Level</span>
                                                    {renderSortIcon("level")}
                                                </button>
                                            </th>
                                            <th aria-sort={getSortDirection("nextSpawnTime")} className="sortable">
                                                <button aria-label="Sort by Status / Timer" className="boss-sort-button" onClick={() => handleSort("nextSpawnTime")} type="button">
                                                    <span>Status / Timer</span>
                                                    {renderSortIcon("nextSpawnTime")}
                                                </button>
                                            </th>
                                            <th aria-sort={getSortDirection("ev")} className="sortable">
                                                <button aria-label="Sort by EV / Boss" className="boss-sort-button" onClick={() => handleSort("ev")} type="button">
                                                    <span>EV / Boss</span>
                                                    {renderSortIcon("ev")}
                                                </button>
                                            </th>
                                            <th>Market note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <BossTableRow key={getBossKey(row)} row={row} now={now} onOpen={openBoss} />
                                        ))}
                                        {rows.length === 0 && (
                                            <tr>
                                                <td colSpan={6}>
                                                    <NoResultsState
                                                        title="No matching bosses"
                                                        description={`Loaded ${totalBossCount} bosses, but none match the current filters.`}
                                                        action={
                                                            <button type="button" onClick={() => { setSearchTerm(""); setSelectedPhase("all"); }}>
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
                                label="Sort Bosses"
                                value={sortCol || "nextSpawnTime"}
                                descending={sortDesc}
                                onSort={handleSort}
                                onToggleDirection={() => setSortDesc((prev) => !prev)}
                                options={[
                                    { value: "nextSpawnTime", label: "Next Spawn" },
                                    { value: "ev", label: "EV / Boss" },
                                    { value: "level", label: "Level" },
                                    { value: "name", label: "Name" },
                                    { value: "location", label: "Location" },
                                ]}
                            />
                            <div className="mobile-card-grid">
                                {rows.map((row) => (
                                    <BossCard key={getBossKey(row)} row={row} now={now} onOpen={openBoss} />
                                ))}
                                {rows.length === 0 && (
                                    <NoResultsState
                                        title="No matching bosses"
                                        description={`Loaded ${totalBossCount} bosses, but none match the current filters.`}
                                        action={
                                            <button type="button" onClick={() => { setSearchTerm(""); setSelectedPhase("all"); }}>
                                                Reset filters
                                            </button>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <BossDetailsModal state={state} />
            <BossStyles />
        </main>
    );
}

export default function BossesPage() {
    return (
        <Suspense fallback={<LoadingState title="Loading bosses" description="Preparing spawn timers, route planner, and EV estimates." />}>
            <BossesContent />
        </Suspense>
    );
}
