'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export function ItemSearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const lastCommittedRef = useRef(value);

  useEffect(() => {
    if (value === lastCommittedRef.current) return;
    lastCommittedRef.current = value;
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localValue === lastCommittedRef.current) return;
      lastCommittedRef.current = localValue;
      onChange(localValue);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="search-shell">
      <Search size={15} aria-hidden="true" />
      <input
        aria-label="Search items"
        type="text"
        className="control-input"
        placeholder={placeholder}
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && localValue) {
            event.preventDefault();
            setLocalValue('');
            lastCommittedRef.current = '';
            onChange('');
          }
        }}
      />
    </div>
  );
}
