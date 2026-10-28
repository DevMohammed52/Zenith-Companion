"use client";

import React, { useMemo } from "react";
import type { CharacterProfile, ProfileFieldSource, ProfileOwnedPet, ProfileUpdateOptions } from "@/lib/profiles";
import type { PetDatabaseRecord } from "@/lib/profile-calculations";
import QualityText from "@/components/QualityText";
import { FieldSourceChip, ProfileNumberField, ProfilePicker, ProfileTextField, type PickerOption } from "./ProfileControls";

export const PET_STAT_FIELDS: Array<[keyof CharacterProfile["pet"]["stats"], string]> = [
  ["agility", "Agility"],
  ["accuracy", "Accuracy"],
  ["protection", "Protection"],
  ["attackPower", "Attack Power"],
  ["movementSpeed", "Movement Speed"],
  ["maxHealth", "Max Health"],
  ["maxStamina", "Max Stamina"],
  ["criticalDamage", "Crit Damage"],
  ["criticalChance", "Crit Chance"],
];

export function profilePetSnapshotKey(pet: Pick<CharacterProfile["pet"], "species" | "level" | "evolution">): string {
  return `${pet.species.toLowerCase()}::${pet.level || ""}::${pet.evolution || ""}`;
}

export type PetPickerValue =
  | { kind: "database"; pet: PetDatabaseRecord }
  | { kind: "owned"; pet: ProfileOwnedPet };

