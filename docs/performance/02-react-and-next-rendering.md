# React 19 & Next.js 16 Rendering Optimization

Reference: [react.dev/reference/react/useDeferredValue](https://react.dev/reference/react/useDeferredValue), [react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition), [react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect), [nextjs.org/docs/app/building-your-application/optimizing](https://nextjs.org/docs/app/building-your-application/optimizing)

## 1. Responsive Input with `useDeferredValue`

When an input field (search box, filter picker) controls a large rendered view, rendering the updated view immediately can freeze the input, causing dropped keystrokes and high INP.

```tsx
// Pattern: Separate high-priority user typing from deferred background filtering
function SearchableCatalog({ allItems }: { allItems: Item[] }) {
  const [query, setQuery] = useState('');
  
  // High-priority: Updates immediately on keystroke so text input remains 60fps
  const deferredQuery = useDeferredValue(query);

  // Background priority: React pauses or interrupts this re-render if the user types again
  const filteredItems = useMemo(() => {
    return filterItems(allItems, deferredQuery);
  }, [allItems, deferredQuery]);

  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search items..."
      />
      <div style={{ opacity: isStale ? 0.7 : 1, transition: 'opacity 0.15s ease' }}>
        <ItemList items={filteredItems} />
      </div>
    </div>
  );
}
```

## 2. Non-Blocking State Updates with `useTransition`

Use `useTransition` for tab switches, sort changes, or view toggles where immediate visual feedback is required on the trigger button while the content view prepares in the background:

```tsx
const [isPending, startTransition] = useTransition();

const handleSortChange = (newSort: SortKey) => {
  startTransition(() => {
    setSortBy(newSort);
  });
};
```

## 3. "You Might Not Need an Effect" Disciplines

Unnecessary `useEffect` calls are the primary cause of rendering cascades, flickering, and infinite loops.

### Rule A: Transform Data During Rendering
Never store filtered or transformed data in state with an effect:

```tsx
// Anti-pattern: Cascading re-render
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(items.filter(i => i.type === selectedType));
}, [items, selectedType]);

// Correct: Compute inline during render with useMemo
const filtered = useMemo(() => {
  return items.filter(i => i.type === selectedType);
}, [items, selectedType]);
```

### Rule B: Resetting State on Prop Change
Never use `useEffect` to reset selection or scroll position on ID changes:

```tsx
// Anti-pattern: Renders with stale state, then flashes on next frame
useEffect(() => {
  setSelectedTier(0);
}, [item.id]);

// Correct: Pass key={item.id} to the child component to reset its internal state cleanly
<ItemTierInspector key={item.id} item={item} />
```

### Rule C: Avoid Runaway Observer Loops
When using `IntersectionObserver` or scroll listeners, never put the growing list length in the dependency array. Storing dynamic counts in dependencies forces the observer to disconnect and reconnect on every batch, immediately re-triggering intersection in a tight runaway loop.

## 4. Server & Client Component Boundaries

Next.js App Router performs best when Server Components deliver static structural HTML and client components (`'use client'`) are pushed to the interactive leaves of the component tree:

1. **Leaf Client Boundaries**: Only mark interactive widgets (`ItemModal`, `FilterPicker`, `SortControls`) as `'use client'`. Static page shells and SEO headers stay server components.
2. **Lazy Loading Heavy Modals**: Use `next/dynamic` to load heavy, rarely opened modals or charts only when requested:
   ```tsx
   import dynamic from 'next/dynamic';
   
   const ItemModal = dynamic(() => import('@/components/ItemModal'), {
     ssr: false,
     loading: () => <ModalSkeleton />,
   });
   ```

## 5. React Compiler & Selective Memoization

1. **Do not memoize by default**: Wrapping every primitive calculation in `useMemo` and every handler in `useCallback` adds allocation overhead and code noise.
2. **Memoize by measurement**: Only apply `useMemo` when profiling shows an expensive calculation (>5ms) or when passing objects/callbacks to virtualized list windowing hooks where referential equality prevents child row reconciliation.
