"use client";

import { useState, useEffect } from "react";
import { clampNumber } from "../utils/pet-helpers";

export function PetNumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (rawValue: string) => {
    if (rawValue === "") {
      setDraft("");
      return;
    }
    const nextValue = clampNumber(Number(rawValue), min, max);
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  return (
    <label className="pet-field">
      <span>{label}</span>
      <input
        className="pet-number"
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => {
          if (draft === "") setDraft(String(value));
        }}
      />
    </label>
  );
}
