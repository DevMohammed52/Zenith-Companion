'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import ItemModal from '@/components/ItemModal';

interface SearchIndexItem {
  id: string;
  name: string;
}

interface ItemModalContextType {
  openItem: (id: string) => void;
  openItemByName: (name: string) => void;
  prefetchItem: (idOrName: string) => void;
  closeItem: () => void;
  getCachedItem: (id: string) => any;
  setCachedItem: (id: string, data: any) => void;
}

const ItemModalContext = createContext<ItemModalContextType | undefined>(undefined);

export function ItemModalProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const [itemCache] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.ok ? r.json() : [])
      .then(setSearchIndex)
      .catch(() => {});
  }, []);

  const getCachedItem = React.useCallback((id: string) => itemCache.get(id), [itemCache]);
  const setCachedItem = React.useCallback((id: string, data: any) => itemCache.set(id, data), [itemCache]);

  const prefetchItem = React.useCallback(async (idOrName: string) => {
    let id = idOrName;
    if (!idOrName.includes('-') && idOrName.length < 50) {
        const found = searchIndex.find(i => i.name.toLowerCase() === idOrName.toLowerCase());
        if (found) id = found.id;
    }

    if (itemCache.has(id)) return;
    
    try {
        const res = await fetch(`/api/items/${id}`);
        if (res.ok) {
            const data = await res.json();
            itemCache.set(id, data);
        }
    } catch {}
  }, [searchIndex, itemCache]);

  const openItem = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);
  
  const openItemByName = React.useCallback((name: string) => {
    let found = searchIndex.find(i => i.name.toLowerCase() === name.toLowerCase());
    
    // Fuzzy fallback for recipes if exact name match fails
    if (!found) {
      const variants = [];
      if (name.startsWith('Recipe: ')) {
        const base = name.replace('Recipe: ', '');
        variants.push(base + ' Recipe');
        variants.push(base + ' Recipe (Untradable)');
        variants.push(base + ' (Untradable)');
        
        if (!base.toLowerCase().includes('crystal')) {
          variants.push(base + ' Crystal (Untradable)');
          variants.push(base + ' Crystal Recipe');
        }
      } else if (name.endsWith(' Recipe')) {
        const base = name.replace(' Recipe', '');
        variants.push('Recipe: ' + base);
        variants.push(base + ' (Untradable)');
      }
      
      for (const variant of variants) {
        found = searchIndex.find(i => i.name.toLowerCase() === variant.toLowerCase());
        if (found) break;
      }
    }

    if (found) {
      setActiveId(found.id);
    }
  }, [searchIndex]);
  }, [searchIndex]);

  const closeItem = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const value = React.useMemo(() => ({ 
    openItem, 
    openItemByName, 
    prefetchItem, 
    closeItem, 
    getCachedItem, 
    setCachedItem 
  }), [openItem, openItemByName, prefetchItem, closeItem, getCachedItem, setCachedItem]);

  return (
    <ItemModalContext.Provider value={value}>
      {activeId && <ItemModal id={activeId} onClose={closeItem} />}
      {children}
    </ItemModalContext.Provider>
  );
}

export function useItemModal() {
  const context = useContext(ItemModalContext);
  if (context === undefined) {
    throw new Error('useItemModal must be used within an ItemModalProvider');
  }
  return context;
}
