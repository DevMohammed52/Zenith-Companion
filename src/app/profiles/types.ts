export const PROFILE_SECTIONS = [
  ["identity", "Identity"],
  ["levels", "Levels"],
  ["combat", "Combat"],
  ["magic", "Magic"],
  ["pet", "Pet"],
  ["gear", "Gear"],
  ["housing", "Housing"],
  ["transfer", "Import"],
] as const;

export type ProfileSectionId = typeof PROFILE_SECTIONS[number][0];
export const PROFILE_SECTION_IDS = new Set<ProfileSectionId>(PROFILE_SECTIONS.map(([id]) => id));
export const PROFILE_BACKUP_HASH = "#profile-backup";
