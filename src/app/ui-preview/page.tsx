"use client";

import React, { useState } from "react";
import {
  Button,
  TextInput,
  SegmentedControl,
  Card,
  ModalSheet,
  Badge,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui";

export default function UIPreviewPage() {
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
    </div>
  );
}
