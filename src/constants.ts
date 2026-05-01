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
    // Level 1-10
    "Battle Potion": {"level": 1, "time": 136.4, "vial": "Cheap Vial", "materials": {"Lucky Rabbit Foot": 2}},
    "Lumberjack Essence Crystal": {"level": 2, "time": 136.4, "vial": "Cheap Crystal", "materials": {"Goblin Totem": 6}},
    "Miners Essence Crystal": {"level": 3, "time": 136.4, "vial": "Cheap Crystal", "materials": {"Ducks Mouth": 2}},
    "Anglers Essence Crystal": {"level": 4, "time": 136.4, "vial": "Cheap Crystal", "materials": {"Boar Tusk": 1}},
    "Smelting Essence Crystal": {"level": 5, "time": 136.4, "vial": "Cheap Crystal", "materials": {"Goblin Pouch": 3}},
    "Chefs Essence Crystal": {"level": 6, "time": 136.4, "vial": "Elemental Crystal", "materials": {"Goblin Scraps": 2}},
    "Dungeon Potion": {"level": 10, "time": 318.2, "vial": "Cheap Vial", "materials": {"Goblin Crown": 1}},
    "Timberfall Essence Crystal": {"level": 10, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Deer Antler": 5}},

    // Level 12-20
    "Rocksplitter Essence Crystal": {"level": 12, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Cursed Talisman": 5}},
    "Deepsea Essence Crystal": {"level": 13, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Ruined Robes": 10}},
    "Bastion Essence": {"level": 15, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Boar Tusk": 2}},
    "Falcon's Grace Essence": {"level": 15, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Snakes Head": 10}},
    "Galeforce Speed Essence": {"level": 15, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Forbidden Tome": 2}},
    "Herculean Strength Essence": {"level": 15, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Goblin Crown": 1}},
    "Hammerfell Essence Crystal": {"level": 15, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Snakes Head": 12}},
    "Flavorburst Essence Crystal": {"level": 17, "time": 318.2, "vial": "Tarnished Crystal", "materials": {"Snakes Head": 5, "Venom Extract": 1}},
    "Protection Potion": {"level": 20, "time": 600, "vial": "Gleaming Vial", "materials": {"Raw Onion": 13}},
    "Felling Essence Crystal": {"level": 20, "time": 600, "vial": "Gleaming Crystal", "materials": {"Djinn's Bottle": 23}},

    // Level 25-30
    "Attack Power Potion": {"level": 25, "time": 600, "vial": "Gleaming Vial", "materials": {"Slime Extract": 20, "Raw Onion": 5}},
    "Merfolk Essence Crystal": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Chest of Scraps": 12}},
    "Precision Essence": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Bone Fragment": 30}},
    "Quickstep Essence": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Pirates Code": 4, "Chest of Scraps": 5}},
    "Fortified Essence": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Buffalo Horn": 8}},
    "Titan Power Essence": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Slime Extract": 38}},
    "Oreseeker Essence Crystal": {"level": 25, "time": 600, "vial": "Gleaming Crystal", "materials": {"Swamp Juice": 12}},
    "Molten Core Essence Crystal": {"level": 27, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Long Forgotten Necklace": 38}},
    "Vortex Brew": {"level": 28, "time": 818.2, "vial": "Elemental Vial", "materials": {"Djinn's Bottle": 18, "Venom Extract": 1}},
    "Spicefinder Essence Crystal": {"level": 30, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Umbral Claw": 11}},

    // Level 35-50
    "Bulwark Brew": {"level": 35, "time": 818.2, "vial": "Elemental Vial", "materials": {"Goblin Scraps": 3, "Slime Extract": 20}},
    "Bladeburst Elixir": {"level": 35, "time": 818.2, "vial": "Elemental Vial", "materials": {"Goblin Crown": 1, "Siren's Scales": 4}},
    "Ironclad Essence": {"level": 40, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Goblin Totem": 12, "Goblin Crown": 1}},
    "Acrobatic's Essence": {"level": 45, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Moose Antler": 10}},
    "Strike Essence": {"level": 45, "time": 818.2, "vial": "Elemental Vial", "materials": {"Siren's Soulstone": 6}},
    "Impenetrable Essence": {"level": 45, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Goblin Totem": 7, "Goblin Pouch": 9}},
    "Windrider Essence": {"level": 45, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Elk Antler": 9}},
    "Dungeon Master's Tonic": {"level": 50, "time": 818.2, "vial": "Elemental Vial", "materials": {"Lions Teeth": 11}},

    // Level 52-70
    "Yggdrasil Essence Crystal": {"level": 52, "time": 818.2, "vial": "Elemental Crystal", "materials": {"Goblin Crown": 1, "Bone Fragment": 20}},
    "Earthcore Essence Crystal": {"level": 55, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Ivory": 6, "Parchment": 6}},
    "Riverbend Essence Crystal": {"level": 60, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Polar Bear Pelt": 20, "Djinn's Bottle": 30}},
    "Tampering Essence Crystal": {"level": 62, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Snakes Head": 30, "Golem Core Fragment": 25}},
    "Shieldbearer's Infusion": {"level": 65, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Elk Antler": 9, "Siren's Soulstone": 8}},
    "Unyielding Fortitude": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Snakes Head": 15, "Enigmatic Stone": 15}},
    "Lightning Sprint": {"level": 65, "time": 1090.9, "vial": "Elemental Crystal", "materials": {"Goblin Pouch": 15, "Broken Dwarven Plate": 7}},
    "Twinstrike Elixir": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Dwarven Whetstone": 35, "Cursed Blade Fragment": 25}},
    "Stoneheart Solution": {"level": 65, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Raccoon Fur": 10, "Goblin Scraps": 10}},
    "Frenzy Potion": {"level": 70, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Wolf Pelt": 14, "Goblin Totem": 60}},

    // Level 80-85
    "Dragonblood Tonic": {"level": 80, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Lions Teeth": 25, "Minotaurs Horn": 25}},
    "Gourmet Essence": {"level": 80, "time": 1090.9, "vial": "Eldritch Crystal", "materials": {"Elk Antler": 15, "Enigmatic Stone": 12}},
    "Wraithbane Essence": {"level": 80, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Moose Antler": 15, "Minotaur Hide": 20}},
    "Thunderfury Brew": {"level": 85, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Black Bear Pelt": 25, "Orb of Elemental Conjuring": 20}},
    "Cosmic Tear": {"level": 85, "time": 1090.9, "vial": "Eldritch Vial", "materials": {"Harpy's Wings": 40, "Air Elemental Essence": 12}}
};
