export const BOSS_SCHEDULES: Record<string, { respawnHours: number; lengthSeconds: number }> = {
    "Isadora": { respawnHours: 8, lengthSeconds: 600 },
    "Malgazar": { respawnHours: 9, lengthSeconds: 700 },
    "Obsidianus": { respawnHours: 10, lengthSeconds: 800 },
    "Shadowmire": { respawnHours: 11, lengthSeconds: 900 },
    "Rogoth": { respawnHours: 12, lengthSeconds: 1000 },
    "Petrok the Guardian": { respawnHours: 13, lengthSeconds: 1100 },
    "Lurka Stonefist": { respawnHours: 14, lengthSeconds: 1200 },
    "Nethrax": { respawnHours: 15, lengthSeconds: 1300 },
    "Skarn the Dreadwake": { respawnHours: 16, lengthSeconds: 1400 },
    "Voragor": { respawnHours: 18, lengthSeconds: 1500 },
    "Thal'guth": { respawnHours: 18, lengthSeconds: 1700 }
};

export const EVENT_BOSSES = [
    { name: "Voloris", level: 10, experience: 500, location: { name: "Yulewood Glades" }, event: "Yule Fest", respawnHours: 3.5, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Altair", level: 10, experience: 500, location: { name: "Springtide Fair" }, event: "Springtide Fair", respawnHours: 3.5, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Noctarok", level: 10, experience: 500, location: { name: "Moonlit Valley" }, event: "Mootlit Festival", respawnHours: 3.5, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Wickerjack", level: 10, experience: 500, location: { name: "Wraithwood Forest" }, event: "Eve of Shadows", respawnHours: 3.5, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Mortem", level: 60, experience: 3000, location: { name: "Wraithwood Forest" }, event: "Eve of Shadows", respawnHours: 7, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Glacivor", level: 60, experience: 3000, location: { name: "Yulewood Glades" }, event: "Yule Fest", respawnHours: 7, lengthSeconds: 80, isEvent: true, loot: [] },
    { name: "Blightbloom", level: 60, experience: 3000, location: { name: "Springtide Fair" }, event: "Springtide Fair", respawnHours: 7, lengthSeconds: 80, isEvent: true, loot: [] }
];

export const EVENT_DUNGEONS = [
    { name: "Winter Wonderland", level_required: 25, location: { name: "Yulewood Glades" }, cost: 1500, length: 3600000, isEvent: true, loot: [] },
    { name: "Springtide Keep", level_required: 25, location: { name: "Springtide Fair" }, cost: 1500, length: 3600000, isEvent: true, loot: [] },
    { name: "Silverleaf Enclave", level_required: 25, location: { name: "Moonlit Valley" }, cost: 1500, length: 3600000, isEvent: true, loot: [] },
    { name: "Pumpkin Hollow", level_required: 25, location: { name: "Wraithwood Forest" }, cost: 1500, length: 3600000, isEvent: true, loot: [] },
    { name: "Wickedroot Patch", level_required: 50, location: { name: "Wraithwood Forest" }, cost: 4000, length: 3600000, isEvent: true, loot: [] },
    { name: "Snowbound Forest", level_required: 50, location: { name: "Yulewood Glades" }, cost: 4000, length: 3600000, isEvent: true, loot: [] },
    { name: "Garden of Grief", level_required: 50, location: { name: "Springtide Fair" }, cost: 4000, length: 3600000, isEvent: true, loot: [] },
    { name: "Stone Hollow", level_required: 50, location: { name: "Moonlit Valley" }, cost: 4000, length: 3600000, isEvent: true, loot: [] }
];
