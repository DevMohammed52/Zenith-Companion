# JavaScript Bundle Size & Code Splitting

Reference: [web.dev/articles/reduce-javascript-payloads-with-code-splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting), [web.dev/articles/reduce-javascript-payloads-with-tree-shaking](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking), [bundlephobia.com](https://bundlephobia.com/)

## 1. Bundle Impact on Mobile Devices

JavaScript is the most expensive resource on the web. A 100 KB JavaScript bundle takes far longer to parse, compile, and execute on mobile CPUs than a 100 KB image takes to decode.

### The Rule of Dependency Addition
Before adding any package to `package.json`:
1. Check its size on [Bundlephobia](https://bundlephobia.com/).
2. Verify its tree-shaking capability and exports map.
3. Reject dependencies that add large polyfills, heavy runtime animation engines, or monolithic utility libraries when a 30-line native helper suffices.

## 2. Tree-Shaking Discipline: Named Imports from Icon Packages

Icons from packages like `lucide-react` must **strictly use named imports**:

```tsx
// Correct: Tree-shakes cleanly, bundler includes only the ~1 KB SVG icon code
import { Sword, Shield, MapPin, ArrowDown } from 'lucide-react';

// Anti-pattern: Destroys tree-shaking, pulls in thousands of icons into the production bundle
import * as Icons from 'lucide-react';
const IconComponent = Icons[iconNameString];
```

In Zenith Companion, `src/lib/icons.ts` maintains a static dictionary mapping named icon strings to explicit named imports, guaranteeing zero unused icons are bundled into client chunks.

## 3. Dynamic Code Splitting with `next/dynamic`

Large interactive features that are not needed on initial page paint must be split into on-demand chunks:

1. **Modals & Drawers**: `ItemModal`, `CommandDialog` (Ctrl+K), `DossierModal`.
2. **Chart Engines**: SVG price trend graphs, historical sales distribution visualizers.
3. **Heavy Tools**: Mythic Alchemy Lab, BiS Gear Optimizer.

```tsx
// Pattern: Dynamic code splitting with SSR false and skeleton fallback
import dynamic from 'next/dynamic';

const CommandDialog = dynamic(() => import('@/components/ui/CommandDialog'), {
  ssr: false,
});
```

When the user presses `Ctrl+K`, the browser fetches the ~8 KB command chunk in 50ms, keeping the main page bundle lightweight and fast to parse on mobile.
