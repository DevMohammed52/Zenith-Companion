export const VIAL_COSTS: Record<string, number> = {
    "Cheap Vial": 5,
    "Cheap Crystal": 5,
    "Tarnished Vial": 10,
    "Tarnished Crystal": 10,
    "Gleaming Vial": 50,
    "Gleaming Crystal": 50,
    "Elemental Vial": 200,
    "Elemental Crystal": 200,
    "Eldritch Vial": 500,
    "Eldritch Crystal": 500,
    "Arcane Vial": 2500,
    "Arcane Crystal": 2500
};

export interface Recipe {
    level: number;
    time: number;
    vial: string;
    materials: Record<string, number>;
}

export const ALCHEMY_ITEMS: Record<string, Recipe> = {
    "Yggdrasil Essence Crystal": {"level": 52, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Goblin Crown": 1, "Bone Fragment": 20}},
    "Earthcore Essence Crystal": {"level": 55, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Ivory": 6, "Parchment": 6}},
    "Riverbend Essence Crystal": {"level": 60, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Polar Bear Pelt": 20, "Djinn's Bottle": 30}},
    "Tampering Essence Crystal": {"level": 62, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Snakes Head": 30, "Golem Core Fragment": 25}},
    "Shieldbearer's Infusion": {"level": 65, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Elk Antler": 9, "Siren's Soulstone": 8}},
    "Unyielding Fortitude": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Snakes Head": 15, "Enigmatic Stone": 15}},
    "Lightning Sprint": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Goblin Pouch": 15, "Broken Dwarven Plate": 7}},
    "Twinstrike Elixir": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Dwarven Whetstone": 35, "Cursed Blade Fragment": 25}},
    "Stoneheart Solution": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Raccoon Fur": 10, "Goblin Scraps": 10}},
    "Frenzy Potion": {"level": 70, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Wolf Pelt": 14, "Goblin Totem": 60}},
    "Dragonblood Tonic": {"level": 80, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Lions Teeth": 25, "Minotaurs Horn": 25}},
    "Gourmet Essence": {"level": 80, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Elk Antler": 15, "Enigmatic Stone": 12}},
    "Wraithbane Essence": {"level": 80, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Moose Antler": 15, "Minotaur Hide": 20}},
    "Thunderfury Brew": {"level": 85, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Black Bear Pelt": 25, "Orb of Elemental Conjuring": 20}},
    "Cosmic Tear": {"level": 85, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Harpy's Wings": 40, "Air Elemental Essence": 12}}
};
