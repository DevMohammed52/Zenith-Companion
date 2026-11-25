'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';

export function ItemSearchBox({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <SearchInput
      id={id}
      value={value}
      onChange={onChange}
      onClear={() => onChange('')}
      placeholder={placeholder}
      ariaLabel="Search items"
      showShortcutHint={false}
    />
  );
}

