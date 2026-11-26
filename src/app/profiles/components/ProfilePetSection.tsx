"use client";

import React, { useMemo } from "react";
import type { CharacterProfile, ProfileFieldSource, ProfileOwnedPet, ProfileUpdateOptions } from "@/lib/profiles";
import type { PetDatabaseRecord } from "@/lib/profile-calculations";
import { GameImage } from "@/components/GameImage";
import QualityText from "@/components/QualityText";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TextArea } from "@/components/ui/TextArea";
import styles from "../Profiles.module.css";
import { ProfileNumberField, ProfilePicker, ProfileTextField, type PickerOption } from "./ProfileControls";

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

export function profilePetSnapshotKey(
  pet: Pick<CharacterProfile["pet"], "species" | "level" | "evolution">,
): string {
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
  const petOptions: Array<PickerOption<PetPickerValue>> = useMemo(
    () => [
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
          subtitle: `${sourceLabel} · ${ownedPet.species} · Lv. ${ownedPet.level || 1} · Evo ${ownedPet.evolution || 0}`,
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
          ]
            .filter(Boolean)
            .join(" "),
          value: { kind: "owned", pet: ownedPet } as PetPickerValue,
        };
      }),
      ...pets.map((pet) => ({
        id: `db-${pet.name}`,
        title: pet.name,
        subtitle: (
          <>
            <QualityText value={pet.quality || "UNKNOWN"}>{pet.quality || "UNKNOWN"}</QualityText>
            {pet.acquisition?.[0]?.boss ? ` · ${pet.acquisition[0].boss}` : ""}
          </>
        ),
        image: pet.imageUrl,
        badge: <QualityText value={pet.quality}>{pet.quality}</QualityText>,
        searchText: `${pet.name} ${pet.quality} ${pet.acquisition?.map((entry) => `${entry.boss} ${entry.location}`).join(" ")}`,
        value: { kind: "database", pet } as PetPickerValue,
      })),
    ],
    [petByName, pets, profile?.ownedPets],
  );

  const selectedPetOption = selectedOwnedPet
    ? petOptions.find((option) => option.id === `owned-${selectedOwnedPet.id}`)
    : selectedPet
      ? petOptions.find((option) => option.id === `db-${selectedPet.name}`)
      : petOptions[0];

  const previewImageUrl = selectedOwnedPet?.imageUrl || selectedPet?.imageUrl;
  const previewSpecies = selectedOwnedPet?.species || selectedPet?.name;

  return (
    <section id="profile-pet" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Companion Pet</h2>
          <p>Select a pet from the Pet Database or imported roster, then configure level, evolution, or stats.</p>
        </div>
        <Badge variant="neutral" size="md" icon={<Icon name="pets" size="xs" aria-hidden="true" />}>
          +{petMasteryBonus}% Pet Mastery stats
        </Badge>
      </div>

      <div className={styles.gridFour}>
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
        <ProfileTextField
          label="Quality"
          value={profile.pet.quality}
          onChange={(value) => updateNested("pet", "quality", value)}
          placeholder="Select a pet"
          source={fieldSource("pet.quality")}
        />
        <ProfileNumberField
          label="Pet Level"
          value={profile.pet.level}
          min={1}
          max={100}
          onChange={(value) => updatePetFormula({ level: value })}
          source={fieldSource("pet.level")}
        />
        <ProfileNumberField
          label="Evolution Level"
          value={profile.pet.evolution}
          min={0}
          max={5}
          onChange={(value) => updatePetFormula({ evolution: value })}
          source={fieldSource("pet.evolution")}
        />
      </div>

      {(selectedOwnedPet || selectedPet) && (
        <div className={styles.selectedCard}>
          <div className={styles.selectedCardMain}>
            {previewImageUrl && (
              <GameImage
                src={previewImageUrl}
                alt=""
                width={56}
                height={56}
                className={`${styles.selectedCardThumb} ${
                  previewSpecies === "Dead Wyrmshadow" ? styles.imageUpsideDown : ""
                }`.trim()}
              />
            )}
            <div className={styles.selectedCardCopy}>
              <strong>{selectedOwnedPet?.nickname || selectedOwnedPet?.species || selectedPet?.name}</strong>
              <p>
                {selectedOwnedPet ? (
                  <>
                    <QualityText value={selectedOwnedPet.quality || "UNKNOWN"}>
                      {selectedOwnedPet.quality || "Unknown quality"}
                    </QualityText>{" "}
                    · {selectedOwnedPet.source === "imported" ? "Imported owned snapshot" : "Owned snapshot"}
                  </>
                ) : (
                  <>
                    <QualityText value={selectedPet?.quality || "UNKNOWN"}>
                      {selectedPet?.quality || "Unknown quality"}
                    </QualityText>{" "}
                    · {selectedPet?.acquisition?.[0]?.boss || "Pet Database"}
                  </>
                )}
              </p>
              <small>
                {PET_STAT_FIELDS.slice(0, 6)
                  .map(([key, label]) => `${label}: ${profile.pet.stats[key] || 0}`)
                  .join(" · ")}
              </small>
            </div>
          </div>
        </div>
      )}

      <div className={styles.subHeading} style={{ marginTop: "1rem", paddingTop: "1rem" }}>
        <div>
          <h3>Pet Stat Totals</h3>
          <p>Computed from species growth and Pet Mastery, or editable manually.</p>
        </div>
      </div>

      <div className={styles.gridFour} style={{ marginBottom: "1rem" }}>
        {PET_STAT_FIELDS.map(([key, label]) => (
          <ProfileNumberField
            key={key}
            label={label}
            value={profile.pet.stats[key]}
            step={key === "movementSpeed" || key === "criticalDamage" || key === "criticalChance" ? "0.01" : "1"}
            onChange={(value) =>
              patchActive({ pet: { ...profile.pet, stats: { ...profile.pet.stats, [key]: value } } })
            }
            source={fieldSource(`pet.stats.${key}`)}
          />
        ))}
      </div>

      <TextArea
        label="Pet Notes"
        minRows={3}
        value={profile.pet.notes}
        placeholder="Optional notes from screenshots or manual checks..."
        onChange={(event) => updateNested("pet", "notes", event.target.value)}
      />
    </section>
  );
}
