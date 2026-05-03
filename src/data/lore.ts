export type LoreCategory = 'Index' | 'Overview' | 'Civilization' | 'World' | 'Concept' | 'Artifact' | 'Bestiary' | 'NPC';

export type LoreSection = { title: string; body: string };

export type LoreEntry = {
  id: string;
  title: string;
  category: LoreCategory;
  summary: string;
  sourceUrl: string;
  sourcePath: string;
  tags: string[];
  relatedIds: string[];
  sections: LoreSection[];
  keyFacts: string[];
  timelineMarkers: string[];
};

export type LoreRelation = {
  source: string;
  target: string;
  type: string;
  confidence: 'canon' | 'inferred' | 'theory';
  evidence: string;
};

export type LoreTheory = {
  id: string;
  title: string;
  premise: string;
  evidenceIds: string[];
  counterpoints: string[];
  speculationLevel: 'Low' | 'Medium' | 'High';
};

export type LoreTimelineEvent = {
  id: string;
  era: string;
  title: string;
  summary: string;
  entryIds: string[];
};

export type LoreItemLink = {
  itemName: string;
  entryIds: string[];
  reason: string;
  confidence: 'canon' | 'inferred' | 'theory';
};

export const LORE_ENTRIES = [
  {
    "id": "index",
    "title": "Lore",
    "category": "Index",
    "summary": "The master archive for the Chronicles of Valaron, gathering artifacts, creatures, civilizations, concepts, characters, and world history into one canon index.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/",
    "sourcePath": "/lore",
    "tags": [
      "Index",
      "Artifacts",
      "Bestiary",
      "Civilizations",
      "Concepts",
      "NPCs"
    ],
    "relatedIds": [
      "artifacts",
      "bestiary",
      "civilizations",
      "concepts",
      "npcs",
      "overview",
      "the-world",
      "world"
    ],
    "sections": [
      {
        "title": "Archive scope",
        "body": "The official Lore index groups Valaron's records into artifacts, creatures, civilizations, concepts, NPCs, overview material, and world history so the atlas can track each branch back to its source."
      }
    ],
    "keyFacts": [
      "Connected records: Artifacts, Bestiary, Civilizations, Concepts, NPCs, Lore Overview, The World, World."
    ],
    "timelineMarkers": []
  },
  {
    "id": "artifacts",
    "title": "Artifacts",
    "category": "Index",
    "summary": "A gateway into the Artifacts archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/artifacts/",
    "sourcePath": "/lore/artifacts",
    "tags": [
      "Index",
      "The Runemark of Eternity"
    ],
    "relatedIds": [
      "artifacts-the-runemark-of-eternity"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Powerful objects of legend."
      }
    ],
    "keyFacts": [
      "Index signal: Powerful objects of legend.",
      "Connected records: The Runemark of Eternity."
    ],
    "timelineMarkers": []
  },
  {
    "id": "artifacts-the-runemark-of-eternity",
    "title": "The Runemark of Eternity",
    "category": "Artifact",
    "summary": "A artifact record in Edric's archive centered on The Runemark of Eternity. The index frames this thread as ancient artifact powering the Citadel. It cross-references The Citadel, The Ancients, Arvendor. Its official sections focus on Overview, History, Function.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/artifacts/the-runemark-of-eternity",
    "sourcePath": "/lore/artifacts/the-runemark-of-eternity",
    "tags": [
      "Artifact",
      "The Citadel",
      "The Ancients",
      "Arvendor",
      "Key Historical Events",
      "Overview",
      "History",
      "Function"
    ],
    "relatedIds": [
      "world-the-citadel",
      "civilizations-the-ancients",
      "civilizations-arvendor",
      "world-history"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "History",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "Function",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "Location",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "The Sacrifice",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events. Date markers: 8,700 AR."
      },
      {
        "title": "Mystery",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      },
      {
        "title": "Trivia",
        "body": "Connected names: The Citadel, The Ancients, Arvendor, Key Historical Events."
      }
    ],
    "keyFacts": [
      "Index signal: Ancient artifact powering the Citadel.",
      "Source sections: Overview, History, Function, Location, The Sacrifice.",
      "Connected records: The Citadel, The Ancients, Arvendor, Key Historical Events."
    ],
    "timelineMarkers": []
  },
  {
    "id": "bestiary",
    "title": "Bestiary",
    "category": "Index",
    "summary": "A gateway into the Bestiary archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/bestiary/",
    "sourcePath": "/lore/bestiary",
    "tags": [
      "Index",
      "Kikimoras",
      "The Sirens"
    ],
    "relatedIds": [
      "bestiary-kikimoras",
      "bestiary-sirens"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Creatures and monsters."
      }
    ],
    "keyFacts": [
      "Index signal: Creatures and monsters.",
      "Connected records: Kikimoras, The Sirens."
    ],
    "timelineMarkers": []
  },
  {
    "id": "bestiary-kikimoras",
    "title": "Kikimoras",
    "category": "Bestiary",
    "summary": "A bestiary record in Edric's archive centered on Kikimoras. The index frames this thread as ancient house spirits of the crypts. It cross-references The Citadel, The Runemark of Eternity, Arvendor. Its official sections focus on Overview, History, Behaviour.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/bestiary/kikimoras",
    "sourcePath": "/lore/bestiary/kikimoras",
    "tags": [
      "Bestiary",
      "The Citadel",
      "The Runemark of Eternity",
      "Arvendor",
      "Overview",
      "History",
      "Behaviour"
    ],
    "relatedIds": [
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity",
      "civilizations-arvendor"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "History",
        "body": "Connected names: The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "Behaviour",
        "body": "Connected names: The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "Significance",
        "body": "Connected names: The Citadel, The Runemark of Eternity, Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: Ancient house spirits of the crypts.",
      "Source sections: Overview, History, Behaviour, Significance.",
      "Connected records: The Citadel, The Runemark of Eternity, Arvendor."
    ],
    "timelineMarkers": []
  },
  {
    "id": "bestiary-sirens",
    "title": "The Sirens",
    "category": "Bestiary",
    "summary": "A bestiary record in Edric's archive centered on The Sirens. The index frames this thread as sirens Haunting creatures of the deep waters. It cross-references Solaris Isle, Ravenna. Its official sections focus on Overview, History, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/bestiary/sirens",
    "sourcePath": "/lore/bestiary/sirens",
    "tags": [
      "Bestiary",
      "Solaris Isle",
      "Ravenna",
      "Overview",
      "History",
      "Nature"
    ],
    "relatedIds": [
      "world-solaris-isle",
      "npcs-ravenna"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Solaris Isle, Ravenna."
      },
      {
        "title": "History",
        "body": "Connected names: Solaris Isle, Ravenna."
      },
      {
        "title": "Nature",
        "body": "Connected names: Solaris Isle, Ravenna."
      }
    ],
    "keyFacts": [
      "Index signal: Sirens Haunting creatures of the deep waters.",
      "Source sections: Overview, History, Nature.",
      "Connected records: Solaris Isle, Ravenna."
    ],
    "timelineMarkers": []
  },
  {
    "id": "civilizations",
    "title": "Civilizations",
    "category": "Index",
    "summary": "A gateway into the Civilizations archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations",
    "sourcePath": "/lore/civilizations",
    "tags": [
      "Index",
      "Arvendor",
      "Eldorian",
      "Mokthar",
      "Oakenra",
      "Ombric"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "civilizations-eldorian",
      "civilizations-mokthar",
      "civilizations-oakenra",
      "civilizations-ombric",
      "civilizations-other-civilisations",
      "civilizations-the-ancients",
      "civilizations-the-first-people"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: An overview of the major civilizations that shape the world."
      }
    ],
    "keyFacts": [
      "Index signal: An overview of the major civilizations that shape the world.",
      "Connected records: Arvendor, Eldorian, Mokthar, Oakenra, Ombric, Other Civilisations of Valaron, The Ancients, The First People."
    ],
    "timelineMarkers": []
  },
  {
    "id": "civilizations-arvendor",
    "title": "Arvendor",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Arvendor. The index frames this thread as divine-blooded people of the floating Citadel. It cross-references The Citadel, Key Historical Events, Valaron. Its official sections focus on Overview, History, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/arvendor",
    "sourcePath": "/lore/civilizations/arvendor",
    "tags": [
      "Civilization",
      "The Citadel",
      "Key Historical Events",
      "Valaron",
      "The Ancients",
      "Ombric",
      "Overview",
      "History",
      "Nature"
    ],
    "relatedIds": [
      "world-the-citadel",
      "world-history",
      "world-valaron",
      "civilizations-the-ancients",
      "civilizations-ombric",
      "artifacts-the-runemark-of-eternity",
      "npcs-mahol"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The Citadel, Key Historical Events, Valaron, The Ancients, Ombric, The Runemark of Eternity."
      },
      {
        "title": "History",
        "body": "Connected names: The Citadel, Key Historical Events, Valaron, The Ancients, Ombric, The Runemark of Eternity. Date markers: 200 BR, 870."
      },
      {
        "title": "Nature",
        "body": "Connected names: The Citadel, Key Historical Events, Valaron, The Ancients, Ombric, The Runemark of Eternity."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: The Citadel, Key Historical Events, Valaron, The Ancients, Ombric, The Runemark of Eternity."
      }
    ],
    "keyFacts": [
      "Index signal: Divine-blooded people of the floating Citadel.",
      "Source sections: Overview, History, Nature, Philosophy.",
      "Date markers found: 200 BR, 870.",
      "Connected records: The Citadel, Key Historical Events, Valaron, The Ancients, Ombric, The Runemark of Eternity, Mahol."
    ],
    "timelineMarkers": [
      "200 BR",
      "870"
    ]
  },
  {
    "id": "civilizations-eldorian",
    "title": "Eldorian",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Eldorian. The index frames this thread as ambitious empire of Solaris Isle. It cross-references Solaris Isle, Valaron, Key Historical Events. Its official sections focus on Overview, Philosophy, History.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/eldorian",
    "sourcePath": "/lore/civilizations/eldorian",
    "tags": [
      "Civilization",
      "Solaris Isle",
      "Valaron",
      "Key Historical Events",
      "Arvendor",
      "Overview",
      "Philosophy",
      "History"
    ],
    "relatedIds": [
      "world-solaris-isle",
      "world-valaron",
      "world-history",
      "civilizations-arvendor"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Solaris Isle, Valaron, Key Historical Events, Arvendor."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Solaris Isle, Valaron, Key Historical Events, Arvendor."
      },
      {
        "title": "History",
        "body": "Connected names: Solaris Isle, Valaron, Key Historical Events, Arvendor."
      },
      {
        "title": "Alliances",
        "body": "Connected names: Solaris Isle, Valaron, Key Historical Events, Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: Ambitious empire of Solaris Isle.",
      "Source sections: Overview, Philosophy, History, Alliances.",
      "Connected records: Solaris Isle, Valaron, Key Historical Events, Arvendor."
    ],
    "timelineMarkers": []
  },
  {
    "id": "civilizations-mokthar",
    "title": "Mokthar",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Mokthar. The index frames this thread as warrior civilization of orcs in Ardenfell. It cross-references Key Historical Events, Valaron, Solaris Isle. Its official sections focus on Overview, History, Perception.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/mokthar",
    "sourcePath": "/lore/civilizations/mokthar",
    "tags": [
      "Civilization",
      "Key Historical Events",
      "Valaron",
      "Solaris Isle",
      "Overview",
      "History",
      "Perception"
    ],
    "relatedIds": [
      "world-history",
      "world-valaron",
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Key Historical Events, Valaron, Solaris Isle."
      },
      {
        "title": "History",
        "body": "Connected names: Key Historical Events, Valaron, Solaris Isle. Date markers: 500."
      },
      {
        "title": "Perception",
        "body": "Connected names: Key Historical Events, Valaron, Solaris Isle."
      },
      {
        "title": "Recent Developments",
        "body": "Connected names: Key Historical Events, Valaron, Solaris Isle."
      }
    ],
    "keyFacts": [
      "Index signal: Warrior civilization of orcs in Ardenfell.",
      "Source sections: Overview, History, Perception, Recent Developments.",
      "Date markers found: 500.",
      "Connected records: Key Historical Events, Valaron, Solaris Isle."
    ],
    "timelineMarkers": [
      "500"
    ]
  },
  {
    "id": "civilizations-oakenra",
    "title": "Oakenra",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Oakenra. The index frames this thread as ancient tree-like beings of wisdom and age. It cross-references Key Historical Events, Oakrum, Gleamara. Its official sections focus on Overview, History, Council.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/oakenra",
    "sourcePath": "/lore/civilizations/oakenra",
    "tags": [
      "Civilization",
      "Key Historical Events",
      "Oakrum",
      "Gleamara",
      "Oilegeist",
      "Onroth",
      "Overview",
      "History",
      "Council"
    ],
    "relatedIds": [
      "world-history",
      "npcs-oakrum",
      "npcs-gleamara",
      "npcs-oilegeist",
      "npcs-onroth",
      "npcs-thorgarr"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Key Historical Events, Oakrum, Gleamara, Oilegeist, Onroth, Thorgarr."
      },
      {
        "title": "History",
        "body": "Connected names: Key Historical Events, Oakrum, Gleamara, Oilegeist, Onroth, Thorgarr. Date markers: 25,000 BR."
      },
      {
        "title": "Council",
        "body": "Connected names: Key Historical Events, Oakrum, Gleamara, Oilegeist, Onroth, Thorgarr."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Key Historical Events, Oakrum, Gleamara, Oilegeist, Onroth, Thorgarr."
      }
    ],
    "keyFacts": [
      "Index signal: Ancient tree-like beings of wisdom and age.",
      "Source sections: Overview, History, Council, Philosophy.",
      "Date markers found: 25,000 BR.",
      "Connected records: Key Historical Events, Oakrum, Gleamara, Oilegeist, Onroth, Thorgarr."
    ],
    "timelineMarkers": [
      "25,000 BR"
    ]
  },
  {
    "id": "civilizations-ombric",
    "title": "Ombric",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Ombric. The index frames this thread as exiled Arvendor, now denizens of the underworld. It cross-references Arvendor, Key Historical Events, Ravenna. Its official sections focus on Overview, History, Recent Developments.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/ombric",
    "sourcePath": "/lore/civilizations/ombric",
    "tags": [
      "Civilization",
      "Arvendor",
      "Key Historical Events",
      "Ravenna",
      "Astaroth",
      "The Runemark of Eternity",
      "Overview",
      "History",
      "Recent Developments"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "world-history",
      "npcs-ravenna",
      "npcs-astaroth",
      "artifacts-the-runemark-of-eternity",
      "npcs-oilegeist",
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor, Key Historical Events, Ravenna, Astaroth, The Runemark of Eternity, Oilegeist. Date markers: 320."
      },
      {
        "title": "History",
        "body": "Connected names: Arvendor, Key Historical Events, Ravenna, Astaroth, The Runemark of Eternity, Oilegeist. Date markers: 320, 8,700 AR."
      },
      {
        "title": "Recent Developments",
        "body": "Connected names: Arvendor, Key Historical Events, Ravenna, Astaroth, The Runemark of Eternity, Oilegeist."
      }
    ],
    "keyFacts": [
      "Index signal: Exiled Arvendor, now denizens of the underworld.",
      "Source sections: Overview, History, Recent Developments.",
      "Date markers found: 320.",
      "Connected records: Arvendor, Key Historical Events, Ravenna, Astaroth, The Runemark of Eternity, Oilegeist, Solaris Isle."
    ],
    "timelineMarkers": [
      "320"
    ]
  },
  {
    "id": "civilizations-other-civilisations",
    "title": "Other Civilisations of Valaron",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on Other Civilisations of Valaron. The index frames this thread as other Civilisations Diverse peoples across Valaron. It cross-references Valaron, Solaris Isle.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/other-civilisations",
    "sourcePath": "/lore/civilizations/other-civilisations",
    "tags": [
      "Civilization",
      "Valaron",
      "Solaris Isle"
    ],
    "relatedIds": [
      "world-valaron",
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Other Civilisations Diverse peoples across Valaron."
      }
    ],
    "keyFacts": [
      "Index signal: Other Civilisations Diverse peoples across Valaron.",
      "Connected records: Valaron, Solaris Isle."
    ],
    "timelineMarkers": []
  },
  {
    "id": "civilizations-the-ancients",
    "title": "The Ancients",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on The Ancients. The index frames this thread as '. It cross-references The First People, Key Historical Events, The Supreme One. Its official sections focus on Overview, Origin and Nature, Legacy.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/the-ancients",
    "sourcePath": "/lore/civilizations/the-ancients",
    "tags": [
      "Civilization",
      "The First People",
      "Key Historical Events",
      "The Supreme One",
      "The Citadel",
      "The Runemark of Eternity",
      "Overview",
      "Origin and Nature",
      "Legacy"
    ],
    "relatedIds": [
      "civilizations-the-first-people",
      "world-history",
      "npcs-the-supreme-one",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity",
      "civilizations-arvendor",
      "npcs-mahol"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor. Date markers: 10,000,000 BR."
      },
      {
        "title": "Origin and Nature",
        "body": "Connected names: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "Legacy",
        "body": "Connected names: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "Mahol",
        "body": "Connected names: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: '.",
      "Source sections: Overview, Origin and Nature, Legacy, Mahol, Philosophy.",
      "Date markers found: 10,000,000 BR.",
      "Connected records: The First People, Key Historical Events, The Supreme One, The Citadel, The Runemark of Eternity, Arvendor, Mahol."
    ],
    "timelineMarkers": [
      "10,000,000 BR"
    ]
  },
  {
    "id": "civilizations-the-first-people",
    "title": "The First People",
    "category": "Civilization",
    "summary": "A civilization record in Edric's archive centered on The First People. The index frames this thread as earliest humans of the Age of Splendor. It cross-references Key Historical Events, Gods and Deities, Valaron. Its official sections focus on Overview, Life and Culture, Settlements.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/civilizations/the-first-people",
    "sourcePath": "/lore/civilizations/the-first-people",
    "tags": [
      "Civilization",
      "Key Historical Events",
      "Gods and Deities",
      "Valaron",
      "Solaris Isle",
      "Mahol",
      "Overview",
      "Life and Culture",
      "Settlements"
    ],
    "relatedIds": [
      "world-history",
      "concepts-gods-and-deities",
      "world-valaron",
      "world-solaris-isle",
      "npcs-mahol"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Key Historical Events, Gods and Deities, Valaron, Solaris Isle, Mahol."
      },
      {
        "title": "Life and Culture",
        "body": "Connected names: Key Historical Events, Gods and Deities, Valaron, Solaris Isle, Mahol."
      },
      {
        "title": "Settlements",
        "body": "Connected names: Key Historical Events, Gods and Deities, Valaron, Solaris Isle, Mahol."
      },
      {
        "title": "Legacy",
        "body": "Connected names: Key Historical Events, Gods and Deities, Valaron, Solaris Isle, Mahol."
      }
    ],
    "keyFacts": [
      "Index signal: Earliest humans of the Age of Splendor.",
      "Source sections: Overview, Life and Culture, Settlements, Legacy.",
      "Connected records: Key Historical Events, Gods and Deities, Valaron, Solaris Isle, Mahol."
    ],
    "timelineMarkers": []
  },
  {
    "id": "concepts",
    "title": "Concepts",
    "category": "Index",
    "summary": "A gateway into the Concepts archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/concepts/",
    "sourcePath": "/lore/concepts",
    "tags": [
      "Index",
      "The Colossal Serpent",
      "Cults",
      "Gods and Deities"
    ],
    "relatedIds": [
      "concepts-colossal-serpent",
      "concepts-cults",
      "concepts-gods-and-deities"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Fundamental concepts of the universe."
      }
    ],
    "keyFacts": [
      "Index signal: Fundamental concepts of the universe.",
      "Connected records: The Colossal Serpent, Cults, Gods and Deities."
    ],
    "timelineMarkers": []
  },
  {
    "id": "concepts-colossal-serpent",
    "title": "The Colossal Serpent",
    "category": "Concept",
    "summary": "A concept record in Edric's archive centered on The Colossal Serpent. The index frames this thread as a cosmic being containing all of reality. It cross-references Valaron. Its official sections focus on A Cosmic Being, The Eye Theory, Modern Worship.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/concepts/colossal-serpent",
    "sourcePath": "/lore/concepts/colossal-serpent",
    "tags": [
      "Concept",
      "Valaron",
      "A Cosmic Being",
      "The Eye Theory",
      "Modern Worship"
    ],
    "relatedIds": [
      "world-valaron"
    ],
    "sections": [
      {
        "title": "A Cosmic Being",
        "body": "Connected names: Valaron."
      },
      {
        "title": "The Eye Theory",
        "body": "Connected names: Valaron."
      },
      {
        "title": "Modern Worship",
        "body": "Connected names: Valaron."
      }
    ],
    "keyFacts": [
      "Index signal: A cosmic being containing all of reality.",
      "Source sections: A Cosmic Being, The Eye Theory, Modern Worship.",
      "Connected records: Valaron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "concepts-cults",
    "title": "Cults",
    "category": "Concept",
    "summary": "A concept record in Edric's archive centered on Cults. The index frames this thread as religious movements and organizations in Valaron. It cross-references The Celestial System of Valaron, Virel. Its official sections focus on The Lunar Vigil, Other Religious Movements.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/concepts/cults",
    "sourcePath": "/lore/concepts/cults",
    "tags": [
      "Concept",
      "The Celestial System of Valaron",
      "Virel",
      "The Lunar Vigil",
      "Other Religious Movements"
    ],
    "relatedIds": [
      "world-celestial-system",
      "npcs-virel"
    ],
    "sections": [
      {
        "title": "The Lunar Vigil",
        "body": "Connected names: The Celestial System of Valaron, Virel."
      },
      {
        "title": "Other Religious Movements",
        "body": "Connected names: The Celestial System of Valaron, Virel."
      }
    ],
    "keyFacts": [
      "Index signal: Religious movements and organizations in Valaron.",
      "Source sections: The Lunar Vigil, Other Religious Movements.",
      "Connected records: The Celestial System of Valaron, Virel."
    ],
    "timelineMarkers": []
  },
  {
    "id": "concepts-gods-and-deities",
    "title": "Gods and Deities",
    "category": "Concept",
    "summary": "A concept record in Edric's archive centered on Gods and Deities. The index frames this thread as old Gods. It cross-references Key Historical Events, Ebris, Gall'har. Its official sections focus on Old Gods, The New Gods.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/concepts/gods-and-deities",
    "sourcePath": "/lore/concepts/gods-and-deities",
    "tags": [
      "Concept",
      "Key Historical Events",
      "Ebris",
      "Gall'har",
      "Mortem",
      "O'lo",
      "Old Gods",
      "The New Gods"
    ],
    "relatedIds": [
      "world-history",
      "npcs-ebris",
      "npcs-gall-har",
      "npcs-mortem",
      "npcs-o-lo",
      "npcs-the-supreme-one"
    ],
    "sections": [
      {
        "title": "Old Gods",
        "body": "Connected names: Key Historical Events, Ebris, Gall'har, Mortem, O'lo, The Supreme One."
      },
      {
        "title": "The New Gods",
        "body": "Connected names: Key Historical Events, Ebris, Gall'har, Mortem, O'lo, The Supreme One."
      }
    ],
    "keyFacts": [
      "Index signal: Old Gods.",
      "Source sections: Old Gods, The New Gods.",
      "Connected records: Key Historical Events, Ebris, Gall'har, Mortem, O'lo, The Supreme One."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs",
    "title": "NPCs",
    "category": "Index",
    "summary": "A gateway into the NPCs archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs",
    "sourcePath": "/lore/npcs",
    "tags": [
      "Index",
      "Aelorid",
      "Ankhotep",
      "Aquiel",
      "Astaroth",
      "Brandor",
      "Chronar"
    ],
    "relatedIds": [
      "npcs-aelorid",
      "npcs-ankhotep",
      "npcs-aquiel",
      "npcs-astaroth",
      "npcs-brandor",
      "npcs-bronn",
      "npcs-celestria",
      "npcs-chronar",
      "npcs-divinus",
      "npcs-ebris",
      "npcs-edric",
      "npcs-elfina",
      "npcs-elfirma",
      "npcs-tritonis",
      "npcs-vorathis"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Meet the key figures and inhabitants of the world."
      }
    ],
    "keyFacts": [
      "Index signal: Meet the key figures and inhabitants of the world.",
      "Connected records: Aelorid, Ankhotep, Aquiel, Astaroth, Brandor, Bronn, Celestria, Chronar, Divinus, Tritonis, Vorathis."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-aelorid",
    "title": "Aelorid",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Aelorid. The index frames this thread as rosy Cloud Knight of Arvendor. It cross-references Arvendor. Its official sections focus on Overview, Skills and Abilities, Philosophy.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/aelorid",
    "sourcePath": "/lore/npcs/aelorid",
    "tags": [
      "NPC",
      "Arvendor",
      "Overview",
      "Skills and Abilities",
      "Philosophy"
    ],
    "relatedIds": [
      "civilizations-arvendor"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor."
      },
      {
        "title": "Skills and Abilities",
        "body": "Connected names: Arvendor."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: Rosy Cloud Knight of Arvendor.",
      "Source sections: Overview, Skills and Abilities, Philosophy.",
      "Connected records: Arvendor."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-ankhotep",
    "title": "Ankhotep",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Ankhotep. The index frames this thread as wise advisor from a far away land. It cross-references Solaris Isle. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/ankhotep",
    "sourcePath": "/lore/npcs/ankhotep",
    "tags": [
      "NPC",
      "Solaris Isle",
      "Overview"
    ],
    "relatedIds": [
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Solaris Isle."
      }
    ],
    "keyFacts": [
      "Index signal: Wise advisor from a far away land.",
      "Source sections: Overview.",
      "Connected records: Solaris Isle."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-aquiel",
    "title": "Aquiel",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Aquiel. The index frames this thread as chef and underwater explorer. Its official sections focus on Overview, Personality and Skills, Role.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/aquiel",
    "sourcePath": "/lore/npcs/aquiel",
    "tags": [
      "NPC",
      "Overview",
      "Personality and Skills",
      "Role"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Personality and Skills",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Role",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Chef and underwater explorer.",
      "Source sections: Overview, Personality and Skills, Role."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-astaroth",
    "title": "Astaroth",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Astaroth. The index frames this thread as royal wizard of the underworld. It cross-references Ombric, Oilegeist, Mahol. Its official sections focus on Overview, History, Goals and Ambitions.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/astaroth",
    "sourcePath": "/lore/npcs/astaroth",
    "tags": [
      "NPC",
      "Ombric",
      "Oilegeist",
      "Mahol",
      "Overview",
      "History",
      "Goals and Ambitions"
    ],
    "relatedIds": [
      "civilizations-ombric",
      "npcs-oilegeist",
      "npcs-mahol"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Ombric, Oilegeist, Mahol."
      },
      {
        "title": "History",
        "body": "Connected names: Ombric, Oilegeist, Mahol."
      },
      {
        "title": "Goals and Ambitions",
        "body": "Connected names: Ombric, Oilegeist, Mahol."
      }
    ],
    "keyFacts": [
      "Index signal: Royal wizard of the underworld.",
      "Source sections: Overview, History, Goals and Ambitions.",
      "Connected records: Ombric, Oilegeist, Mahol."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-brandor",
    "title": "Brandor",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Brandor. The index frames this thread as warrior and expedition cook. It cross-references Eryndeth. Its official sections focus on Overview, Background, Current Role.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/brandor",
    "sourcePath": "/lore/npcs/brandor",
    "tags": [
      "NPC",
      "Eryndeth",
      "Overview",
      "Background",
      "Current Role"
    ],
    "relatedIds": [
      "npcs-eryndeth"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Eryndeth."
      },
      {
        "title": "Background",
        "body": "Connected names: Eryndeth."
      },
      {
        "title": "Current Role",
        "body": "Connected names: Eryndeth."
      }
    ],
    "keyFacts": [
      "Index signal: Warrior and expedition cook.",
      "Source sections: Overview, Background, Current Role.",
      "Connected records: Eryndeth."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-bronn",
    "title": "Bronn",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Bronn. The index frames this thread as traveler and trader. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/bronn",
    "sourcePath": "/lore/npcs/bronn",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Traveler and trader.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-celestria",
    "title": "Celestria",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Celestria. The index frames this thread as guardian of peace. Its official sections focus on Overview, Background, Character.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/celestria",
    "sourcePath": "/lore/npcs/celestria",
    "tags": [
      "NPC",
      "Overview",
      "Background",
      "Character"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Background",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Character",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Guardian of peace.",
      "Source sections: Overview, Background, Character."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-chronar",
    "title": "Chronar",
    "category": "NPC",
    "summary": "A deity record in Edric's archive centered on Chronar, the forgotten god of time whose worship has nearly vanished from recorded memory while his quiet presence still lingers in the rhythm of time itself.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/chronar",
    "sourcePath": "/lore/npcs/chronar",
    "tags": [
      "NPC",
      "Gods and Deities",
      "Time",
      "Overview"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "world-history"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Chronar is identified as the god of time, mostly erased from popular memory but still implied to persist wherever time moves with patient inevitability."
      }
    ],
    "keyFacts": [
      "Index signal: God of Time.",
      "Source sections: Overview.",
      "Connected records: Gods and Deities, Key Historical Events."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-divinus",
    "title": "Divinus",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Divinus. The index frames this thread as loyal knight. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/divinus",
    "sourcePath": "/lore/npcs/divinus",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Loyal knight.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-ebris",
    "title": "Ebris",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Ebris. The index frames this thread as god of protection. Its official sections focus on Overview, Nature, Distinction.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/ebris",
    "sourcePath": "/lore/npcs/ebris",
    "tags": [
      "NPC",
      "Overview",
      "Nature",
      "Distinction"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Distinction",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: God of protection.",
      "Source sections: Overview, Nature, Distinction."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-edric",
    "title": "Edric",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Edric. The index frames this thread as arvendorian historian and lore chronicler. It cross-references Arvendor, Lore Overview. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/edric",
    "sourcePath": "/lore/npcs/edric",
    "tags": [
      "NPC",
      "Arvendor",
      "Lore Overview",
      "Overview"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "overview"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor, Lore Overview."
      }
    ],
    "keyFacts": [
      "Index signal: Arvendorian historian and lore chronicler.",
      "Source sections: Overview.",
      "Connected records: Arvendor, Lore Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-elfina",
    "title": "Elfina",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Elfina. The index frames this thread as cunning elf. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/elfina",
    "sourcePath": "/lore/npcs/elfina",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Cunning elf.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-elfirma",
    "title": "Elfirma",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Elfirma. The index frames this thread as valiant warrior. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/elfirma",
    "sourcePath": "/lore/npcs/elfirma",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Valiant warrior.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-eryndeth",
    "title": "Eryndeth",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Eryndeth. The index frames this thread as oakenra scholar and alchemist. It cross-references Oakenra, Gleamara. Its official sections focus on Overview, Work and Approach, Relationships.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/eryndeth",
    "sourcePath": "/lore/npcs/eryndeth",
    "tags": [
      "NPC",
      "Oakenra",
      "Gleamara",
      "Overview",
      "Work and Approach",
      "Relationships"
    ],
    "relatedIds": [
      "civilizations-oakenra",
      "npcs-gleamara"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Oakenra, Gleamara."
      },
      {
        "title": "Work and Approach",
        "body": "Connected names: Oakenra, Gleamara."
      },
      {
        "title": "Relationships",
        "body": "Connected names: Oakenra, Gleamara."
      }
    ],
    "keyFacts": [
      "Index signal: Oakenra scholar and alchemist.",
      "Source sections: Overview, Work and Approach, Relationships.",
      "Connected records: Oakenra, Gleamara."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-ezekiel",
    "title": "Ezekiel",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Ezekiel. The index frames this thread as captain of the Arvendor Guard. It cross-references Arvendor, Ombric. Its official sections focus on Overview, Expertise, Background.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/ezekiel",
    "sourcePath": "/lore/npcs/ezekiel",
    "tags": [
      "NPC",
      "Arvendor",
      "Ombric",
      "Overview",
      "Expertise",
      "Background"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "civilizations-ombric"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor, Ombric."
      },
      {
        "title": "Expertise",
        "body": "Connected names: Arvendor, Ombric."
      },
      {
        "title": "Background",
        "body": "Connected names: Arvendor, Ombric."
      },
      {
        "title": "Mission",
        "body": "Connected names: Arvendor, Ombric."
      },
      {
        "title": "Role",
        "body": "Connected names: Arvendor, Ombric."
      }
    ],
    "keyFacts": [
      "Index signal: Captain of the Arvendor Guard.",
      "Source sections: Overview, Expertise, Background, Mission, Role.",
      "Connected records: Arvendor, Ombric."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-fendral",
    "title": "Fendral",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Fendral. The index frames this thread as ambitious Eldorian. It cross-references Eldorian, Arvendor. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/fendral",
    "sourcePath": "/lore/npcs/fendral",
    "tags": [
      "NPC",
      "Eldorian",
      "Arvendor",
      "Overview"
    ],
    "relatedIds": [
      "civilizations-eldorian",
      "civilizations-arvendor"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Eldorian, Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: Ambitious Eldorian.",
      "Source sections: Overview.",
      "Connected records: Eldorian, Arvendor."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-feron",
    "title": "Feron",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Feron. The index frames this thread as dark warrior. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/feron",
    "sourcePath": "/lore/npcs/feron",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Dark warrior.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-freya",
    "title": "Freya",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Freya. The index frames this thread as sneaky assassin. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/freya",
    "sourcePath": "/lore/npcs/freya",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Sneaky assassin.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-galen",
    "title": "Galen",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Galen. The index frames this thread as legendary warrior (not really). It cross-references Eldorian. Its official sections focus on Overview, Nature, His Only Skill.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/galen",
    "sourcePath": "/lore/npcs/galen",
    "tags": [
      "NPC",
      "Eldorian",
      "Overview",
      "Nature",
      "His Only Skill"
    ],
    "relatedIds": [
      "civilizations-eldorian"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Eldorian."
      },
      {
        "title": "Nature",
        "body": "Connected names: Eldorian."
      },
      {
        "title": "His Only Skill",
        "body": "Connected names: Eldorian."
      },
      {
        "title": "How He Operates",
        "body": "Connected names: Eldorian."
      }
    ],
    "keyFacts": [
      "Index signal: Legendary warrior (not really).",
      "Source sections: Overview, Nature, His Only Skill, How He Operates.",
      "Connected records: Eldorian."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-gall-har",
    "title": "Gall'har",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Gall'har. The index frames this thread as god of eternal war. It cross-references Gods and Deities, Valaron. Its official sections focus on Overview, Nature, Influence.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/gall-har",
    "sourcePath": "/lore/npcs/gall-har",
    "tags": [
      "NPC",
      "Gods and Deities",
      "Valaron",
      "Overview",
      "Nature",
      "Influence"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "world-valaron"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Gods and Deities, Valaron."
      },
      {
        "title": "Nature",
        "body": "Connected names: Gods and Deities, Valaron."
      },
      {
        "title": "Influence",
        "body": "Connected names: Gods and Deities, Valaron."
      },
      {
        "title": "Status",
        "body": "Connected names: Gods and Deities, Valaron."
      }
    ],
    "keyFacts": [
      "Index signal: God of eternal war.",
      "Source sections: Overview, Nature, Influence, Status.",
      "Connected records: Gods and Deities, Valaron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-gelar",
    "title": "Gelar",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Gelar. The index frames this thread as winter Knight and King of Roasts. Its official sections focus on Overview, Character, Background.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/gelar",
    "sourcePath": "/lore/npcs/gelar",
    "tags": [
      "NPC",
      "Overview",
      "Character",
      "Background"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Character",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Background",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Role",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Winter Knight and King of Roasts.",
      "Source sections: Overview, Character, Background, Role."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-gerrin",
    "title": "Gerrin",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Gerrin. The index frames this thread as warrior seeking redemption. It cross-references Ombric, Feron. Its official sections focus on Overview, Hope.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/gerrin",
    "sourcePath": "/lore/npcs/gerrin",
    "tags": [
      "NPC",
      "Ombric",
      "Feron",
      "Overview",
      "Hope"
    ],
    "relatedIds": [
      "civilizations-ombric",
      "npcs-feron"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Ombric, Feron."
      },
      {
        "title": "Hope",
        "body": "Connected names: Ombric, Feron."
      }
    ],
    "keyFacts": [
      "Index signal: Warrior seeking redemption.",
      "Source sections: Overview, Hope.",
      "Connected records: Ombric, Feron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-gleamara",
    "title": "Gleamara",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Gleamara. The index frames this thread as oakenra Council member. It cross-references Oakenra. Its official sections focus on Overview, Philosophy, Methods.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/gleamara",
    "sourcePath": "/lore/npcs/gleamara",
    "tags": [
      "NPC",
      "Oakenra",
      "Overview",
      "Philosophy",
      "Methods"
    ],
    "relatedIds": [
      "civilizations-oakenra"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Methods",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Projects",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Relations",
        "body": "Connected names: Oakenra."
      }
    ],
    "keyFacts": [
      "Index signal: Oakenra Council member.",
      "Source sections: Overview, Philosophy, Methods, Projects, Relations.",
      "Connected records: Oakenra."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-groloth",
    "title": "Groloth",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Groloth. The index frames this thread as orc alchemist. It cross-references Mokthar. Its official sections focus on Overview, Background, Work.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/groloth",
    "sourcePath": "/lore/npcs/groloth",
    "tags": [
      "NPC",
      "Mokthar",
      "Overview",
      "Background",
      "Work"
    ],
    "relatedIds": [
      "civilizations-mokthar"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Mokthar."
      },
      {
        "title": "Background",
        "body": "Connected names: Mokthar."
      },
      {
        "title": "Work",
        "body": "Connected names: Mokthar."
      },
      {
        "title": "Legacy",
        "body": "Connected names: Mokthar."
      }
    ],
    "keyFacts": [
      "Index signal: Orc alchemist.",
      "Source sections: Overview, Background, Work, Legacy.",
      "Connected records: Mokthar."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-gwyneira",
    "title": "Gwyneira",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Gwyneira. The index frames this thread as frost Warrior and mine overseer. Its official sections focus on Overview, Character, Background.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/gwyneira",
    "sourcePath": "/lore/npcs/gwyneira",
    "tags": [
      "NPC",
      "Overview",
      "Character",
      "Background"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Character",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Background",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Work",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Leadership",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Frost Warrior and mine overseer.",
      "Source sections: Overview, Character, Background, Work, Leadership."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-isadora",
    "title": "Isadora",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Isadora. The index frames this thread as mysterious witch. It cross-references Bronn. Its official sections focus on Overview, History, Abilities.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/isadora",
    "sourcePath": "/lore/npcs/isadora",
    "tags": [
      "NPC",
      "Bronn",
      "Overview",
      "History",
      "Abilities"
    ],
    "relatedIds": [
      "npcs-bronn"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Bronn."
      },
      {
        "title": "History",
        "body": "Connected names: Bronn."
      },
      {
        "title": "Abilities",
        "body": "Connected names: Bronn."
      },
      {
        "title": "Reputation",
        "body": "Connected names: Bronn."
      },
      {
        "title": "Notable Encounters",
        "body": "Connected names: Bronn."
      },
      {
        "title": "Legacy",
        "body": "Connected names: Bronn."
      }
    ],
    "keyFacts": [
      "Index signal: Mysterious witch.",
      "Source sections: Overview, History, Abilities, Reputation, Notable Encounters.",
      "Connected records: Bronn."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-iskra",
    "title": "Iskra",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Iskra. The index frames this thread as spirit seer. Its official sections focus on Overview, Abilities, Artifact.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/iskra",
    "sourcePath": "/lore/npcs/iskra",
    "tags": [
      "NPC",
      "Overview",
      "Abilities",
      "Artifact"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Abilities",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Artifact",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Existence",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Motivation",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Spirit seer.",
      "Source sections: Overview, Abilities, Artifact, Existence, Motivation."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-isolde",
    "title": "Isolde",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Isolde. The index frames this thread as shy woman. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/isolde",
    "sourcePath": "/lore/npcs/isolde",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Shy woman.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-katiyara",
    "title": "Katiyara",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Katiyara. The index frames this thread as demi-god healer. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/katiyara",
    "sourcePath": "/lore/npcs/katiyara",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Demi-god healer.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-khufu",
    "title": "Khufu",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Khufu. The index frames this thread as desert entity. Its official sections focus on Overview, Background, Character.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/khufu",
    "sourcePath": "/lore/npcs/khufu",
    "tags": [
      "NPC",
      "Overview",
      "Background",
      "Character"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Background",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Character",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Activities",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Obsession",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Influence",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Desert entity.",
      "Source sections: Overview, Background, Character, Activities, Obsession."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-leilatha",
    "title": "Leilatha",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Leilatha. The index frames this thread as cheerful companion. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/leilatha",
    "sourcePath": "/lore/npcs/leilatha",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Cheerful companion.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-lucian",
    "title": "Lucian",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Lucian. The index frames this thread as shadow Guardian. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/lucian",
    "sourcePath": "/lore/npcs/lucian",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Shadow Guardian.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-mahol",
    "title": "Mahol",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Mahol. The index frames this thread as the Endless. It cross-references The First People, O'lo, Key Historical Events. Its official sections focus on Overview, History, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/mahol",
    "sourcePath": "/lore/npcs/mahol",
    "tags": [
      "NPC",
      "The First People",
      "O'lo",
      "Key Historical Events",
      "Overview",
      "History",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-the-first-people",
      "npcs-o-lo",
      "world-history"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The First People, O'lo, Key Historical Events."
      },
      {
        "title": "History",
        "body": "Connected names: The First People, O'lo, Key Historical Events."
      },
      {
        "title": "Nature",
        "body": "Connected names: The First People, O'lo, Key Historical Events."
      },
      {
        "title": "Abilities",
        "body": "Connected names: The First People, O'lo, Key Historical Events."
      },
      {
        "title": "Lore",
        "body": "Connected names: The First People, O'lo, Key Historical Events."
      }
    ],
    "keyFacts": [
      "Index signal: the Endless.",
      "Source sections: Overview, History, Nature, Abilities, Lore.",
      "Connected records: The First People, O'lo, Key Historical Events."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-melriel",
    "title": "Melriel",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Melriel. The index frames this thread as enigmatic elf. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/melriel",
    "sourcePath": "/lore/npcs/melriel",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Enigmatic elf.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-mircus",
    "title": "Mircus",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Mircus. The index frames this thread as templar knight. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/mircus",
    "sourcePath": "/lore/npcs/mircus",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Templar knight.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-mortem",
    "title": "Mortem",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Mortem. The index frames this thread as god of death and darkness. It cross-references Gods and Deities, O'lo, Mahol. Its official sections focus on Overview, Reality, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/mortem",
    "sourcePath": "/lore/npcs/mortem",
    "tags": [
      "NPC",
      "Gods and Deities",
      "O'lo",
      "Mahol",
      "Overview",
      "Reality",
      "Nature"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "npcs-o-lo",
      "npcs-mahol"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      },
      {
        "title": "Reality",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      },
      {
        "title": "Nature",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      },
      {
        "title": "Perception",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      },
      {
        "title": "History",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      },
      {
        "title": "Trivia",
        "body": "Connected names: Gods and Deities, O'lo, Mahol."
      }
    ],
    "keyFacts": [
      "Index signal: God of death and darkness.",
      "Source sections: Overview, Reality, Nature, Perception, History.",
      "Connected records: Gods and Deities, O'lo, Mahol."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-nythera",
    "title": "Nythera",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Nythera. The index frames this thread as priestess of the Lunar Vigil. It cross-references Cults, Valaron. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/nythera",
    "sourcePath": "/lore/npcs/nythera",
    "tags": [
      "NPC",
      "Cults",
      "Valaron",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "concepts-cults",
      "world-valaron"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Cults, Valaron."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Cults, Valaron."
      },
      {
        "title": "Nature",
        "body": "Connected names: Cults, Valaron."
      }
    ],
    "keyFacts": [
      "Index signal: Priestess of the Lunar Vigil.",
      "Source sections: Overview, Philosophy, Nature.",
      "Connected records: Cults, Valaron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-o-lo",
    "title": "O'lo",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on O'lo. The index frames this thread as god of wisdom. It cross-references Gods and Deities, Mahol, The First People. Its official sections focus on Overview, Nature, Followers.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/o-lo",
    "sourcePath": "/lore/npcs/o-lo",
    "tags": [
      "NPC",
      "Gods and Deities",
      "Mahol",
      "The First People",
      "Key Historical Events",
      "Overview",
      "Nature",
      "Followers"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "npcs-mahol",
      "civilizations-the-first-people",
      "world-history"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Gods and Deities, Mahol, The First People, Key Historical Events."
      },
      {
        "title": "Nature",
        "body": "Connected names: Gods and Deities, Mahol, The First People, Key Historical Events."
      },
      {
        "title": "Followers",
        "body": "Connected names: Gods and Deities, Mahol, The First People, Key Historical Events."
      },
      {
        "title": "Perception",
        "body": "Connected names: Gods and Deities, Mahol, The First People, Key Historical Events."
      },
      {
        "title": "Mahol",
        "body": "Connected names: Gods and Deities, Mahol, The First People, Key Historical Events."
      }
    ],
    "keyFacts": [
      "Index signal: God of wisdom.",
      "Source sections: Overview, Nature, Followers, Perception, Mahol.",
      "Connected records: Gods and Deities, Mahol, The First People, Key Historical Events."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-oakrum",
    "title": "Oakrum",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Oakrum. The index frames this thread as elder of unity. It cross-references Oakenra, Oilegeist. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/oakrum",
    "sourcePath": "/lore/npcs/oakrum",
    "tags": [
      "NPC",
      "Oakenra",
      "Oilegeist",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-oakenra",
      "npcs-oilegeist"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Oakenra, Oilegeist."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Oakenra, Oilegeist."
      },
      {
        "title": "Nature",
        "body": "Connected names: Oakenra, Oilegeist."
      }
    ],
    "keyFacts": [
      "Index signal: Elder of unity.",
      "Source sections: Overview, Philosophy, Nature.",
      "Connected records: Oakenra, Oilegeist."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-oilegeist",
    "title": "Oilegeist",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Oilegeist. The index frames this thread as oakenra ambitious. It cross-references Oakenra, Oakrum, Astaroth. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/oilegeist",
    "sourcePath": "/lore/npcs/oilegeist",
    "tags": [
      "NPC",
      "Oakenra",
      "Oakrum",
      "Astaroth",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-oakenra",
      "npcs-oakrum",
      "npcs-astaroth"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Oakenra, Oakrum, Astaroth."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Oakenra, Oakrum, Astaroth."
      },
      {
        "title": "Nature",
        "body": "Connected names: Oakenra, Oakrum, Astaroth."
      },
      {
        "title": "Alliances",
        "body": "Connected names: Oakenra, Oakrum, Astaroth."
      }
    ],
    "keyFacts": [
      "Index signal: Oakenra ambitious.",
      "Source sections: Overview, Philosophy, Nature, Alliances.",
      "Connected records: Oakenra, Oakrum, Astaroth."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-onroth",
    "title": "Onroth",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Onroth. The index frames this thread as oakenra trickster. It cross-references Oakenra. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/onroth",
    "sourcePath": "/lore/npcs/onroth",
    "tags": [
      "NPC",
      "Oakenra",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-oakenra"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Oakenra."
      },
      {
        "title": "Nature",
        "body": "Connected names: Oakenra."
      }
    ],
    "keyFacts": [
      "Index signal: Oakenra trickster.",
      "Source sections: Overview, Philosophy, Nature.",
      "Connected records: Oakenra."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-orcenzum",
    "title": "Orcenzum",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Orcenzum. The index frames this thread as orc commander. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/orcenzum",
    "sourcePath": "/lore/npcs/orcenzum",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Orc commander.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-osrith-the-unbound",
    "title": "Osrith the Unbound",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Osrith the Unbound. The index frames this thread as soul at peace. Its official sections focus on Overview, History, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/osrith-the-unbound",
    "sourcePath": "/lore/npcs/osrith-the-unbound",
    "tags": [
      "NPC",
      "Overview",
      "History",
      "Nature"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "History",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Philosophy",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Soul at peace.",
      "Source sections: Overview, History, Nature, Philosophy."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-ravenna",
    "title": "Ravenna",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Ravenna. The index frames this thread as embodiment of death. It cross-references Astaroth, Arvendor, Mortem. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/ravenna",
    "sourcePath": "/lore/npcs/ravenna",
    "tags": [
      "NPC",
      "Astaroth",
      "Arvendor",
      "Mortem",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "npcs-astaroth",
      "civilizations-arvendor",
      "npcs-mortem"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Astaroth, Arvendor, Mortem."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Astaroth, Arvendor, Mortem."
      },
      {
        "title": "Nature",
        "body": "Connected names: Astaroth, Arvendor, Mortem."
      },
      {
        "title": "Lore",
        "body": "Connected names: Astaroth, Arvendor, Mortem."
      }
    ],
    "keyFacts": [
      "Index signal: Embodiment of death.",
      "Source sections: Overview, Philosophy, Nature, Lore.",
      "Connected records: Astaroth, Arvendor, Mortem."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-roclus",
    "title": "Roclus",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Roclus. The index frames this thread as wise farmer. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/roclus",
    "sourcePath": "/lore/npcs/roclus",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Wise farmer.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-sapphire",
    "title": "Sapphire",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Sapphire. The index frames this thread as guardian of the crypts. It cross-references Arvendor, The Citadel, The Runemark of Eternity. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/sapphire",
    "sourcePath": "/lore/npcs/sapphire",
    "tags": [
      "NPC",
      "Arvendor",
      "The Citadel",
      "The Runemark of Eternity",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor, The Citadel, The Runemark of Eternity."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Arvendor, The Citadel, The Runemark of Eternity."
      },
      {
        "title": "Nature",
        "body": "Connected names: Arvendor, The Citadel, The Runemark of Eternity."
      }
    ],
    "keyFacts": [
      "Index signal: Guardian of the crypts.",
      "Source sections: Overview, Philosophy, Nature.",
      "Connected records: Arvendor, The Citadel, The Runemark of Eternity."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-shiera",
    "title": "Shiera",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Shiera. The index frames this thread as prince of the underworld. It cross-references Ombric. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/shiera",
    "sourcePath": "/lore/npcs/shiera",
    "tags": [
      "NPC",
      "Ombric",
      "Overview"
    ],
    "relatedIds": [
      "civilizations-ombric"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Ombric."
      }
    ],
    "keyFacts": [
      "Index signal: Prince of the underworld.",
      "Source sections: Overview.",
      "Connected records: Ombric."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-solvyr",
    "title": "Solvyr",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Solvyr. The index frames this thread as avatar of the sun. Its official sections focus on Overview, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/solvyr",
    "sourcePath": "/lore/npcs/solvyr",
    "tags": [
      "NPC",
      "Overview",
      "Nature"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Avatar of the sun.",
      "Source sections: Overview, Nature."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-svernom",
    "title": "Svernom",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Svernom. The index frames this thread as disgraced warrior. It cross-references Ombric, Osrith the Unbound. Its official sections focus on Overview, History, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/svernom",
    "sourcePath": "/lore/npcs/svernom",
    "tags": [
      "NPC",
      "Ombric",
      "Osrith the Unbound",
      "Overview",
      "History",
      "Nature"
    ],
    "relatedIds": [
      "civilizations-ombric",
      "npcs-osrith-the-unbound"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Ombric, Osrith the Unbound."
      },
      {
        "title": "History",
        "body": "Connected names: Ombric, Osrith the Unbound."
      },
      {
        "title": "Nature",
        "body": "Connected names: Ombric, Osrith the Unbound."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Ombric, Osrith the Unbound."
      }
    ],
    "keyFacts": [
      "Index signal: Disgraced warrior.",
      "Source sections: Overview, History, Nature, Philosophy.",
      "Connected records: Ombric, Osrith the Unbound."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-sylari",
    "title": "Sylari",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Sylari. The index frames this thread as ancient hermit. Its official sections focus on Overview, Nature, Philosophy.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/sylari",
    "sourcePath": "/lore/npcs/sylari",
    "tags": [
      "NPC",
      "Overview",
      "Nature",
      "Philosophy"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Philosophy",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Lore",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Ancient hermit.",
      "Source sections: Overview, Nature, Philosophy, Lore."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-the-spectral-entity",
    "title": "The Spectral Entity",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on The Spectral Entity. The index frames this thread as water consciousness. Its official sections focus on Overview, Nature, Perception of Reality.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/the-spectral-entity",
    "sourcePath": "/lore/npcs/the-spectral-entity",
    "tags": [
      "NPC",
      "Overview",
      "Nature",
      "Perception of Reality"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Perception of Reality",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Interaction",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Water consciousness.",
      "Source sections: Overview, Nature, Perception of Reality, Interaction."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-the-supreme-one",
    "title": "The Supreme One",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on The Supreme One. The index frames this thread as the first entity. It cross-references Gall'har, Mortem, Ebris. Its official sections focus on Overview, Prophecy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/the-supreme-one",
    "sourcePath": "/lore/npcs/the-supreme-one",
    "tags": [
      "NPC",
      "Gall'har",
      "Mortem",
      "Ebris",
      "O'lo",
      "The Ancients",
      "Overview",
      "Prophecy",
      "Nature"
    ],
    "relatedIds": [
      "npcs-gall-har",
      "npcs-mortem",
      "npcs-ebris",
      "npcs-o-lo",
      "civilizations-the-ancients"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Gall'har, Mortem, Ebris, O'lo, The Ancients."
      },
      {
        "title": "Prophecy",
        "body": "Connected names: Gall'har, Mortem, Ebris, O'lo, The Ancients."
      },
      {
        "title": "Nature",
        "body": "Connected names: Gall'har, Mortem, Ebris, O'lo, The Ancients."
      }
    ],
    "keyFacts": [
      "Index signal: The first entity.",
      "Source sections: Overview, Prophecy, Nature.",
      "Connected records: Gall'har, Mortem, Ebris, O'lo, The Ancients."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-thorgarr",
    "title": "Thorgarr",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Thorgarr. The index frames this thread as brute enforcer. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/thorgarr",
    "sourcePath": "/lore/npcs/thorgarr",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Brute enforcer.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-thornrend",
    "title": "Thornrend",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Thornrend. The index frames this thread as wild card. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/thornrend",
    "sourcePath": "/lore/npcs/thornrend",
    "tags": [
      "NPC",
      "Overview"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Wild card.",
      "Source sections: Overview."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-tritonis",
    "title": "Tritonis",
    "category": "NPC",
    "summary": "A deity record in Edric's archive centered on Tritonis, god of the sea, whose authority over oceans is framed as merciful to respectful sailors and devastating toward those who disregard the sea.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/tritonis",
    "sourcePath": "/lore/npcs/tritonis",
    "tags": [
      "NPC",
      "Gods and Deities",
      "Sea",
      "Overview"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "world-valaron",
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Tritonis is identified as the god of the sea, bound to oceanic power, storms, mercy for sailors who honor the waters, and punishment for those who do not."
      }
    ],
    "keyFacts": [
      "Index signal: God of the sea.",
      "Source sections: Overview.",
      "Connected records: Gods and Deities, Valaron, Solaris Isle."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-vandellian",
    "title": "Vandellian",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Vandellian. The index frames this thread as commander of the guards. It cross-references Ombric, Svernom. Its official sections focus on Overview.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/vandellian",
    "sourcePath": "/lore/npcs/vandellian",
    "tags": [
      "NPC",
      "Ombric",
      "Svernom",
      "Overview"
    ],
    "relatedIds": [
      "civilizations-ombric",
      "npcs-svernom"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Ombric, Svernom."
      }
    ],
    "keyFacts": [
      "Index signal: Commander of the guards.",
      "Source sections: Overview.",
      "Connected records: Ombric, Svernom."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-vesira",
    "title": "Vesira",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Vesira. The index frames this thread as pragmatic scholar. It cross-references Cults. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/vesira",
    "sourcePath": "/lore/npcs/vesira",
    "tags": [
      "NPC",
      "Cults",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "concepts-cults"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Cults."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Cults."
      },
      {
        "title": "Nature",
        "body": "Connected names: Cults."
      },
      {
        "title": "Challenges",
        "body": "Connected names: Cults."
      }
    ],
    "keyFacts": [
      "Index signal: Pragmatic scholar.",
      "Source sections: Overview, Philosophy, Nature, Challenges.",
      "Connected records: Cults."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-virel",
    "title": "Virel",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Virel. The index frames this thread as voice of the Lunar Vigil. It cross-references Cults, The Celestial System of Valaron, Eldorian. Its official sections focus on Overview, Philosophy, Nature.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/virel",
    "sourcePath": "/lore/npcs/virel",
    "tags": [
      "NPC",
      "Cults",
      "The Celestial System of Valaron",
      "Eldorian",
      "Overview",
      "Philosophy",
      "Nature"
    ],
    "relatedIds": [
      "concepts-cults",
      "world-celestial-system",
      "civilizations-eldorian"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Cults, The Celestial System of Valaron, Eldorian."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: Cults, The Celestial System of Valaron, Eldorian."
      },
      {
        "title": "Nature",
        "body": "Connected names: Cults, The Celestial System of Valaron, Eldorian."
      },
      {
        "title": "Mystery",
        "body": "Connected names: Cults, The Celestial System of Valaron, Eldorian."
      }
    ],
    "keyFacts": [
      "Index signal: Voice of the Lunar Vigil.",
      "Source sections: Overview, Philosophy, Nature, Mystery.",
      "Connected records: Cults, The Celestial System of Valaron, Eldorian."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-vorathis",
    "title": "Vorathis",
    "category": "NPC",
    "summary": "A contested deity record in Edric's archive centered on Vorathis, a force often called the god of chaos but described by the official entry as something older, darker, and stranger than a true god.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/vorathis",
    "sourcePath": "/lore/npcs/vorathis",
    "tags": [
      "NPC",
      "Gods and Deities",
      "Chaos",
      "Beyond Valaron",
      "Overview"
    ],
    "relatedIds": [
      "concepts-gods-and-deities",
      "concepts-colossal-serpent",
      "world-valaron"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Vorathis is officially described as a chaos-linked force from beyond the known universe, not a conventional god, with influence that distorts reality rather than conquering through armies."
      }
    ],
    "keyFacts": [
      "Index signal: God of chaos.",
      "Source sections: Overview.",
      "Connected records: Gods and Deities, The Colossal Serpent, Valaron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "npcs-yeti",
    "title": "Yeti",
    "category": "NPC",
    "summary": "A npc record in Edric's archive centered on Yeti. The index frames this thread as mountain chef. Its official sections focus on Overview, Nature, Diet.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/npcs/yeti",
    "sourcePath": "/lore/npcs/yeti",
    "tags": [
      "NPC",
      "Overview",
      "Nature",
      "Diet"
    ],
    "relatedIds": [],
    "sections": [
      {
        "title": "Overview",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Nature",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Diet",
        "body": "This section adds context to the entry without a strong cross-link marker."
      },
      {
        "title": "Lore",
        "body": "This section adds context to the entry without a strong cross-link marker."
      }
    ],
    "keyFacts": [
      "Index signal: Mountain chef.",
      "Source sections: Overview, Nature, Diet, Lore."
    ],
    "timelineMarkers": []
  },
  {
    "id": "overview",
    "title": "Lore Overview",
    "category": "Overview",
    "summary": "Edric introduces the Chronicles as an in-world historical record: useful, dangerous, and openly shaped by an Arvendorian perspective.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/overview",
    "sourcePath": "/lore/overview",
    "tags": [
      "Overview",
      "Valaron",
      "Edric",
      "Arvendor",
      "About the Author",
      "A Note",
      "Behind The Lore"
    ],
    "relatedIds": [
      "world-valaron",
      "npcs-edric",
      "civilizations-arvendor"
    ],
    "sections": [
      {
        "title": "About the Author",
        "body": "Connected names: Valaron, Edric, Arvendor."
      },
      {
        "title": "A Note",
        "body": "Connected names: Valaron, Edric, Arvendor."
      },
      {
        "title": "Behind The Lore",
        "body": "Connected names: Valaron, Edric, Arvendor."
      }
    ],
    "keyFacts": [
      "Index signal: A summary of the history and mythology of Valaron.",
      "Source sections: About the Author, A Note, Behind The Lore.",
      "Connected records: Valaron, Edric, Arvendor."
    ],
    "timelineMarkers": []
  },
  {
    "id": "the-world",
    "title": "The World",
    "category": "Index",
    "summary": "A gateway into the The World archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/the-world",
    "sourcePath": "/lore/the-world",
    "tags": [
      "Index",
      "Solaris Isle",
      "Astaroth"
    ],
    "relatedIds": [
      "world-solaris-isle",
      "npcs-astaroth"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Explore the geography and creation of the world."
      }
    ],
    "keyFacts": [
      "Index signal: Explore the geography and creation of the world.",
      "Connected records: Solaris Isle, Astaroth."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world",
    "title": "World",
    "category": "Index",
    "summary": "A gateway into the World archive, collecting the official records that branch from this lore category.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/",
    "sourcePath": "/lore/world",
    "tags": [
      "Index",
      "The Celestial System of Valaron",
      "Key Historical Events",
      "Solaris Isle",
      "The Citadel",
      "Valaron"
    ],
    "relatedIds": [
      "world-celestial-system",
      "world-history",
      "world-solaris-isle",
      "world-the-citadel",
      "world-valaron"
    ],
    "sections": [
      {
        "title": "Archive Signal",
        "body": "The lore index labels this thread as: Specific locations and history."
      }
    ],
    "keyFacts": [
      "Index signal: Specific locations and history.",
      "Connected records: The Celestial System of Valaron, Key Historical Events, Solaris Isle, The Citadel, Valaron."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world-celestial-system",
    "title": "The Celestial System of Valaron",
    "category": "World",
    "summary": "A world record in Edric's archive centered on The Celestial System of Valaron. The index frames this thread as celestia. It cross-references Valaron, Cults, Virel. Its official sections focus on Overview, Celestia, Secondary Moons.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/celestial-system",
    "sourcePath": "/lore/world/celestial-system",
    "tags": [
      "World",
      "Valaron",
      "Cults",
      "Virel",
      "Solaris Isle",
      "Overview",
      "Celestia",
      "Secondary Moons"
    ],
    "relatedIds": [
      "world-valaron",
      "concepts-cults",
      "npcs-virel",
      "world-solaris-isle"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "Celestia",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "Secondary Moons",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "Nature",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "History",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "Worship",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      },
      {
        "title": "Celebrations",
        "body": "Connected names: Valaron, Cults, Virel, Solaris Isle."
      }
    ],
    "keyFacts": [
      "Index signal: Celestia.",
      "Source sections: Overview, Celestia, Secondary Moons, Nature, History.",
      "Connected records: Valaron, Cults, Virel, Solaris Isle."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world-history",
    "title": "Key Historical Events",
    "category": "World",
    "summary": "A world record in Edric's archive centered on Key Historical Events. The index frames this thread as ombric-Arvendor war. It cross-references The First People, Valaron, The Colossal Serpent. Its official sections focus on The Age of Splendor, The Great Fragmentation, The Great War: Arvendor vs. Ombric.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/history",
    "sourcePath": "/lore/world/history",
    "tags": [
      "World",
      "The First People",
      "Valaron",
      "The Colossal Serpent",
      "Arvendor",
      "Ombric",
      "The Age of Splendor",
      "The Great Fragmentation",
      "The Great War: Arvendor vs. Ombric"
    ],
    "relatedIds": [
      "civilizations-the-first-people",
      "world-valaron",
      "concepts-colossal-serpent",
      "civilizations-arvendor",
      "civilizations-ombric",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity",
      "npcs-astaroth",
      "npcs-ravenna",
      "civilizations-the-ancients",
      "civilizations-oakenra",
      "civilizations-eldorian"
    ],
    "sections": [
      {
        "title": "The Age of Splendor",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel."
      },
      {
        "title": "The Great Fragmentation",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel."
      },
      {
        "title": "The Great War: Arvendor vs. Ombric",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel."
      },
      {
        "title": "The Dark Chapter of Eldoria",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel."
      },
      {
        "title": "The Great Fire of Eldoria",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel."
      },
      {
        "title": "Timeline",
        "body": "Connected names: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel. Date markers: 10,000,000, 500,000 BR, 200,000 BR, 25,000 BR, 200 BR."
      }
    ],
    "keyFacts": [
      "Index signal: Ombric-Arvendor war.",
      "Source sections: The Age of Splendor, The Great Fragmentation, The Great War: Arvendor vs. Ombric, The Dark Chapter of Eldoria, The Great Fire of Eldoria.",
      "Connected records: The First People, Valaron, The Colossal Serpent, Arvendor, Ombric, The Citadel, The Runemark of Eternity, Astaroth."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world-solaris-isle",
    "title": "Solaris Isle",
    "category": "World",
    "summary": "A world record in Edric's archive centered on Solaris Isle. The index frames this thread as the heart of Valaron and center of civilization. It cross-references Arvendor, Eldorian, Oakenra. Its official sections focus on Overview, History, Civilizations.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/solaris-isle",
    "sourcePath": "/lore/world/solaris-isle",
    "tags": [
      "World",
      "Arvendor",
      "Eldorian",
      "Oakenra",
      "Mokthar",
      "Overview",
      "History",
      "Civilizations"
    ],
    "relatedIds": [
      "civilizations-arvendor",
      "civilizations-eldorian",
      "civilizations-oakenra",
      "civilizations-mokthar"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: Arvendor, Eldorian, Oakenra, Mokthar."
      },
      {
        "title": "History",
        "body": "Connected names: Arvendor, Eldorian, Oakenra, Mokthar."
      },
      {
        "title": "Civilizations",
        "body": "Connected names: Arvendor, Eldorian, Oakenra, Mokthar."
      },
      {
        "title": "Recent Developments",
        "body": "Connected names: Arvendor, Eldorian, Oakenra, Mokthar."
      }
    ],
    "keyFacts": [
      "Index signal: The heart of Valaron and center of civilization.",
      "Source sections: Overview, History, Civilizations, Recent Developments.",
      "Connected records: Arvendor, Eldorian, Oakenra, Mokthar."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world-the-citadel",
    "title": "The Citadel",
    "category": "World",
    "summary": "A world record in Edric's archive centered on The Citadel. The index frames this thread as ancient crypts. It cross-references The Runemark of Eternity, The Ancients, Key Historical Events. Its official sections focus on Overview, Foundation, The Crypts.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/the-citadel",
    "sourcePath": "/lore/world/the-citadel",
    "tags": [
      "World",
      "The Runemark of Eternity",
      "The Ancients",
      "Key Historical Events",
      "Arvendor",
      "Ezekiel",
      "Overview",
      "Foundation",
      "The Crypts"
    ],
    "relatedIds": [
      "artifacts-the-runemark-of-eternity",
      "civilizations-the-ancients",
      "world-history",
      "civilizations-arvendor",
      "npcs-ezekiel",
      "npcs-sapphire"
    ],
    "sections": [
      {
        "title": "Overview",
        "body": "Connected names: The Runemark of Eternity, The Ancients, Key Historical Events, Arvendor, Ezekiel, Sapphire."
      },
      {
        "title": "Foundation",
        "body": "Connected names: The Runemark of Eternity, The Ancients, Key Historical Events, Arvendor, Ezekiel, Sapphire."
      },
      {
        "title": "The Crypts",
        "body": "Connected names: The Runemark of Eternity, The Ancients, Key Historical Events, Arvendor, Ezekiel, Sapphire."
      },
      {
        "title": "Philosophy",
        "body": "Connected names: The Runemark of Eternity, The Ancients, Key Historical Events, Arvendor, Ezekiel, Sapphire."
      }
    ],
    "keyFacts": [
      "Index signal: ancient crypts.",
      "Source sections: Overview, Foundation, The Crypts, Philosophy.",
      "Connected records: The Runemark of Eternity, The Ancients, Key Historical Events, Arvendor, Ezekiel, Sapphire."
    ],
    "timelineMarkers": []
  },
  {
    "id": "world-valaron",
    "title": "Valaron",
    "category": "World",
    "summary": "A world record in Edric's archive centered on Valaron. The index frames this thread as ardenfell. It cross-references The First People, The Ancients, Solaris Isle. Its official sections focus on Solaris Isle, The Eastern Lands, The Northern Caps.",
    "sourceUrl": "https://wiki.idle-mmo.com/lore/world/valaron",
    "sourcePath": "/lore/world/valaron",
    "tags": [
      "World",
      "The First People",
      "The Ancients",
      "Solaris Isle",
      "The Citadel",
      "Civilizations",
      "The Eastern Lands",
      "The Northern Caps"
    ],
    "relatedIds": [
      "civilizations-the-first-people",
      "civilizations-the-ancients",
      "world-solaris-isle",
      "world-the-citadel",
      "civilizations"
    ],
    "sections": [
      {
        "title": "Solaris Isle",
        "body": "Connected names: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
      },
      {
        "title": "The Eastern Lands",
        "body": "Connected names: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
      },
      {
        "title": "The Northern Caps",
        "body": "Connected names: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
      },
      {
        "title": "Valenor",
        "body": "Connected names: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
      },
      {
        "title": "Ardenfell",
        "body": "Connected names: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
      }
    ],
    "keyFacts": [
      "Index signal: Ardenfell.",
      "Source sections: Solaris Isle, The Eastern Lands, The Northern Caps, Valenor, Ardenfell.",
      "Connected records: The First People, The Ancients, Solaris Isle, The Citadel, Civilizations."
    ],
    "timelineMarkers": []
  }
] as const satisfies readonly LoreEntry[];

export const LORE_RELATIONS = [
  {
    "source": "index",
    "target": "artifacts",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to Artifacts in the official lore page."
  },
  {
    "source": "index",
    "target": "bestiary",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to Bestiary in the official lore page."
  },
  {
    "source": "index",
    "target": "civilizations",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to Civilizations in the official lore page."
  },
  {
    "source": "index",
    "target": "concepts",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to Concepts in the official lore page."
  },
  {
    "source": "index",
    "target": "npcs",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to NPCs in the official lore page."
  },
  {
    "source": "index",
    "target": "overview",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to Lore Overview in the official lore page."
  },
  {
    "source": "index",
    "target": "the-world",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to The World in the official lore page."
  },
  {
    "source": "index",
    "target": "world",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore links to World in the official lore page."
  },
  {
    "source": "artifacts",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Artifacts links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "artifacts-the-runemark-of-eternity",
    "target": "world-the-citadel",
    "type": "artifact thread",
    "confidence": "canon",
    "evidence": "The Runemark of Eternity links to The Citadel in the official lore page."
  },
  {
    "source": "artifacts-the-runemark-of-eternity",
    "target": "civilizations-the-ancients",
    "type": "artifact thread",
    "confidence": "canon",
    "evidence": "The Runemark of Eternity links to The Ancients in the official lore page."
  },
  {
    "source": "artifacts-the-runemark-of-eternity",
    "target": "civilizations-arvendor",
    "type": "artifact thread",
    "confidence": "canon",
    "evidence": "The Runemark of Eternity links to Arvendor in the official lore page."
  },
  {
    "source": "artifacts-the-runemark-of-eternity",
    "target": "world-history",
    "type": "artifact thread",
    "confidence": "canon",
    "evidence": "The Runemark of Eternity links to Key Historical Events in the official lore page."
  },
  {
    "source": "bestiary",
    "target": "bestiary-kikimoras",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Bestiary links to Kikimoras in the official lore page."
  },
  {
    "source": "bestiary",
    "target": "bestiary-sirens",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Bestiary links to The Sirens in the official lore page."
  },
  {
    "source": "bestiary-kikimoras",
    "target": "world-the-citadel",
    "type": "creature thread",
    "confidence": "canon",
    "evidence": "Kikimoras links to The Citadel in the official lore page."
  },
  {
    "source": "bestiary-kikimoras",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "creature thread",
    "confidence": "canon",
    "evidence": "Kikimoras links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "bestiary-kikimoras",
    "target": "civilizations-arvendor",
    "type": "creature thread",
    "confidence": "canon",
    "evidence": "Kikimoras links to Arvendor in the official lore page."
  },
  {
    "source": "bestiary-sirens",
    "target": "world-solaris-isle",
    "type": "creature thread",
    "confidence": "canon",
    "evidence": "The Sirens links to Solaris Isle in the official lore page."
  },
  {
    "source": "bestiary-sirens",
    "target": "npcs-ravenna",
    "type": "creature thread",
    "confidence": "canon",
    "evidence": "The Sirens links to Ravenna in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-arvendor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Arvendor in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-eldorian",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Eldorian in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-mokthar",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Mokthar in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-oakenra",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Oakenra in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-ombric",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Ombric in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-other-civilisations",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to Other Civilisations of Valaron in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-the-ancients",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to The Ancients in the official lore page."
  },
  {
    "source": "civilizations",
    "target": "civilizations-the-first-people",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Civilizations links to The First People in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "world-the-citadel",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to The Citadel in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to Valaron in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "civilizations-the-ancients",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to The Ancients in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "civilizations-ombric",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to Ombric in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "civilizations-arvendor",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Arvendor links to Mahol in the official lore page."
  },
  {
    "source": "civilizations-eldorian",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Eldorian links to Solaris Isle in the official lore page."
  },
  {
    "source": "civilizations-eldorian",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Eldorian links to Valaron in the official lore page."
  },
  {
    "source": "civilizations-eldorian",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Eldorian links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-eldorian",
    "target": "civilizations-arvendor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Eldorian links to Arvendor in the official lore page."
  },
  {
    "source": "civilizations-mokthar",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mokthar links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-mokthar",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mokthar links to Valaron in the official lore page."
  },
  {
    "source": "civilizations-mokthar",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mokthar links to Solaris Isle in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "npcs-oakrum",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Oakrum in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "npcs-gleamara",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Gleamara in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "npcs-oilegeist",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Oilegeist in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "npcs-onroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Onroth in the official lore page."
  },
  {
    "source": "civilizations-oakenra",
    "target": "npcs-thorgarr",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakenra links to Thorgarr in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "civilizations-arvendor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Arvendor in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "npcs-ravenna",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Ravenna in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "npcs-astaroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Astaroth in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "npcs-oilegeist",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Oilegeist in the official lore page."
  },
  {
    "source": "civilizations-ombric",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ombric links to Solaris Isle in the official lore page."
  },
  {
    "source": "civilizations-other-civilisations",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Other Civilisations of Valaron links to Valaron in the official lore page."
  },
  {
    "source": "civilizations-other-civilisations",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Other Civilisations of Valaron links to Solaris Isle in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "civilizations-the-first-people",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to The First People in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "npcs-the-supreme-one",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to The Supreme One in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "world-the-citadel",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to The Citadel in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "civilizations-arvendor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to Arvendor in the official lore page."
  },
  {
    "source": "civilizations-the-ancients",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Ancients links to Mahol in the official lore page."
  },
  {
    "source": "civilizations-the-first-people",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The First People links to Key Historical Events in the official lore page."
  },
  {
    "source": "civilizations-the-first-people",
    "target": "concepts-gods-and-deities",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The First People links to Gods and Deities in the official lore page."
  },
  {
    "source": "civilizations-the-first-people",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The First People links to Valaron in the official lore page."
  },
  {
    "source": "civilizations-the-first-people",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The First People links to Solaris Isle in the official lore page."
  },
  {
    "source": "civilizations-the-first-people",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The First People links to Mahol in the official lore page."
  },
  {
    "source": "concepts",
    "target": "concepts-colossal-serpent",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Concepts links to The Colossal Serpent in the official lore page."
  },
  {
    "source": "concepts",
    "target": "concepts-cults",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Concepts links to Cults in the official lore page."
  },
  {
    "source": "concepts",
    "target": "concepts-gods-and-deities",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Concepts links to Gods and Deities in the official lore page."
  },
  {
    "source": "concepts-colossal-serpent",
    "target": "world-valaron",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "The Colossal Serpent links to Valaron in the official lore page."
  },
  {
    "source": "concepts-cults",
    "target": "world-celestial-system",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Cults links to The Celestial System of Valaron in the official lore page."
  },
  {
    "source": "concepts-cults",
    "target": "npcs-virel",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Cults links to Virel in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "world-history",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to Key Historical Events in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-ebris",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to Ebris in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-gall-har",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to Gall'har in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-mortem",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to Mortem in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-o-lo",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to O'lo in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-the-supreme-one",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Gods and Deities links to The Supreme One in the official lore page."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-chronar",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Chronar's official NPC page identifies him as the god of time."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-tritonis",
    "type": "mythic association",
    "confidence": "canon",
    "evidence": "Tritonis's official NPC page identifies him as the god of the sea."
  },
  {
    "source": "concepts-gods-and-deities",
    "target": "npcs-vorathis",
    "type": "contested deity",
    "confidence": "canon",
    "evidence": "Vorathis's official NPC page says he is called the god of chaos while also describing him as no true god."
  },
  {
    "source": "npcs",
    "target": "npcs-aelorid",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Aelorid in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-ankhotep",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Ankhotep in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-aquiel",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Aquiel in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-astaroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Astaroth in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-brandor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Brandor in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-bronn",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Bronn in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-celestria",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Celestria in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-chronar",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Chronar in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-divinus",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Divinus in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-tritonis",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Tritonis in the official lore page."
  },
  {
    "source": "npcs",
    "target": "npcs-vorathis",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "NPCs links to Vorathis in the official lore page."
  },
  {
    "source": "npcs-aelorid",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Aelorid links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-ankhotep",
    "target": "world-solaris-isle",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Ankhotep links to Solaris Isle in the official lore page."
  },
  {
    "source": "npcs-astaroth",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Astaroth links to Ombric in the official lore page."
  },
  {
    "source": "npcs-astaroth",
    "target": "npcs-oilegeist",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Astaroth links to Oilegeist in the official lore page."
  },
  {
    "source": "npcs-astaroth",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Astaroth links to Mahol in the official lore page."
  },
  {
    "source": "npcs-brandor",
    "target": "npcs-eryndeth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Brandor links to Eryndeth in the official lore page."
  },
  {
    "source": "npcs-edric",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Edric links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-edric",
    "target": "overview",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Edric links to Lore Overview in the official lore page."
  },
  {
    "source": "npcs-eryndeth",
    "target": "civilizations-oakenra",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Eryndeth links to Oakenra in the official lore page."
  },
  {
    "source": "npcs-eryndeth",
    "target": "npcs-gleamara",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Eryndeth links to Gleamara in the official lore page."
  },
  {
    "source": "npcs-ezekiel",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Ezekiel links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-ezekiel",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Ezekiel links to Ombric in the official lore page."
  },
  {
    "source": "npcs-fendral",
    "target": "civilizations-eldorian",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Fendral links to Eldorian in the official lore page."
  },
  {
    "source": "npcs-fendral",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Fendral links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-galen",
    "target": "civilizations-eldorian",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Galen links to Eldorian in the official lore page."
  },
  {
    "source": "npcs-gall-har",
    "target": "concepts-gods-and-deities",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Gall'har links to Gods and Deities in the official lore page."
  },
  {
    "source": "npcs-gall-har",
    "target": "world-valaron",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Gall'har links to Valaron in the official lore page."
  },
  {
    "source": "npcs-gerrin",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Gerrin links to Ombric in the official lore page."
  },
  {
    "source": "npcs-gerrin",
    "target": "npcs-feron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Gerrin links to Feron in the official lore page."
  },
  {
    "source": "npcs-gleamara",
    "target": "civilizations-oakenra",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Gleamara links to Oakenra in the official lore page."
  },
  {
    "source": "npcs-groloth",
    "target": "civilizations-mokthar",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Groloth links to Mokthar in the official lore page."
  },
  {
    "source": "npcs-isadora",
    "target": "npcs-bronn",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Isadora links to Bronn in the official lore page."
  },
  {
    "source": "npcs-mahol",
    "target": "civilizations-the-first-people",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Mahol links to The First People in the official lore page."
  },
  {
    "source": "npcs-mahol",
    "target": "npcs-o-lo",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mahol links to O'lo in the official lore page."
  },
  {
    "source": "npcs-mahol",
    "target": "world-history",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Mahol links to Key Historical Events in the official lore page."
  },
  {
    "source": "npcs-mortem",
    "target": "concepts-gods-and-deities",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mortem links to Gods and Deities in the official lore page."
  },
  {
    "source": "npcs-mortem",
    "target": "npcs-o-lo",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mortem links to O'lo in the official lore page."
  },
  {
    "source": "npcs-mortem",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Mortem links to Mahol in the official lore page."
  },
  {
    "source": "npcs-nythera",
    "target": "concepts-cults",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Nythera links to Cults in the official lore page."
  },
  {
    "source": "npcs-nythera",
    "target": "world-valaron",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Nythera links to Valaron in the official lore page."
  },
  {
    "source": "npcs-o-lo",
    "target": "concepts-gods-and-deities",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "O'lo links to Gods and Deities in the official lore page."
  },
  {
    "source": "npcs-o-lo",
    "target": "npcs-mahol",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "O'lo links to Mahol in the official lore page."
  },
  {
    "source": "npcs-o-lo",
    "target": "civilizations-the-first-people",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "O'lo links to The First People in the official lore page."
  },
  {
    "source": "npcs-o-lo",
    "target": "world-history",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "O'lo links to Key Historical Events in the official lore page."
  },
  {
    "source": "npcs-oakrum",
    "target": "civilizations-oakenra",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Oakrum links to Oakenra in the official lore page."
  },
  {
    "source": "npcs-oakrum",
    "target": "npcs-oilegeist",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oakrum links to Oilegeist in the official lore page."
  },
  {
    "source": "npcs-oilegeist",
    "target": "civilizations-oakenra",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Oilegeist links to Oakenra in the official lore page."
  },
  {
    "source": "npcs-oilegeist",
    "target": "npcs-oakrum",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oilegeist links to Oakrum in the official lore page."
  },
  {
    "source": "npcs-oilegeist",
    "target": "npcs-astaroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Oilegeist links to Astaroth in the official lore page."
  },
  {
    "source": "npcs-onroth",
    "target": "civilizations-oakenra",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Onroth links to Oakenra in the official lore page."
  },
  {
    "source": "npcs-ravenna",
    "target": "npcs-astaroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ravenna links to Astaroth in the official lore page."
  },
  {
    "source": "npcs-ravenna",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Ravenna links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-ravenna",
    "target": "npcs-mortem",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Ravenna links to Mortem in the official lore page."
  },
  {
    "source": "npcs-sapphire",
    "target": "civilizations-arvendor",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Sapphire links to Arvendor in the official lore page."
  },
  {
    "source": "npcs-sapphire",
    "target": "world-the-citadel",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Sapphire links to The Citadel in the official lore page."
  },
  {
    "source": "npcs-sapphire",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Sapphire links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "npcs-shiera",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Shiera links to Ombric in the official lore page."
  },
  {
    "source": "npcs-svernom",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Svernom links to Ombric in the official lore page."
  },
  {
    "source": "npcs-svernom",
    "target": "npcs-osrith-the-unbound",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Svernom links to Osrith the Unbound in the official lore page."
  },
  {
    "source": "npcs-the-supreme-one",
    "target": "npcs-gall-har",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Supreme One links to Gall'har in the official lore page."
  },
  {
    "source": "npcs-the-supreme-one",
    "target": "npcs-mortem",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Supreme One links to Mortem in the official lore page."
  },
  {
    "source": "npcs-the-supreme-one",
    "target": "npcs-ebris",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Supreme One links to Ebris in the official lore page."
  },
  {
    "source": "npcs-the-supreme-one",
    "target": "npcs-o-lo",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The Supreme One links to O'lo in the official lore page."
  },
  {
    "source": "npcs-the-supreme-one",
    "target": "civilizations-the-ancients",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "The Supreme One links to The Ancients in the official lore page."
  },
  {
    "source": "npcs-vandellian",
    "target": "civilizations-ombric",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Vandellian links to Ombric in the official lore page."
  },
  {
    "source": "npcs-vandellian",
    "target": "npcs-svernom",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Vandellian links to Svernom in the official lore page."
  },
  {
    "source": "npcs-vesira",
    "target": "concepts-cults",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Vesira links to Cults in the official lore page."
  },
  {
    "source": "npcs-virel",
    "target": "concepts-cults",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Virel links to Cults in the official lore page."
  },
  {
    "source": "npcs-virel",
    "target": "world-celestial-system",
    "type": "place connection",
    "confidence": "canon",
    "evidence": "Virel links to The Celestial System of Valaron in the official lore page."
  },
  {
    "source": "npcs-virel",
    "target": "civilizations-eldorian",
    "type": "origin or allegiance",
    "confidence": "canon",
    "evidence": "Virel links to Eldorian in the official lore page."
  },
  {
    "source": "overview",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore Overview links to Valaron in the official lore page."
  },
  {
    "source": "overview",
    "target": "npcs-edric",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore Overview links to Edric in the official lore page."
  },
  {
    "source": "overview",
    "target": "civilizations-arvendor",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "Lore Overview links to Arvendor in the official lore page."
  },
  {
    "source": "the-world",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The World links to Solaris Isle in the official lore page."
  },
  {
    "source": "the-world",
    "target": "npcs-astaroth",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "The World links to Astaroth in the official lore page."
  },
  {
    "source": "world",
    "target": "world-celestial-system",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "World links to The Celestial System of Valaron in the official lore page."
  },
  {
    "source": "world",
    "target": "world-history",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "World links to Key Historical Events in the official lore page."
  },
  {
    "source": "world",
    "target": "world-solaris-isle",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "World links to Solaris Isle in the official lore page."
  },
  {
    "source": "world",
    "target": "world-the-citadel",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "World links to The Citadel in the official lore page."
  },
  {
    "source": "world",
    "target": "world-valaron",
    "type": "canon cross-reference",
    "confidence": "canon",
    "evidence": "World links to Valaron in the official lore page."
  },
  {
    "source": "world-celestial-system",
    "target": "world-valaron",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Celestial System of Valaron links to Valaron in the official lore page."
  },
  {
    "source": "world-celestial-system",
    "target": "concepts-cults",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Celestial System of Valaron links to Cults in the official lore page."
  },
  {
    "source": "world-celestial-system",
    "target": "npcs-virel",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Celestial System of Valaron links to Virel in the official lore page."
  },
  {
    "source": "world-celestial-system",
    "target": "world-solaris-isle",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Celestial System of Valaron links to Solaris Isle in the official lore page."
  },
  {
    "source": "world-history",
    "target": "civilizations-the-first-people",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to The First People in the official lore page."
  },
  {
    "source": "world-history",
    "target": "world-valaron",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to Valaron in the official lore page."
  },
  {
    "source": "world-history",
    "target": "concepts-colossal-serpent",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to The Colossal Serpent in the official lore page."
  },
  {
    "source": "world-history",
    "target": "civilizations-arvendor",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to Arvendor in the official lore page."
  },
  {
    "source": "world-history",
    "target": "civilizations-ombric",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to Ombric in the official lore page."
  },
  {
    "source": "world-history",
    "target": "world-the-citadel",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to The Citadel in the official lore page."
  },
  {
    "source": "world-history",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "world-history",
    "target": "npcs-astaroth",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Key Historical Events links to Astaroth in the official lore page."
  },
  {
    "source": "world-solaris-isle",
    "target": "civilizations-arvendor",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Solaris Isle links to Arvendor in the official lore page."
  },
  {
    "source": "world-solaris-isle",
    "target": "civilizations-eldorian",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Solaris Isle links to Eldorian in the official lore page."
  },
  {
    "source": "world-solaris-isle",
    "target": "civilizations-oakenra",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Solaris Isle links to Oakenra in the official lore page."
  },
  {
    "source": "world-solaris-isle",
    "target": "civilizations-mokthar",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Solaris Isle links to Mokthar in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "artifacts-the-runemark-of-eternity",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to The Runemark of Eternity in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "civilizations-the-ancients",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to The Ancients in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "world-history",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to Key Historical Events in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "civilizations-arvendor",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to Arvendor in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "npcs-ezekiel",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to Ezekiel in the official lore page."
  },
  {
    "source": "world-the-citadel",
    "target": "npcs-sapphire",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "The Citadel links to Sapphire in the official lore page."
  },
  {
    "source": "world-valaron",
    "target": "civilizations-the-first-people",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Valaron links to The First People in the official lore page."
  },
  {
    "source": "world-valaron",
    "target": "civilizations-the-ancients",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Valaron links to The Ancients in the official lore page."
  },
  {
    "source": "world-valaron",
    "target": "world-solaris-isle",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Valaron links to Solaris Isle in the official lore page."
  },
  {
    "source": "world-valaron",
    "target": "world-the-citadel",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Valaron links to The Citadel in the official lore page."
  },
  {
    "source": "world-valaron",
    "target": "civilizations",
    "type": "historical geography",
    "confidence": "canon",
    "evidence": "Valaron links to Civilizations in the official lore page."
  }
] as const satisfies readonly LoreRelation[];

export const LORE_THEORIES = [
  {
    "id": "edric-bias-file",
    "title": "Edric's Bias File",
    "premise": "The archive may be accurate and still politically angled, because its narrator admits an Arvendorian lens.",
    "evidenceIds": [
      "overview",
      "npcs-edric",
      "civilizations-arvendor"
    ],
    "counterpoints": [
      "The narrator explicitly warns readers to question unclear history."
    ],
    "speculationLevel": "Low"
  },
  {
    "id": "runemark-blood-price",
    "title": "The Citadel Floats On A Price",
    "premise": "The Runemark and the Citadel suggest that Arvendorian grandeur depends on a hidden sacrificial economy.",
    "evidenceIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel",
      "civilizations-arvendor",
      "civilizations-the-ancients"
    ],
    "counterpoints": [
      "The official sources preserve the secret, but they do not reveal every actor maintaining it."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "ombric-exile-coverup",
    "title": "The Ombric Exile Was Not Just Treason",
    "premise": "The Ombric split reads like a political wound around forbidden truths, not only a simple rebellion.",
    "evidenceIds": [
      "civilizations-ombric",
      "civilizations-arvendor",
      "npcs-astaroth",
      "npcs-ravenna"
    ],
    "counterpoints": [
      "The exact motives remain filtered through hostile historical memory."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "sirens-solaris-memory",
    "title": "Solaris Waters Remember More Than People Do",
    "premise": "Sirens, Ravenna, and Solaris Isle form a coastal mystery thread about memory, warning, and seductive danger.",
    "evidenceIds": [
      "bestiary-sirens",
      "world-solaris-isle",
      "npcs-ravenna"
    ],
    "counterpoints": [
      "The connection is thematic unless future lore gives a direct cause."
    ],
    "speculationLevel": "High"
  },
  {
    "id": "serpent-reality-vessel",
    "title": "The Serpent Is The Frame, Not A Creature",
    "premise": "The Colossal Serpent may be less a monster and more the metaphysical container for Valaron and its divine order.",
    "evidenceIds": [
      "concepts-colossal-serpent",
      "world-valaron",
      "concepts-gods-and-deities"
    ],
    "counterpoints": [
      "Cosmology pages are mythic records, not mechanical proof."
    ],
    "speculationLevel": "High"
  },
  {
    "id": "chronar-erased-himself",
    "title": "Chronar May Have Chosen Forgetting",
    "premise": "Chronar's disappearance from memory might not be defeat; it may be a time-god's deliberate method of surviving outside ordinary history.",
    "evidenceIds": [
      "npcs-chronar",
      "concepts-gods-and-deities",
      "world-history"
    ],
    "counterpoints": [
      "The official entry says time erased him, but it does not prove intent."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "vorathis-outside-serpent",
    "title": "Vorathis Is From Outside The Frame",
    "premise": "If the Colossal Serpent is the container of reality, Vorathis reads like a pressure from beyond that container rather than a normal divine actor inside it.",
    "evidenceIds": [
      "npcs-vorathis",
      "concepts-colossal-serpent",
      "world-valaron",
      "concepts-gods-and-deities"
    ],
    "counterpoints": [
      "This depends on treating the Serpent cosmology as structurally true rather than symbolic."
    ],
    "speculationLevel": "High"
  },
  {
    "id": "tritonis-siren-boundary",
    "title": "Tritonis And The Sirens Mark A Sea Boundary",
    "premise": "The sea may be one of Valaron's oldest borders: Tritonis governs its storms while the Sirens embody the dangerous memory and lure of what lies beneath.",
    "evidenceIds": [
      "npcs-tritonis",
      "bestiary-sirens",
      "world-solaris-isle",
      "npcs-ravenna"
    ],
    "counterpoints": [
      "The Siren thread and Tritonis thread are thematically aligned, but not directly joined by a source link."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "sapphire-crypt-sentinel",
    "title": "Sapphire Guards More Than The Crypts",
    "premise": "Sapphire's tie to the Citadel and Runemark suggests she may guard a moral secret as much as a physical underground space.",
    "evidenceIds": [
      "npcs-sapphire",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity",
      "bestiary-kikimoras"
    ],
    "counterpoints": [
      "Her official role is guardian-like, but the scope of what she knows is not explicitly confirmed."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "kikimoras-citadel-guilt",
    "title": "Kikimoras Are Citadel Guilt Given Shape",
    "premise": "The Kikimoras may be less random crypt creatures and more a lingering symptom of the Citadel's hidden sacrifice and the Runemark's price.",
    "evidenceIds": [
      "bestiary-kikimoras",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity",
      "civilizations-arvendor"
    ],
    "counterpoints": [
      "The bestiary record does not explicitly say they are created by the Runemark."
    ],
    "speculationLevel": "High"
  },
  {
    "id": "oakenra-memory-network",
    "title": "Oakenra May Be Valaron's Living Backup",
    "premise": "The Oakenra and Oakrum read like a living archive: a civilization whose survival matters because memory itself can be destroyed, bent, or erased.",
    "evidenceIds": [
      "civilizations-oakenra",
      "npcs-oakrum",
      "npcs-chronar",
      "overview"
    ],
    "counterpoints": [
      "The Oakenra pages emphasize age and memory, but not a formal world-preservation duty."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "mahol-knowledge-cost",
    "title": "Mahol Is The Warning Label On Knowledge",
    "premise": "Mahol's thread beside O'lo, the First People, and divine records suggests that wisdom in Valaron always carries a cost, not just enlightenment.",
    "evidenceIds": [
      "npcs-mahol",
      "npcs-o-lo",
      "civilizations-the-first-people",
      "concepts-gods-and-deities"
    ],
    "counterpoints": [
      "Mahol's exact role varies by linked record, so this is a pattern read rather than a direct claim."
    ],
    "speculationLevel": "Low"
  },
  {
    "id": "lunar-vigil-celestial-politics",
    "title": "The Lunar Vigil May Be Watching The Wrong Sky",
    "premise": "Virel, the Lunar Vigil, Eldorian, and the celestial system imply that sky-worship may be a political technology as much as a spiritual practice.",
    "evidenceIds": [
      "npcs-virel",
      "concepts-cults",
      "world-celestial-system",
      "civilizations-eldorian"
    ],
    "counterpoints": [
      "The cult material supports a connection to celestial belief, but not a confirmed political program."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "supreme-one-divine-stalemate",
    "title": "The Supreme One May Be A Stalemate, Not A Ruler",
    "premise": "The divine map around The Supreme One, Gall'har, Mortem, Ebris, and O'lo looks less like a hierarchy and more like a tense balance of incompatible forces.",
    "evidenceIds": [
      "npcs-the-supreme-one",
      "npcs-gall-har",
      "npcs-mortem",
      "npcs-ebris",
      "npcs-o-lo"
    ],
    "counterpoints": [
      "The title 'The Supreme One' still points to primacy, even if the surrounding records feel unstable."
    ],
    "speculationLevel": "Medium"
  },
  {
    "id": "spectral-entity-water-witness",
    "title": "The Spectral Entity Is A Witness, Not A Person",
    "premise": "The Spectral Entity's water-consciousness framing suggests Valaron may contain non-human observers whose memories do not fit civilization history.",
    "evidenceIds": [
      "npcs-the-spectral-entity",
      "world-valaron",
      "concepts-colossal-serpent",
      "bestiary-sirens"
    ],
    "counterpoints": [
      "This is a metaphysical interpretation; the official entry does not define the entity's cosmic purpose."
    ],
    "speculationLevel": "High"
  }
] as const satisfies readonly LoreTheory[];

export const LORE_TIMELINE = [
  {
    "id": "age-ancients",
    "era": "10,000,000+ BR",
    "title": "The Age Of The Ancients",
    "entryIds": [
      "civilizations-the-ancients",
      "world-history"
    ],
    "summary": "The oldest official marker belongs to the Ancients, long before recorded kingdoms, wars, or modern calendars."
  },
  {
    "id": "age-splendor",
    "era": "500,000 BR",
    "title": "The Age Of Splendor",
    "entryIds": [
      "civilizations-the-first-people",
      "concepts-gods-and-deities",
      "world-history"
    ],
    "summary": "The First People live during an age of old gods, scattered temples, simple prosperity, and worship carried across the earth."
  },
  {
    "id": "great-fragmentation",
    "era": "200,000 BR",
    "title": "The Great Fragmentation",
    "entryIds": [
      "world-history",
      "world-valaron",
      "concepts-colossal-serpent"
    ],
    "summary": "Valaron fractures into drifting landmasses. Scholars call it natural evolution, while darker theories whisper about the Serpent blinking."
  },
  {
    "id": "oakenra-roots",
    "era": "25,000 BR",
    "title": "The Oakenra Civilization Emerges",
    "entryIds": [
      "civilizations-oakenra",
      "world-history",
      "npcs-oakrum"
    ],
    "summary": "The Oakenra appear as one of Valaron's oldest named civilizations, carrying memory through wisdom, age, and living roots."
  },
  {
    "id": "arvendor-foundation",
    "era": "200 BR",
    "title": "The Rise Of Arvendor",
    "entryIds": [
      "civilizations-arvendor",
      "world-history",
      "world-valaron"
    ],
    "summary": "Arvendor rises before recorded history begins, later shaping the official account of divinity, war, and civilization."
  },
  {
    "id": "recorded-history",
    "era": "0 AR",
    "title": "Recorded History Begins",
    "entryIds": [
      "world-history",
      "overview",
      "npcs-edric"
    ],
    "summary": "The calendar turns from Before Record to After Record, giving later historians a formal starting point for the official chronicle."
  },
  {
    "id": "citadel-discovery",
    "era": "37 AR",
    "title": "The Citadel Is Discovered",
    "entryIds": [
      "world-the-citadel",
      "civilizations-arvendor",
      "artifacts-the-runemark-of-eternity"
    ],
    "summary": "Arvendor discovers the Citadel, setting up the fortress, the crypts, and the Runemark thread that later bends history around itself."
  },
  {
    "id": "ombric-break",
    "era": "3,200 AR",
    "title": "The Ombric Civilization Forms",
    "entryIds": [
      "civilizations-ombric",
      "civilizations-arvendor",
      "npcs-astaroth",
      "npcs-ravenna"
    ],
    "summary": "The Ombric enter the official timeline, carrying the underworld thread of exile, transformation, resentment, and buried Arvendorian guilt."
  },
  {
    "id": "eldoria-founding",
    "era": "4,500 AR",
    "title": "Eldoria Is Founded",
    "entryIds": [
      "civilizations-eldorian",
      "world-solaris-isle",
      "world-history"
    ],
    "summary": "Eldoria begins its imperial record, eventually becoming a keeper of knowledge whose archives challenge Arvendor's clean version of history."
  },
  {
    "id": "mokthar-marker",
    "era": "5,001 AR",
    "title": "The Mokthar Enter Historical Records",
    "entryIds": [
      "civilizations-mokthar",
      "world-history"
    ],
    "summary": "The warrior civilization is marked in the archive as a force tied to Ardenfell and the wider world."
  },
  {
    "id": "great-war-arvendor-ombric",
    "era": "8,700 AR",
    "title": "The Great War Between Arvendor And Ombric",
    "entryIds": [
      "world-history",
      "civilizations-arvendor",
      "civilizations-ombric",
      "world-the-citadel",
      "artifacts-the-runemark-of-eternity"
    ],
    "summary": "The war burns through bloodlines and reaches the crypts under the Citadel, where mass death is used to empower the Runemark of Eternity."
  },
  {
    "id": "dark-chapter-eldoria",
    "era": "9,407 AR",
    "title": "The Dark Chapter Of Eldoria",
    "entryIds": [
      "world-history",
      "civilizations-eldorian"
    ],
    "summary": "Eldoria's shameful chapter begins with an emperor's attempted genocide, a wound the empire would later prefer to forget."
  },
  {
    "id": "great-fire-eldoria",
    "era": "9,480 AR",
    "title": "The Great Fire Of Eldoria",
    "entryIds": [
      "world-history",
      "civilizations-eldorian",
      "civilizations-arvendor"
    ],
    "summary": "A massive fire destroys priceless Eldorian archives. The official page leaves room for the suspicion that the loss was deliberate."
  },
  {
    "id": "present-archive",
    "era": "13,903 AR",
    "title": "Current Day",
    "entryIds": [
      "world-history",
      "overview",
      "npcs-edric"
    ],
    "summary": "The present day sits on top of buried wars, missing records, Ombric unrest, and Edric's dangerous effort to preserve what can still be known."
  }
] as const satisfies readonly LoreTimelineEvent[];

export const LORE_ITEM_LINKS = [
  {
    "itemName": "Runemark of Eternity",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel",
      "civilizations-the-ancients"
    ],
    "reason": "Exact artifact match from the official lore archive.",
    "confidence": "canon"
  },
  {
    "itemName": "Mysterious Rune",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Rune-themed item connected to the Runemark/Citadel thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Coffer",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound naming aligns with the Citadel rune archive.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Coffer (Recipes)",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound recipe thread linked by naming to the rune archive.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Bulwark",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Bulwark is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Helm",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Helm is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Shinplates",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Shinplates is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Footwraps",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Footwraps is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runeblade Sword",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runeblade Sword is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runeblade Dagger",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runeblade Dagger is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Rune-etched Reeler",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Rune-etched Reeler is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Rune-etched Reeler Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Rune-etched Reeler Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runeblade Dagger Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runeblade Dagger Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runeblade Sword Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runeblade Sword Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Bulwark Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Bulwark Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Footwraps Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Footwraps Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Helm Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Helm Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Runebound Shinplates Recipe",
    "entryIds": [
      "artifacts-the-runemark-of-eternity",
      "world-the-citadel"
    ],
    "reason": "Runebound Shinplates Recipe is treated as a rune-themed equipment thread.",
    "confidence": "inferred"
  },
  {
    "itemName": "Siren's Scales",
    "entryIds": [
      "bestiary-sirens"
    ],
    "reason": "Exact bestiary material match for the Siren thread.",
    "confidence": "canon"
  },
  {
    "itemName": "Siren's Soulstone",
    "entryIds": [
      "bestiary-sirens"
    ],
    "reason": "Exact bestiary material match for the Siren thread.",
    "confidence": "canon"
  },
  {
    "itemName": "Guardian's Citadel",
    "entryIds": [
      "world-the-citadel"
    ],
    "reason": "Citadel-named item connected to the Citadel world record.",
    "confidence": "inferred"
  },
  {
    "itemName": "Guardian's Citadel (Recipes)",
    "entryIds": [
      "world-the-citadel"
    ],
    "reason": "Citadel-named recipe connected to the Citadel world record.",
    "confidence": "inferred"
  },
  {
    "itemName": "Mirage Citadel Alchemy Chest",
    "entryIds": [
      "world-the-citadel"
    ],
    "reason": "Citadel-named chest connected to the Citadel world record.",
    "confidence": "inferred"
  },
  {
    "itemName": "Serpent's Covert",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Covert is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent's Covert (Recipes)",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Covert (Recipes) is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent Scale",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent Scale is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpentstrike",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpentstrike is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent's Kiss",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Kiss is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent's Arrow",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Arrow is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent Scale Recipe",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent Scale Recipe is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent's Arrow Recipe",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Arrow Recipe is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpent's Kiss Recipe",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpent's Kiss Recipe is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  },
  {
    "itemName": "Serpentstrike Recipe",
    "entryIds": [
      "concepts-colossal-serpent"
    ],
    "reason": "Serpentstrike Recipe is a serpent-themed item; this is a thematic lore hook, not proof of canon identity.",
    "confidence": "theory"
  }
] as const satisfies readonly LoreItemLink[];

export const LORE_ENTRY_BY_ID = Object.fromEntries(LORE_ENTRIES.map((entry) => [entry.id, entry])) as Record<string, LoreEntry>;

export function getLoreForItem(itemName: string) {
  return LORE_ITEM_LINKS.filter((link) => link.itemName.toLowerCase() === itemName.toLowerCase());
}

export function getLoreEntry(id: string) {
  return LORE_ENTRY_BY_ID[id];
}
