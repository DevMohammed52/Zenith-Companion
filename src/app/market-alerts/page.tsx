'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Eye,
  LineChart,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useItemModal } from '@/context/ItemModalContext';
import ZenithIcon from '@/components/icons/ZenithIcon';
import QualityText from '@/components/QualityText';
import {
  comparatorLabel,
  collectMarketWatchVendorCandidates,
  createMarketWatchRule,
  evaluateMarketWatchRule,
  formatMarketWatchValue,
  MARKET_WATCH_METRIC_OPTIONS,
  MARKET_WATCH_RULES_EVENT,
  MARKET_WATCH_STORAGE_KEY,
  metricOption,
  sanitizeMarketWatchRules,
  type MarketWatchComparator,
  type MarketWatchMetric,
  type MarketWatchRule,
} from '@/lib/market-alerts';
import type { MarketPriceDatum } from '@/lib/market-pricing';
import { useProfiles } from '@/lib/profiles';
import { getProfileBarteringBoost } from '@/lib/profile-calculations';

type FilterOption<T extends string> = {
  value: T;
  label: string;
  detail?: string;
};

type ItemOption = {
  name: string;
  imageUrl: string;
  type: string;
  quality: string;
  id: string;
  searchText: string;
};

type NotificationState = NotificationPermission | 'unsupported';
type WatchFilter = 'all' | 'triggered' | 'enabled' | 'paused';

const metricOptions: FilterOption<MarketWatchMetric>[] = MARKET_WATCH_METRIC_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  detail: option.detail,
}));

const watchFilterOptions: Array<{ value: WatchFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'triggered', label: 'Triggered' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'paused', label: 'Paused' },
];

const formatGold = (value: number) => `${Math.round(value).toLocaleString()}g`;

