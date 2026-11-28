"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { GameImage } from "@/components/GameImage";
import { Icon } from "@/components/ui";
import {
    formatWorldBossModifierDuration,
    getWorldBossItemModifierSummary,
    type WorldBossItemModifier,
} from "../types";
import styles from "../Bosses.module.css";

type WorldBossItemEffectPickerProps = {
    options: WorldBossItemModifier[];
    value: string;
    onChange: (itemName: string) => void;
    compact?: boolean;
};

export function WorldBossItemEffectPicker({
    options,
    value,
    onChange,
}: WorldBossItemEffectPickerProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const listboxId = useId();
    const labelId = useId();

    const selectedOption = useMemo(
        () => options.find((option) => option.name === value) || null,
        [options, value],
    );

    const focusOption = (index: number) => {
        const count = options.length + 1;
        const normalized = ((index % count) + count) % count;
        window.requestAnimationFrame(() => optionRefs.current[normalized]?.focus());
    };

    const selectAndClose = (itemName: string) => {
        onChange(itemName);
        setOpen(false);
        triggerRef.current?.focus();
    };

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const selectedIdx = selectedOption ? options.findIndex((opt) => opt.name === selectedOption.name) + 1 : 0;
            focusOption(event.key === "ArrowDown" ? selectedIdx : 0);
        } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
        }
    };

    const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, itemName: string) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusOption(index + 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusOption(index - 1);
        } else if (event.key === "Home") {
            event.preventDefault();
            focusOption(0);
        } else if (event.key === "End") {
            event.preventDefault();
            focusOption(options.length);
        } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectAndClose(itemName);
        }
    };

    useEffect(() => {
        if (!open) return;
        const handlePointer = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener("pointerdown", handlePointer);
        return () => window.removeEventListener("pointerdown", handlePointer);
    }, [open]);

    return (
        <div className={styles.controlField} ref={rootRef}>
            <span id={labelId} className={styles.fieldLabel}>
                <span>WB Consumable / Scroll</span>
                <span className={styles.fieldMeta}>
                    {selectedOption ? `+${selectedOption.magicFind}% MF` : `${options.length} available`}
                </span>
            </span>

            <div className={styles.pickerWrap}>
                <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-controls={open ? listboxId : undefined}
                    aria-labelledby={labelId}
                    className={styles.pickerTrigger}
                    onClick={() => setOpen((current) => !current)}
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span className={styles.pickerTriggerContent}>
                        <span className={styles.pickerTriggerIcon} aria-hidden="true">
                            {selectedOption?.imageUrl ? (
                                <GameImage
                                    src={selectedOption.imageUrl}
                                    alt=""
                                    width={22}
                                    height={22}
                                    sizes="22px"
                                    fallback={<Icon name="magic" size="sm" />}
                                />
                            ) : (
                                <Icon name="magic" size="sm" />
                            )}
                        </span>
                        <span className={styles.pickerTriggerText}>
                            <span className={styles.pickerPrimary}>
                                {selectedOption ? selectedOption.name : "No WB item modifier"}
                            </span>
                            <span className={styles.pickerSecondary}>
                                {selectedOption
                                    ? getWorldBossItemModifierSummary(selectedOption)
                                    : "Preview scroll or potion MF"}
                            </span>
                        </span>
                    </span>
                    <Icon name="chevronDown" size="sm" aria-hidden="true" />
                </button>

                {open && (
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
                        className={styles.pickerMenu}
                    >
                        <button
                            ref={(el) => {
                                optionRefs.current[0] = el;
                            }}
                            type="button"
                            role="option"
                            aria-selected={value === ""}
                            className={`${styles.pickerOption} ${value === "" ? styles.pickerOptionSelected : ""}`.trim()}
                            onClick={() => selectAndClose("")}
                            onKeyDown={(event) => handleOptionKeyDown(event, 0, "")}
                        >
                            <span className={styles.pickerOptionMain}>
                                <span className={styles.pickerTriggerIcon} aria-hidden="true">
                                    <Icon name="minus" size="sm" />
                                </span>
                                <span className={styles.pickerOptionText}>
                                    <span className={styles.pickerPrimary}>No WB item modifier</span>
                                    <span className={styles.pickerOptionMeta}>Base / profile MF only</span>
                                </span>
                            </span>
                            {value === "" && <Icon name="check" size="sm" aria-hidden="true" />}
                        </button>

                        {options.map((option, index) => {
                            const selected = option.name === value;
                            return (
                                <button
                                    key={option.name}
                                    ref={(el) => {
                                        optionRefs.current[index + 1] = el;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={`${styles.pickerOption} ${selected ? styles.pickerOptionSelected : ""}`.trim()}
                                    onClick={() => selectAndClose(option.name)}
                                    onKeyDown={(event) => handleOptionKeyDown(event, index + 1, option.name)}
                                >
                                    <span className={styles.pickerOptionMain}>
                                        <span className={styles.pickerTriggerIcon} aria-hidden="true">
                                            <GameImage
                                                src={option.imageUrl}
                                                alt=""
                                                width={22}
                                                height={22}
                                                sizes="22px"
                                                fallback={<Icon name="magic" size="sm" />}
                                            />
                                        </span>
                                        <span className={styles.pickerOptionText}>
                                            <span className={styles.pickerPrimary}>{option.name}</span>
                                            <span className={styles.pickerOptionMeta}>
                                                +{option.magicFind}% MF | {formatWorldBossModifierDuration(option.durationMs)}
                                            </span>
                                        </span>
                                    </span>
                                    {selected && <Icon name="check" size="sm" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
