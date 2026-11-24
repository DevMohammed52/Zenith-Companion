'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';

export function ItemSearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      onClear={() => onChange('')}
      placeholder={placeholder}
      ariaLabel="Search items"
      showShortcutHint={false}
    />
  );
}

