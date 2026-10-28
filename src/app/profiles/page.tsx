"use client";

import React from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { Toast } from "./components/ProfileControls";
import { ProfileHeader, ProfileListPanel } from "./components/ProfileHeader";
import { ProfileIdentitySection } from "./components/ProfileIdentitySection";
import { ProfileLevelsSection } from "./components/ProfileLevelsSection";
import { ProfileSkillsSection } from "./components/ProfileSkillsSection";
import { ProfileCombatSection } from "./components/ProfileCombatSection";
import { ProfileMagicSection } from "./components/ProfileMagicSection";
import { ProfilePetSection } from "./components/ProfilePetSection";
import { ProfileGearSection } from "./components/ProfileGearSection";
import { ProfileHousingSection } from "./components/ProfileHousingSection";
import { ProfileLiveImportModal } from "./components/ProfileLiveImportModal";
import { ProfileBackupDetails, ProfileConfirmModal } from "./components/ProfileBackupModal";
import { ProfilesLoadingShell } from "./components/ProfilesLoadingShell";
import { useProfileState } from "./hooks/useProfileState";
import { useLiveProfileImport } from "./hooks/useLiveProfileImport";

export {
  LIVE_IMPORT_STEPS,
  formatWaitTime,
  getPollAfterMs,
  getRetryAfterMs,
  isRecord,
  resolveLiveImportStep,
} from "./hooks/useLiveProfileImport";

export default function ProfilesPage() {
  const ps = useProfileState();
  const { state, profile, loaded } = ps;

  const liveImport = useLiveProfileImport({
    profile,
    activeProfileSection: ps.activeProfileSection,
    profilesState: state,
    updateProfile: ps.updateProfile,
    replaceState: ps.replaceState,
    setToast: ps.setToast,
    setTransferText: ps.setTransferText,
  });

  if (!loaded) return <ProfilesLoadingShell />;

  if (!profile) {
    return (
      <main className="container profiles-page">
        <div className="header">
          <h1 className="header-title">
            <ZenithIcon name="profile" size={24} style={{ color: "var(--text-accent)" }} /> Profiles
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main
      className="container profiles-page"
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest(".profile-picker")) ps.setOpenPicker(null);
      }}
    >
      <Toast message={ps.toast} onClose={() => ps.setToast("")} />
      <ProfileHeader
        profilesCount={state.profiles.length}
        activeProfileSection={ps.activeProfileSection}
        openProfileSection={ps.openProfileSection}
        onAddProfile={() => {
          const created = ps.addProfile();
          if (created) ps.setToast("Profile added.");
        }}
        onExport={ps.handleExport}
        backupDue={ps.backupDue}
        lastBackupAt={ps.lastBackupAt}
        lastImportedOrRefreshedAt={profile.importSource.importedAt || profile.importSource.refreshedAt}
      />

      <section className="profile-layout" aria-label="Profile manager">
        <ProfileListPanel
          profiles={state.profiles}
          activeProfileId={profile.id}
          onSelectProfile={ps.setActiveProfile}
        />

        <div className="profile-editor" style={{ minHeight: "560px", contain: "layout" }}>
          {ps.activeProfileSection === "identity" && (
            <ProfileIdentitySection
              profile={profile}
              profilesCount={state.profiles.length}
              classInfo={ps.classInfo}
              openPicker={ps.openPicker}
              setOpenPicker={ps.setOpenPicker}
              duplicateProfile={ps.duplicateProfile}
              handleDeleteProfile={ps.handleDeleteProfile}
              patchActive={ps.patchActive}
              handleCopyValue={ps.handleCopyValue}
              fieldSource={ps.fieldSource}
              setToast={ps.setToast}
            />
          )}

          {ps.activeProfileSection === "levels" && (
            <section id="profile-levels" className="profile-panel" tabIndex={-1}>
              <ProfileLevelsSection
                levels={profile.levels}
                onChangeLevel={(key, value) => ps.updateNested("levels", key, value)}
                fieldSource={ps.fieldSource}
              />
              <ProfileSkillsSection
                skills={profile.skills}
                getSkillInputLevel={ps.getSkillInputLevel}
                onUpdateSkill={ps.updateSkillLevel}
                fieldSource={ps.fieldSource}
              />
            </section>
          )}

          {ps.activeProfileSection === "combat" && (
            <ProfileCombatSection
              secondaryStats={profile.secondaryStats}
              calculatedSecondary={ps.calculatedSecondary}
              combatStatTotal={ps.combatStatTotal}
              onChangeSecondaryStat={(key, value) => ps.updateNested("secondaryStats", key, value)}
              fieldSource={ps.fieldSource}
            />
          )}

          {ps.activeProfileSection === "magic" && (
            <ProfileMagicSection
              profile={profile}
              dailyBonus={ps.dailyBonus}
              barteringPercent={ps.barteringPercent}
              openPicker={ps.openPicker}
              setOpenPicker={ps.setOpenPicker}
              updateNested={ps.updateNested}
              updateDailyStreak={ps.updateDailyStreak}
              fieldSource={ps.fieldSource}
            />
          )}

          {ps.activeProfileSection === "pet" && (
            <ProfilePetSection
              profile={profile}
              pets={ps.pets}
              petByName={ps.petByName}
              selectedPet={ps.selectedPet}
              selectedOwnedPet={ps.selectedOwnedPet}
              petMasteryBonus={ps.petMasteryBonus}
              openPicker={ps.openPicker}
              setOpenPicker={ps.setOpenPicker}
              selectPet={ps.selectPet}
              updatePetFormula={ps.updatePetFormula}
              patchActive={ps.patchActive}
              updateNested={ps.updateNested}
              fieldSource={ps.fieldSource}
            />
          )}

          {ps.activeProfileSection === "gear" && (
            <ProfileGearSection
              profile={profile}
              itemByName={ps.itemByName}
              itemOptionsByType={ps.itemOptionsByType}
              openPicker={ps.openPicker}
              setOpenPicker={ps.setOpenPicker}
              updateCombatStyle={ps.updateCombatStyle}
              patchActive={ps.patchActive}
              fieldSource={ps.fieldSource}
            />
          )}

          {ps.activeProfileSection === "housing" && (
            <ProfileHousingSection
              profile={profile}
              housingSummary={ps.housingSummary}
              canUseGuestHousing={ps.canUseGuestHousing}
              updateNested={ps.updateNested}
              fieldSource={ps.fieldSource}
            />
          )}

          {ps.activeProfileSection === "transfer" && (
            <section id="profile-transfer" className="profile-panel" tabIndex={-1}>
              <ProfileLiveImportModal
                profile={profile}
                liveImport={liveImport}
                profilesCount={state.profiles.length}
                profileHashDraft={ps.profileHashDraft}
                setProfileHashDraft={ps.setProfileHashDraft}
                handleCreateProfileFromHash={ps.handleCreateProfileFromHash}
              />
              <ProfileBackupDetails
                transferText={ps.transferText}
                setTransferText={ps.setTransferText}
                onExport={ps.handleExport}
                onImport={ps.handleImport}
              />
            </section>
          )}
        </div>
      </section>

      <ProfileConfirmModal
        confirmDetails={ps.confirmDetails}
        onClose={() => ps.setConfirmAction(null)}
        confirmDialogRef={ps.confirmDialogRef}
        cancelRef={ps.confirmCancelRef}
      />
    </main>
  );
}
