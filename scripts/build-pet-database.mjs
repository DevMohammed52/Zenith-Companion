import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manualDir = path.join(root, "local_data", "derived_manual", "pets");
const cacheDir = path.join(root, "local_data", "idle_mmo_cache", "derived");
const publicDir = path.join(root, "public");

const CELESTIAL_EXCHANGE_URL = "https://web.idle-mmo.com/merchants?category=CELESTIAL_EXCHANGE";
const LEGACY_VAULT_URL = "https://web.idle-mmo.com/merchants?category=LEGACY_VAULT";

const PET_SOURCE_OVERRIDES = {
  Lunark: {
    type: "merchant",
    availability: "available",
    label: "Celestial Exchange",
    merchant: { name: "Celestial Exchange", url: CELESTIAL_EXCHANGE_URL, currency: "shards", price: 300000 },
    notes: ["Available from the Celestial Exchange for 300,000 shards."],
  },
  Orthrus: {
    type: "merchant",
    availability: "available",
    label: "Celestial Exchange",
    merchant: { name: "Celestial Exchange", url: CELESTIAL_EXCHANGE_URL, currency: "shards", price: 300000 },
    notes: ["Available from the Celestial Exchange for 300,000 shards."],
  },
  Lovebuzz: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    imageUrl:
      "https://cdn.idle-mmo.com/cdn-cgi/image/width=250,height=250,format=auto/uploaded/skins/01HP22520ZZ7W2CZTZS38RBXYF.png",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Snowrunner: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 40000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 40,000 shards."],
  },
  Thistlehop: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Nyx: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Ravenwing: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Wingsley: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Nova: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: 30000 },
    notes: ["Event pet; not normally obtainable now. Seen in the Legacy Vault for 30,000 shards."],
  },
  Ollo: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: null },
    notes: ["Event pet; not normally obtainable now. Legacy Vault price still needs confirmation."],
  },
  Nutmeg: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: null },
    notes: ["Event pet; not normally obtainable now. Legacy Vault price still needs confirmation."],
  },
  Rattles: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: null },
    notes: ["Event pet; not normally obtainable now. Legacy Vault price still needs confirmation."],
  },
  Splash: {
    type: "event",
    availability: "legacy_vault",
    label: "Legacy Vault event pet",
    merchant: { name: "Legacy Vault", url: LEGACY_VAULT_URL, currency: "shards", price: null },
    notes: ["Event pet; not normally obtainable now. Legacy Vault price still needs confirmation."],
  },
  "Dead Wyrmshadow": {
    type: "unique",
    availability: "limited_manual_gift",
    label: "Moderator joke gift",
    merchant: null,
    notes: ["Meme pet given to a few Discord moderators by Mike."],
  },
  Tin: {
    type: "unique",
    availability: "unique_owner",
    label: "Unique owner pet",
    merchant: null,
    notes: ["Unique pet for MavenTheLost."],
  },
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readManual(name) {
  return readJson(path.join(manualDir, name));
}

function readManualOptional(name, fallback = null) {
  const file = path.join(manualDir, name);
  return fs.existsSync(file) ? readJson(file) : fallback;
}

