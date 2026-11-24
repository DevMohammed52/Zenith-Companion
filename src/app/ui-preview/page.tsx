"use client";

import React, { useState } from "react";
import {
  Button,
  TextInput,
  SegmentedControl,
  Card,
  ModalSheet,
  Badge,
  Icon,
  TableContainer,
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ToastProvider,
  useToast,
  Banner,
  type BannerVariant,
  type TableDensity,
  type ButtonVariant,
  type ButtonSize,
  type EmptyStateVariant,
  type EmptyStateSize,
} from "@/components/ui";

export default function UIPreviewPage() {
  return (
    <ToastProvider>
      <UIPreviewContent />
    </ToastProvider>
  );
}

function UIPreviewContent() {
  const { toast, dismissAll, toasts } = useToast();

  // Button interactive states
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnSuccess, setBtnSuccess] = useState(false);
  const [btnVariant, setBtnVariant] = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize] = useState<ButtonSize>("md");

  // TextInput interactive states
  const [inputValue, setInputValue] = useState("Kaelen");
  const [priceValue, setPriceValue] = useState("145000");
  const [hasError, setHasError] = useState(false);

  // SegmentedControl state
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTimeframe, setActiveTimeframe] = useState("24h");

  // ModalSheet state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Interactive Card state
  const [clickCount, setClickCount] = useState(0);

  // Table state
  type SortColumn = "name" | "profit" | "margin" | "volume";
  const [tableDensity, setTableDensity] = useState<TableDensity>("normal");
  const [tableSortKey, setTableSortKey] = useState<SortColumn>("profit");
  const [tableSortDir, setTableSortDir] = useState<"ascending" | "descending">("descending");
  const [selectedTableRow, setSelectedTableRow] = useState<string>("titan-plate");

  // EmptyState interactive states
  const [emptyVariant, setEmptyVariant] = useState<EmptyStateVariant>("search-empty");
  const [emptySize, setEmptySize] = useState<EmptyStateSize>("md");
  const [searchDemoQuery, setSearchDemoQuery] = useState("glimmersteel helm");
  const [emptyFeedback, setEmptyFeedback] = useState<string | null>(null);

  // Banner interactive states
  const [demoBannerVariant, setDemoBannerVariant] = useState<BannerVariant>("announcement");
  const [isDemoBannerVisible, setIsDemoBannerVisible] = useState(true);

  const sampleItems = [
    { id: "titan-plate", name: "Titan's Platebody", rarity: "mythic" as const, skill: "Forge", profit: 1450000, margin: 42.5, volume: 1280 },
    { id: "abyssal-ring", name: "Abyssal Ring", rarity: "unique" as const, skill: "Dungeon", profit: 890000, margin: 38.0, volume: 2450 },
    { id: "glimmer-dagger", name: "Glimmersteel Dagger", rarity: "legendary" as const, skill: "Forge", profit: 520000, margin: 18.5, volume: 840 },
    { id: "health-potion", name: "Major Health Potion", rarity: "refined" as const, skill: "Alchemy", profit: 345000, margin: 24.2, volume: 15200 },
    { id: "swift-boots", name: "Swiftflight Boots", rarity: "epic" as const, skill: "Combat", profit: 210000, margin: 15.0, volume: 3100 },
  ];

  const handleTableSort = (key: SortColumn) => {
    if (tableSortKey === key) {
      setTableSortDir(tableSortDir === "descending" ? "ascending" : "descending");
    } else {
      setTableSortKey(key);
      setTableSortDir("descending");
    }
  };

  const sortedTableItems = [...sampleItems].sort((a, b) => {
    const mult = tableSortDir === "descending" ? -1 : 1;
    if (tableSortKey === "name") return mult * a.name.localeCompare(b.name);
    return mult * (a[tableSortKey] - b[tableSortKey]);
  });


  const simulateAsyncAction = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
    }, 2000);
  };

  const simulateSuccessAction = () => {
    setBtnSuccess(true);
    setTimeout(() => {
      setBtnSuccess(false);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 80px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header Banner */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Badge variant="neutral">Design System Lab</Badge>
          <Badge variant="legendary">Zenith Astral</Badge>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-main)", margin: "0 0 8px 0" }}>
          UI Primitives Showcase
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, maxWidth: 640 }}>
          Interactive testing ground for the core atomic primitives. Test hover states, active press physics, focus rings, keyboard navigation, and responsive touch layouts.
        </p>
      </div>

      {/* 1. Button Section */}
      <Card
        title="1. Button Primitive"
        subtitle="Apple HIG micro-interactions with hardware-accelerated press scaling, 44px mobile touch zones, and accessible loading states."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Controls Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Variant:</span>
            <SegmentedControl
              size="sm"
              ariaLabel="Button variant selector"
              value={btnVariant}
              onChange={(v) => setBtnVariant(v as ButtonVariant)}
              options={[
                { value: "primary", label: "Primary (AAA)" },
                { value: "secondary", label: "Secondary" },
                { value: "ghost", label: "Ghost" },
                { value: "danger", label: "Danger" },
              ]}
            />

            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginLeft: 8 }}>Size:</span>
            <SegmentedControl
              size="sm"
              ariaLabel="Button size selector"
              value={btnSize}
              onChange={(s) => setBtnSize(s as ButtonSize)}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
          </div>

          {/* Live Button Matrix */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <Button variant={btnVariant} size={btnSize}>
              Active Example
            </Button>

            <Button
              variant={btnVariant}
              size={btnSize}
              loading={btnLoading}
              onClick={simulateAsyncAction}
            >
              {btnLoading ? "Processing..." : "Click to Simulate 2s Async"}
            </Button>

            <Button
              variant={btnVariant}
              size={btnSize}
              success={btnSuccess}
              onClick={simulateSuccessAction}
            >
              {btnSuccess ? "Saved Successfully!" : "Click for Success State"}
            </Button>

            <Button
              variant={btnVariant}
              size={btnSize}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
            >
              Import Profile
            </Button>

            <Button variant={btnVariant} size={btnSize} disabled>
              Disabled
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. TextInput Section */}
      <Card
        title="2. TextInput Primitive"
        subtitle="Recessed dark well fill (--bg-input), bound label association, helper copy, aria-invalid error states, and mobile numeric input optimization."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <TextInput
            id="preview-name"
            label="Character Name"
            placeholder="e.g. Ironclad"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Enter your public IdleMMO player handle"
            leftIcon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />

          <TextInput
            id="preview-price"
            label="Custom Item Price (Gold)"
            labelAction={
              <button
                type="button"
                onClick={() => setHasError(!hasError)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, padding: 0 }}
              >
                {hasError ? "Clear Error" : "Toggle Error"}
              </button>
            }
            type="number"
            inputMode="numeric"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            error={hasError ? "Price must be below current market cap (50,000,000 gold)" : undefined}
            helperText={!hasError ? "Overrides global market price for alchemy and forge EV" : undefined}
            leftIcon={<span style={{ fontSize: 13, fontWeight: 700, color: "var(--quality-legendary)" }}>G</span>}
          />
        </div>
      </Card>

      {/* 3. SegmentedControl Section */}
      <Card
        title="3. SegmentedControl Primitive"
        subtitle="W3C ARIA APG tablist implementation with full ArrowLeft/ArrowRight keyboard support and high-contrast white active pill."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Category Filter (Medium, with item count badges):
            </span>
            <SegmentedControl
              ariaLabel="Item category filter"
              value={activeCategory}
              onChange={setActiveCategory}
              options={[
                { value: "all", label: "All Items", badge: 342 },
                { value: "weapons", label: "Weapons", badge: 48 },
                { value: "armor", label: "Armor", badge: 86 },
                { value: "alchemy", label: "Alchemy", badge: 19 },
                { value: "archived", label: "Archived", disabled: true },
              ]}
            />
          </div>

          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Timeframe Switcher (Small, full width):
            </span>
            <SegmentedControl
              size="sm"
              fullWidth
              ariaLabel="Market history timeframe"
              value={activeTimeframe}
              onChange={setActiveTimeframe}
              options={[
                { value: "24h", label: "24 Hours" },
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "all", label: "Lifetime" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 4. Card Variants Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <Card
          title="Default Surface"
          subtitle="Structural --bg-card elevation"
          action={<Badge variant="standard">Standard</Badge>}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Standard content surface with subtle hairline border and soft ambient shadow.
          </p>
        </Card>

        <Card
          variant="sunken"
          title="Sunken Well"
          subtitle="Recessed --bg-input depth"
          action={<Badge variant="neutral">Sunken</Badge>}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Ideal for formula parameters, raw JSON payloads, and embedded code blocks.
          </p>
        </Card>

        <Card
          accent="legendary"
          title="Legendary Accent"
          subtitle="3px high-contrast left border"
          action={<Badge variant="legendary">Accent</Badge>}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Visual indicator for drop tiers, danger alerts, or important notices.
          </p>
        </Card>

        <Card
          interactive
          title="Interactive Card"
          subtitle="Hover lift + physical press scale"
          action={<Badge variant="success">+{clickCount}</Badge>}
          onClick={() => setClickCount((c) => c + 1)}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Click or press Enter/Space. Lifts on hover and scales down 0.99 on press.
          </p>
        </Card>
      </div>

      {/* 5. ModalSheet Section */}
      <Card
        title="5. ModalSheet Primitive"
        subtitle="Responsive container: centered modal on desktop, slide-up sheet on mobile, with W3C ARIA focus trapping and Escape key closing."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Modal Sheet
          </Button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Tests body scroll lock, backdrop click, Escape key, and focus restoration.
          </span>
        </div>

        <ModalSheet
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Market Override Settings"
          description="Adjust local pricing parameters for this session."
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Save Changes
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput
              id="sheet-discount"
              label="Guild Tax Discount (%)"
              type="number"
              defaultValue="5"
              helperText="Applied when calculating net profit from market sales."
            />
            <TextInput
              id="sheet-margin"
              label="Minimum Profit Threshold (Gold)"
              type="number"
              defaultValue="25000"
              helperText="Hides skilling recipes yielding below this gold return."
            />
          </div>
        </ModalSheet>
      </Card>

      {/* 6. Item Rarity Badges Section */}
      <Card
        title="6. Two-Tier Rarity Badge System"
        subtitle="Verified WCAG 2.2 AA contrast with computed text-safe tints on cosmic slate surfaces."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge variant="standard">Standard (11.65:1)</Badge>
          <Badge variant="refined">Refined Text Safe (6.75:1)</Badge>
          <Badge variant="premium">Premium (8.73:1)</Badge>
          <Badge variant="epic">Epic Text Safe (6.20:1)</Badge>
          <Badge variant="legendary">Legendary (10.01:1)</Badge>
          <Badge variant="mythic">Mythic (6.93:1)</Badge>
          <Badge variant="unique">Unique Text Safe (6.50:1)</Badge>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge variant="warning">Warning (10.28:1)</Badge>
          <Badge variant="success">In Progress</Badge>
          <Badge variant="danger">High Danger</Badge>
          <Badge variant="neutral">Muted Status</Badge>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
            Official IdleMMO Text Gradients (Item Titles):
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <div>
              <span className="text-gradient-mythic" style={{ fontSize: 16, fontWeight: 600 }}>
                Cosmic Barrier
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                linear-gradient(90deg, #f48a00, #da5b00)
              </span>
            </div>

            <div>
              <span className="text-gradient-unique" style={{ fontSize: 16, fontWeight: 600 }}>
                First Birthday Cake
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                linear-gradient(90deg, rgb(180, 23, 244), rgb(128, 6, 181))
              </span>
            </div>

            <div>
              <span className="text-gradient-unique-safe" style={{ fontSize: 16, fontWeight: 600 }}>
                First Birthday Cake (Text Safe)
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                linear-gradient(90deg, #e879f9, #c084fc)
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <Badge variant="mythic" gradient>Mythic Gradient Badge</Badge>
            <Badge variant="unique" gradient>Unique Gradient Badge</Badge>
          </div>
        </div>
      </Card>

      {/* 7. Tabular Numerics Demonstration */}
      <Card
        title="7. Tabular Numerics on Proportional Font (cv02, cv03, cv04, cv11, tnum)"
        subtitle="Keeps proportional letter spacing while locking numerical column widths so live timers and counters never jitter."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Alchemy Expected Value:</span>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>
              1,842,910 <span style={{ fontSize: 13, fontWeight: 500, color: "var(--quality-legendary)" }}>gold/hr</span>
            </div>
          </div>

          <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Next Boss Spawn:</span>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>
              00:14:52
            </div>
          </div>

          <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Current Combat XP:</span>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>
              482,109 / 500,000
            </div>
          </div>
        </div>
      </Card>

      {/* 8. Icon Primitive & Semantic Map Showcase */}
      <Card
        title="8. Icon Primitive & Semantic Registry (One Icon, One Meaning)"
        subtitle="Auditable central concept mapping with optical scaling, 1.75px crisp stroke weight, and WCAG 2.2 SC 1.1.1 accessibility."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Optical Size Scale */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Optical Sizing Scale (xs: 12px, sm: 14px, md: 16px, lg: 20px, xl: 24px)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 20px", padding: "12px 16px", background: "var(--bg-input)", borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="combat" size="xs" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>xs (12px)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="combat" size="sm" />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>sm (14px)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="combat" size="md" />
                <span style={{ fontSize: 14, color: "var(--text-main)", fontWeight: 500 }}>md (16px default)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="combat" size="lg" />
                <span style={{ fontSize: 15, color: "var(--text-main)" }}>lg (20px)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="combat" size="xl" />
                <span style={{ fontSize: 16, color: "var(--text-main)", fontWeight: 600 }}>xl (24px)</span>
              </div>
            </div>
          </div>

          {/* IdleMMO Game Domains */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Domain System Mappings
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {[
                { name: "combat", label: "Combat" },
                { name: "boss", label: "Bosses" },
                { name: "dungeon", label: "Dungeons" },
                { name: "alchemy", label: "Alchemy" },
                { name: "forge", label: "Forge" },
                { name: "skillProfit", label: "Skill Profit" },
                { name: "weather", label: "Weather" },
                { name: "housing", label: "Housing" },
                { name: "pets", label: "Pets" },
                { name: "museum", label: "Museum" },
                { name: "conquest", label: "Conquest" },
                { name: "lore", label: "Lore" },
                { name: "items", label: "Items" },
                { name: "gold", label: "Economy (Gold)" },
                { name: "xp", label: "Essence / XP" },
                { name: "timer", label: "Timer / Clock" },
              ].map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    borderRadius: 6,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Icon name={item.name as any} size="md" />
                  <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility Demonstration */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              WCAG 2.2 SC 1.1.1 Non-Text Content Compliance
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-input)", borderRadius: 6 }}>
                <Icon name="search" label="Search Database" size="md" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Informative Icon (Accessible Name via visually hidden text)</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="filter" size="sm" />}
              >
                Filter Results
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="copy" size="sm" />}
                aria-label="Copy Data"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Primitive 8: Data Table & Dense Data Grid */}
      <Card
        variant="elevated"
        accent="refined"
        title="Primitive 8: Table & Dense Data Grid"
        subtitle="Accessible scroll region, Lea Verou CSS scroll shadows, sortable columns, and tabular numbers"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Controls Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Row Density:</span>
              <SegmentedControl<TableDensity>
                ariaLabel="Row density selection"
                options={[
                  { value: "compact", label: "Compact (36px)" },
                  { value: "normal", label: "Normal (44px)" },
                  { value: "relaxed", label: "Relaxed (52px)" },
                ]}
                value={tableDensity}
                onChange={(val) => setTableDensity(val)}
                size="sm"
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Sorted by <strong style={{ color: "var(--text-main)" }}>{tableSortKey}</strong> ({tableSortDir})
            </div>
          </div>

          {/* Accessible Data Table */}
          <TableContainer
            ariaLabel="IdleMMO Crafting and Market Comparison Grid"
            maxHeight={320}
          >
            <Table density={tableDensity} hoverable striped>
              <TableCaption visuallyHidden>
                Item crafting profit, margins, and market volumes
              </TableCaption>
              <TableHeader sticky>
                <TableRow>
                  <TableHead
                    pinned
                    sortable
                    sortDirection={tableSortKey === "name" ? tableSortDir : "none"}
                    onSort={() => handleTableSort("name")}
                  >
                    Item Name
                  </TableHead>
                  <TableHead align="center">Skill</TableHead>
                  <TableHead
                    align="right"
                    sortable
                    sortDirection={tableSortKey === "profit" ? tableSortDir : "none"}
                    onSort={() => handleTableSort("profit")}
                  >
                    Profit (Gold/hr)
                  </TableHead>
                  <TableHead
                    align="right"
                    sortable
                    sortDirection={tableSortKey === "margin" ? tableSortDir : "none"}
                    onSort={() => handleTableSort("margin")}
                  >
                    Margin (%)
                  </TableHead>
                  <TableHead
                    align="right"
                    sortable
                    sortDirection={tableSortKey === "volume" ? tableSortDir : "none"}
                    onSort={() => handleTableSort("volume")}
                  >
                    Volume (3d)
                  </TableHead>
                  <TableHead align="center">Rarity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTableItems.map((item) => (
                  <TableRow
                    key={item.id}
                    selected={selectedTableRow === item.id}
                    interactive
                    onClick={() => setSelectedTableRow(item.id)}
                  >
                    <TableCell pinned style={{ fontWeight: 500 }}>
                      {item.name}
                    </TableCell>
                    <TableCell align="center">
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.skill}</span>
                    </TableCell>
                    <TableCell numeric style={{ fontWeight: 600, color: "var(--text-success)" }}>
                      +{item.profit.toLocaleString()}
                    </TableCell>
                    <TableCell numeric>
                      {item.margin.toFixed(1)}%
                    </TableCell>
                    <TableCell numeric style={{ color: "var(--text-muted)" }}>
                      {item.volume.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={item.rarity} size="sm">
                        {item.rarity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell pinned style={{ fontWeight: 600 }}>
                    Average
                  </TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell numeric style={{ fontWeight: 600, color: "var(--text-success)" }}>
                    +683,000
                  </TableCell>
                  <TableCell numeric style={{ fontWeight: 600 }}>
                    27.6%
                  </TableCell>
                  <TableCell numeric style={{ fontWeight: 600 }}>
                    4,574
                  </TableCell>
                  <TableCell align="center">-</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </div>
      </Card>

      {/* Primitive 9: EmptyState & Error Tone */}
      <Card
        variant="elevated"
        accent="refined"
        title="Primitive 9: EmptyState & Error Tone"
        subtitle="Semantic taxonomy (no-data, search-empty, error, offline), WCAG 2.2 SC 4.1.3 live region, query echoing, and single action budget"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Controls Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Category:</span>
              <SegmentedControl<EmptyStateVariant>
                ariaLabel="Empty state category selection"
                options={[
                  { value: "search-empty", label: "Search Zero-Result" },
                  { value: "no-data", label: "No Data / First Run" },
                  { value: "error", label: "System Error" },
                  { value: "offline", label: "Offline Mode" },
                ]}
                value={emptyVariant}
                onChange={(val) => setEmptyVariant(val)}
                size="sm"
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Size:</span>
              <SegmentedControl<EmptyStateSize>
                ariaLabel="Empty state size selection"
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                ]}
                value={emptySize}
                onChange={(val) => setEmptySize(val)}
                size="sm"
              />
            </div>
          </div>

          {emptyFeedback && (
            <div style={{ padding: "8px 12px", borderRadius: 6, backgroundColor: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.25)", color: "var(--text-success)", fontSize: 13 }}>
              {emptyFeedback}
            </div>
          )}

          {/* Interactive Variant Preview */}
          <div style={{ borderRadius: 8, overflow: "hidden" }}>
            {emptyVariant === "search-empty" && (
              <EmptyState
                variant="search-empty"
                size={emptySize}
                title="No Matching Market Items"
                query={searchDemoQuery}
                action={{
                  label: "Clear Search",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Search cleared");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
                secondaryAction={{
                  label: "Reset All Filters",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Filters reset");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
              />
            )}

            {emptyVariant === "no-data" && (
              <EmptyState
                variant="no-data"
                size={emptySize}
                title="No Characters Linked"
                description="Link your IdleMMO character profile to calculate personalized skilling profit, boss combat chances, and equipment upgrades."
                action={{
                  label: "Import Character Profile",
                  variant: "primary",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Opening profile import dialog");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
                secondaryAction={{
                  label: "View Public Profiles",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Navigating to public profiles");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
              />
            )}

            {emptyVariant === "error" && (
              <EmptyState
                variant="error"
                size={emptySize}
                title="Edge Worker Connection Failed"
                description="Unable to sync real-time market pricing from the Cloudflare edge SQLite worker. The server may be restarting or rate-limiting."
                action={{
                  label: "Retry Connection",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Retrying network connection...");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
                secondaryAction={{
                  label: "Report Issue",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Opening issue reporter");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
              />
            )}

            {emptyVariant === "offline" && (
              <EmptyState
                variant="offline"
                size={emptySize}
                title="Offline Mode Active"
                description="Displaying cached local market data. Item prices reflect the last successful network synchronization."
                action={{
                  label: "Attempt Reconnect",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Polling network status...");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
                secondaryAction={{
                  label: "Offline Storage Settings",
                  onClick: () => {
                    setEmptyFeedback("Action triggered: Navigating to cache settings");
                    setTimeout(() => setEmptyFeedback(null), 2500);
                  },
                }}
              />
            )}
          </div>

          {/* Side-by-side Comparative Showcase */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12 }}>
              All 4 Primary Taxonomy Variants (Side-by-Side Comparison):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <EmptyState
                variant="search-empty"
                size="sm"
                title="Search Zero-Result"
                query="runemark"
                action={{ label: "Clear Query", size: "sm" }}
              />
              <EmptyState
                variant="no-data"
                size="sm"
                title="Unpopulated Queue"
                description="Nothing currently queued for production."
                action={{ label: "Add Recipe", size: "sm" }}
              />
              <EmptyState
                variant="error"
                size="sm"
                title="Sync Error"
                description="Edge database query timed out after 5s."
                action={{ label: "Retry", size: "sm" }}
              />
              <EmptyState
                variant="offline"
                size="sm"
                title="Offline Storage"
                description="Displaying cached data from local cache."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Primitive 10: Feedback, Notifications & Toasts */}
      <Card
        variant="elevated"
        accent="refined"
        title="Primitive 10: Feedback, Notifications & Toasts"
        subtitle="WCAG 2.2 SC 2.2.1 adaptive duration, hover/focus pause, pre-mounted polite/assertive live regions, duplicate collapsing, mobile dock offset, and undo actions"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Action Trigger Controls */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-main)" }}>
              Interactive Toast Triggers
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  toast.success("Profile synced with Cloudflare D1 edge", {
                    description: "Updated 42 inventory items across 3 characters.",
                  })
                }
              >
                Trigger Success
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  toast.info("Boss timer updated", {
                    description: "Broodmother respawns in 14m 20s.",
                  })
                }
              >
                Trigger Info
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  toast.warning("Market cache is 45 minutes stale", {
                    description: "IdleMMO API scraper is throttled to 1 request per second.",
                  })
                }
              >
                Trigger Warning
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={() =>
                  toast.error("Edge worker connection timed out", {
                    description: "Cloudflare SQLite query exceeded 5,000ms threshold. Click X to close.",
                  })
                }
              >
                Trigger Error (Persistent)
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  toast({
                    title: "Recipe unpinned",
                    description: "Titan's Platebody removed from quick queue.",
                    variant: "info",
                    action: {
                      label: "Undo",
                      onClick: () => toast.success("Recipe restored to quick queue"),
                    },
                  })
                }
              >
                Trigger Actionable (Undo)
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() =>
                  toast.info("Market listing refreshed", {
                    description: "Calculated EV updated for 18 forged items.",
                  })
                }
              >
                Trigger Duplicate (Rapid Click)
              </Button>

              <Button
                variant="ghost"
                size="md"
                disabled={toasts.length === 0}
                onClick={() => dismissAll()}
              >
                Dismiss All ({toasts.length})
              </Button>
            </div>
          </div>

          {/* Telemetry & Constraints Summary */}
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                Active Toast Stack Status
              </span>
              <Badge variant={toasts.length > 0 ? "refined" : "neutral"} size="sm">
                {toasts.length} active
              </Badge>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Duration scales adaptively: 2,000ms base + 280ms per word (2,800ms - 7,500ms bounds). Actionable toasts require 8,000ms minimum. Errors are persistent and require explicit dismissal. Hovering over a toast or moving keyboard focus into it pauses the auto-dismiss timer. Rapid duplicate messages collapse into a single toast with an incrementing badge counter to prevent viewport spam.
            </p>
          </div>
        </div>
      </Card>

      {/* Primitive 11: System Announcements & Banners */}
      <Card
        variant="elevated"
        accent="refined"
        title="Primitive 11: System Announcements & Banners"
        subtitle="Page-level persistent alerts, prominent maintenance windows, service status, and release announcements with action buttons and dismissibility"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Interactive Banner Demo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Variant:</span>
                <SegmentedControl<BannerVariant>
                  ariaLabel="Banner variant selection"
                  options={[
                    { value: "announcement", label: "Announcement" },
                    { value: "warning", label: "Warning" },
                    { value: "error", label: "Error" },
                    { value: "info", label: "Info" },
                  ]}
                  value={demoBannerVariant}
                  onChange={setDemoBannerVariant}
                  size="sm"
                />
              </div>

              {!isDemoBannerVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDemoBannerVisible(true)}
                >
                  Restore Banner
                </Button>
              )}
            </div>

            {isDemoBannerVisible ? (
              <Banner
                variant={demoBannerVariant}
                action={{
                  label: "Learn More",
                  onClick: () => toast.info(`Action triggered for ${demoBannerVariant} banner`),
                }}
                onDismiss={() => {
                  setIsDemoBannerVisible(false);
                  toast.info("Banner dismissed");
                }}
                dismissible
              >
                {demoBannerVariant === "announcement" &&
                  "Patch 0.86.2 recipes and pet stat curves have been indexed into Zenith Companion."}
                {demoBannerVariant === "warning" &&
                  "IdleMMO API is experiencing degraded performance. Live market syncing is temporarily throttled."}
                {demoBannerVariant === "error" &&
                  "Cloudflare D1 edge database maintenance in progress. Companion calculations operating in read-only mode."}
                {demoBannerVariant === "info" &&
                  "Offline resilience active. All market arbitrage and EV calculations are running against local cache."}
              </Banner>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: "1px dashed var(--border-subtle)",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                Banner is currently dismissed. Click &apos;Restore Banner&apos; above to display it again.
              </div>
            )}
          </div>

          {/* Static Comparison Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>
              Standard Banner Variants
            </h4>

            <Banner
              variant="warning"
              action={{
                label: "API Status",
                onClick: () => toast.info("Opening IdleMMO status page"),
              }}
            >
              IdleMMO API is experiencing degraded performance. Live market syncing is temporarily throttled to 1 request every 2.5 seconds.
            </Banner>

            <Banner
              variant="error"
              action={{
                label: "Schedule",
                onClick: () => toast.info("Viewing Cloudflare maintenance window"),
              }}
            >
              Cloudflare D1 edge database maintenance scheduled at 02:00 UTC. Custom profile synchronizations will pause during this 15-minute window.
            </Banner>

            <Banner
              variant="announcement"
              action={{
                label: "View Notes",
                onClick: () => toast.info("Opening Patch 0.86.2 summary"),
              }}
              onDismiss={() => toast.info("Announcement dismissed")}
              dismissible
            >
              Patch 0.86.2 is live. New alchemical essences and combat dungeon drops are now available in all calculators.
            </Banner>

            <Banner variant="info">
              Offline resilience active. Displaying cached calculations from local IndexedDB storage. Fresh pricing will download automatically upon reconnection.
            </Banner>
          </div>
        </div>
      </Card>
    </div>
  );
}
