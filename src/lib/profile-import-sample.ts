import { normalizeIdleMmoProfileImport, type ImportedProfileDraft } from "@/lib/profile-import";

export function createSampleProfileImportDraft(): ImportedProfileDraft {
  return normalizeIdleMmoProfileImport({
    hash: "SAMPLEzzzzzzzz123456",
    importedAt: "2026-05-14T08:00:00.000Z",
    information: {
      character: {
        name: "Sample Chef",
        class: "Chef",
        total_level: 1843,
        image_url: "https://cdn.idle-mmo.com/uploaded/skins/2h65o3Ag4fa8xWGt1n4ik3xbe0nET7-metaRWltaXIgKHJlcGxhY2UgdGhlIG9sZCBvbmUpLnBuZw==-.png",
        background_url: "https://cdn.idle-mmo.com/skins/backgrounds/default.jpg",
        current_status: "Cooking",
        location: { id: 42, name: "Volcanic Kitchen" },
        guild: { id: 7, tag: "ZEN", level: 12, position: "Member" },
        stats: {
          combat: { level: 100, experience: 123456 },
          strength: { level: 88, experience: 4567 },
          defence: { level: 76, experience: 3456 },
          speed: { level: 70, experience: 2345 },
          dexterity: { level: 81, experience: 3456 },
          "hunting-mastery": { level: 155, experience: 98765 },
          dungeoneering: { level: 92, experience: 87654 },
          "pet-mastery": { level: 25, experience: 7890 },
        },
        skills: {
          cooking: { level: 91, experience: 999999 },
          mining: { level: 45, experience: 1000 },
          alchemy: { level: 67, experience: 55555 },
        },
      },
    },
    metrics: {
      endpoint_updates_at: "2026-05-14T07:58:00.000Z",
      metrics: {
        combat: { kills: 12, deaths: 1 },
        skilling: { cooked_items: 44, gathered_items: 31 },
      },
    },
    pets: {
      pets: [
        {
          id: 1001,
          pet_id: 30,
          name: "Aerion",
          custom_name: "Glow",
          image_url: "https://cdn.idle-mmo.com/uploaded/skins/CczGESMfcJ0kmsCM4lqxTudmTA6K7l-metaYWVyaW9uLnBuZw==-.png",
          quality: "Epic",
          level: 22,
          experience: 500,
          total_experience: 12500,
          equipped: true,
          stats: {
            agility: 8,
            accuracy: 9,
            protection: 7,
            attack_power: 11,
            movement_speed: 4,
            max_stamina: 3,
            critical_damage: 2,
            critical_chance: 1,
          },
          evolution: {
            state: 2,
            max: 5,
            can_evolve: true,
            targets: [{ key: "attack_power", label: "Attack Power" }],
          },
          health: { current: 80, maximum: 100, percentage: 80 },
          location: { id: 11, name: "Forest" },
        },
        {
          id: 1002,
          pet_id: 89,
          name: "Kitchen Sprite",
          custom_name: "",
          quality: "Common",
          level: 9,
          total_experience: 1200,
          equipped: false,
          stats: { agility: 2, accuracy: 3, protection: 1, attack_power: 4 },
        },
      ],
    },
    museum: {
      status: "partial",
      importedAt: "2026-05-14T08:00:00.000Z",
      pagination: {
        currentPage: 1,
        lastPage: 2,
        perPage: 25,
        total: 26,
        fetchedPages: [1],
        failedPages: [2],
      },
      missingOrPrivate: ["museum.page.2"],
      items: [
        { category: "PETS", id: 30, name: "Aerion", quantity: 1, imageUrl: "https://cdn.idle-mmo.com/uploaded/skins/CczGESMfcJ0kmsCM4lqxTudmTA6K7l-metaYWVyaW9uLnBuZw==-.png" },
        { category: "SKINS", id: 9, name: "Chef Robe", quantity: 1, imageUrl: "https://cdn.idle-mmo.com/skins/chef-robe.png" },
      ],
    },
  });
}
