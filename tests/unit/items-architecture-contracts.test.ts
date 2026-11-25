import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import {
  SORT_OPTIONS,
  SIGNAL_OPTIONS,
  EQUIPMENT_TYPES,
  SECONDARY_PRODUCTION_TYPES,
  CONSTRUCTION_OUTPUT_PATTERN,
  GATHERING_ACTION_ITEMS,
  ITEM_DB_VIEW_STORAGE_KEY,
  DESKTOP_ITEM_BATCH_SIZE,
  MOBILE_ITEM_BATCH_SIZE,
  COMPACT_BADGE_LIMIT,
  formatLabel,
  formatGold,
  getNumericRequirementEntries,
  getRequiredLevel,
  formatRequirements,
  isRareManualMarketItem,
  isRareOrLimitedHistoryItem,
  descriptionMarksNonTradeable,
  getMarketConfidence,
  getGatheringActionSource,
  isDefaultAlchemyCraft,
  tokenizeSearchText,
  buildItemSearchText,
  matchesSearchToken,
  getMarketWarningLabel,
} from '@/app/items/page';
import { useItemsState } from '@/app/items/hooks/useItemsState';
import { useItemsData } from '@/app/items/hooks/useItemsData';
import { useItemsFilter } from '@/app/items/hooks/useItemsFilter';
import { ItemsHeader } from '@/app/items/components/ItemsHeader';
import { ItemsFilterBar } from '@/app/items/components/ItemsFilterBar';
import { ItemsTable } from '@/app/items/components/ItemsTable';
import { ItemsCardGrid } from '@/app/items/components/ItemsCardGrid';
import { ItemsPagination } from '@/app/items/components/ItemsPagination';
import { ItemBadges, ItemCompactBadges } from '@/app/items/components/ItemBadges';
import { ItemSearchBox } from '@/app/items/components/ItemSearchBox';

