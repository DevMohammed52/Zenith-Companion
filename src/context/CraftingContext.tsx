"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const saved = localStorage.getItem('zenith_craft_queue');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse craft queue:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('zenith_craft_queue', JSON.stringify(queue));
    }
  }, [queue, isLoaded]);

  const addToQueue = (name: string, qty: number = 1) => {
    setQueue(prev => ({
      ...prev,
      [name]: (prev[name] || 0) + qty
    }));
  };

  const removeFromQueue = (name: string) => {
    setQueue(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setQueueQty = (name: string, qty: number) => {
    if (qty <= 0) {
      removeFromQueue(name);
    } else {
      setQueue(prev => ({ ...prev, [name]: qty }));
    }
  };

  const clearQueue = () => {
    setQueue({});
  };

  return (
    <CraftingContext.Provider value={{ queue, addToQueue, removeFromQueue, setQueueQty, clearQueue }}>
      {children}
    </CraftingContext.Provider>
  );
}

export function useCrafting() {
  const context = useContext(CraftingContext);
  if (context === undefined) {
    throw new Error('useCrafting must be used within a CraftingProvider');
  }
  return context;
}