function normalizeQuality(value) {
  if (!value) return "UNKNOWN";
  return String(value).trim().toUpperCase();
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function compactListing(listing) {
  return {
    level: listing.pet?.level ?? null,
    quality: normalizeQuality(listing.pet?.quality),
    price: Number(listing.cost?.amount || 0),
    imageUrl: listing.pet?.image_url || null,
  };
}

function buildExchangeBlock(petName) {
  const exchange = exchangeSummaryByPet.get(petName);
  if (!exchange) return null;
  const listings = exchangeListingsByPet.get(petName) || [];
  const prices = listings.map((listing) => listing.price);
  return {
    ...exchange,
    medianPrice: median(prices),
    sampleListings: listings.slice(0, 12).map(({ imageUrl, ...listing }) => listing),
  };
}

const speciesData = readManual("pet_species_stats.json");
const acquisitionData = readManual("pet_acquisition.json");
const rarityData = readManual("pet_rarity.json");
const masteryData = readManual("pet_mastery.json");
const battleZonesData = readManual("pet_battle_zones.json");
const expectedDropsData = readManual("pet_battle_expected_drops.json");
const pricesData = readManual("pet_battle_prices.json");
const megaTestData = readManualOptional("pet_battle_mega_test.json", {});
const valueCalculatorData = readManualOptional("pet_value_calculator.json", {});
const allItemsDb = readJson(path.join(publicDir, "all-items-db.json"));
const exchangePath = path.join(cacheDir, "companion_exchange.json");
const exchangeData = fs.existsSync(exchangePath) ? readJson(exchangePath) : null;

const ZONE_ALIASES = new Map([
  ["Lvl 1 - BB", "Level 1 - Bluebell Hollow"],
  ["Level 1 Zone", "Level 1 - Bluebell Hollow"],
  ["Lvl 8 - WW", "Level  8 - Whispering Woods"],
  ["Level 8 Zone", "Level  8 - Whispering Woods"],
  ["Lvl 18 - EL", "Level 18 - Eldoria"],
  ["Level 18 Zone", "Level 18 - Eldoria"],
  ["Lvl 32 - CC", "Level 32 - Crystal Caverns"],
  ["Level 32 Zone", "Level 32 - Crystal Caverns"],
  ["Lvl 48 - SP", "Level 48 - Skyreach Peak"],
  ["Level 48 Zone", "Level 48 - Skyreach Peak"],
  ["Lvl 60 - EO", "Level 60 - Enchanted Oasis"],
  ["Level 60 Zone", "Level 60 - Enchanted Oasis"],
  ["Lvl 70 - FG", "Level 70 - Floating Gardens of Aetheria"],
  ["Level 70 Zone", "Level 70 - Floating Gardens of Aetheria"],
  ["Lvl 78 - CO", "Level 78 - Celestial Observatory"],
  ["Level 78 Zone", "Level 78 - Celestial Observatory"],
  ["Lvl 92 - IW", "Level 92 - Isle of Whispers"],
  ["Level 92 Zone", "Level 92 - Isle of Whispers"],
  ["Lvl 100 - CI", "Level 100 - Citadel"],
  ["Level 100 Zone", "Level 100 - Citadel"],
]);

function normalizeZoneName(zone) {
  return ZONE_ALIASES.get(zone) || zone;
}

const eggItems = Object.values(allItemsDb).filter((item) => item?.type === "PET_EGG");
const eggByPet = new Map();
for (const egg of eggItems) {
  if (egg.pet?.name) eggByPet.set(egg.pet.name, egg);
}

const acquisitionByPet = new Map();
for (const source of acquisitionData.acquisition || []) {
  for (const egg of source.eggs || []) {
    const petName = String(egg.egg || "").replace(/\s+Egg$/i, "");
    if (!petName) continue;
    const current = acquisitionByPet.get(petName) || [];
    current.push({
      boss: source.boss,
      location: source.location,
      levelRequirement: source.level_requirement,
      egg: egg.egg,
      chancePercent: egg.chance_percent ?? null,
      quality: normalizeQuality(egg.quality),
    });
    acquisitionByPet.set(petName, current);
  }
}

const rarityByPet = new Map();
for (const row of rarityData.rarity || []) {
  rarityByPet.set(row.pet_name, {
    codexId: row.id,
    quality: normalizeQuality(row.quality),
    worldBoss: row.world_boss,
    battlePlusRespawnSeconds: row.battle_plus_respawn_seconds ?? null,
    dropChancePercent: row.drop_chance_percent ?? null,
  });
}

const exchangeSummaryByPet = new Map();
for (const summary of exchangeData?.data?.market_summary || []) {
  exchangeSummaryByPet.set(summary.name, {
    petId: summary.pet_id ?? null,
    listingCount: summary.listing_count || 0,
    minPrice: summary.min_price ?? null,
    maxPrice: summary.max_price ?? null,
    averagePrice: summary.average_price ?? null,
    byQuality: summary.by_quality || {},
  });
}

const exchangeListingsByPet = new Map();
for (const listing of exchangeData?.data?.listings || []) {
  const name = listing.pet?.name;
  if (!name) continue;
  const current = exchangeListingsByPet.get(name) || [];
  current.push(compactListing(listing));
  exchangeListingsByPet.set(name, current);
}

const priceByItem = new Map();
for (const row of pricesData.prices || []) {
  if (!row.loot_name) continue;
  priceByItem.set(String(row.loot_name).toLowerCase(), {
    marketPrice: row.market_price ?? null,
    lastDayPriceAfterTax: row.last_day_price_after_tax ?? null,
    vendor100Barter: row.vendor_100_barter ?? null,
    bestAfterTaxSellValue: row.best_after_tax_sell_value ?? null,
  });
}
for (const row of megaTestData.loot_prices || []) {
  if (!row.item_name) continue;
  const key = String(row.item_name).toLowerCase();
  priceByItem.set(key, {
    ...(priceByItem.get(key) || {}),
    megaLastDayPrice: row.last_day_price ?? null,
    megaLastDayPriceAfterTax: row.last_day_price_after_market_tax ?? null,
    megaManualPrice: row.manual_price ?? null,
    megaManualPriceAfterTax: row.manual_price_after_market_tax ?? null,
  });
}

function isSummaryDropItem(itemName) {
  const normalized = String(itemName || "").trim().replace(/[\s_:-]+/g, " ").toLowerCase();
  return !normalized || ["total", "grand total", "subtotal", "average"].includes(normalized);
}

const expectedDropRows = (expectedDropsData.expected_drops || []).filter((row) => !isSummaryDropItem(row.item_name));
const calculatorDropRows = (megaTestData.calculator_drop_breakdowns || []).filter((row) => !isSummaryDropItem(row.item_name));

const dropsByZone = new Map();
for (const row of expectedDropRows) {
  const zone = normalizeZoneName(row.zone);
  const current = dropsByZone.get(zone) || [];
  current.push({
    itemName: row.item_name,
    expectedDropPercent: row.expected_drop_percent ?? null,
    dropValueShareMaxPrice: row.drop_value_share_max_price ?? null,
    dropValueShareVendor: row.drop_value_share_vendor ?? null,
    valueShareMaxPrice: row.value_share_max_price ?? null,
    prices: priceByItem.get(String(row.item_name || "").toLowerCase()) || null,
    source: "master_expected_drops",
  });
  dropsByZone.set(zone, current);
}
for (const row of calculatorDropRows) {
  const zone = normalizeZoneName(row.normalized_zone || row.zone);
  const current = dropsByZone.get(zone) || [];
  current.push({
    itemName: row.item_name,
    expectedDropPercent: row.drop_percent ?? null,
    totalDrops: row.total_drops ?? null,
    dropValueShare: row.drop_value_share ?? null,
    valueSharePercent: row.value_share_percent ?? null,
    prices: priceByItem.get(String(row.item_name || "").toLowerCase()) || null,
    source: "mega_test_calculator",
  });
  dropsByZone.set(zone, current);
}

const zoneRankingByZone = new Map(
  (megaTestData.zone_rankings || []).map((row) => [
    normalizeZoneName(row.normalized_zone || row.zone),
    row,
  ]),
);

const petValueByName = new Map();
for (const row of valueCalculatorData.egg_price_table || []) {
  if (!row.pet_name) continue;
  petValueByName.set(row.pet_name, {
    ...(petValueByName.get(row.pet_name) || {}),
    eggPrice: row.egg_price ?? null,
  });
}
for (const row of valueCalculatorData.level_100_bonus_table || []) {
  if (!row.pet_name) continue;
  const petName = String(row.pet_name).charAt(0).toUpperCase() + String(row.pet_name).slice(1).toLowerCase();
  petValueByName.set(petName, {
    ...(petValueByName.get(petName) || {}),
    level100Bonus: row.level_100_bonus ?? null,
  });
}
for (const row of valueCalculatorData.pet_accounting || []) {
  if (!row.pet_name) continue;
  const current = petValueByName.get(row.pet_name) || {};
  const samples = current.samples || [];
  samples.push({
    level: row.level ?? null,
    rarity: row.rarity ?? null,
    eggPrice: row.egg_price ?? null,
    roughEstimate: row.rough_estimate ?? null,
  });
  petValueByName.set(row.pet_name, { ...current, samples });
}

const battleByPet = new Map();
for (const zone of battleZonesData.zones || []) {
  for (const pet of zone.pets || []) {
    const current = battleByPet.get(pet.pet_name) || [];
    current.push({
      zone: zone.zone,
      battleTimeSeconds: pet.battle_time_seconds ?? null,
      enemiesBattled: pet.enemies_battled ?? null,
      lootPieces: pet.loot_pieces ?? null,
      expectedRevenuePerBattle: pet.expected_revenue_per_battle ?? null,
      expectedRevenuePerHour: pet.expected_revenue_per_hour ?? null,
      expectedProfitPerBattle: pet.expected_profit_per_battle ?? null,
      expectedProfitPerHourWithSleep: pet.expected_profit_per_hour_with_sleep ?? null,
      expectedProfitPerHourNoSleep: pet.expected_profit_per_hour_no_sleep ?? null,
      expectedProfitPerHourHealingWithSleep: pet.expected_profit_per_hour_healing_with_sleep ?? null,
      profitMargin: pet.profit_margin ?? null,
      foodCostPerHourCheapest: pet.food_cost_per_hour_cheapest ?? null,
      cycle: {
        maxStamina: pet.max_stamina ?? null,
        staminaDrainPerHour: pet.stamina_drain_per_hour ?? null,
        staminaDrainPerBattle: pet.stamina_drain_per_battle ?? null,
        timeBattledForZeroStaminaSeconds: pet.time_battled_for_zero_stamina_seconds ?? null,
        staminaRecoveryZeroToFullSeconds: pet.stamina_recovery_zero_to_full_seconds ?? null,
        battlesBeforeSleep: pet.battles_before_sleep ?? null,
        healthRecoveryZeroToFullSeconds: pet.health_recovery_zero_to_full_seconds ?? null,
        sleepToBattleForStamina: pet.sleep_to_battle_for_stamina ?? null,
        battleToSleepForHp: pet.battle_to_sleep_for_hp ?? null,
      },
      drops: dropsByZone.get(zone.zone) || [],
      ranking: zoneRankingByZone.get(zone.zone) || null,
    });
    battleByPet.set(pet.pet_name, current);
  }
}

const pets = (speciesData.species || []).map((species) => {
  const egg = eggByPet.get(species.name);
  const listings = exchangeListingsByPet.get(species.name) || [];
  const exchange = buildExchangeBlock(species.name);
  const sourceOverride = PET_SOURCE_OVERRIDES[species.name] || null;
  return {
    id: egg?.pet?.id ?? exchange?.petId ?? null,
    hashedId: egg?.pet?.hashed_id ?? null,
    name: species.name,
    quality: normalizeQuality(species.quality),
    imageUrl: sourceOverride?.imageUrl || egg?.pet?.image_url || listings.find((listing) => listing.imageUrl)?.imageUrl || null,
    description: egg?.pet?.description || null,
    egg: egg ? {
      name: egg.name,
      hashedId: egg.hashed_id,
      imageUrl: egg.image_url || null,
      quality: normalizeQuality(egg.quality),
      vendorPrice: egg.vendor_price ?? null,
      isTradeable: Boolean(egg.is_tradeable),
      worldBosses: egg.where_to_find?.world_bosses || [],
    } : null,
    stats: species.stats,
    acquisition: acquisitionByPet.get(species.name) || [],
    sourceOverride,
    rarity: rarityByPet.get(species.name) || null,
    valuation: petValueByName.get(species.name) || null,
    exchange,
    battle: {
      zones: battleByPet.get(species.name) || [],
    },
  };
});

const petsWithEggs = new Set(pets.map((pet) => pet.name));
const extraEggPets = eggItems
  .filter((egg) => egg.pet?.name && !petsWithEggs.has(egg.pet.name))
  .map((egg) => {
    const sourceOverride = PET_SOURCE_OVERRIDES[egg.pet.name] || null;
    return {
      id: egg.pet.id ?? null,
      hashedId: egg.pet.hashed_id ?? null,
      name: egg.pet.name,
      quality: normalizeQuality(egg.quality),
      imageUrl: sourceOverride?.imageUrl || egg.pet.image_url || null,
      description: egg.pet.description || null,
      egg: {
        name: egg.name,
        hashedId: egg.hashed_id,
        imageUrl: egg.image_url || null,
        quality: normalizeQuality(egg.quality),
        vendorPrice: egg.vendor_price ?? null,
        isTradeable: Boolean(egg.is_tradeable),
        worldBosses: egg.where_to_find?.world_bosses || [],
      },
      stats: null,
      acquisition: acquisitionByPet.get(egg.pet.name) || [],
      sourceOverride,
      rarity: rarityByPet.get(egg.pet.name) || null,
      valuation: petValueByName.get(egg.pet.name) || null,
      exchange: buildExchangeBlock(egg.pet.name),
      battle: {
        zones: battleByPet.get(egg.pet.name) || [],
      },
    };
  });

const allPets = [...pets, ...extraEggPets].sort((a, b) => a.name.localeCompare(b.name));

const database = {
  meta: {
    generatedAt: new Date().toISOString(),
    verificationStatus: "research",
    counts: {
      pets: allPets.length,
      petsWithStats: allPets.filter((pet) => pet.stats).length,
      petsWithEggs: allPets.filter((pet) => pet.egg).length,
      petsWithExchangeListings: allPets.filter((pet) => pet.exchange?.listingCount).length,
      exchangeListings: exchangeData?.data?.listings?.length || 0,
      exchangeSpecies: exchangeData?.data?.market_summary?.length || 0,
    },
    sources: [
      "game_info/05_pets/Chapter II - Pets.xlsx",
      "game_info/05_pets/IdleMMO Pet Battles - Master Sheet (Public).xlsx",
      "game_info/05_pets/IdleMMO Pet Battles - Mega Test.xlsx",
      "game_info/05_pets/IMMO - Pet Value Calculator.xlsx",
      "local_data/derived_manual/pets/pet_battle_mega_test.json",
      "local_data/derived_manual/pets/pet_value_calculator.json",
      "public/all-items-db.json",
      "local_data/idle_mmo_cache/derived/companion_exchange.json",
      CELESTIAL_EXCHANGE_URL,
      LEGACY_VAULT_URL,
      "https://wiki.idle-mmo.com/pets/overview",
      "https://wiki.idle-mmo.com/pets/battling",
      "https://wiki.idle-mmo.com/pets/hunting",
      "https://wiki.idle-mmo.com/pets/companion-exchange",
    ],
  },
  formulas: {
    rawStat: "base + ((level - 1) * per_level)",
    petMastery: "Pet Mastery stat bonus uses the published breakpoint table.",
    evolution: "Each evolution stage adds 5% to the chosen stat bonus, up to 25%. UI treats it as an all-stat preview until per-stat allocation is verified.",
    huntingTimePerEnemySeconds: "200 - 125 * ((0.7 * min(agility / 120, 1)) + (0.3 * min(movementSpeed / 100, 1)))",
    battleDurationSeconds: "max(8, 8 + (5.65 * currentHealth) + (15 * (totalPower - 3.9 * averageEnemyLevel)))",
  },
  qualityStamina: {
    battle: masteryData.stamina_drain_by_quality || [],
    hunting: [
      { quality: "STANDARD", hunting_stamina_per_second: 0.025 },
      { quality: "REFINED", hunting_stamina_per_second: 0.022 },
      { quality: "PREMIUM", hunting_stamina_per_second: 0.019 },
      { quality: "EPIC", hunting_stamina_per_second: 0.016 },
      { quality: "LEGENDARY", hunting_stamina_per_second: 0.013 },
      { quality: "MYTHIC", hunting_stamina_per_second: 0.01 },
    ],
  },
  mastery: {
    levels: masteryData.pet_mastery || [],
    concurrentSlots: masteryData.concurrent_slots || [],
    lootChanceBreakpoints: masteryData.loot_chance_breakpoints || [],
  },
  pets: allPets,
  acquisition: acquisitionData.acquisition || [],
  battleZones: battleZonesData.zones || [],
  battlePrices: pricesData.prices || [],
  battleExpectedDrops: expectedDropRows,
  supplementalBattleResearch: {
    zoneRankings: megaTestData.zone_rankings || [],
    foodPrices: [
      ...(pricesData.food_prices || []),
      ...(megaTestData.food_prices || []),
    ],
    valueFormula: valueCalculatorData.valuation_formula || null,
    leveling: valueCalculatorData.leveling || [],
  },
  exchange: {
    fetchedAt: exchangeData?.meta?.all_file?.fetched_at || exchangeData?.meta?.generated_at || null,
    listingCount: exchangeData?.data?.listings?.length || 0,
    speciesCount: exchangeData?.data?.market_summary?.length || 0,
  },
};

fs.writeFileSync(path.join(publicDir, "pet-database.json"), JSON.stringify(database, null, 2));
console.log(`Wrote public/pet-database.json with ${database.pets.length} pets.`);
