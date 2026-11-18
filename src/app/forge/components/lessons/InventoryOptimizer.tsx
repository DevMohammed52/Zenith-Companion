"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ArrowUpDown, Check, ChevronDown, DollarSign, Flame, Package, Plus, Search, Trash2, TrendingUp, X, Zap } from "lucide-react";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";

export function InventoryOptimizer({
  lessons,
  onSwitchSubView,
}: {
  lessons: UseForgeLessonsReturn;
  onSwitchSubView?: (view: "session" | "planner" | "catalog" | "inventory") => void;
}) {
  const {
    ownedMaterials,
    updateOwnedMaterial,
    clearOwnedMaterials,
    allCalculatedMaterials,
    addToQueue,
    queueAllOwned,
    fillSessionWithMaterial,
  } = lessons;

  const [selectedMatName, setSelectedMatName] = useState<string>(allCalculatedMaterials[0]?.name || "Coal Ore");
  const [comboboxCategory, setComboboxCategory] = useState<"ALL" | "MOB_DROPS" | "ORES" | "BARS" | "LOGS">("ALL");
  const [comboboxSearch, setComboboxSearch] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [rawAddQty, setRawAddQty] = useState<string>("100");
  const [sortBy, setSortBy] = useState<"exp" | "value" | "count" | "name">("exp");
  const comboboxRef = useRef<HTMLDivElement>(null);
  const popoverMenuRef = useRef<HTMLDivElement>(null);

  const parsedAddQty = useMemo(() => {
    const val = parseInt(rawAddQty, 10);
    return Number.isNaN(val) || val <= 0 ? 0 : Math.min(1000000, val);
  }, [rawAddQty]);

  const handleQuickAdd = (amount: number) => {
    const current = parsedAddQty || 0;
    const next = Math.min(1000000, current + amount);
    setRawAddQty(String(next));
  };

  const materialsMap = useMemo(() => {
    return new Map(allCalculatedMaterials.map((m) => [m.name, m]));
  }, [allCalculatedMaterials]);

  const selectedMat = useMemo(() => {
    return materialsMap.get(selectedMatName) || allCalculatedMaterials[0] || null;
  }, [selectedMatName, materialsMap, allCalculatedMaterials]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: allCalculatedMaterials.length, MOB_DROPS: 0, ORES: 0, BARS: 0, LOGS: 0 };
    for (const m of allCalculatedMaterials) {
      if (m.category === "MOB_DROPS") counts.MOB_DROPS++;
      else if (m.category === "ORES") counts.ORES++;
      else if (m.category === "BARS") counts.BARS++;
      else if (m.category === "LOGS") counts.LOGS++;
    }
    return counts;
  }, [allCalculatedMaterials]);

  // Filter materials for the custom combobox
  const filteredComboboxMaterials = useMemo(() => {
    let list = allCalculatedMaterials;
    if (comboboxCategory !== "ALL") {
      list = list.filter((m) => m.category === comboboxCategory);
    }
    if (!comboboxSearch.trim()) return list;
    const query = comboboxSearch.toLowerCase().trim();
    return list.filter((m) => {
      const matchName = m.name.toLowerCase().includes(query);
      const matchCategory = m.category.toLowerCase().includes(query);
      const matchQuality = m.quality.toLowerCase().includes(query);
      const matchMob = m.mob ? m.mob.toLowerCase().includes(query) : false;
      return matchName || matchCategory || matchQuality || matchMob;
    });
  }, [allCalculatedMaterials, comboboxCategory, comboboxSearch]);

  // Reset highlighted index when filter results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [comboboxSearch, comboboxCategory]);

  // Auto-scroll highlighted item into view in popover
  useEffect(() => {
    if (!comboboxOpen || !popoverMenuRef.current) return;
    const items = popoverMenuRef.current.querySelectorAll(".combobox-item-row");
    const activeItem = items[highlightedIndex] as HTMLElement | undefined;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, comboboxOpen]);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && comboboxOpen) {
        setComboboxOpen(false);
      }
    }
    if (comboboxOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [comboboxOpen]);

  // Analyze owned inventory items
  const inventoryAnalysis = useMemo(() => {
    let totalInventoryExp = 0;
    let totalBurnSeconds = 0;
    let totalGrossMarketValue = 0;
    let totalNetMarketValue = 0; // after 15% tax

    const rows = Object.entries(ownedMaterials)
      .map(([name, qty]) => {
        const mat = materialsMap.get(name);
        if (!mat || qty <= 0) return null;

        const itemExp = Number((mat.effectiveExp * qty).toFixed(2));
        const itemDuration = mat.timeSeconds * qty;
        const grossValue = mat.liveMarketPrice * qty;
        const netValue = Math.floor(grossValue * 0.85); // 15% IdleMMO market fee

        totalInventoryExp += itemExp;
        totalBurnSeconds += itemDuration;
        totalGrossMarketValue += grossValue;
        totalNetMarketValue += netValue;

        // Opportunity cost recommendation:
        // If material has heavy penalty (efficiency <= 50%) or poor gold efficiency (>10g/EXP) and price is substantial, recommend selling.
        const isPoorGoldEfficiency = mat.goldPerExp > 10;
        const hasHeavyPenalty = mat.hasPenalty && mat.displayedEff <= 50;
        const shouldSell = (isPoorGoldEfficiency || hasHeavyPenalty) && mat.liveMarketPrice >= 100;
        const recommendation: "burn" | "sell" = shouldSell ? "sell" : "burn";

        return {
          name,
          qty,
          mat,
          itemExp,
          itemDuration,
          netValue,
          recommendation,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return {
      rows,
      totalInventoryExp: Math.floor(totalInventoryExp),
      totalBurnSeconds,
      totalNetMarketValue,
    };
  }, [ownedMaterials, materialsMap]);

  const sortedRows = useMemo(() => {
    return [...inventoryAnalysis.rows].sort((a, b) => {
      if (sortBy === "exp") return b.itemExp - a.itemExp;
      if (sortBy === "value") return b.netValue - a.netValue;
      if (sortBy === "count") return b.qty - a.qty;
      return a.name.localeCompare(b.name);
    });
  }, [inventoryAnalysis.rows, sortBy]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatName || parsedAddQty <= 0) return;
    const current = ownedMaterials[selectedMatName] || 0;
    updateOwnedMaterial(selectedMatName, current + parsedAddQty);
    setRawAddQty("100");
  };

  // Quick Mob Drop suggestions based on user's current forge level (includes all qualities, sorted by level closeness & efficiency)
  const quickMobDropSuggestions = useMemo(() => {
    return allCalculatedMaterials
      .filter(
        (m) =>
          m.category === "MOB_DROPS" &&
          m.displayedEff >= 80 &&
          m.reqLvl <= lessons.forgeLevel + 15
      )
      .sort((a, b) => {
        const aDiff = Math.abs(a.reqLvl - lessons.forgeLevel);
        const bDiff = Math.abs(b.reqLvl - lessons.forgeLevel);
        return aDiff - bDiff;
      })
      .slice(0, 4);
  }, [allCalculatedMaterials, lessons.forgeLevel]);

  // Quick Ore / Bar / Log suggestions
  const quickOreBarSuggestions = useMemo(() => {
    return allCalculatedMaterials
      .filter(
        (m) =>
          m.category !== "MOB_DROPS" &&
          m.displayedEff >= 80 &&
          m.reqLvl <= lessons.forgeLevel + 10
      )
      .sort((a, b) => Math.abs(a.reqLvl - lessons.forgeLevel) - Math.abs(b.reqLvl - lessons.forgeLevel))
      .slice(0, 4);
  }, [allCalculatedMaterials, lessons.forgeLevel]);

  return (
    <section className="inventory-optimizer-section" aria-label="Inventory burn vs sell optimizer">
      <div className="inventory-topbar">
        <div className="inventory-title-group">
          <span className="panel-kicker"><Package size={14} aria-hidden="true" /> Inventory <span className="sr-only">Optimizer</span></span>
          <h2>Owned Materials</h2>
        </div>

        {inventoryAnalysis.rows.length > 0 && (
          <div className="inventory-actions">
            <button
              type="button"
              className="queue-all-owned-btn"
              onClick={() => {
                queueAllOwned();
                onSwitchSubView?.("session");
              }}
              title="Queue all owned items and open Session Queue"
            >
              <Flame size={13} aria-hidden="true" />
              <span>Queue All in Lesson</span>
            </button>
            <button
              type="button"
              className="clear-inventory-btn"
              onClick={() => clearOwnedMaterials()}
              aria-label="Clear stored inventory"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Modern Searchable Combobox Add Form */}
      <form className="add-inventory-form" onSubmit={handleAddSubmit}>
        {/* Searchable Combobox */}
        <div className={`select-material-group ${comboboxOpen ? "menu-open" : ""}`} ref={comboboxRef}>
          <div className="select-material-label-row">
            <label htmlFor="inventory-mat-search">Material</label>
            {selectedMatName && ownedMaterials[selectedMatName] ? (
              <span className="current-owned-pill">
                Tracking: {ownedMaterials[selectedMatName].toLocaleString()}
              </span>
            ) : null}
          </div>
          <div className={`combobox-container ${comboboxOpen ? "open" : ""}`}>
            <div
              className="combobox-trigger-shell"
              onClick={() => setComboboxOpen(true)}
            >
              {selectedMat && !comboboxOpen && selectedMat.imageUrl ? (
                <img
                  src={selectedMat.imageUrl}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  className="combobox-selected-icon"
                />
              ) : (
                <Search size={14} className="combobox-search-icon" aria-hidden="true" />
              )}
              <input
                id="inventory-mat-search"
                type="text"
                role="combobox"
                aria-expanded={comboboxOpen}
                aria-haspopup="listbox"
                aria-controls="forge-mat-combobox-list"
                aria-autocomplete="list"
                aria-activedescendant={
                  comboboxOpen && highlightedIndex >= 0 && filteredComboboxMaterials[highlightedIndex]
                    ? `combobox-opt-${highlightedIndex}`
                    : undefined
                }
                placeholder={selectedMat ? selectedMat.name : "Search material..."}
                value={comboboxOpen ? comboboxSearch : (selectedMat ? selectedMat.name : "")}
                onChange={(e) => {
                  setComboboxSearch(e.target.value);
                  if (!comboboxOpen) setComboboxOpen(true);
                }}
                onFocus={() => {
                  setComboboxOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!comboboxOpen) {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setComboboxOpen(true);
                    }
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((prev) => Math.min(filteredComboboxMaterials.length - 1, prev + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((prev) => Math.max(0, prev - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const targetMat = filteredComboboxMaterials[highlightedIndex];
                    if (targetMat) {
                      setSelectedMatName(targetMat.name);
                      setComboboxOpen(false);
                      setComboboxSearch("");
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setComboboxOpen(false);
                  }
                }}
                className="combobox-search-input"
                autoComplete="off"
                spellCheck={false}
              />
              {selectedMat && !comboboxOpen && (
                <span className={`combobox-quality-badge ${selectedMat.quality.toLowerCase()}`}>
                  {selectedMat.quality}
                </span>
              )}
              <button
                type="button"
                className="combobox-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setComboboxOpen(!comboboxOpen);
                }}
                aria-label="Toggle material list"
              >
                <ChevronDown size={14} className={`combobox-chevron ${comboboxOpen ? "flipped" : ""}`} />
              </button>
            </div>

            {/* Custom Dark Theme Dropdown Menu */}
            {comboboxOpen && (
              <div
                id="forge-mat-combobox-list"
                className="combobox-popover-menu"
                ref={popoverMenuRef}
                role="listbox"
                aria-label="Available lesson materials"
              >
                <div className="combobox-cat-bar" role="tablist" aria-label="Filter materials by category">
                  <button
                    type="button"
                    className={`cat-pill ${comboboxCategory === "ALL" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setComboboxCategory("ALL");
                    }}
                  >
                    All ({categoryCounts.ALL})
                  </button>
                  <button
                    type="button"
                    className={`cat-pill ${comboboxCategory === "MOB_DROPS" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setComboboxCategory("MOB_DROPS");
                    }}
                  >
                    Mob Drops ({categoryCounts.MOB_DROPS})
                  </button>
                  <button
                    type="button"
                    className={`cat-pill ${comboboxCategory === "ORES" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setComboboxCategory("ORES");
                    }}
                  >
                    Ores ({categoryCounts.ORES})
                  </button>
                  <button
                    type="button"
                    className={`cat-pill ${comboboxCategory === "BARS" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setComboboxCategory("BARS");
                    }}
                  >
                    Bars ({categoryCounts.BARS})
                  </button>
                  <button
                    type="button"
                    className={`cat-pill ${comboboxCategory === "LOGS" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setComboboxCategory("LOGS");
                    }}
                  >
                    Logs ({categoryCounts.LOGS})
                  </button>
                </div>

                <div className="combobox-items-scroll">
                  {filteredComboboxMaterials.length === 0 ? (
                    <div className="combobox-empty-message">No materials found</div>
                  ) : (
                    filteredComboboxMaterials.map((mat, idx) => {
                      const isSelected = selectedMat?.name === mat.name;
                      const isHighlighted = highlightedIndex === idx;
                      return (
                        <div
                          key={mat.name}
                          id={`combobox-opt-${idx}`}
                          className={`combobox-item-row ${isSelected ? "selected" : ""} ${isHighlighted ? "highlighted" : ""}`}
                          onClick={() => {
                            setSelectedMatName(mat.name);
                            setComboboxOpen(false);
                            setComboboxSearch("");
                          }}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="item-title-col">
                            {mat.imageUrl && (
                              <img
                                src={mat.imageUrl}
                                alt=""
                                width={22}
                                height={22}
                                loading="lazy"
                                decoding="async"
                                className="combobox-item-icon"
                              />
                            )}
                            <div className="item-name-stack">
                              <span className="item-name">{mat.name}</span>
                              <span className="item-sub">
                                Lv. {mat.reqLvl} • {mat.mob || mat.category.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          <div className="item-badge-col">
                            <span className={`item-quality-pill ${mat.quality.toLowerCase()}`}>
                              {mat.quality}
                            </span>
                            <span className="item-market-price">
                              {formatGold(mat.liveMarketPrice)}
                              <GoldIcon size={10} />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Owned Count Stepper */}
        <div className="quantity-input-group">
          <label htmlFor="inventory-qty-input">Owned Count</label>
          <div className="stepper-wrap">
            <input
              id="inventory-qty-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rawAddQty}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                setRawAddQty(digits);
              }}
              onBlur={() => {
                if (!rawAddQty.trim()) {
                  setRawAddQty("100");
                } else {
                  const val = parseInt(rawAddQty, 10);
                  if (val > 1000000) setRawAddQty("1000000");
                  else if (val < 1) setRawAddQty("1");
                }
              }}
              className="inventory-qty-field"
            />
            <div className="quick-qty-pills">
              <button type="button" aria-label="+10 quantity" onClick={() => handleQuickAdd(10)}>+10</button>
              <button type="button" aria-label="+50 quantity" onClick={() => handleQuickAdd(50)}>+50</button>
              <button type="button" aria-label="+100 quantity" onClick={() => handleQuickAdd(100)}>+100</button>
              <button type="button" aria-label="+1k quantity" onClick={() => handleQuickAdd(1000)}>+1k</button>
            </div>
          </div>
        </div>

        <button type="submit" className="add-material-submit-btn">
          <Plus size={14} aria-hidden="true" />
          <span>Save Owned</span>
        </button>
      </form>

      {/* Inventory summary readout if materials exist */}
      {inventoryAnalysis.rows.length > 0 ? (
        <div className="inventory-results-wrap">
          <div className="inventory-summary-cards">
            <div className="inv-summary-card">
              <span className="label">Total Stored Materials</span>
              <strong>{inventoryAnalysis.rows.reduce((sum, r) => sum + r.qty, 0).toLocaleString()} items</strong>
            </div>
            <div className="inv-summary-card highlight">
              <span className="label">Potential Lesson EXP</span>
              <strong>+{inventoryAnalysis.totalInventoryExp.toLocaleString()} EXP</strong>
            </div>
            <div className="inv-summary-card">
              <span className="label">Net Market Value</span>
              <strong className="good-val">
                {formatGold(inventoryAnalysis.totalNetMarketValue)}
                <GoldIcon size={12} />
              </strong>
            </div>
          </div>

          {/* Sort bar and owned items list */}
          <div className="inventory-list-header">
            <span className="list-title">Tracked Items ({sortedRows.length})</span>
            <div className="inventory-sort-bar">
              <span className="sort-label"><ArrowUpDown size={12} aria-hidden="true" /> Sort:</span>
              <button
                type="button"
                className={`inv-sort-btn ${sortBy === "exp" ? "active" : ""}`}
                onClick={() => setSortBy("exp")}
              >
                EXP Yield
              </button>
              <button
                type="button"
                className={`inv-sort-btn ${sortBy === "value" ? "active" : ""}`}
                onClick={() => setSortBy("value")}
              >
                Net Value
              </button>
              <button
                type="button"
                className={`inv-sort-btn ${sortBy === "count" ? "active" : ""}`}
                onClick={() => setSortBy("count")}
              >
                Count
              </button>
              <button
                type="button"
                className={`inv-sort-btn ${sortBy === "name" ? "active" : ""}`}
                onClick={() => setSortBy("name")}
              >
                Name
              </button>
            </div>
          </div>

          <div className="owned-items-list" aria-label="Owned materials ledger">
            {sortedRows.map((row) => (
              <div key={row.name} className="owned-item-row">
                <div className="owned-item-identity-wrap">
                  {row.mat.imageUrl && (
                    <div className="mat-icon-wrapper mini">
                      <img
                        src={row.mat.imageUrl}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        className="owned-mat-icon"
                      />
                    </div>
                  )}
                  <div className="owned-item-main">
                    <div className="name-and-recommendation">
                      <strong className="mat-name">{row.name}</strong>
                      <div className="count-stepper-wrap">
                        <button
                          type="button"
                          className="count-step-btn"
                          onClick={() => updateOwnedMaterial(row.name, Math.max(0, row.qty - 10))}
                          aria-label={`Decrease ${row.name} count by 10`}
                          title="-10"
                        >
                          -10
                        </button>
                        <span className="count-pill">{row.qty.toLocaleString()}x</span>
                        <button
                          type="button"
                          className="count-step-btn"
                          onClick={() => updateOwnedMaterial(row.name, Math.min(1000000, row.qty + 10))}
                          aria-label={`Increase ${row.name} count by 10`}
                          title="+10"
                        >
                          +10
                        </button>
                      </div>
                      {row.recommendation === "sell" ? (
                        <span className="rec-badge sell" title="High market value with level penalty: selling on market yields better gold efficiency">
                          <DollarSign size={12} aria-hidden="true" />
                          <span>Sell on Market</span>
                        </span>
                      ) : (
                        <span className="rec-badge burn" title="Good EXP efficiency: burn in lessons">
                          <Flame size={12} aria-hidden="true" />
                          <span>Burn for EXP</span>
                        </span>
                      )}
                    </div>
                    <div className="owned-item-metrics">
                      <span>Yields: <strong>+{Math.floor(row.itemExp).toLocaleString()} EXP</strong></span>
                      <span>
                        Net Sale: <strong>{formatGold(row.netValue)}</strong>
                        <GoldIcon size={11} />
                      </span>
                      <span>Eff: <strong>{row.mat.displayedEff}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="owned-item-actions">
                  <button
                    type="button"
                    className="inv-fill-session-btn"
                    onClick={() => fillSessionWithMaterial(row.name)}
                    title={`Fill session duration with ${row.name}`}
                  >
                    <Zap size={12} aria-hidden="true" />
                    <span>Fill Session</span>
                  </button>
                  <button
                    type="button"
                    className="add-to-queue-pill-btn"
                    onClick={() => addToQueue(row.name, row.qty)}
                    title={`Queue all ${row.qty} in active lesson`}
                  >
                    <Flame size={12} aria-hidden="true" />
                    <span>Queue All</span>
                  </button>
                  <button
                    type="button"
                    className="remove-owned-btn"
                    onClick={() => updateOwnedMaterial(row.name, 0)}
                    aria-label={`Remove ${row.name} from inventory`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="inventory-empty-hint">
          <p>
            No owned materials tracked yet. Search materials above or pick a level {lessons.forgeLevel} suggestion to track inventory and compare burn vs. market value:
          </p>

          <div className="quick-suggestions-block">
            {quickMobDropSuggestions.length > 0 && (
              <div className="quick-suggestions-subgroup">
                <span className="subgroup-title">
                  <Flame size={12} aria-hidden="true" />
                  <span>Popular Mob Drops to Track:</span>
                </span>
                <div className="quick-suggestions-row" aria-label="Quick track mob drops">
                  {quickMobDropSuggestions.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      className="quick-suggestion-chip"
                      onClick={() => {
                        setSelectedMatName(m.name);
                        setRawAddQty("100");
                      }}
                      title={`Select ${m.name} (Lv. ${m.reqLvl}${m.mob ? ` - Dropped by ${m.mob}` : ""}) with count 100`}
                    >
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" width={18} height={18} loading="lazy" decoding="async" className="sugg-icon" />
                      )}
                      <span className="sugg-name">{m.name}</span>
                      <span className={`quality-mini ${m.quality.toLowerCase()}`}>{m.quality.slice(0, 3)}</span>
                      <span className="sugg-lvl">Lv. {m.reqLvl}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickOreBarSuggestions.length > 0 && (
              <div className="quick-suggestions-subgroup">
                <span className="subgroup-title">
                  <Package size={12} aria-hidden="true" />
                  <span>Ores, Bars & Logs:</span>
                </span>
                <div className="quick-suggestions-row" aria-label="Quick track standard materials">
                  {quickOreBarSuggestions.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      className="quick-suggestion-chip"
                      onClick={() => {
                        setSelectedMatName(m.name);
                        setRawAddQty("100");
                      }}
                      title={`Select ${m.name} (Lv. ${m.reqLvl}) with count 100`}
                    >
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" width={18} height={18} loading="lazy" decoding="async" className="sugg-icon" />
                      )}
                      <span className="sugg-name">{m.name}</span>
                      <span className="sugg-lvl">Lv. {m.reqLvl}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
