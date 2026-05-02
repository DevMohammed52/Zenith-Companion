'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Database, Search, Package, ChevronRight } from 'lucide-react';
import { useItemModal } from '@/context/ItemModalContext';
import { useData } from '@/context/DataContext';

interface SearchIndexItem {
  id: string;
  name: string;
  type: string;
  quality: string;
  image: string;
}

function ItemsArchiveContent() {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const { openItem } = useItemModal();


  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.json())
      .then(data => {
        setIndex(data);
        
        const nameParam = searchParams.get('name');
        const idParam = searchParams.get('id');
        
        if (idParam) {
          openItem(idParam);
        } else if (nameParam) {
          setSearchTerm(nameParam);
          const found = data.find((i: any) => i.name.toLowerCase() === nameParam.toLowerCase());
          if (found) {
            openItem(found.id);
          }
        }
      })
      .catch(console.error);
  }, [searchParams, openItem]);

  const types = useMemo(() => {
    const t = new Set(index.map(i => i.type));
    return ['ALL', ...Array.from(t).sort()];
  }, [index]);

  const qualities = ['ALL', 'STANDARD', 'REFINED', 'PREMIUM', 'EPIC', 'LEGENDARY', 'MYTHIC', 'UNIQUE'];

  const { marketData } = useData();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    
    // First filter
    const filtered = index.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(q);
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchQuality = selectedQuality === 'ALL' || item.quality === selectedQuality;
      return matchSearch && matchType && matchQuality;
    });

    // Then sort by volume (Most used items first)
    return filtered.sort((a, b) => {
      const volA = marketData?.[a.name]?.vol_3 || 0;
      const volB = marketData?.[b.name]?.vol_3 || 0;
      return volB - volA; // Descending
    }).slice(0, 200);
  }, [index, debouncedSearch, selectedType, selectedQuality, marketData]);

  const qualityColors: any = {
    STANDARD: '#fff',
    REFINED: '#4ade80',
    PREMIUM: '#60a5fa',
    EPIC: '#a855f7',
    LEGENDARY: '#f59e0b',
    MYTHIC: '#ef4444',
    UNIQUE: '#ec4899'
  };

  return (
    <main className="container">
      <div className="header">
        <h1 className="header-title">
          <Database size={24} color="var(--text-accent)" /> ZENITH ITEM ARCHIVE
        </h1>
        <div className="header-status">
            <div className="status-dot"></div>
            <span className="mono">{index.length} ARTIFACTS CATALOGED</span>
        </div>
      </div>

      <div className="controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="control-group" style={{ flex: 2, minWidth: '300px' }}>
          <label className="control-label">Search Items</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="control-input" 
              placeholder="Search by name..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="control-group" style={{ flex: 1, minWidth: '150px' }}>
          <label className="control-label">Type</label>
          <select 
            className="control-input" 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="control-group" style={{ flex: 1, minWidth: '150px' }}>
          <label className="control-label">Quality</label>
          <select 
            className="control-input" 
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            {qualities.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {filteredItems.map(item => (
          <div 
            key={item.id}
            onClick={() => openItem(item.id)}
            className="item-card"
          >
            <div style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0, width: '4px',
                background: qualityColors[item.quality] || qualityColors.STANDARD
            }} />

            <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', zIndex: 1 }} />
            
            <div style={{ flex: 1, zIndex: 1 }}>
              <div className="card-item-name">
                {item.name}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.type.replace(/_/g, ' ')}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>•</span>
                <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: qualityColors[item.quality] || qualityColors.STANDARD 
                }}>
                  {item.quality}
                </span>
              </div>
            </div>

            <ChevronRight size={18} className="text-muted" style={{ opacity: 0.3 }} />
          </div>
        ))}
      </div>

      <style jsx>{`
        .item-card {
          background: rgba(255,255,255,0.02) !important;
          border: 1px solid var(--border-subtle) !important;
          border-radius: 16px !important;
          padding: 1.25rem !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          gap: 1rem !important;
          align-items: center !important;
          position: relative !important;
          overflow: hidden !important;
        }
        .item-card:hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: var(--text-accent) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .item-card:hover :global(svg) {
          opacity: 1 !important;
          color: var(--text-accent);
          transform: translateX(4px);
          transition: all 0.2s ease;
        }
      `}</style>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>No items found matching your filters.</p>
        </div>
      )}

      {filteredItems.length === 200 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Showing top 200 most active items. Use search/filters to find more.
        </div>
      )}
    </main>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="skeleton-text" style={{ width: '200px', margin: '0 auto' }}></div>
      </div>
    }>
      <ItemsArchiveContent />
    </Suspense>
  );
}
