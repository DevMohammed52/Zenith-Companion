"use client";

import { useDeferredValue, useMemo, useState, type CSSProperties } from "react";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { SearchInput } from "@/components/ui/SearchInput";
import { getQualityPalette } from "@/lib/quality";
import { QUALITY_COLORS, qualityLabel } from "@/lib/pets";
import type { PetOption } from "../types";
import styles from "../page.module.css";

export function PetPicker({
  slotIndex,
  value,
  options,
  open,
  onOpen,
  onSelect,
  onClear,
}: {
  slotIndex: number;
  value: string | null;
  options: PetOption[];
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const selected = options.find((option) => option.id === value) || null;
  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return options.filter((option) => !needle || option.searchText.includes(needle)).slice(0, 40);
  }, [options, deferredQuery]);

  const handleClose = () => {
    setQuery("");
    onOpen(false);
  };

  return (
    <div className={styles.picker}>
      <button
        type="button"
        className={styles.pickerTrigger}
        style={
          selected
            ? ({ "--accent": QUALITY_COLORS[selected.pet.quality] || QUALITY_COLORS.UNKNOWN } as CSSProperties)
            : undefined
        }
        data-filled={selected ? "true" : undefined}
        aria-haspopup="dialog"
        aria-label={
          selected
            ? `Change comparison slot ${slotIndex + 1}, currently ${selected.title}`
            : `Choose pet for comparison slot ${slotIndex + 1}`
        }
        onClick={() => onOpen(true)}
      >
        {selected ? (
          <PetImage pet={selected.pet} size={40} />
        ) : (
          <div className={styles.emptyAvatar}>{slotIndex + 1}</div>
        )}
        <span className={styles.pickerBody}>
          <strong className={styles.pickerTitle}>
            {selected?.title || `Choose pet ${slotIndex + 1}`}
          </strong>
          <small className={styles.pickerSub}>
            {selected
              ? selected.subtitle
              : "Pick from catalog or owned snapshots"}
          </small>
        </span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <Icon name="chevronDown" size="md" />
        </span>
      </button>

      {selected && (
        <button
          type="button"
          className={styles.clearSlot}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label={`Clear ${selected.title} from comparison`}
          title="Clear pet slot"
        >
          <Icon name="close" size="sm" aria-hidden="true" />
        </button>
      )}

      <ModalSheet
        isOpen={open}
        onClose={handleClose}
        title={`Choose Pet for Slot ${slotIndex + 1}`}
        maxWidth="md"
      >
        <div className={styles.pickerModalBody}>
          <SearchInput
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
            placeholder="Search pet, boss, source, or owned snapshot..."
            ariaLabel={`Search pets for comparison slot ${slotIndex + 1}`}
            showShortcutHint={false}
          />

          <div
            className={styles.petOptions}
            role="listbox"
            aria-label={`Pet options for comparison slot ${slotIndex + 1}`}
          >
            {filtered.map((option) => {
              const isSelected = option.id === value;
              const palette = getQualityPalette(option.pet.quality);
              return (
                <button
                  type="button"
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.petOptionBtn} ${isSelected ? styles.petOptionSelected : ""}`}
                  onClick={() => {
                    onSelect(option.id);
                    handleClose();
                  }}
                >
                  <PetImage pet={option.pet} size={36} />
                  <span className={styles.petOptionInfo}>
                    <strong className={styles.petOptionTitle}>{option.title}</strong>
                    <small className={styles.petOptionSub}>{option.subtitle}</small>
                  </span>
                  <span className={styles.petOptionRight}>
                    <Badge
                      variant="neutral"
                      size="sm"
                      style={{
                        color: palette.textColor,
                        borderColor: palette.border,
                        backgroundColor: palette.background,
                      }}
                    >
                      {option.kind === "owned" ? option.meta : qualityLabel(option.pet.quality)}
                    </Badge>
                    {option.kind === "database" && option.meta !== "-" && (
                      <span className={styles.petOptionPrice}>{option.meta}</span>
                    )}
                  </span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className={styles.emptyList}>No pets match &ldquo;{query}&rdquo;.</p>
            )}
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
