"use client";

import { Suspense } from "react";
import { useLoreState } from "./hooks/useLoreState";
import { LoreCanvas } from "./components/LoreCanvas";
import { LoreHeader } from "./components/LoreHeader";
import { LoreToolbar } from "./components/LoreToolbar";
import { LoreAtlasView } from "./components/LoreAtlasView";
import { LoreTimelineView } from "./components/LoreTimelineView";
import { LoreCharactersView } from "./components/LoreCharactersView";
import { LoreArtifactsView } from "./components/LoreArtifactsView";
import { LoreMysteryBoardView } from "./components/LoreMysteryBoardView";
import { LoreTheoriesView } from "./components/LoreTheoriesView";
import { LoreEntryModal } from "./components/LoreEntryModal";
import { LoreStyles } from "./components/LoreStyles";

export * from "./types";

function LoreContent() {
  const state = useLoreState();

  return (
    <main className="lore-page" aria-labelledby="lore-page-title">
      <LoreCanvas />
      <div className="lore-shade" aria-hidden="true" />

      <LoreHeader
        loading={state.loading}
        entriesCount={state.entries.length}
        relationsCount={state.relations.length}
        theoriesCount={state.theories.length}
      />

      <LoreToolbar
        search={state.search}
        setSearch={state.setSearch}
        hasSearch={state.hasSearch}
        activeView={state.activeView}
        setActiveView={state.setActiveView}
        activeViewLabel={state.activeViewLabel}
        visibleEntryCount={state.visibleEntryCount}
        activeCategory={state.activeCategory}
        setActiveCategory={state.setActiveCategory}
        activeCategoryLabel={state.activeCategoryLabel}
        categoryFilterApplies={state.categoryFilterApplies}
        entriesCount={state.entries.length}
        categoryCounts={state.categoryCounts}
        hasActiveControls={state.hasActiveControls}
        resetLoreControls={state.resetLoreControls}
      />

      <div className="lore-view-viewport" style={{ minHeight: "500px", contain: "layout", position: "relative", zIndex: 5 }}>
        {state.activeView === "atlas" && (
          <LoreAtlasView
            featuredAtlas={state.featuredAtlas}
            activeCategory={state.activeCategory}
            loading={state.loading}
            openEntry={state.openEntry}
          />
        )}

        {state.activeView === "timeline" && (
          <LoreTimelineView
            timeline={state.timeline}
            entryById={state.entryById}
            openEntry={state.openEntry}
          />
        )}

        {state.activeView === "characters" && (
          <LoreCharactersView
            characterEntries={state.characterEntries}
            npcNetworkGroups={state.npcNetworkGroups}
            openEntry={state.openEntry}
          />
        )}

        {state.activeView === "artifacts" && (
          <LoreArtifactsView
            artifactsAndBeasts={state.artifactsAndBeasts}
            openEntry={state.openEntry}
          />
        )}

        {state.activeView === "board" && (
          <LoreMysteryBoardView
            search={state.search}
            boardPickerRef={state.boardPickerRef}
            boardPickerTriggerRef={state.boardPickerTriggerRef}
            boardPickerOpen={state.boardPickerOpen}
            toggleBoardPicker={state.toggleBoardPicker}
            boardPickerListId={state.boardPickerListId}
            boardEntry={state.boardEntry}
            boardPickerSearch={state.boardPickerSearch}
            setBoardPickerSearch={state.setBoardPickerSearch}
            setActiveBoardOptionIndex={state.setActiveBoardOptionIndex}
            handleBoardPickerSearchKeyDown={state.handleBoardPickerSearchKeyDown}
            boardPickerCategory={state.boardPickerCategory}
            setBoardPickerCategory={state.setBoardPickerCategory}
            filteredBoardOptions={state.filteredBoardOptions}
            activeBoardOptionIndex={state.activeBoardOptionIndex}
            activeBoardOptionId={state.activeBoardOptionId}
            getBoardOptionId={state.getBoardOptionId}
            selectBoardEntry={state.selectBoardEntry}
            relationFilter={state.relationFilter}
            setRelationFilter={state.setRelationFilter}
            boardStats={state.boardStats}
            boardGraphRelations={state.boardGraphRelations}
            boardRelations={state.boardRelations}
            entryById={state.entryById}
            openEntry={state.openEntry}
            setBoardEntryId={state.setBoardEntryId}
          />
        )}

        {state.activeView === "theories" && (
          <LoreTheoriesView
            theories={state.theories}
            entryById={state.entryById}
            openEntry={state.openEntry}
          />
        )}
      </div>

      {state.selectedEntry && (
        <LoreEntryModal
          entry={state.selectedEntry}
          onClose={() => state.setSelectedEntry(null)}
          onOpen={state.openEntry}
          entryById={state.entryById}
          itemLinks={state.itemLinks}
        />
      )}

      <LoreStyles />
    </main>
  );
}

export default function LorePage() {
  return (
    <Suspense fallback={<main className="container">Loading lore archive...</main>}>
      <LoreContent />
    </Suspense>
  );
}
