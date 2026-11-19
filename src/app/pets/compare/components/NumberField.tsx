"use client";

import { useEffect, useState } from "react";
import { clampNumber } from "@/lib/pets";
import styles from "../page.module.css";

export function NumberField({
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
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
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
