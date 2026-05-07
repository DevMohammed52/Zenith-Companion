"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CRAFTING_QUEUE_STORAGE_KEY,
  isCraftingQueueRecipe,
  sanitizeCraftingQueue,
  sanitizeQueueQty,
} from '@/lib/crafting-queue';
import { useProfiles } from '@/lib/profiles';
import { getProfileStorageKey } from '@/lib/profile-storage';

interface CraftingContextType {
  queue: Record<string, number>;
  addToQueue: (name: string, qty?: number) => void;
  removeFromQueue: (name: string) => void;
  setQueueQty: (name: string, qty: number) => void;
  clearQueue: () => void;
}

const CraftingContext = createContext<CraftingContextType | undefined>(undefined);

export function CraftingProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfiles();
  const activeProfileId = activeProfile?.id || null;
  const storageKey = useMemo(() => getProfileStorageKey(CRAFTING_QUEUE_STORAGE_KEY, activeProfile?.id), [activeProfile?.id]);
  const [queue, setQueue] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setQueue(readStoredQueue(storageKey, activeProfileId ? undefined : CRAFTING_QUEUE_STORAGE_KEY));
    setIsLoaded(true);

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === storageKey) setQueue(readStoredQueue(storageKey, activeProfileId ? undefined : CRAFTING_QUEUE_STORAGE_KEY));
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, [activeProfileId, storageKey]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(sanitizeCraftingQueue(queue)));
    }
  }, [queue, isLoaded, storageKey]);

  const addToQueue = useCallback((name: string, qty: number = 1) => {
    if (!isCraftingQueueRecipe(name)) return;
    const safeQty = sanitizeQueueQty(qty);
    if (safeQty <= 0) return;
    setQueue(prev => ({
      ...prev,
      [name]: sanitizeQueueQty((prev[name] || 0) + safeQty)
    }));
  }, []);

  const removeFromQueue = useCallback((name: string) => {
    setQueue(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const setQueueQty = useCallback((name: string, qty: number) => {
    if (!isCraftingQueueRecipe(name)) {
      removeFromQueue(name);
      return;
    }
    const safeQty = sanitizeQueueQty(qty);
    if (safeQty <= 0) {
      removeFromQueue(name);
    } else {
      setQueue(prev => ({ ...prev, [name]: safeQty }));
    }
  }, [removeFromQueue]);

  const clearQueue = useCallback(() => {
    setQueue({});
  }, []);

  const value = useMemo(() => ({
    queue,
    addToQueue,
    removeFromQueue,
    setQueueQty,
    clearQueue,
  }), [addToQueue, clearQueue, queue, removeFromQueue, setQueueQty]);

  return (
    <CraftingContext.Provider value={value}>
      {children}
    </CraftingContext.Provider>
  );
}

function readStoredQueue(storageKey: string, legacyKey?: string) {
  try {
    const saved = localStorage.getItem(storageKey) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
    return saved ? sanitizeCraftingQueue(JSON.parse(saved)) : {};
  } catch (e) {
    console.error('Failed to parse craft queue:', e);
    return {};
  }
}

export function useCrafting() {
  const context = useContext(CraftingContext);
  if (context === undefined) {
    throw new Error('useCrafting must be used within a CraftingProvider');
  }
  return context;
}
