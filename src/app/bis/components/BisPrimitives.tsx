"use client";

import React from "react";
import { clampTier } from "../types";

export function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="control-group">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <span>{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function TierStepper({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number | "";
  max: number;
  disabled?: boolean;
  onChange: (value: number | "") => void;
}) {
  const numericValue = clampTier(value, max) || 1;
  return (
    <label className="tier-stepper">
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || numericValue <= 1}
          onClick={() => onChange(clampTier(numericValue - 1, max))}
        >
          -
        </button>
        <input
          value={disabled ? "" : value}
          disabled={disabled}
          inputMode="numeric"
          aria-label={label}
          placeholder="-"
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? "" : clampTier(Number(next || 1), max));
          }}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled || numericValue >= max}
          onClick={() => onChange(clampTier(numericValue + 1, max))}
        >
          +
        </button>
      </div>
      <small>{disabled ? "No saved item" : `Max ${max}`}</small>
    </label>
  );
}
