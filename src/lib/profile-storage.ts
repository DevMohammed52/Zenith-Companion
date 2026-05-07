export const NO_PROFILE_STORAGE_SCOPE = "no-profile";

export function getProfileStorageScope(profileId?: string | null) {
  return profileId || NO_PROFILE_STORAGE_SCOPE;
}

export function getProfileStorageKey(baseKey: string, profileId?: string | null) {
  return `${baseKey}__profile__${getProfileStorageScope(profileId)}`;
}