export interface ProfilePetSectionProps {
  profile: CharacterProfile;
  pets: PetDatabaseRecord[];
  petByName: Map<string, PetDatabaseRecord>;
  selectedPet: PetDatabaseRecord | undefined;
  selectedOwnedPet: ProfileOwnedPet | null;
  petMasteryBonus: number;
  openPicker: string | null;
  setOpenPicker: (id: string | null) => void;
  selectPet: (selection: PetPickerValue | null) => void;
  updatePetFormula: (patch: Partial<CharacterProfile["pet"]>) => void;
  patchActive: (patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  updateNested: <Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
    section: Section,
    key: Key,
    value: CharacterProfile[Section][Key],
  ) => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfilePetSection({
  profile,
  pets,
  petByName,
  selectedPet,
  selectedOwnedPet,
  petMasteryBonus,
  openPicker,
  setOpenPicker,
  selectPet,
  updatePetFormula,
  patchActive,
  updateNested,
  fieldSource,
}: ProfilePetSectionProps) {
  const petOptions: Array<PickerOption<PetPickerValue>> = useMemo(() => [
    {
      id: "none",
      title: "No Pet Selected",
      subtitle: "Clear pet data",
      searchText: "none clear no pet",
      value: null,
      muted: true,
    },
    ...(profile?.ownedPets || []).map((ownedPet) => {
      const databasePet = petByName.get(ownedPet.species);
      const title = ownedPet.nickname || ownedPet.species;
      const sourceLabel = ownedPet.source === "imported" ? "Imported owned pet" : "Owned pet";
      return {
        id: `owned-${ownedPet.id}`,
        title,
        subtitle: `${sourceLabel} - ${ownedPet.species} - Lv. ${ownedPet.level || 1} - Evo ${ownedPet.evolution || 0}`,
        image: ownedPet.imageUrl || databasePet?.imageUrl,
        badge: ownedPet.equipped || ownedPet.active ? "Active" : "Owned",
        searchText: [
          title,
          ownedPet.species,
          ownedPet.quality,
          ownedPet.source,
          ownedPet.location?.name,
          ownedPet.hashTail,
          "owned imported snapshot",
        ].filter(Boolean).join(" "),
        value: { kind: "owned", pet: ownedPet } as PetPickerValue,
      };
    }),
    ...pets.map((pet) => ({
      id: `db-${pet.name}`,
      title: pet.name,
      subtitle: (
        <>
          <QualityText value={pet.quality || "UNKNOWN"}>{pet.quality || "UNKNOWN"}</QualityText>
          {pet.acquisition?.[0]?.boss ? ` - ${pet.acquisition[0].boss}` : ""}
        </>
      ),
      image: pet.imageUrl,
      badge: <QualityText value={pet.quality}>{pet.quality}</QualityText>,
      searchText: `${pet.name} ${pet.quality} ${pet.acquisition?.map((entry) => `${entry.boss} ${entry.location}`).join(" ")}`,
      value: { kind: "database", pet } as PetPickerValue,
    })),
  ], [petByName, pets, profile?.ownedPets]);

  const selectedPetOption = selectedOwnedPet
    ? petOptions.find((option) => option.id === `owned-${selectedOwnedPet.id}`)
    : selectedPet
      ? petOptions.find((option) => option.id === `db-${selectedPet.name}`)
      : petOptions[0];

  return (
    <section id="profile-pet" className="profile-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Pet</h2>
          <p>Select from the Pet Database, then adjust level, evolution, Pet Mastery, or final visible pet stats.</p>
        </div>
        <div className="profile-stat-pill">+{petMasteryBonus}% Pet Mastery stats</div>
      </div>
      <div className="profile-grid">
        <ProfilePicker
          id="pet"
          label="Pet"
          placeholder="Select Pet"
          selected={selectedPetOption}
          options={petOptions}
          openId={openPicker}
          setOpenId={setOpenPicker}
          onSelect={selectPet}
          source={fieldSource("pet.species")}
        />
        <ProfileTextField label="Quality" value={profile.pet.quality} onChange={(value) => updateNested("pet", "quality", value)} placeholder="Select a pet" source={fieldSource("pet.quality")} />
        <ProfileNumberField label="Pet Level" value={profile.pet.level} min={1} max={100} onChange={(value) => updatePetFormula({ level: value })} source={fieldSource("pet.level")} />
        <ProfileNumberField label="Evolution Level" value={profile.pet.evolution} min={0} max={5} onChange={(value) => updatePetFormula({ evolution: value })} source={fieldSource("pet.evolution")} />
      </div>
      {(selectedOwnedPet || selectedPet) && (
        <div className="profile-selected-card">
          {(selectedOwnedPet?.imageUrl || selectedPet?.imageUrl) && (
            <img
              src={selectedOwnedPet?.imageUrl || selectedPet?.imageUrl}
              alt=""
              className={(selectedOwnedPet?.species || selectedPet?.name) === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined}
            />
          )}
          <div>
            <h3>{selectedOwnedPet?.nickname || selectedOwnedPet?.species || selectedPet?.name}</h3>
            <p>
              {selectedOwnedPet ? (
                <>
                  <QualityText value={selectedOwnedPet.quality || "UNKNOWN"}>{selectedOwnedPet.quality || "Unknown quality"}</QualityText> - {selectedOwnedPet.source === "imported" ? "Imported owned snapshot" : "Owned snapshot"}
                </>
              ) : (
                <>
                  <QualityText value={selectedPet?.quality || "UNKNOWN"}>{selectedPet?.quality || "Unknown quality"}</QualityText> - {selectedPet?.acquisition?.[0]?.boss || "Pet Database"}
                </>
              )}
            </p>
            <div className="profile-chip-row">
              {PET_STAT_FIELDS.slice(0, 6).map(([key, label]) => <span key={key}>{label}: {profile.pet.stats[key] || 0}</span>)}
            </div>
          </div>
        </div>
      )}
      <div className="profile-grid compact">
        {PET_STAT_FIELDS.map(([key, label]) => (
          <ProfileNumberField
            key={key}
            label={label}
            value={profile.pet.stats[key]}
            step={key === "movementSpeed" || key === "criticalDamage" || key === "criticalChance" ? "0.01" : "1"}
            onChange={(value) => patchActive({ pet: { ...profile.pet, stats: { ...profile.pet.stats, [key]: value } } })}
            source={fieldSource(`pet.stats.${key}`)}
          />
        ))}
      </div>
      <label className="profile-field profile-field-wide">
        <span className="profile-field-labelrow">
          <span>Pet Notes</span>
          <FieldSourceChip source={fieldSource("pet.notes")} />
        </span>
        <textarea className="control-input" value={profile.pet.notes} placeholder="Optional notes from screenshots or manual checks..." onChange={(event) => updateNested("pet", "notes", event.target.value)} />
      </label>
    </section>
  );
}