describe('items architecture and modularization contracts', () => {
  const itemsDir = path.join(process.cwd(), 'src', 'app', 'items');
  const pagePath = path.join(itemsDir, 'page.tsx');
  const typesPath = path.join(itemsDir, 'types.ts');
  const hooksDir = path.join(itemsDir, 'hooks');
  const componentsDir = path.join(itemsDir, 'components');

  it('orchestrator page.tsx is strictly under 200 lines', () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, 'utf-8');
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(200);
  });

  it('types.ts exists and exports required constants and helpers', () => {
    expect(existsSync(typesPath)).toBe(true);
    expect(SORT_OPTIONS.length).toBeGreaterThan(0);
    expect(SIGNAL_OPTIONS.length).toBeGreaterThan(0);
    expect(EQUIPMENT_TYPES.has('SWORD')).toBe(true);
    expect(SECONDARY_PRODUCTION_TYPES.has('METAL_BAR')).toBe(true);
    expect(CONSTRUCTION_OUTPUT_PATTERN.test('wooden plank')).toBe(true);
    expect(GATHERING_ACTION_ITEMS.clay).toBeDefined();
    expect(ITEM_DB_VIEW_STORAGE_KEY).toBe('zenith_items_view_mode');
    expect(DESKTOP_ITEM_BATCH_SIZE).toBe(48);
    expect(MOBILE_ITEM_BATCH_SIZE).toBe(36);
    expect(COMPACT_BADGE_LIMIT).toBe(4);
  });

  it('exports dedicated custom hooks', () => {
    expect(existsSync(path.join(hooksDir, 'useItemsState.ts'))).toBe(true);
    expect(existsSync(path.join(hooksDir, 'useItemsData.ts'))).toBe(true);
    expect(existsSync(path.join(hooksDir, 'useItemsFilter.ts'))).toBe(true);
    expect(typeof useItemsState).toBe('function');
    expect(typeof useItemsData).toBe('function');
    expect(typeof useItemsFilter).toBe('function');
  });

  it('contains all required feature and section components', () => {
    const requiredComponents = [
      'ItemsHeader.tsx',
      'ItemsFilterBar.tsx',
      'ItemsTable.tsx',
      'ItemsCardGrid.tsx',
      'ItemsPagination.tsx',
      'ItemBadges.tsx',
      'ItemSearchBox.tsx',
    ];
    for (const comp of requiredComponents) {
      expect(existsSync(path.join(componentsDir, comp)), `Missing component: ${comp}`).toBe(true);
    }
    expect(existsSync(path.join(itemsDir, 'Items.module.css'))).toBe(true);
    expect(existsSync(path.join(componentsDir, 'ItemsStyles.tsx'))).toBe(false);
    expect(existsSync(path.join(componentsDir, 'ItemFilterPicker.tsx'))).toBe(false);
  });

  it('exports valid component functions', () => {
    expect(typeof ItemsHeader).toBe('function');
    expect(typeof ItemsFilterBar).toBe('function');
    expect(typeof ItemsTable).toBe('function');
    expect(typeof ItemsCardGrid).toBe('function');
    expect(typeof ItemsPagination).toBe('function');
    expect(typeof ItemBadges).toBe('function');
    expect(typeof ItemCompactBadges).toBe('function');
    expect(typeof ItemSearchBox).toBe('function');
  });

  it('orchestrator defines layout containment and min-height to guarantee zero CLS', () => {
    const pageContent = readFileSync(pagePath, 'utf-8');
    expect(pageContent).toContain('contain: \'layout\'');
    expect(pageContent).toMatch(/minHeight:\s*['"]640px['"]/);
    expect(pageContent).not.toContain('StateBlock');
  });

  it('orchestrator delegates all state and computation to custom hooks with zero inline fetch or heavy computation', () => {
    const pageContent = readFileSync(pagePath, 'utf-8');
    expect(pageContent).not.toContain('fetch(');
    expect(pageContent).not.toContain('localStorage.');
    expect(pageContent).not.toContain('window.matchMedia');
    expect(pageContent).not.toContain('.filter(');
    expect(pageContent).not.toContain('.sort(');
  });

  it('Items.module.css uses valid scoped styles, >= 44px targets, reduced-motion safety, and Astral Slate tokens', () => {
    const cssPath = path.join(itemsDir, 'Items.module.css');
    const content = readFileSync(cssPath, 'utf-8');
    const root = postcss.parse(content);
    expect(root.nodes.length).toBeGreaterThan(10);

    expect(content).toContain('var(--border-subtle)');
    expect(content).toContain('var(--text-muted)');
    expect(content).toContain('var(--text-main)');
    expect(content).toContain('var(--bg-base)');
    expect(content).toContain('var(--border-focus)');
    expect(content).toContain('prefers-reduced-motion');
    expect(content).toMatch(/\.sortHeaderButton\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.rowOpenButton\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.advancedFilterSummary\s*\{[^}]*min-height:\s*44px/);
  });

  it('re-exports all pure helpers from page.tsx for backward compatibility', () => {
    expect(typeof formatGold).toBe('function');
    expect(typeof formatLabel).toBe('function');
    expect(typeof getNumericRequirementEntries).toBe('function');
    expect(typeof getRequiredLevel).toBe('function');
    expect(typeof formatRequirements).toBe('function');
    expect(typeof isRareManualMarketItem).toBe('function');
    expect(typeof isRareOrLimitedHistoryItem).toBe('function');
    expect(typeof descriptionMarksNonTradeable).toBe('function');
    expect(typeof getMarketConfidence).toBe('function');
    expect(typeof getGatheringActionSource).toBe('function');
    expect(typeof isDefaultAlchemyCraft).toBe('function');
    expect(typeof tokenizeSearchText).toBe('function');
    expect(typeof buildItemSearchText).toBe('function');
    expect(typeof matchesSearchToken).toBe('function');
    expect(typeof getMarketWarningLabel).toBe('function');
  });
});
