"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import QualityText from "@/components/QualityText";
import { type WorldBossItemModifier, getWorldBossItemModifierSummary } from "../types";

export interface WorldBossItemEffectPickerProps {
    ariaLabel: string;
    emptyLabel: string;
    label: string;
    onChange: (value: string) => void;
    options: WorldBossItemModifier[];
    value: string;
}

export function WorldBossItemEffectPicker({
    ariaLabel,
    emptyLabel,
    label,
    onChange,
    options,
    value,
}: WorldBossItemEffectPickerProps) {
    const [open, setOpen] = useState(false);
    const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = options.find((option) => option.name === value) || null;

    const focusOption = (index: number) => {
        window.requestAnimationFrame(() => {
            optionRefs.current[index]?.focus();
        });
    };

    const selectOption = (nextValue: string) => {
        onChange(nextValue);
        setOpen(false);
        triggerRef.current?.focus();
    };

    const selectedIndex = Math.max(0, options.findIndex((option) => option.name === value) + 1);

    const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
        event.preventDefault();
        setOpen(true);
        focusOption(event.key === "ArrowUp" ? options.length : selectedIndex);
    };

    const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
        const optionCount = options.length + 1;
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusOption((index + 1) % optionCount);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            focusOption((index - 1 + optionCount) % optionCount);
            return;
        }
        if (event.key === "Home") {
            event.preventDefault();
            focusOption(0);
            return;
        }
        if (event.key === "End") {
            event.preventDefault();
            focusOption(optionCount - 1);
        }
    };

    useEffect(() => {
        if (!open) return;
        const updatePlacement = () => {
            const triggerRect = triggerRef.current?.getBoundingClientRect();
            if (!triggerRect) return;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            setMenuPlacement(spaceBelow < 320 && spaceAbove > spaceBelow ? "up" : "down");
        };
        updatePlacement();
        const handlePointer = (event: PointerEvent) => {
            if (pickerRef.current?.contains(event.target as Node)) return;
            setOpen(false);
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("resize", updatePlacement);
        window.addEventListener("scroll", updatePlacement, true);
        document.addEventListener("pointerdown", handlePointer);
        document.addEventListener("keydown", handleKey);
        return () => {
            window.removeEventListener("resize", updatePlacement);
            window.removeEventListener("scroll", updatePlacement, true);
            document.removeEventListener("pointerdown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    return (
        <div className={`world-boss-effect-picker ${open ? "open" : ""} ${menuPlacement === "up" ? "drop-up" : ""}`} ref={pickerRef}>
            <button
                type="button"
                ref={triggerRef}
                className="world-boss-effect-trigger"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={handleTriggerKeyDown}
            >
                <span>
                    <small>{label}</small>
                    <strong>{selected?.name || emptyLabel}</strong>
                    <em>{selected ? getWorldBossItemModifierSummary(selected) : "Use profile MF or special gear from Profiles."}</em>
                </span>
                <ChevronDown size={16} />
            </button>
            {open && (
                <div className="world-boss-effect-menu" role="listbox" aria-label={ariaLabel}>
                    <button
                        type="button"
                        ref={(node) => { optionRefs.current[0] = node; }}
                        className={`world-boss-effect-option ${!value ? "active" : ""}`}
                        role="option"
                        aria-selected={!value}
                        onKeyDown={(event) => handleOptionKeyDown(event, 0)}
                        onClick={() => selectOption("")}
                    >
                        <span className="world-boss-effect-icon-placeholder" aria-hidden="true" />
                        <span>
                            <strong>{emptyLabel}</strong>
                            <small>Use profile MF or special gear from Profiles.</small>
                        </span>
                        {!value && <Check size={14} />}
                    </button>
                    {options.map((option, index) => {
                        const active = option.name === value;
                        return (
                            <button
                                type="button"
                                ref={(node) => { optionRefs.current[index + 1] = node; }}
                                className={`world-boss-effect-option ${active ? "active" : ""}`}
                                key={option.name}
                                role="option"
                                aria-selected={active}
                                onKeyDown={(event) => handleOptionKeyDown(event, index + 1)}
                                onClick={() => selectOption(option.name)}
                            >
                                {option.imageUrl ? <img src={option.imageUrl} alt="" /> : <span className="world-boss-effect-icon-placeholder" aria-hidden="true" />}
                                <span>
                                    <strong>{option.name}</strong>
                                    <small><QualityText value={option.quality}>{option.quality}</QualityText> {option.type}</small>
                                </span>
                                <em>{getWorldBossItemModifierSummary(option)}</em>
                                {active && <Check size={14} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
export default WorldBossItemEffectPicker;
