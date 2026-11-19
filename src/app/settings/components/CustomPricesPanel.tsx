"use client";

import { Coins, Plus, Trash2, X } from "lucide-react";
import { getSafeMarketValue } from "@/lib/market-pricing";
import type { UseSettingsStateReturn } from "../types";

export default function CustomPricesPanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    | "customItemName"
    | "setCustomItemName"
    | "customItemPrice"
    | "setCustomItemPrice"
    | "itemSearchOpen"
    | "setItemSearchOpen"
    | "activeSuggestionIndex"
    | "setActiveSuggestionIndex"
    | "itemSuggestionsId"
    | "itemSuggestions"
    | "allItemsDb"
    | "marketData"
    | "customPriceRows"
    | "suspiciousCustomRows"
    | "saveCustomPrice"
    | "removeCustomPrice"
    | "closeItemSearch"
    | "selectCustomItem"
    | "handleCustomItemKeyDown"
    | "clearCustomPrices"
    | "confirmClearOpen"
    | "setConfirmClearOpen"
    | "confirmCancelRef"
    | "confirmModalRef"
    | "confirmClearCustomPrices"
  >;
}) {
  const {
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    itemSearchOpen,
    setItemSearchOpen,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    itemSuggestionsId,
    itemSuggestions,
    allItemsDb,
    marketData,
    customPriceRows,
    suspiciousCustomRows,
    saveCustomPrice,
    removeCustomPrice,
    closeItemSearch,
    selectCustomItem,
    handleCustomItemKeyDown,
    clearCustomPrices,
    confirmClearOpen,
    setConfirmClearOpen,
    confirmCancelRef,
    confirmModalRef,
    confirmClearCustomPrices,
  } = state;

  return (
    <div className="settings-panel settings-panel-wide">
      <h2><Coins size={17} /> Custom Item Prices</h2>
      <p className="settings-panel-note">
        Custom prices override market cache values everywhere. Use whole gold values; safe market pricing still filters suspicious market outliers before comparisons.
      </p>
      <div className="custom-price-builder">
        <label className="custom-price-item-field">
          <span>Item</span>
          <div className="custom-price-combobox">
            <input
              className="control-input"
              placeholder="Search item name"
              value={customItemName}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={itemSearchOpen && itemSuggestions.length > 0}
              aria-controls={itemSuggestionsId}
              aria-activedescendant={
                itemSearchOpen && activeSuggestionIndex >= 0
                  ? `${itemSuggestionsId}-${activeSuggestionIndex}`
                  : undefined
              }
              onBlur={() => window.setTimeout(closeItemSearch, 120)}
              onChange={(e) => {
                setCustomItemName(e.target.value);
                setItemSearchOpen(true);
                setActiveSuggestionIndex(0);
              }}
              onFocus={() => setItemSearchOpen(true)}
              onKeyDown={handleCustomItemKeyDown}
            />
            {itemSearchOpen && itemSuggestions.length > 0 && (
              <div className="custom-price-suggestions" id={itemSuggestionsId} role="listbox" aria-label="Item suggestions">
                {itemSuggestions.map((name, index) => {
                  const item = allItemsDb?.[name];
                  return (
                    <button
                      key={name}
                      id={`${itemSuggestionsId}-${index}`}
                      type="button"
                      role="option"
                      aria-label={`${name}, ${item?.type ? String(item.type).replace(/_/g, " ") : "Item"}`}
                      aria-selected={index === activeSuggestionIndex}
                      className={index === activeSuggestionIndex ? "custom-price-suggestion-active" : ""}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCustomItem(name)}
                    >
                      <span>{name}</span>
                      <small>{item?.type ? String(item.type).replace(/_/g, " ") : "Item"}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>
        <label className="custom-price-value-field">
          <span>Custom value</span>
          <input
            className="control-input"
            min="0"
            type="number"
            value={customItemPrice}
            onChange={(e) => setCustomItemPrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Gold each"
          />
        </label>
        <button className="control-input custom-price-add" type="button" onClick={saveCustomPrice}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="settings-actions-row custom-price-actions">
        <span>{customPriceRows.length.toLocaleString()} active override{customPriceRows.length === 1 ? "" : "s"}</span>
        <button
          type="button"
          className="settings-link-button settings-danger-link"
          onClick={clearCustomPrices}
          disabled={customPriceRows.length === 0}
        >
          Clear All Overrides
        </button>
      </div>

      {customPriceRows.length === 0 ? (
        <p className="settings-empty-note">No custom prices yet. Calculators will use safe market, recipe, or vendor values.</p>
      ) : (
        <div className="custom-price-list">
          {customPriceRows.map(([name, price]) => {
            const market = getSafeMarketValue(marketData?.[name]);
            return (
              <div className="custom-price-row" key={name}>
                <span>
                  <strong>{name}</strong>
                  <small>{market > 0 ? `Safe market ${market.toLocaleString()}g` : "No safe market price"}</small>
                </span>
                <em>{Number(price).toLocaleString()}g</em>
                <button type="button" onClick={() => removeCustomPrice(name)} aria-label={`Remove ${name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {suspiciousCustomRows.length > 0 && (
        <p className="settings-warning-note">
          {suspiciousCustomRows.length} custom price override is far above safe market. That may be intentional, but it will override every calculator.
        </p>
      )}

      {confirmClearOpen && (
        <div className="modal-overlay settings-confirm-overlay" role="presentation" onClick={() => setConfirmClearOpen(false)}>
          <div
            ref={confirmModalRef}
            className="modal-content settings-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-clear-prices-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="settings-clear-prices-title">Clear Custom Prices</h2>
              <button className="close-btn" type="button" aria-label="Close confirmation" onClick={() => setConfirmClearOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="settings-panel-note">
                Remove all {customPriceRows.length.toLocaleString()} custom price override{customPriceRows.length === 1 ? "" : "s"}?
                Calculators will immediately return to safe market, recipe, or vendor values.
              </p>
              <div className="settings-confirm-actions">
                <button type="button" ref={confirmCancelRef} className="settings-link-button" onClick={() => setConfirmClearOpen(false)} autoFocus>
                  Cancel
                </button>
                <button type="button" className="settings-link-button settings-danger-link" onClick={confirmClearCustomPrices}>
                  Clear overrides
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
