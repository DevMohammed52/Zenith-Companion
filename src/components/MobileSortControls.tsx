"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

type SortOption = {
  value: string;
  label: string;
};

type MobileSortControlsProps = {
  label: string;
  options: SortOption[];
  value: string;
  descending: boolean;
  onSort: (value: string) => void;
  onToggleDirection: () => void;
};

export default function MobileSortControls({
  label,
  options,
  value,
  descending,
  onSort,
  onToggleDirection,
}: MobileSortControlsProps) {
  return (
    <div className="mobile-sort-controls">
      <div className="mobile-sort-header">
        <span>{label}</span>
        <button
          type="button"
          className="mobile-sort-direction"
          onClick={onToggleDirection}
          aria-label={`Sort ${descending ? "descending" : "ascending"}`}
        >
          {descending ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          <span>{descending ? "Desc" : "Asc"}</span>
        </button>
      </div>
      <div className="mobile-sort-grid">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`mobile-sort-chip ${active ? "mobile-sort-chip-active" : ""}`}
              onClick={() => onSort(option.value)}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
