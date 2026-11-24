'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { getQualityTextStyle } from '@/lib/quality';
import type { FilterOption } from '../types';

export function ItemFilterPicker<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const [menuMaxHeight, setMenuMaxHeight] = useState(320);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value) || options[0] || null;

  const renderOptionLabel = (option: FilterOption<T> | null) => {
    if (!option) return 'Select';
    if (option.qualityTone) {
      return <span style={getQualityTextStyle(option.qualityTone)}>{option.label}</span>;
    }
    return option.label;
  };

  const closePicker = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const selectOption = (option: FilterOption<T> | undefined) => {
    if (!option) return;
    onChange(option.value);
    closePicker(true);
  };

  const prevSelectedIndexRef = useRef(selectedIndex);

  const moveActive = (direction: number) => {
    if (options.length === 0) return;
    setActiveIndex((current) => {
      const next = ((current + direction) % options.length + options.length) % options.length;
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportPadding = 12;
      const preferredHeight = 320;
      const isCompactPicker = window.matchMedia('(max-width: 820px)').matches;
      const spaceBelow = Math.max(48, window.innerHeight - rect.bottom - viewportPadding);
      const spaceAbove = Math.max(48, rect.top - viewportPadding);
      const nextPlacement = !isCompactPicker && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? 'up' : 'down';
      setPlacement(nextPlacement);
      setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === 'up' ? spaceAbove : spaceBelow));
    };
    updatePlacement();

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker(true);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(selectedIndex);
    } else if (prevSelectedIndexRef.current !== selectedIndex) {
      setActiveIndex(selectedIndex);
    }
    prevSelectedIndexRef.current = selectedIndex;
  }, [open, selectedIndex]);

  useEffect(() => {
    if (options.length === 0) return;
    if (activeIndex >= options.length || activeIndex < 0) {
      setActiveIndex(Math.min(selectedIndex, options.length - 1));
    }
  }, [options.length, activeIndex, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus({ preventScroll: true });
  }, [activeIndex, open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(event.key === 'ArrowDown' ? selectedIndex : options.length - 1);
    }
  };

  const handleTriggerClick = () => {
    if (options.length === 0) return;
    const nextOpen = !open;
    if (nextOpen && window.matchMedia('(max-width: 820px)').matches) {
      triggerRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    setOpen(nextOpen);
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (options.length === 0) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        closePicker(event.key === 'Escape');
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closePicker(true);
      return;
    }
    if (event.key === 'Tab') {
      closePicker(false);
      return;
    }
  };

  return (
    <div className={`item-select ${open ? 'open' : ''} ${open && placement === 'up' ? 'open-up' : ''}`} ref={pickerRef}>
      <button
        type="button"
        className="item-select-trigger"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="item-select-label">{renderOptionLabel(selected)}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="item-select-menu"
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          style={{ '--item-select-max-height': `${menuMaxHeight}px` } as React.CSSProperties}
        >
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                className={`item-select-option ${active ? 'active' : ''}`}
                role="option"
                aria-selected={active}
                tabIndex={index === activeIndex ? 0 : -1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  selectOption(option);
                }}
              >
                <span>{renderOptionLabel(option)}</span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
