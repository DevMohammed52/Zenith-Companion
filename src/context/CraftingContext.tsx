"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CRAFTING_QUEUE_STORAGE_KEY,
  isCraftingQueueRecipe,
  sanitizeCraftingQueue,
  sanitizeQueueQty,
} from '@/lib/crafting-queue';

interface CraftingContextType {
  queue: Record<string, number>;
  addToQueue: (name: string, qty?: number) => void;
  removeFromQueue: (name: string) => void;
  setQueueQty: (name: string, qty: number) => void;
  clearQueue: () => void;
}

const CraftingContext = createContext<CraftingContextType | undefined>(undefined);

export function CraftingProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load from localStorage
  useEffect(() => {
    setQueue(readStoredQueue());
    setIsLoaded(true);

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === CRAFTING_QUEUE_STORAGE_KEY) setQueue(readStoredQueue());
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CRAFTING_QUEUE_STORAGE_KEY, JSON.stringify(sanitizeCraftingQueue(queue)));
    }
  }, [queue, isLoaded]);

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

function readStoredQueue() {
  try {
    const saved = localStorage.getItem(CRAFTING_QUEUE_STORAGE_KEY);
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
