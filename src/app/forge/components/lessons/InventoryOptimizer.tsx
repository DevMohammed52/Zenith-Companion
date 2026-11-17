"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, DollarSign, Flame, Package, Plus, Search, Trash2, TrendingUp, X } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";

export function InventoryOptimizer({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    ownedMaterials,
    updateOwnedMaterial,
    clearOwnedMaterials,
    allCalculatedMaterials,
    addToQueue,
    queueAllOwned,
  } = lessons;

  const [selectedMatName, setSelectedMatName] = useState<string>(allCalculatedMaterials[0]?.name || "Coal Ore");
  const [comboboxSearch, setComboboxSearch] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [addQty, setAddQty] = useState<number>(100);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const popoverMenuRef = useRef<HTMLDivElement>(null);

  const materialsMap = useMemo(() => {
    return new Map(allCalculatedMaterials.map((m) => [m.name, m]));
  }, [allCalculatedMaterials]);

  const selectedMat = useMemo(() => {
    return materialsMap.get(selectedMatName) || allCalculatedMaterials[0] || null;
  }, [selectedMatName, materialsMap, allCalculatedMaterials]);

  // Filter materials for the custom combobox
  const filteredComboboxMaterials = useMemo(() => {
    if (!comboboxSearch.trim()) return allCalculatedMaterials;
    const query = comboboxSearch.toLowerCase().trim();
    return allCalculatedMaterials.filter((m) => {
      const matchName = m.name.toLowerCase().includes(query);
      const matchCategory = m.category.toLowerCase().includes(query);
      const matchQuality = m.quality.toLowerCase().includes(query);
      const matchMob = m.mob ? m.mob.toLowerCase().includes(query) : false;
      return matchName || matchCategory || matchQuality || matchMob;
    });
  }, [allCalculatedMaterials, comboboxSearch]);

  // Reset highlighted index when filter results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [comboboxSearch]);

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
    if (comboboxOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatName || addQty <= 0) return;
    const current = ownedMaterials[selectedMatName] || 0;
    updateOwnedMaterial(selectedMatName, current + addQty);
  };

  return (
    <section className="inventory-optimizer-section" aria-label="Inventory burn vs sell optimizer">
      <div className="inventory-topbar">
        <div className="inventory-title-group">
          <span className="panel-kicker"><Package size={14} aria-hidden="true" /> Inventory Optimizer</span>
          <h2>Owned Materials Valuation</h2>
        </div>

        {inventoryAnalysis.rows.length > 0 && (
          <div className="inventory-actions">
            <button
              type="button"
              className="queue-all-owned-btn"
              onClick={() => queueAllOwned()}
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
        <div className="select-material-group" ref={comboboxRef}>
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
              <Search size={14} className="combobox-search-icon" aria-hidden="true" />
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
                          <span className="item-name">{mat.name}</span>
                          <span className="item-sub">
                            Lv. {mat.reqLvl} • {mat.category.replace("_", " ")}
                          </span>
                        </div>
                        <div className="item-badge-col">
                          <span className={`item-quality-pill ${mat.quality.toLowerCase()}`}>
                            {mat.quality}
                          </span>
                          <span className="item-market-price">{formatGold(mat.liveMarketPrice)}g</span>
                        </div>
                      </div>
                    );
                  })
                )}
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
              type="number"
              min={1}
              value={addQty}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setAddQty(Number.isNaN(val) ? 1 : Math.max(1, val));
              }}
              className="inventory-qty-field"
            />
            <div className="quick-qty-pills">
              <button type="button" aria-label="+10 quantity" onClick={() => setAddQty((q) => q + 10)}>+10</button>
              <button type="button" aria-label="+50 quantity" onClick={() => setAddQty((q) => q + 50)}>+50</button>
              <button type="button" aria-label="+100 quantity" onClick={() => setAddQty((q) => q + 100)}>+100</button>
              <button type="button" aria-label="+1k quantity" onClick={() => setAddQty((q) => q + 1000)}>+1k</button>
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
              <strong className="good-val">{formatGold(inventoryAnalysis.totalNetMarketValue)}g</strong>
            </div>
          </div>

          {/* Owned items list */}
          <div className="owned-items-list" aria-label="Owned materials ledger">
            {inventoryAnalysis.rows.map((row) => (
              <div key={row.name} className="owned-item-row">
                <div className="owned-item-main">
                  <div className="name-and-recommendation">
                    <strong className="mat-name">{row.name}</strong>
                    <span className="count-pill">{row.qty.toLocaleString()}x</span>
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
                    <span>Net Sale: <strong>{formatGold(row.netValue)}g</strong></span>
                    <span>Eff: <strong>{row.mat.displayedEff}%</strong></span>
                  </div>
                </div>

                <div className="owned-item-actions">
                  <button
                    type="button"
                    className="add-to-queue-pill-btn"
                    onClick={() => addToQueue(row.name, row.qty)}
                    title={`Queue all ${row.qty} in active lesson`}
                  >
                    <span>Queue</span>
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
            No owned materials tracked yet. Search materials above or set counts in the catalog to track inventory and compare burn vs. market value.
          </p>
        </div>
      )}
    </section>
  );
}
