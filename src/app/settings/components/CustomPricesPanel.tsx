"use client";

import { Coins, Plus, Trash2 } from "lucide-react";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { TextInput } from "@/components/ui/TextInput";
import type { UseSettingsStateReturn } from "../types";
import styles from "../Settings.module.css";

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
    confirmClearCustomPrices,
  } = state;

  return (
    <Card
      className={`settings-panel settings-panel-wide ${styles.fullWidth}`}
      title={
        <h2 className={styles.cardTitle}>
          <Coins size={18} style={{ color: "var(--text-accent)" }} />
          Custom Item Prices
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Override live market cache values with custom gold prices across all calculators and crafting recipes.
        </p>
      }
    >
      <div className={styles.customPriceForm}>
        <div className={styles.customPriceCombobox}>
          <TextInput
            label="Item Name"
            placeholder="Search item to override..."
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
            onBlur={() => window.setTimeout(closeItemSearch, 150)}
            onChange={(e) => {
              setCustomItemName(e.target.value);
              setItemSearchOpen(true);
              setActiveSuggestionIndex(0);
            }}
            onFocus={() => setItemSearchOpen(true)}
            onKeyDown={handleCustomItemKeyDown}
          />

          {itemSearchOpen && itemSuggestions.length > 0 && (
            <div
              className={`custom-price-suggestions ${styles.customPriceSuggestions}`}
              id={itemSuggestionsId}
              role="listbox"
              aria-label="Item search suggestions"
            >
              {itemSuggestions.map((name, index) => {
                const item = allItemsDb?.[name];
                const isActive = index === activeSuggestionIndex;
                return (
                  <button
                    key={name}
                    id={`${itemSuggestionsId}-${index}`}
                    type="button"
                    role="option"
                    aria-label={`${name}, ${item?.type ? String(item.type).replace(/_/g, " ") : "Item"}`}
                    aria-selected={isActive}
                    className={`${styles.suggestionOption} ${
                      isActive ? `custom-price-suggestion-active ${styles.suggestionOptionActive}` : ""
                    }`}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCustomItem(name)}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item?.type ? String(item.type).replace(/_/g, " ") : "Item"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <TextInput
            label="Custom Value (Gold)"
            type="number"
            min="0"
            placeholder="e.g. 15000"
            value={customItemPrice}
            onChange={(e) =>
              setCustomItemPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={saveCustomPrice}
          style={{ height: "42px", marginBottom: "2px" }}
        >
          Add Override
        </Button>
      </div>

      <div className={styles.customPriceActionsRow}>
        <span className={styles.customPriceCount}>
          {customPriceRows.length.toLocaleString()} active override
          {customPriceRows.length === 1 ? "" : "s"}
        </span>
        <Button
          variant="danger"
          size="sm"
          onClick={clearCustomPrices}
          disabled={customPriceRows.length === 0}
        >
          Clear All Overrides
        </Button>
      </div>

      {suspiciousCustomRows.length > 0 && (
        <Banner variant="warning" style={{ marginTop: "1rem" }}>
          {suspiciousCustomRows.length} price override is over 5x higher than safe market value. Verify values to avoid skewing profit calculations.
        </Banner>
      )}

      {customPriceRows.length === 0 ? (
        <p className={styles.storageStatusNote}>
          No custom prices set yet. All calculators will use safe market, recipe, or vendor values.
        </p>
      ) : (
        <div className={styles.customPriceList}>
          {customPriceRows.map(([name, price]) => {
            const market = getSafeMarketValue(marketData?.[name]);
            return (
              <div className={styles.customPriceRow} key={name}>
                <div className={styles.customPriceItemInfo}>
                  <strong className={styles.customPriceItemName}>{name}</strong>
                  <span className={styles.customPriceItemRef}>
                    {market > 0
                      ? `Safe market: ${market.toLocaleString()}g`
                      : "No safe market price recorded"}
                  </span>
                </div>

                <div className={styles.customPriceValues}>
                  <span className={styles.customPriceGold}>
                    {Number(price).toLocaleString()}g
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={14} />}
                    onClick={() => removeCustomPrice(name)}
                    aria-label={`Remove override for ${name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmClearOpen && (
        <ModalSheet
          isOpen={confirmClearOpen}
          onClose={() => setConfirmClearOpen(false)}
          title="Clear All Custom Prices"
          description={`Remove all ${customPriceRows.length.toLocaleString()} custom price overrides? All calculators will return to default market values.`}
          maxWidth="sm"
          footer={
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", width: "100%" }}>
              <Button
                variant="ghost"
                onClick={() => setConfirmClearOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmClearCustomPrices}
              >
                Clear Overrides
              </Button>
            </div>
          }
        />
      )}
    </Card>
  );
}
