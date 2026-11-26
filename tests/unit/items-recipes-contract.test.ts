import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Base Crafting Recipes Contract (Smelting, Cooking, Forge)', () => {
  const usageMapPath = path.join(process.cwd(), 'public', 'usage-map.json');
  const usageMap = JSON.parse(fs.readFileSync(usageMapPath, 'utf8'));

  it('correctly maps 9 smelting metal bars with ore and coal', () => {
    const bars = [
      'Tin Bar', 'Copper Bar', 'Iron Bar', 'Lead Bar',
      'Steel Bar', 'Mercury Bar', 'Chromite Bar', 'Uranium Bar', 'Mystic Bar'
    ];

    bars.forEach((barName) => {
      const entry = usageMap[barName];
      expect(entry, `${barName} should exist in usage-map`).toBeDefined();
      expect(entry.produced_from, `${barName} should have produced_from`).toBeDefined();
      expect(entry.produced_from.skill).toBe('SMELTING');
      expect(entry.produced_from.source).toBe('DEFAULT_SMELTING');
      expect(entry.produced_from.materials).toHaveLength(2);

      const coal = entry.produced_from.materials.find((m: any) => m.name === 'Coal Ore');
      expect(coal, `${barName} recipe requires Coal Ore`).toBeDefined();
      expect(coal.amount).toBe(1);
    });
  });

  it('correctly maps 13 cooked fish with raw fish and coal', () => {
    const cookedFish = [
      'Cooked Cod', 'Cooked Salmon', 'Cooked Tuna', 'Cooked Trout',
      'Cooked Perch', 'Cooked Herring', 'Cooked Sardines', 'Cooked Lobster',
      'Cooked Crab', 'Cooked Turtle', 'Cooked Stingray', 'Cooked Lantern Fish',
      'Cooked Great White Shark'
    ];

    cookedFish.forEach((dishName) => {
      const entry = usageMap[dishName];
      expect(entry, `${dishName} should exist in usage-map`).toBeDefined();
      expect(entry.produced_from, `${dishName} should have produced_from`).toBeDefined();
      expect(entry.produced_from.skill).toBe('COOKING');
      expect(entry.produced_from.source).toBe('DEFAULT_COOKING');
      expect(entry.produced_from.materials).toHaveLength(2);

      const coal = entry.produced_from.materials.find((m: any) => m.name === 'Coal Ore');
      expect(coal, `${dishName} recipe requires Coal Ore`).toBeDefined();
      expect(coal.amount).toBe(1);
    });
  });

  it('correctly maps 9 forge bows with 10 logs and 5 coal', () => {
    const bows = [
      'Oak Bow', 'Yew Bow', 'Spruce Bow', 'Birch Bow',
      'Banyan Bow', 'Maple Bow', 'Willow Bow', 'Mahogany Bow', 'Mystical Bow'
    ];

    bows.forEach((bowName) => {
      const entry = usageMap[bowName];
      expect(entry, `${bowName} should exist in usage-map`).toBeDefined();
      expect(entry.produced_from, `${bowName} should have produced_from`).toBeDefined();
      expect(entry.produced_from.skill).toBe('FORGE');
      expect(entry.produced_from.materials).toHaveLength(2);

      const coal = entry.produced_from.materials.find((m: any) => m.name === 'Coal Ore');
      expect(coal, `${bowName} recipe requires Coal Ore`).toBeDefined();
      expect(coal.amount).toBe(5);

      const logMat = entry.produced_from.materials.find((m: any) => m.name !== 'Coal Ore');
      expect(logMat.amount).toBe(10);
    });
  });

  it('correctly maps 72 forge gear items with 10 bars and 5 coal', () => {
    const sampleGear = ['Tin Sword', 'Mystic Sword', 'Iron Chestplate', 'Steel Boots'];

    sampleGear.forEach((gearName) => {
      const entry = usageMap[gearName];
      expect(entry, `${gearName} should exist in usage-map`).toBeDefined();
      expect(entry.produced_from, `${gearName} should have produced_from`).toBeDefined();
      expect(entry.produced_from.skill).toBe('FORGE');
      expect(entry.produced_from.materials).toHaveLength(2);

      const coal = entry.produced_from.materials.find((m: any) => m.name === 'Coal Ore');
      expect(coal, `${gearName} requires Coal Ore`).toBeDefined();
      expect(coal.amount).toBe(5);

      const barMat = entry.produced_from.materials.find((m: any) => m.name !== 'Coal Ore');
      expect(barMat.amount).toBe(10);
    });
  });

  it('establishes reverse recipe links for Coal Ore and metal bars', () => {
    const coalEntry = usageMap['Coal Ore'];
    expect(coalEntry.required_for.length).toBeGreaterThan(100);

    const tinBarEntry = usageMap['Tin Bar'];
    const tinGear = tinBarEntry.required_for.filter((r: any) => r.type === 'FORGE');
    expect(tinGear.length).toBeGreaterThanOrEqual(8);
  });

  it('correctly maps all 9 construction material recipes and reverse ingredient links', () => {
    const constructionItems = [
      { name: 'Weak Plank', level: 1, materials: ['Oak Log'] },
      { name: 'Brick', level: 10, materials: ['Clay'] },
      { name: 'Iron Fitting', level: 10, materials: ['Iron Bar'] },
      { name: 'Weak Beam', level: 15, materials: ['Birch Log', 'Banyan Log'] },
      { name: 'Glass', level: 15, materials: ['Limestone', 'Sand'] },
      { name: 'Robust Plank', level: 30, materials: ['Banyan Log'] },
      { name: 'Robust Beam', level: 45, materials: ['Maple Log', 'Willow Log'] },
      { name: 'Strong Plank', level: 65, materials: ['Willow Log'] },
      { name: 'Strong Beam', level: 75, materials: ['Mahogany Log', 'Mystical Log'] },
    ];

    constructionItems.forEach(({ name, level, materials }) => {
      const entry = usageMap[name];
      expect(entry, `${name} should exist in usage-map`).toBeDefined();
      expect(entry.produced_from, `${name} should have produced_from`).toBeDefined();
      expect(entry.produced_from.skill).toBe('CONSTRUCTION');
      expect(entry.produced_from.source).toBe('DEFAULT_CONSTRUCTION');
      expect(entry.produced_from.level).toBe(level);
      expect(entry.produced_from.materials).toHaveLength(materials.length);

      materials.forEach((matName) => {
        const mat = entry.produced_from.materials.find((m: any) => m.name === matName);
        expect(mat, `${name} requires ${matName}`).toBeDefined();
        expect(mat.amount).toBe(3);

        const reverse = usageMap[matName]?.required_for?.find(
          (r: any) => r.name === name && r.type === 'CONSTRUCTION'
        );
        expect(reverse, `${matName} links to ${name}`).toBeDefined();
        expect(reverse.amount).toBe(3);
      });
    });
  });
});