const formatAge = (value?: string | number | null) => {
  if (!value) return 'Waiting for data';
  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return 'Waiting for data';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getItemSearchText = (item: Pick<ItemOption, 'name' | 'type' | 'quality'>) => (
  `${item.name} ${item.type} ${item.quality}`.toLowerCase()
);

const getMarketUpdatedAt = (marketData: Record<string, any> | null, scraperStatus: Record<string, unknown> | null) => {
  const metaUpdated = typeof marketData?._meta?.last_updated === 'string' ? marketData._meta.last_updated : null;
  const statusUpdated = scraperStatus?.timestamp || scraperStatus?.last_updated;
  return metaUpdated || (typeof statusUpdated === 'string' || typeof statusUpdated === 'number' ? statusUpdated : null);
};

function currentMetricValue({
  metric,
  itemName,
  marketData,
  allItemsDb,
  barteringBoost,
}: {
  metric: MarketWatchMetric;
  itemName: string;
  marketData: Record<string, MarketPriceDatum> | null;
  allItemsDb: Record<string, any> | null;
  barteringBoost: number;
}) {
  const rule = createMarketWatchRule({
    itemName,
    metric,
    comparator: metricOption(metric).defaultComparator,
    threshold: 1,
  });
  const evaluated = evaluateMarketWatchRule({
    rule,
    market: marketData?.[itemName],
    item: allItemsDb?.[itemName],
    barteringBoostPercent: barteringBoost,
  });
  return evaluated.hasValue ? evaluated.value : 0;
}

function MarketPicker<T extends string>({
  ariaLabel,
  labelledBy,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  labelledBy?: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options[selectedIndex] || options[0];

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const selectOption = (option: FilterOption<T> | undefined) => {
    if (!option) return;
    onChange(option.value);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(selectedIndex);
      return;
    }
    setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const moveActive = (direction: number) => {
    setActiveIndex((current) => (current + direction + options.length) % options.length);
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  };

  return (
    <div
      className={`market-select ${open ? 'open' : ''}`}
      ref={rootRef}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        close(false);
      }}
    >
      <button
        type="button"
        className="market-select-trigger"
        ref={triggerRef}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(event.key === 'ArrowDown' ? selectedIndex : options.length - 1);
          }
        }}
      >
        <span>{selected?.label || 'Select'}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="market-select-menu" role="listbox" aria-label={labelledBy ? undefined : ariaLabel} aria-labelledby={labelledBy} onKeyDown={handleListKeyDown}>
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                className={`market-select-option ${active ? 'active' : ''}`}
                role="option"
                aria-selected={active}
                tabIndex={index === activeIndex ? 0 : -1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.detail && <small>{option.detail}</small>}
                </span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MarketAlertsPage() {
  const { marketData, allItemsDb, scraperStatus, loading, refresh } = useData();
  const { activeProfile } = useProfiles();
  const { openItem, openItemByName } = useItemModal();
  const searchListboxId = useId();
  const builderRef = useRef<HTMLDivElement | null>(null);
  const watchlistRef = useRef<HTMLElement | null>(null);
  const vendorSectionRef = useRef<HTMLElement | null>(null);
  const itemSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [rules, setRules] = useState<MarketWatchRule[]>([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [metric, setMetric] = useState<MarketWatchMetric>('safe_price');
  const [comparator, setComparator] = useState<MarketWatchComparator>('lte');
  const [threshold, setThreshold] = useState('');
  const [notifyByDefault, setNotifyByDefault] = useState(false);
  const [notificationState, setNotificationState] = useState<NotificationState>('unsupported');
  const [manualMessage, setManualMessage] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [watchFilter, setWatchFilter] = useState<WatchFilter>('all');
  const [watchSearch, setWatchSearch] = useState('');
  const [visibleVendorCount, setVisibleVendorCount] = useState(24);
  const marketUpdatedAt = getMarketUpdatedAt(marketData, scraperStatus);
  const typedMarketData = marketData as Record<string, MarketPriceDatum> | null;
  const barteringBoost = getProfileBarteringBoost(activeProfile);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setNotificationState('unsupported');
      return;
    }
    setNotificationState(Notification.permission);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(MARKET_WATCH_STORAGE_KEY);
      setRules(sanitizeMarketWatchRules(stored ? JSON.parse(stored) : []));
    } catch {
      setRules([]);
    } finally {
      setRulesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!rulesLoaded || typeof window === 'undefined') return;
    localStorage.setItem(MARKET_WATCH_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent(MARKET_WATCH_RULES_EVENT));
  }, [rules, rulesLoaded]);

  const itemOptions = useMemo<ItemOption[]>(() => {
    const map = new Map<string, ItemOption>();
    Object.values(allItemsDb || {}).forEach((item: any) => {
      if (!item?.name) return;
      map.set(item.name, {
        name: item.name,
        imageUrl: item.image_url || item.image || '',
        type: item.type || '',
        quality: item.quality || '',
        id: item.hashed_id || item.id || item.name,
        searchText: getItemSearchText({
          name: item.name,
          type: item.type || '',
          quality: item.quality || '',
        }),
      });
    });
    Object.entries(marketData || {}).forEach(([name, market]: [string, any]) => {
      if (name.startsWith('_')) return;
      if (map.has(name)) return;
      map.set(name, {
        name,
        imageUrl: market?.image_url || '',
        type: '',
        quality: '',
        id: market?.hashed_id || name,
        searchText: getItemSearchText({
          name,
          type: '',
          quality: '',
        }),
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItemsDb, marketData]);

  const selectedMarket = selectedItemName ? typedMarketData?.[selectedItemName] || null : null;
  const selectedItemRecord = selectedItemName ? allItemsDb?.[selectedItemName] || null : null;

  useEffect(() => {
    const defaultComparator = metricOption(metric).defaultComparator;
    setComparator(defaultComparator);
    if (!selectedItemName) return;
    const value = currentMetricValue({
      metric,
      itemName: selectedItemName,
      marketData: typedMarketData,
      allItemsDb,
      barteringBoost,
    });
    if (value > 0) {
      const suggested = defaultComparator === 'gte' ? Math.ceil(value) : Math.floor(value);
      setThreshold(String(Math.max(1, suggested)));
    }
  }, [metric, selectedItemName, typedMarketData, allItemsDb, barteringBoost]);

  const matchedItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return itemOptions;
    const tokens = query.split(/\s+/).filter(Boolean);
    return itemOptions
      .filter((item) => tokens.every((token) => item.searchText.includes(token)));
  }, [itemOptions, searchTerm]);
  const filteredItems = useMemo(() => matchedItems.slice(0, 10), [matchedItems]);
  const hiddenResultCount = Math.max(0, matchedItems.length - filteredItems.length);

  const selectedItemMatchesSearch = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!selectedItemName) return false;
    return selectedItemName.toLowerCase() === query;
  }, [searchTerm, selectedItemName]);
  const hasSearchQuery = searchTerm.trim().length > 0;
  const showItemResults = hasSearchQuery && filteredItems.length > 0 && !selectedItemMatchesSearch;
  const activeSearchOptionId = showItemResults && filteredItems[activeSearchIndex]
    ? `${searchListboxId}-option-${activeSearchIndex}`
    : undefined;

  const evaluations = useMemo(() => rules.map((rule) => evaluateMarketWatchRule({
    rule,
    market: typedMarketData?.[rule.itemName],
    item: allItemsDb?.[rule.itemName],
    barteringBoostPercent: barteringBoost,
    fallbackUpdatedAt: typeof marketUpdatedAt === 'string' ? marketUpdatedAt : undefined,
  })), [rules, typedMarketData, allItemsDb, barteringBoost, marketUpdatedAt]);

  const openMarketItem = React.useCallback((hashedId: string | undefined, itemName: string) => {
    if (hashedId) {
      openItem(hashedId);
      return;
    }
    openItemByName(itemName);
  }, [openItem, openItemByName]);

  useEffect(() => {
    if (!rulesLoaded || !typedMarketData) return;
    const byRuleId = new Map(evaluations.map((evaluation) => [evaluation.rule.id, evaluation]));
    const pendingNotifications: typeof evaluations = [];
    const checkedAt = new Date().toISOString();
    let changed = false;

    const nextRules = rules.map((rule) => {
      const evaluation = byRuleId.get(rule.id);
      if (!evaluation || !rule.enabled || !evaluation.hasValue || rule.lastCheckedKey === evaluation.snapshotKey) {
        return rule;
      }
      changed = true;
      const shouldTrigger = evaluation.conditionMet && rule.lastConditionMet !== true;
      if (shouldTrigger) pendingNotifications.push(evaluation);
      return {
        ...rule,
        lastCheckedKey: evaluation.snapshotKey,
        lastSeenValue: evaluation.value,
        lastConditionMet: evaluation.conditionMet,
        lastTriggeredAt: shouldTrigger ? checkedAt : rule.lastTriggeredAt,
        lastTriggeredKey: shouldTrigger ? evaluation.triggerKey : rule.lastTriggeredKey,
      };
    });

    if (!changed) return;
    setRules(nextRules);

    if (pendingNotifications.length && notificationState === 'granted') {
      pendingNotifications
        .filter((evaluation) => evaluation.rule.notify)
        .forEach((evaluation) => {
          try {
            new Notification('Zenith market watch', {
              body: `${evaluation.title}: ${evaluation.body}`,
              tag: evaluation.rule.id,
            });
          } catch {}
        });
    }
  }, [evaluations, notificationState, rules, rulesLoaded, typedMarketData]);

  const activeAlerts = evaluations.filter((evaluation) => evaluation.conditionMet);
  const filteredEvaluations = useMemo(() => {
    const query = watchSearch.trim().toLowerCase();
    return evaluations.filter((evaluation) => {
      if (watchFilter === 'triggered' && !evaluation.conditionMet) return false;
      if (watchFilter === 'enabled' && !evaluation.rule.enabled) return false;
      if (watchFilter === 'paused' && evaluation.rule.enabled) return false;
      if (!query) return true;
      return [
        evaluation.rule.itemName,
        evaluation.metricLabel,
        evaluation.valueLabel,
        evaluation.thresholdLabel,
      ].join(' ').toLowerCase().includes(query);
    });
  }, [evaluations, watchFilter, watchSearch]);
  const enabledRules = rules.filter((rule) => rule.enabled).length;
  const notificationRules = rules.filter((rule) => rule.notify).length;
  const vendorCandidateCollection = useMemo(() => collectMarketWatchVendorCandidates({
    marketData: typedMarketData,
    allItemsDb,
    barteringBoostPercent: barteringBoost,
    minimumMargin: 1,
    includeNearVendor: true,
  }), [typedMarketData, allItemsDb, barteringBoost]);
  const vendorCandidates = useMemo(() => vendorCandidateCollection.candidates.slice(0, 250), [vendorCandidateCollection]);
  const vendorSummary = vendorCandidateCollection.summary;
  const visibleVendorCandidates = vendorCandidates.slice(0, visibleVendorCount);
  const activeProfileName = activeProfile?.name?.trim() || 'No profile';
  const snapshotAgeLabel = formatAge(marketUpdatedAt);
  const rulesHealthLabel = `${enabledRules}/${rules.length} active`;
  const alertsHealthLabel = activeAlerts.length
    ? `${activeAlerts.length} live match${activeAlerts.length === 1 ? '' : 'es'}`
    : 'No live matches';
  const notificationHealthLabel = notificationState === 'granted'
    ? `${notificationRules} notification rule${notificationRules === 1 ? '' : 's'}`
    : notificationState === 'unsupported'
      ? 'Notifications unsupported'
      : `Notifications ${notificationState}`;
  const vendorSignalLabel = vendorSummary.profitableRows > 0
    ? `${vendorSummary.profitableRows.toLocaleString()} below vendor`
    : `${vendorSummary.nearVendorRows.toLocaleString()} near vendor`;

  useEffect(() => {
    setVisibleVendorCount(24);
  }, [barteringBoost, typedMarketData]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchTerm, filteredItems.length]);

  const selectSearchItem = (item: ItemOption) => {
    setSelectedItemName(item.name);
    setSearchTerm(item.name);
    setActiveSearchIndex(0);
  };

  const createRule = () => {
    const thresholdValue = Number(threshold);
    if (!selectedItemName || !selectedItemMatchesSearch || !Number.isFinite(thresholdValue) || thresholdValue <= 0) return;
    const rule = createMarketWatchRule({
      itemName: selectedItemName,
      metric,
      comparator,
      threshold: thresholdValue,
      notify: notifyByDefault && notificationState === 'granted',
    });
    setRules((current) => [rule, ...current].slice(0, 100));
    setManualMessage(`Watching ${selectedItemName}.`);
  };

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationState('unsupported');
      setManualMessage('This browser does not support local notifications.');
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationState(result);
    if (result === 'granted') {
      setNotifyByDefault(true);
      try {
        new Notification('Zenith market watch', {
          body: 'Browser alerts are enabled while Zenith Companion can run in this browser.',
          tag: 'zenith-market-watch-test',
        });
      } catch {}
    } else {
      setManualMessage('Browser notifications are not enabled.');
    }
  };

  const removeRule = (ruleId: string) => {
    setRules((current) => current.filter((rule) => rule.id !== ruleId));
  };

  const updateRule = (ruleId: string, patch: Partial<MarketWatchRule>) => {
    setRules((current) => current.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule));
  };

  const addVendorRule = (candidate: { itemName: string; margin: number }) => {
    const thresholdValue = Math.max(1, Math.floor(candidate.margin));
    setRules((current) => [
      createMarketWatchRule({
        itemName: candidate.itemName,
        metric: 'vendor_margin',
        comparator: 'gte',
        threshold: thresholdValue,
        notify: notifyByDefault && notificationState === 'granted',
      }),
      ...current,
    ].slice(0, 100));
    setManualMessage(`Watching vendor margin on ${candidate.itemName}.`);
  };

  const getScrollBehavior = (): ScrollBehavior => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  );

  const focusRuleBuilder = () => {
    builderRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    window.setTimeout(() => itemSearchInputRef.current?.focus(), 180);
  };

  const jumpToWatchlist = () => {
    watchlistRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
  };

  const jumpToVendorWatch = () => {
    vendorSectionRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
  };

  const selectedEvaluation = selectedItemName ? evaluateMarketWatchRule({
    rule: createMarketWatchRule({
      itemName: selectedItemName,
      metric,
      comparator,
      threshold: Number(threshold) || 1,
    }),
    market: selectedMarket,
    item: selectedItemRecord,
    barteringBoostPercent: barteringBoost,
    fallbackUpdatedAt: typeof marketUpdatedAt === 'string' ? marketUpdatedAt : undefined,
  }) : null;
  const canCreateRule = Boolean(selectedItemName && selectedItemMatchesSearch && Number(threshold) > 0);

  return (
    <main className="container market-watch-page">
      <section className="market-hero">
        <div className="market-hero-copy">
          <span className="eyebrow"><ZenithIcon name="bell" size={15} /> Market Watch</span>
          <h1>Local market alerts</h1>
          <p>
            Watch generated market-history snapshots for price thresholds, sold-price moves, stable volume changes, and vendor-margin candidates.
          </p>
          <div className="market-hero-chips" aria-label="Market watch context">
            <span><Clock3 size={14} aria-hidden="true" /> {snapshotAgeLabel}</span>
            <span><Eye size={14} aria-hidden="true" /> {rulesHealthLabel}</span>
            <span className={activeAlerts.length ? 'hot' : ''}><BellRing size={14} aria-hidden="true" /> {alertsHealthLabel}</span>
          </div>
          <div className="market-quick-actions" aria-label="Market watch quick actions">
            <button type="button" onClick={focusRuleBuilder}>
              <Search size={15} aria-hidden="true" /> Add watch
            </button>
            <button type="button" onClick={jumpToWatchlist}>
              <Eye size={15} aria-hidden="true" /> Watchlist
            </button>
            <button type="button" onClick={jumpToVendorWatch}>
              <CircleDollarSign size={15} aria-hidden="true" /> Vendor
            </button>
            <button type="button" onClick={() => refresh()} aria-busy={loading} disabled={loading}>
              <RefreshCcw size={15} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>
        <div className="market-hero-card">
          <span>Active profile</span>
          <strong>{activeProfileName}</strong>
          <small>{barteringBoost ? `+${barteringBoost}% vendor value from bartering` : 'Base vendor value'}</small>
          <div className="market-hero-metrics" aria-label="Market watch summary">
            <span><small>Alerts</small><b>{alertsHealthLabel}</b></span>
            <span><small>Notify</small><b>{notificationHealthLabel}</b></span>
            <span><small>Vendor</small><b>{vendorSignalLabel}</b></span>
          </div>
        </div>
      </section>

      <section className="market-watch-note warning" aria-label="Experimental feature notice">
        <ShieldAlert size={17} aria-hidden="true" />
        <span>
          Market Watch is experimental. It is being trialed to see whether snapshot-based alerts are useful in normal play. If it proves unreliable or creates more confusion than value, it may be changed or removed later.
        </span>
      </section>

      <section className="market-status-grid" aria-label="Market watch status">
        <div>
          <Clock3 size={17} />
          <span>Data snapshot</span>
          <strong>{snapshotAgeLabel}</strong>
        </div>
        <div>
          <Eye size={17} />
          <span>Watch rules</span>
          <strong>{enabledRules} / {rules.length}</strong>
        </div>
        <div className={activeAlerts.length ? 'alerting' : ''}>
          <ShieldAlert size={17} />
          <span>Current alerts</span>
          <strong>{activeAlerts.length}</strong>
        </div>
        <div>
          <Bell size={17} />
          <span>Notify while open</span>
          <strong>{notificationState === 'granted' ? `${notificationRules} rules` : notificationState === 'unsupported' ? 'Unsupported' : notificationState}</strong>
        </div>
      </section>

      <section className="market-watch-note">
        <LineChart size={17} aria-hidden="true" />
        <span>
          Alerts use generated market-history snapshots, not live listings. They can flag thresholds, but they cannot see private buyers, off-app trades, or bulk undercutting, so confirm official listings before buying, selling, or mass crafting.
        </span>
      </section>

      <section className="market-watch-layout">
        <div ref={builderRef} className="watch-builder">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Rule builder</span>
              <h2>Add a watch</h2>
            </div>
            <button type="button" className="soft-icon-button" onClick={() => refresh()} aria-label="Refresh market data" aria-busy={loading} disabled={loading}>
              <RefreshCcw size={16} />
            </button>
          </div>

          <div className="watch-field">
            <label htmlFor="market-watch-search">Item</label>
            <div className="watch-search" role="combobox" aria-expanded={showItemResults} aria-controls={showItemResults ? searchListboxId : undefined} aria-haspopup="listbox">
              <Search size={16} aria-hidden="true" />
              <input
                id="market-watch-search"
                type="text"
                aria-label="Search item history"
                aria-activedescendant={activeSearchOptionId}
                ref={itemSearchInputRef}
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedItemName('');
                }}
                onKeyDown={(event) => {
                  if (!showItemResults) return;
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveSearchIndex((index) => Math.min(filteredItems.length - 1, index + 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveSearchIndex((index) => Math.max(0, index - 1));
                  } else if (event.key === 'Enter') {
                    event.preventDefault();
                    const item = filteredItems[activeSearchIndex];
                    if (item) selectSearchItem(item);
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    setSearchTerm(selectedItemName);
                  }
                }}
                placeholder="Search item history..."
                autoComplete="off"
              />
            </div>
            {showItemResults ? (
              <div className="item-pick-list" id={searchListboxId} role="listbox" aria-label="Matching items">
                {filteredItems.map((item, index) => {
                  const active = item.name === selectedItemName;
                  const market = typedMarketData?.[item.name];
                  return (
                    <button
                      type="button"
                      key={item.name}
                      id={`${searchListboxId}-option-${index}`}
                      className={active || index === activeSearchIndex ? 'active' : ''}
                      role="option"
                      aria-selected={active || index === activeSearchIndex}
                      onMouseEnter={() => setActiveSearchIndex(index)}
                      onClick={() => selectSearchItem(item)}
                    >
                      {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="item-pick-fallback" />}
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.type || (item.quality ? <QualityText value={item.quality}>{item.quality}</QualityText> : 'Market item')}</small>
                      </span>
                      <em>{market ? formatMarketWatchValue('safe_price', Number(market.safe_price || market.price || 0)) : '-'}</em>
                    </button>
                  );
                })}
                {hiddenResultCount > 0 && (
                  <div className="item-result-hint" role="status">
                    Showing first 10 matches. Type more of the item name to narrow {hiddenResultCount.toLocaleString()} more.
                  </div>
                )}
              </div>
            ) : hasSearchQuery && filteredItems.length === 0 ? (
              <div className="inline-status search-empty">No matching item history. Pick an item from the list before adding a watch.</div>
            ) : !selectedItemName ? (
              <div className="selected-item-hint muted">
                <Search size={14} aria-hidden="true" />
                <span>Choose an item from search results before adding a watch.</span>
              </div>
            ) : (
              <div className="selected-item-hint">
                <Check size={14} aria-hidden="true" />
                <span>{selectedItemName}</span>
              </div>
            )}
          </div>

          <div className="watch-form-grid">
            <div className="watch-field">
              <label id="market-watch-metric-label">Metric</label>
              <MarketPicker
                ariaLabel="Market watch metric"
                labelledBy="market-watch-metric-label"
                options={metricOptions}
                value={metric}
                onChange={setMetric}
              />
            </div>
            <div className="watch-field">
              <label id="market-watch-trigger-label">Trigger</label>
              <div className="comparator-control" role="group" aria-labelledby="market-watch-trigger-label">
                <button
                  type="button"
                  className={comparator === 'lte' ? 'active' : ''}
                  aria-pressed={comparator === 'lte'}
                  onClick={() => setComparator('lte')}
                >
                  Below
                </button>
                <button
                  type="button"
                  className={comparator === 'gte' ? 'active' : ''}
                  aria-pressed={comparator === 'gte'}
                  onClick={() => setComparator('gte')}
                >
                  Above
                </button>
              </div>
            </div>
            <div className="watch-field">
              <label htmlFor="market-watch-threshold">Threshold</label>
              <input
                id="market-watch-threshold"
                type="number"
                aria-label="Market watch threshold"
                min="0"
                inputMode="numeric"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                placeholder="Gold, volume, or ratio"
              />
            </div>
          </div>

          {selectedEvaluation && (
            <div className={`watch-preview ${selectedEvaluation.conditionMet ? 'triggered' : ''}`}>
              <span>{selectedEvaluation.metricLabel}</span>
              <strong>{selectedEvaluation.valueLabel}</strong>
              <small>
                Current snapshot is {selectedEvaluation.comparatorLabel} {selectedEvaluation.thresholdLabel}
                {selectedEvaluation.conditionMet ? '.' : ' only if it crosses your threshold.'}
              </small>
              <small>If the current snapshot already matches, it appears in Snapshot matches immediately.</small>
              {!selectedItemMatchesSearch && (
                <small className="warn-copy">Select a matching item result before creating a new watch.</small>
              )}
            </div>
          )}

          <div className="notify-row">
            <button
              type="button"
              className={notifyByDefault ? 'toggle-pill active' : 'toggle-pill'}
              aria-pressed={notifyByDefault}
              onClick={() => setNotifyByDefault((current) => !current)}
              disabled={notificationState !== 'granted'}
            >
              <Bell size={15} /> Notify while open
            </button>
            {notificationState !== 'granted' && (
              <button type="button" className="secondary-action" onClick={requestNotifications}>
                Enable browser permission
              </button>
            )}
          </div>
          <p className="notify-helper">
            Runs locally while this browser has Zenith open. Your browser will ask for permission before notifications are enabled.
          </p>

          <button
            type="button"
            className="primary-action"
            disabled={!canCreateRule}
            onClick={createRule}
          >
            <Plus size={16} /> Add watch
          </button>

          {manualMessage && <div className="inline-status">{manualMessage}</div>}
        </div>

        <div className="alert-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">In-app alerts</span>
              <h2>Snapshot matches</h2>
            </div>
            <span className="panel-count">{activeAlerts.length}</span>
          </div>
          {activeAlerts.length === 0 ? (
            <div className="empty-state">
              <Bell size={30} />
              <p>No current rule matches. Rules are checked whenever the market snapshot refreshes while the app is open.</p>
            </div>
          ) : (
            <div className="alert-list">
              {activeAlerts.map((evaluation) => (
                <article key={evaluation.rule.id} className={`alert-card ${evaluation.tone}`}>
                  <div>
                    <span>{evaluation.metricLabel}</span>
                    <strong>{evaluation.rule.itemName}</strong>
                    <p>{evaluation.body}</p>
                  </div>
                  <button type="button" onClick={() => openMarketItem(evaluation.item?.hashed_id, evaluation.rule.itemName)} aria-label={`Open ${evaluation.rule.itemName}`}>
                    <ExternalLink size={15} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section ref={watchlistRef} className="watch-rules-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Saved locally</span>
            <h2>Watchlist</h2>
          </div>
          <span className="panel-count">{rules.length}</span>
        </div>
        {rules.length > 0 && (
          <div className="watchlist-controls" aria-label="Watchlist filters">
            <div className="watchlist-filter-row" role="group" aria-label="Watchlist status filters">
              {watchFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={watchFilter === option.value ? 'active' : ''}
                  aria-pressed={watchFilter === option.value}
                  onClick={() => setWatchFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="watchlist-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="text"
                aria-label="Search saved watch rules"
                value={watchSearch}
                onChange={(event) => setWatchSearch(event.target.value)}
                placeholder="Search saved rules..."
              />
            </label>
          </div>
        )}
        {rules.length === 0 ? (
          <div className="empty-state wide">
            <Eye size={30} />
            <p>No saved watch rules yet. Add a rule above to track market-history thresholds on this browser.</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="empty-state wide">
            <Eye size={30} />
            <p>No saved rules match the current watchlist filter.</p>
          </div>
        ) : (
          <div className="watch-rule-grid">
            {filteredEvaluations.map((evaluation) => (
              <article key={evaluation.rule.id} className={`watch-rule-card ${evaluation.conditionMet ? 'triggered' : ''}`}>
                <div className="rule-topline">
                  <div>
                    <span>{evaluation.metricLabel}</span>
                    <strong>{evaluation.rule.itemName}</strong>
                  </div>
                  <div className="rule-actions">
                    <button
                      type="button"
                      className={evaluation.rule.enabled ? 'mini-toggle active' : 'mini-toggle'}
                      aria-pressed={evaluation.rule.enabled}
                      aria-label={`${evaluation.rule.enabled ? 'Disable' : 'Enable'} ${evaluation.rule.itemName} watch`}
                      onClick={() => updateRule(evaluation.rule.id, { enabled: !evaluation.rule.enabled })}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{evaluation.rule.enabled ? 'On' : 'Off'}</span>
                    </button>
                    <button
                      type="button"
                      className={evaluation.rule.notify ? 'mini-toggle active' : 'mini-toggle'}
                      aria-pressed={evaluation.rule.notify}
                      aria-label={`${evaluation.rule.notify ? 'Disable' : 'Enable'} browser notification for ${evaluation.rule.itemName}`}
                      disabled={notificationState !== 'granted'}
                      onClick={() => updateRule(evaluation.rule.id, { notify: !evaluation.rule.notify })}
                    >
                      <Bell size={14} aria-hidden="true" />
                      <span>Bell</span>
                    </button>
                    <button type="button" className="icon-danger" onClick={() => removeRule(evaluation.rule.id)} aria-label={`Remove ${evaluation.rule.itemName} watch`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="rule-metrics">
                  <div>
                    <span>Current</span>
                    <strong>{evaluation.valueLabel}</strong>
                  </div>
                  <div>
                    <span>Rule</span>
                    <strong>{comparatorLabel(evaluation.rule.comparator)} {evaluation.thresholdLabel}</strong>
                  </div>
                  <div>
                    <span>Last trigger</span>
                    <strong>{evaluation.rule.lastTriggeredAt ? formatAge(evaluation.rule.lastTriggeredAt) : '-'}</strong>
                  </div>
                </div>
                <p>{evaluation.hasValue ? evaluation.note : 'No usable market-history value is available for this rule yet.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section ref={vendorSectionRef} className="vendor-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow"><CircleDollarSign size={15} /> Vendor candidates</span>
            <h2>Vendor margin watch</h2>
          </div>
          <span className="panel-count">+{barteringBoost}%</span>
        </div>
        <p className="section-note">
          These are not live listing opportunities. Below-vendor rows are already under your profile-adjusted vendor value; near-vendor rows are close enough to watch for the next snapshot.
        </p>
        <div className="vendor-summary" aria-label="Vendor candidate summary">
          <span><strong>{vendorSummary.profitableRows.toLocaleString()}</strong> below vendor</span>
          <span><strong>{vendorSummary.nearVendorRows.toLocaleString()}</strong> near vendor</span>
          <span><strong>{vendorSummary.pricedRows.toLocaleString()}</strong> priced rows</span>
        </div>
        {vendorCandidates.length === 0 ? (
          <div className="empty-state wide">
            <CircleDollarSign size={30} />
            <p>
              No market-history averages are near your current profile-adjusted vendor value.
              Vendor checks compare market average against your active profile&apos;s vendor value; higher bartering profiles can reveal more rows to watch.
            </p>
          </div>
        ) : (
          <>
          <div className="vendor-grid">
            {visibleVendorCandidates.map((candidate) => {
              const imageUrl = candidate.item?.image_url || candidate.item?.image || candidate.market?.image_url || '';
              return (
                <article key={candidate.itemName} className={`vendor-card ${candidate.status === 'below_vendor' ? 'below-vendor' : 'near-vendor'}`}>
                  <div className="vendor-item">
                    {imageUrl ? <img src={imageUrl} alt="" /> : <span className="item-pick-fallback" />}
                    <div>
                      <strong>{candidate.itemName}</strong>
                      <span>{candidate.status === 'below_vendor' ? 'Below vendor' : 'Near vendor'} - {candidate.liquidity.label}</span>
                    </div>
                  </div>
                  <div className="vendor-card-grid">
                    <span><small>Market avg</small><strong>{formatGold(candidate.marketValue)}</strong></span>
                    <span><small>Vendor</small><strong>{formatGold(candidate.vendorValue)}</strong></span>
                    <span>
                      <small>{candidate.margin >= 0 ? 'Margin' : 'Gap'}</small>
                      <strong className={candidate.margin >= 0 ? 'good' : 'watch-gap'}>
                        {candidate.margin >= 0 ? formatGold(candidate.margin) : `${formatGold(Math.abs(candidate.margin))} over`}
                      </strong>
                    </span>
                  </div>
                  <div className="vendor-actions">
                    <button type="button" onClick={() => openMarketItem(candidate.item?.hashed_id, candidate.itemName)}>Open item</button>
                    <button type="button" onClick={() => addVendorRule(candidate)}>Watch below vendor</button>
                  </div>
                </article>
              );
            })}
          </div>
          {visibleVendorCandidates.length < vendorCandidates.length && (
            <button
              type="button"
              className="secondary-action vendor-more"
              onClick={() => setVisibleVendorCount((current) => current + 24)}
            >
              Show more candidates ({visibleVendorCandidates.length} / {vendorCandidates.length})
            </button>
          )}
          </>
        )}
      </section>

      {loading && <div className="inline-status">Loading market snapshot...</div>}

      <style jsx>{`
        .market-watch-page {
          padding-bottom: 4rem;
          overflow-x: hidden;
        }
        .market-hero {
          align-items: stretch;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
          margin-bottom: 1rem;
        }
        .market-hero h1 {
          color: var(--text-main);
          font-size: clamp(2.1rem, 5vw, 4rem);
          letter-spacing: 0;
          line-height: 1;
          margin: 0.35rem 0 0.75rem;
        }
        .market-hero p,
        .section-note {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.55;
          margin: 0;
          max-width: 820px;
        }
        .eyebrow {
          align-items: center;
          color: var(--text-accent);
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .market-hero-card,
        .market-status-grid > div,
        .watch-builder,
        .alert-panel,
        .watch-rules-section,
        .vendor-section {
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012));
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
        }
        .market-hero-card {
          display: grid;
          gap: 0.35rem;
          padding: 1.1rem;
        }
        .market-hero-card span,
        .market-hero-card small,
        .market-status-grid span,
        .watch-field label,
        .watch-preview span,
        .rule-topline span,
        .rule-metrics span,
        .vendor-card-grid small {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .market-hero-card strong {
          color: #fff;
          font-size: 1.15rem;
        }
        .market-status-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .market-status-grid > div {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          padding: 0.9rem;
        }
        .market-status-grid svg {
          color: var(--text-accent);
        }
        .market-status-grid strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 1.2rem;
          overflow-wrap: anywhere;
        }
        .market-watch-note {
          align-items: flex-start;
          background: rgba(56,189,248,0.07);
          border: 1px solid rgba(56,189,248,0.22);
          border-radius: 8px;
          color: var(--text-muted);
          display: flex;
          font-size: 0.86rem;
          font-weight: 750;
          gap: 0.65rem;
          line-height: 1.45;
          margin-bottom: 1rem;
          padding: 0.8rem 0.95rem;
        }
        .market-watch-note svg {
          color: var(--text-accent);
          flex: 0 0 auto;
          margin-top: 0.1rem;
        }
        .market-watch-note.warning {
          background: rgba(245,158,11,0.09);
          border-color: rgba(245,158,11,0.32);
          color: #f8e7bd;
        }
        .market-watch-note.warning svg {
          color: #fbbf24;
        }
        .market-watch-layout {
          align-items: start;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          margin-bottom: 1rem;
        }
        .watch-builder,
        .alert-panel,
        .watch-rules-section,
        .vendor-section {
          min-width: 0;
          padding: 1rem;
        }
        .panel-heading {
          align-items: center;
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 1rem;
          min-width: 0;
        }
        .panel-heading h2 {
          color: #fff;
          font-size: 1.05rem;
          margin: 0.25rem 0 0;
        }
        .panel-count {
          background: color-mix(in srgb, var(--text-accent), transparent 84%);
          border: 1px solid var(--border-focus);
          border-radius: 999px;
          color: var(--text-main);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 900;
          padding: 0.3rem 0.6rem;
          white-space: nowrap;
        }
        .watch-field {
          display: grid;
          gap: 0.45rem;
          min-width: 0;
        }
        .watch-search {
          align-items: center;
          display: flex;
          position: relative;
        }
        :global(.market-watch-page .watch-search svg) {
          color: var(--text-muted);
          left: 0.75rem;
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        .watch-field input,
        .watch-search input {
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-main);
          font: inherit;
          font-size: 0.9rem;
          font-weight: 800;
          min-height: 42px;
          min-width: 0;
          padding: 0.65rem 0.75rem;
          width: 100%;
        }
        .watch-search input {
          padding-left: 2.35rem;
        }
        .watch-field input:focus,
        .watch-search input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        .item-pick-list {
          display: grid;
          gap: 0.4rem;
          margin-top: 0.55rem;
        }
        .item-pick-list button {
          align-items: center;
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: inherit;
          cursor: pointer;
          display: grid;
          gap: 0.65rem;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          min-height: 48px;
          min-width: 0;
          padding: 0.55rem;
          text-align: left;
          width: 100%;
        }
        .item-pick-list button:hover,
        .item-pick-list button:focus-visible,
        .item-pick-list button.active {
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
          border-color: var(--border-focus);
          outline: none;
        }
        .item-pick-list img,
        .item-pick-fallback {
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          display: block;
          height: 34px;
          width: 34px;
        }
        .item-pick-list strong,
        .vendor-item strong {
          color: #fff;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-pick-list small,
        .vendor-item span,
        .watch-rule-card p {
          color: var(--text-muted);
          display: block;
          font-size: 0.75rem;
          line-height: 1.4;
          margin-top: 0.12rem;
        }
        .item-pick-list em {
          color: var(--text-success);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-style: normal;
          font-weight: 900;
        }
        .item-result-hint,
        .notify-helper {
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.45;
        }
        .item-result-hint {
          background: rgba(255,255,255,0.022);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          padding: 0.55rem 0.65rem;
        }
        .search-empty {
          margin-top: 0.55rem;
        }
        .selected-item-hint {
          align-items: center;
          color: var(--text-muted);
          display: inline-flex;
          font-size: 0.78rem;
          font-weight: 850;
          gap: 0.35rem;
          margin-top: 0.45rem;
          min-width: 0;
        }
        .selected-item-hint svg {
          color: var(--text-success);
          flex: 0 0 auto;
        }
        .selected-item-hint.muted svg {
          color: var(--text-muted);
        }
        .selected-item-hint span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .watch-form-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: minmax(0, 1.1fr) minmax(140px, 0.8fr) minmax(140px, 0.8fr);
          margin-top: 0.85rem;
          position: relative;
          z-index: 45;
        }
        :global(.market-watch-page .market-select) {
          position: relative;
          z-index: 20;
        }
        :global(.market-watch-page .market-select.open) {
          z-index: 90;
        }
        :global(.market-watch-page .market-select-trigger) {
          align-items: center;
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 900;
          gap: 0.6rem;
          justify-content: space-between;
          min-height: 42px;
          padding: 0.6rem 0.7rem;
          text-align: left;
          width: 100%;
        }
        :global(.market-watch-page .market-select-trigger:focus-visible),
        :global(.market-watch-page .market-select.open .market-select-trigger) {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        :global(.market-watch-page .market-select-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.market-watch-page .market-select-menu) {
          background: color-mix(in srgb, var(--bg-base), black 18%);
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.42);
          display: grid;
          gap: 0.3rem;
          left: 0;
          margin-top: 0.35rem;
          max-height: min(360px, 62vh);
          min-width: min(360px, calc(100vw - 2rem));
          overflow-y: auto;
          padding: 0.35rem;
          position: absolute;
          top: 100%;
          width: max-content;
          max-width: calc(100vw - 2rem);
          z-index: 120;
        }
        :global(.market-watch-page .market-select-option) {
          align-items: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          font: inherit;
          font-size: 0.83rem;
          gap: 0.65rem;
          justify-content: space-between;
          min-height: 44px;
          padding: 0.5rem 0.6rem;
          text-align: left;
          width: 100%;
        }
        :global(.market-watch-page .market-select-option:hover),
        :global(.market-watch-page .market-select-option.active) {
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          border-color: rgba(56,189,248,0.24);
        }
        :global(.market-watch-page .market-select-option strong) {
          display: block;
          font-weight: 900;
        }
        :global(.market-watch-page .market-select-option small) {
          color: var(--text-muted);
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 0.15rem;
        }
        .comparator-control {
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          display: flex;
          min-height: 42px;
          overflow: hidden;
        }
        .comparator-control button {
          background: transparent;
          border: 0;
          color: var(--text-muted);
          cursor: pointer;
          flex: 1;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
        }
        .comparator-control button.active {
          background: var(--text-accent);
          color: #050505;
        }
        .watch-preview {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 0.3rem;
          margin-top: 0.85rem;
          padding: 0.75rem;
        }
        .watch-preview.triggered {
          border-color: rgba(34,197,94,0.34);
          background: rgba(34,197,94,0.08);
        }
        .watch-preview strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 1.15rem;
        }
        .watch-preview small {
          color: var(--text-muted);
          line-height: 1.4;
        }
        .watch-preview .warn-copy {
          color: var(--text-warning, #fbbf24);
        }
        .notify-row {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.85rem;
        }
        .notify-helper {
          margin: 0.45rem 0 0;
        }
        .toggle-pill,
        .secondary-action,
        .primary-action,
        .soft-icon-button,
        .mini-toggle,
        .icon-danger,
        .alert-card button,
        .vendor-actions button {
          align-items: center;
          border-radius: 7px;
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-weight: 900;
          gap: 0.4rem;
          justify-content: center;
        }
        .toggle-pill,
        .secondary-action,
        .soft-icon-button,
        .mini-toggle,
        .icon-danger,
        .alert-card button,
        .vendor-actions button {
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
        }
        .toggle-pill {
          min-height: 44px;
          padding: 0 0.8rem;
        }
        .toggle-pill.active,
        .mini-toggle.active {
          background: color-mix(in srgb, var(--text-accent), transparent 86%);
          border-color: var(--border-focus);
        }
        .toggle-pill:disabled,
        .mini-toggle:disabled,
        .primary-action:disabled,
        .soft-icon-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .secondary-action,
        .primary-action {
          min-height: 44px;
          padding: 0 0.9rem;
        }
        .primary-action {
          background: var(--text-accent);
          border: 0;
          color: #050505;
          margin-top: 0.85rem;
          width: 100%;
        }
        .soft-icon-button,
        .icon-danger,
        .alert-card button {
          height: 44px;
          min-width: 44px;
          width: 44px;
        }
        .icon-danger {
          color: var(--text-danger);
        }
        .inline-status {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 800;
          margin-top: 0.75rem;
          padding: 0.65rem 0.75rem;
        }
        .empty-state {
          align-items: center;
          background: rgba(255,255,255,0.018);
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          min-height: 220px;
          justify-content: center;
          padding: 1rem;
          text-align: center;
        }
        .empty-state.wide {
          min-height: 150px;
        }
        .empty-state p {
          line-height: 1.5;
          margin: 0;
          max-width: 520px;
        }
        .alert-list,
        .watch-rule-grid,
        .vendor-grid {
          display: grid;
          gap: 0.75rem;
        }
        .alert-card {
          align-items: start;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: minmax(0, 1fr) auto;
          padding: 0.85rem;
        }
        .alert-card.good {
          border-color: rgba(34,197,94,0.36);
          background: rgba(34,197,94,0.06);
        }
        .alert-card.warn {
          border-color: rgba(251,191,36,0.32);
          background: rgba(251,191,36,0.06);
        }
        .alert-card span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .alert-card strong {
          color: #fff;
          display: block;
          margin-top: 0.2rem;
        }
        .alert-card p {
          color: var(--text-muted);
          font-size: 0.84rem;
          line-height: 1.45;
          margin: 0.35rem 0 0;
        }
        .watch-rules-section,
        .vendor-section {
          margin-top: 1rem;
        }
        .watchlist-controls {
          align-items: center;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
          margin: -0.25rem 0 1rem;
        }
        .watchlist-filter-row {
          display: flex;
          gap: 0.45rem;
          min-width: 0;
          overflow-x: auto;
          padding-bottom: 0.1rem;
          scrollbar-width: thin;
        }
        .watchlist-filter-row button {
          flex: 0 0 auto;
          min-height: 40px;
          min-width: max-content;
          padding: 0 0.75rem;
        }
        .watchlist-filter-row button.active {
          background: rgba(56,189,248,0.16);
          border-color: rgba(56,189,248,0.42);
          color: #fff;
        }
        .watchlist-search {
          align-items: center;
          background: rgba(0,0,0,0.26);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: flex;
          gap: 0.55rem;
          min-width: 0;
          padding: 0 0.75rem;
        }
        .watchlist-search svg {
          color: var(--text-muted);
          flex: 0 0 auto;
        }
        .watchlist-search input {
          background: transparent;
          border: 0;
          color: var(--text-main);
          font: inherit;
          font-weight: 750;
          min-height: 42px;
          min-width: 0;
          outline: 0;
          width: 100%;
        }
        .watchlist-search:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
        }
        .watch-rule-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
        }
        .watch-rule-card,
        .vendor-card {
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          min-width: 0;
          padding: 0.85rem;
        }
        .vendor-card.below-vendor {
          border-color: rgba(34,197,94,0.28);
          box-shadow: inset 0 0 0 1px rgba(34,197,94,0.06);
        }
        .vendor-card.near-vendor {
          border-color: rgba(251,191,36,0.22);
        }
        .watch-rule-card.triggered {
          border-color: rgba(34,197,94,0.34);
          box-shadow: inset 0 0 0 1px rgba(34,197,94,0.08);
        }
        .rule-topline {
          align-items: flex-start;
          display: flex;
          gap: 0.75rem;
          justify-content: space-between;
          min-width: 0;
        }
        .rule-topline strong {
          color: #fff;
          display: block;
          margin-top: 0.25rem;
          overflow-wrap: anywhere;
        }
        .rule-actions {
          display: flex;
          flex: 0 0 auto;
          flex-wrap: wrap;
          gap: 0.35rem;
          justify-content: flex-end;
        }
        .mini-toggle {
          font-size: 0.72rem;
          min-height: 40px;
          min-width: 44px;
          padding: 0 0.55rem;
        }
        .rule-metrics {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin: 0.85rem 0;
        }
        .rule-metrics div,
        .vendor-card-grid span {
          background: rgba(0,0,0,0.16);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px;
          min-width: 0;
          padding: 0.55rem;
        }
        .rule-metrics strong,
        .vendor-card-grid strong {
          color: #fff;
          display: block;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          margin-top: 0.18rem;
          overflow-wrap: anywhere;
        }
        .vendor-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          margin-top: 1rem;
        }
        .vendor-summary {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 0.85rem;
        }
        .vendor-summary span {
          background: rgba(255,255,255,0.022);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1.3;
          min-width: 0;
          padding: 0.65rem;
        }
        .vendor-summary strong {
          color: #fff;
          display: block;
          font-family: var(--font-mono);
          font-size: 1rem;
          margin-bottom: 0.12rem;
        }
        .vendor-item {
          align-items: center;
          display: grid;
          gap: 0.65rem;
          grid-template-columns: 40px minmax(0, 1fr);
          margin-bottom: 0.75rem;
        }
        .vendor-item img {
          border-radius: 7px;
          height: 40px;
          width: 40px;
        }
        .vendor-card-grid {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .vendor-card-grid .good {
          color: var(--text-success);
        }
        .vendor-card-grid .watch-gap {
          color: var(--text-warning, #fbbf24);
        }
        .vendor-actions {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: 1fr 1fr;
          margin-top: 0.75rem;
        }
        .vendor-actions button {
          min-height: 44px;
          padding: 0 0.6rem;
        }
        .vendor-more {
          margin-top: 0.85rem;
          width: 100%;
        }
        @media (max-width: 1100px) {
          .market-hero,
          .market-watch-layout {
            grid-template-columns: 1fr;
          }
          .market-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .market-watch-page {
            padding-bottom: 2.5rem;
          }
          .market-hero {
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .market-hero h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          .market-hero p {
            font-size: 0.86rem;
            line-height: 1.45;
          }
          .market-hero-card,
          .market-status-grid > div,
          .watch-builder,
          .alert-panel,
          .watch-rules-section,
          .vendor-section {
            padding: 0.85rem;
          }
          .market-status-grid {
            gap: 0.55rem;
            margin-bottom: 0.75rem;
          }
          .market-status-grid > div {
            padding: 0.7rem;
          }
          .market-status-grid strong {
            font-size: 1rem;
          }
          .market-watch-note {
            font-size: 0.8rem;
            margin-bottom: 0.75rem;
            padding: 0.68rem 0.75rem;
          }
          .watch-form-grid {
            grid-template-columns: 1fr;
          }
          .watchlist-controls {
            grid-template-columns: 1fr;
          }
          .rule-metrics,
          .vendor-card-grid,
          .vendor-summary {
            grid-template-columns: 1fr;
          }
          :global(.market-watch-page .market-select-menu) {
            bottom: 1rem;
            left: 1rem;
            margin-top: 0;
            max-height: min(420px, 62vh);
            max-width: calc(100vw - 2rem);
            min-width: 0;
            position: fixed;
            right: 1rem;
            top: auto;
            width: auto;
          }
        }
        @media (max-width: 520px) {
          .market-status-grid {
            grid-template-columns: 1fr;
          }
          .item-pick-list button {
            grid-template-columns: 32px minmax(0, 1fr);
          }
          .item-pick-list em {
            grid-column: 2;
          }
          .rule-topline {
            display: grid;
          }
          .rule-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(44px, 1fr));
            justify-content: stretch;
          }
          .mini-toggle,
          .icon-danger {
            width: 100%;
          }
          .vendor-actions {
            grid-template-columns: 1fr;
          }
        }
        .market-watch-page {
          --market-gold: #f5b041;
          --market-mint: #34d399;
          --market-sky: #38bdf8;
          --market-rose: #fb7185;
          --market-panel: rgba(9, 13, 17, 0.78);
          -webkit-tap-highlight-color: transparent;
          padding-bottom: clamp(5rem, 8vh, 7.5rem);
        }
        .market-watch-page :where(button, input, [role="button"], [role="option"]) {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .market-watch-page .market-hero {
          position: relative;
          overflow: hidden;
          align-items: stretch;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 8px;
          background:
            linear-gradient(145deg, rgba(56, 189, 248, 0.08), rgba(7, 12, 15, 0.88)),
            radial-gradient(circle at 92% 0%, rgba(245, 176, 65, 0.16), transparent 34%);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
          padding: clamp(1rem, 2.2vw, 1.45rem);
        }
        .market-watch-page .market-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(115deg, rgba(245, 176, 65, 0.13), rgba(52, 211, 153, 0.055) 42%, transparent 68%),
            radial-gradient(circle at 8% 0%, rgba(56, 189, 248, 0.12), transparent 28%);
        }
        .market-watch-page .market-hero > * {
          position: relative;
          z-index: 1;
        }
        .market-watch-page .market-hero-copy {
          min-width: 0;
          display: grid;
          align-content: start;
          gap: 0.78rem;
        }
        .market-watch-page .market-hero-copy .eyebrow,
        .market-watch-page .market-hero-copy p {
          margin: 0;
        }
        .market-watch-page .market-hero-copy p {
          max-width: 72ch;
          line-height: 1.62;
        }
        .market-watch-page .market-hero h1 {
          color: #fffdf8;
          margin: 0;
        }
        .market-watch-page .market-hero-chips,
        .market-watch-page .market-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .market-watch-page .market-hero-chips span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          color: #bae6fd;
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.72rem;
          text-transform: none;
        }
        .market-watch-page .market-hero-chips span.hot {
          border-color: rgba(245, 176, 65, 0.3);
          background: rgba(245, 176, 65, 0.11);
          color: #fde68a;
        }
        .market-watch-page .market-hero-chips svg {
          flex: 0 0 auto;
          color: var(--market-gold);
        }
        .market-watch-page .market-quick-actions {
          margin-top: 0.08rem;
        }
        .market-watch-page .market-quick-actions button {
          min-height: 2.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: 1px solid rgba(245, 176, 65, 0.22);
          border-radius: 8px;
          background: rgba(245, 176, 65, 0.08);
          color: #fde68a;
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          padding: 0.62rem 0.86rem;
        }
        .market-watch-page .market-quick-actions button:hover:not(:disabled) {
          border-color: rgba(56, 189, 248, 0.38);
          background: rgba(56, 189, 248, 0.1);
          color: #e0f2fe;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
          transform: translateY(-1px);
        }
        .market-watch-page .market-hero-card {
          border-color: rgba(56, 189, 248, 0.22);
          background:
            linear-gradient(145deg, rgba(56, 189, 248, 0.1), rgba(0, 0, 0, 0.26)),
            rgba(5, 10, 13, 0.54);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 56px rgba(0, 0, 0, 0.22);
        }
        .market-watch-page .market-hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
          margin-top: 0.42rem;
        }
        .market-watch-page .market-hero-metrics span {
          min-width: 0;
          display: grid;
          gap: 0.18rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
          padding: 0.55rem;
          text-transform: none;
        }
        .market-watch-page .market-hero-metrics small,
        .market-watch-page .market-hero-metrics b {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .market-watch-page .market-hero-metrics small {
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 850;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .market-watch-page .market-hero-metrics b {
          color: var(--text-main);
          font-size: 0.82rem;
          line-height: 1.15;
        }
        .market-watch-page .market-status-grid > div.alerting {
          border-color: rgba(245, 176, 65, 0.28);
          background:
            linear-gradient(145deg, rgba(245, 176, 65, 0.1), rgba(0, 0, 0, 0.14)),
            rgba(255, 255, 255, 0.025);
        }
        .market-watch-page .watch-rules-section {
          position: relative;
          overflow: hidden;
        }
        .market-watch-page .watch-rules-section::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 96% 0%, rgba(56, 189, 248, 0.08), transparent 28%),
            linear-gradient(140deg, transparent 0%, rgba(255, 255, 255, 0.025) 100%);
        }
        .market-watch-page .watch-rules-section > * {
          position: relative;
          z-index: 1;
        }
        .market-watch-page .watch-rules-section .panel-heading {
          align-items: flex-start;
          margin-bottom: 0.85rem;
        }
        .market-watch-page .watch-rules-section .panel-count {
          min-width: 2.35rem;
          height: 2.35rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(56, 189, 248, 0.34);
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.1);
          color: #e0f2fe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 900;
        }
        .market-watch-page .watchlist-controls {
          grid-template-columns: minmax(0, auto) minmax(260px, 400px);
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.14);
          padding: 0.55rem;
        }
        .market-watch-page .watchlist-filter-row {
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          gap: 0.25rem;
          padding: 0.25rem;
        }
        .market-watch-page .watchlist-filter-row button {
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          min-height: 2.35rem;
          padding-inline: 0.85rem;
        }
        .market-watch-page .watchlist-filter-row button:hover {
          background: rgba(255, 255, 255, 0.055);
          color: var(--text-main);
        }
        .market-watch-page .watchlist-filter-row button.active {
          border-color: rgba(56, 189, 248, 0.34);
          background: rgba(56, 189, 248, 0.14);
          color: #e0f2fe;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
        }
        .market-watch-page .watchlist-search {
          justify-self: end;
          width: min(100%, 400px);
          border-color: rgba(255, 255, 255, 0.075);
          background: rgba(0, 0, 0, 0.24);
        }
        .market-watch-page .watch-rule-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 390px), 1fr));
        }
        .market-watch-page .watch-rule-card {
          position: relative;
          overflow: hidden;
          border-color: rgba(255, 255, 255, 0.075);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }
        .market-watch-page .watch-rule-card.triggered {
          background:
            linear-gradient(145deg, rgba(52, 211, 153, 0.095), rgba(0, 0, 0, 0.16)),
            var(--market-panel);
        }
        .market-watch-page .watch-rule-card.triggered::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--market-mint), rgba(56, 189, 248, 0.72));
        }
        .market-watch-page .rule-actions {
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.12);
          padding: 0.25rem;
        }
        .market-watch-page .mini-toggle,
        .market-watch-page .icon-danger {
          min-height: 2.25rem;
          border-radius: 7px;
        }
        .market-watch-page .mini-toggle {
          gap: 0.35rem;
          min-width: 3.6rem;
          padding-inline: 0.62rem;
        }
        .market-watch-page .mini-toggle:not(.active) svg {
          color: var(--text-muted);
        }
        .market-watch-page .mini-toggle.active {
          border-color: rgba(56, 189, 248, 0.34);
          background: rgba(56, 189, 248, 0.14);
          color: #e0f2fe;
        }
        .market-watch-page .rule-metrics div {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.065);
        }
        .market-watch-page .watch-builder,
        .market-watch-page .alert-panel,
        .market-watch-page .watch-rules-section,
        .market-watch-page .vendor-section {
          scroll-margin-top: 1rem;
        }
        .market-watch-page .watch-builder {
          position: relative;
          z-index: 40;
        }
        :global(.market-watch-page .watch-builder:has(.market-select.open)) {
          z-index: 7600;
        }
        .market-watch-page .alert-panel {
          position: relative;
          z-index: 30;
        }
        .market-watch-page .market-hero-card,
        .market-watch-page .market-status-grid > div,
        .market-watch-page .watch-builder,
        .market-watch-page .alert-panel,
        .market-watch-page .watch-rules-section,
        .market-watch-page .vendor-section,
        .market-watch-page .watch-rule-card,
        .market-watch-page .vendor-card,
        .market-watch-page .alert-card,
        .market-watch-page .watch-preview {
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.046), rgba(0, 0, 0, 0.2)),
            var(--market-panel);
          backdrop-filter: blur(16px);
        }
        .market-watch-page .market-hero-card,
        .market-watch-page .market-status-grid > div,
        .market-watch-page .watch-builder,
        .market-watch-page .alert-panel,
        .market-watch-page .watch-rules-section,
        .market-watch-page .vendor-section,
        .market-watch-page .watch-rule-card,
        .market-watch-page .vendor-card,
        .market-watch-page .alert-card,
        .market-watch-page button,
        .market-watch-page :global(.market-select-trigger),
        .market-watch-page :global(.market-select-menu) {
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            color 180ms ease;
        }
        .market-watch-page button:active:not(:disabled),
        .market-watch-page .vendor-card:active,
        .market-watch-page .watch-rule-card:active {
          transform: scale(0.985);
        }
        .market-watch-page .watch-field input:focus-visible,
        .market-watch-page .watch-search input:focus-visible,
        .market-watch-page .watchlist-search input:focus-visible,
        .market-watch-page button:focus-visible,
        .market-watch-page :global(.market-select-trigger:focus-visible),
        .market-watch-page :global(.market-select-option:focus-visible) {
          outline: 2px solid color-mix(in srgb, var(--market-sky), white 12%);
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.11);
        }
        @media (hover: hover) and (pointer: fine) {
          .market-watch-page .watch-builder:hover,
          .market-watch-page .alert-panel:hover,
          .market-watch-page .watch-rules-section:hover,
          .market-watch-page .vendor-section:hover,
          .market-watch-page .watch-rule-card:hover,
          .market-watch-page .vendor-card:hover,
          .market-watch-page .alert-card:hover {
            transform: translateY(-1px);
            border-color: rgba(245, 176, 65, 0.2);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .market-watch-page *,
          .market-watch-page *::before,
          .market-watch-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        @media (max-width: 1100px) {
          .market-watch-page .market-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .market-watch-page .watchlist-controls {
            grid-template-columns: minmax(0, 1fr);
          }
          .market-watch-page .watchlist-search {
            justify-self: stretch;
            width: 100%;
          }
        }
        @media (max-width: 760px) {
          .market-watch-page {
            padding-bottom: 9rem;
          }
          .market-watch-page .market-hero {
            margin-left: -0.15rem;
            margin-right: -0.15rem;
            padding: 1rem;
          }
          .market-watch-page .market-quick-actions,
          .market-watch-page .market-hero-metrics {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .market-watch-page .market-quick-actions button {
            min-width: 0;
            padding-inline: 0.55rem;
          }
          .market-watch-page .market-hero-chips span {
            width: 100%;
          }
          .market-watch-page .watch-rules-section .panel-heading {
            align-items: center;
          }
          .market-watch-page .watchlist-controls {
            padding: 0.45rem;
          }
          .market-watch-page .watchlist-filter-row button {
            padding-inline: 0.7rem;
          }
          .market-watch-page .rule-actions {
            width: 100%;
          }
          .market-watch-page :global(.market-select.open) {
            z-index: 7000;
          }
          .market-watch-page :global(.market-select.open)::before {
            background: rgba(0, 0, 0, 0.32);
            content: "";
            inset: 0;
            position: fixed;
            z-index: 7001;
          }
          .market-watch-page :global(.market-select.open .market-select-trigger) {
            position: relative;
            z-index: 7002;
          }
          .market-watch-page :global(.market-select-menu) {
            bottom: max(1rem, env(safe-area-inset-bottom)) !important;
            left: 1rem !important;
            max-height: min(360px, calc(100dvh - 2rem)) !important;
            max-width: calc(100vw - 2rem);
            position: fixed;
            right: 1rem !important;
            top: auto !important;
            width: auto;
            z-index: 7003;
          }
        }
        @media (max-width: 520px) {
          .market-watch-page .market-quick-actions,
          .market-watch-page .market-hero-metrics {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
