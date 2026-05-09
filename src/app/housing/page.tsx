"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Castle,
  Check,
  ChevronDown,
  Coins,
  Home,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { usePreferences } from "@/lib/preferences";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { useProfiles } from "@/lib/profiles";
import {
  HOUSING_COMPONENTS,
  HOUSING_LOCATIONS,
  calculateHousingBuffs,
  formatHours,
  getComponentBuildCost,
  getHousingActivityLabel,
  sanitizeHousing,
  type HousingActivity,
  type HousingMode,
} from "@/lib/housing";

const BUFF_ACTIVITIES: HousingActivity[] = [
  "woodcutting",
  "mining",
  "fishing",
  "alchemy",
  "smelting",
  "cooking",
  "forge",
  "meditation",
  "eventMastery",
  "combat",
  "dungeon",
  "hunting",
  "construction",
];

const GUEST_BUFF_OPTIONS = [
  { label: "None", hours: 0 },
  { label: "T1", hours: 0.5 },
  { label: "T2", hours: 1 },
  { label: "T3", hours: 2 },
  { label: "T4", hours: 3 },
  { label: "T5", hours: 4 },
] as const;

const MODE_OPTIONS: Array<{ mode: HousingMode; label: string; hint: string }> = [
  { mode: "none", label: "None", hint: "Disable housing buffs" },
  { mode: "owner", label: "Owner", hint: "Use built components" },
  { mode: "guest", label: "Guest", hint: "Enter received buffs" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All components" },
  { value: "idle", label: "Idle rooms" },
  { value: "special", label: "Special" },
  { value: "guest", label: "Guest quarters" },
] as const;

function formatGold(value: number) {
  return `${Math.round(value).toLocaleString()}g`;
}

function priceForItem(
  name: string,
  marketData: Record<string, any> | null,
  allItemsDb: Record<string, any> | null,
  customPrices: Record<string, number>,
) {
  const custom = Number(customPrices?.[name] || 0);
  if (custom > 0) return custom;
  const market = getSafeMarketValue(marketData?.[name]);
  if (market > 0) return market;
  const vendor = Number(allItemsDb?.[name]?.vendor_price || 0);
  return Number.isFinite(vendor) && vendor > 0 ? vendor : 0;
}

function ChoicePicker<T extends string>({
  label,
  value,
  options,
  open,
  setOpen,
  onChange,
  placeholder = "Select",
}: {
  label?: string;
  value: T | "";
  options: Array<{ value: T; label: string; hint?: string }>;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div
      className="choice-picker"
      ref={rootRef}
    >
      {label && <span className="choice-label">{label}</span>}
      <button
        type="button"
        className="choice-trigger"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="choice-menu custom-scrollbar" role="listbox">
          <div className="choice-menu-head">
            <span>{label || placeholder}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={15} />
            </button>
          </div>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? "active" : ""}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <strong>{option.label}</strong>
              {option.hint && <small>{option.hint}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HousingPage() {
  const { activeProfile, updateProfile } = useProfiles();
  const { marketData, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "idle" | "special" | "guest">("all");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [draftTiers, setDraftTiers] = useState<Record<string, string>>({});

  const housing = sanitizeHousing(activeProfile?.housing);
  const summary = useMemo(() => calculateHousingBuffs(housing), [housing]);
  const selected = new Set(housing.selectedComponents);
  const ownerSlotsAvailable = housing.foundationBuilt ? 1 + housing.extraSlots : 0;

  const materialPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    for (const component of HOUSING_COMPONENTS) {
      for (const material of component.materials) {
        prices[material.name] = priceForItem(material.name, marketData, allItemsDb, preferences.customPrices);
      }
    }
    return prices;
  }, [allItemsDb, marketData, preferences.customPrices]);

  const selectedCost = useMemo(() => {
    const foundationCost = housing.mode === "owner" && housing.foundationBuilt
      ? getComponentBuildCost(HOUSING_COMPONENTS.find((component) => component.id === "foundation")!, materialPrices).totalCost
      : 0;
    const slot = HOUSING_COMPONENTS.find((component) => component.id === "slot");
    const slotCost = slot ? getComponentBuildCost(slot, materialPrices).totalCost * housing.extraSlots : 0;
    return foundationCost + slotCost + housing.selectedComponents.reduce((sum, id) => {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      if (!component) return sum;
      return sum + getComponentBuildCost(component, materialPrices).totalCost;
    }, 0);
  }, [housing.extraSlots, housing.foundationBuilt, housing.mode, housing.selectedComponents, materialPrices]);

  const selectedComponentDetails = useMemo(() => (
    housing.selectedComponents
      .map((id) => HOUSING_COMPONENTS.find((component) => component.id === id))
      .filter((component): component is NonNullable<typeof component> => Boolean(component))
  ), [housing.selectedComponents]);

  const slotOverage = Math.max(0, summary.activeComponentCount - summary.slotCapacity);

  const componentGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const visible = HOUSING_COMPONENTS.filter((component) => {
      if (component.category === "structure") return false;
      if (category !== "all" && component.category !== category) return false;
      if (!needle) return true;
      return [
        component.name,
        component.family,
        component.description,
        component.activity ? getHousingActivityLabel(component.activity) : "",
        component.materials.map((material) => material.name).join(" "),
      ].join(" ").toLowerCase().includes(needle);
    });
    const groups: Array<{ key: string; family: string; category: string; variants: typeof HOUSING_COMPONENTS; selectedId: string | null }> = [];
    const seen = new Set<string>();
    for (const component of visible) {
      if (component.category === "idle" || component.category === "guest") {
        if (seen.has(component.family)) continue;
        const variants = HOUSING_COMPONENTS.filter((candidate) => candidate.family === component.family);
        groups.push({
          key: component.family,
          family: component.family,
          category: component.category,
          variants,
          selectedId: variants.find((variant) => selected.has(variant.id))?.id || draftTiers[component.family] || variants[0]?.id || null,
        });
        seen.add(component.family);
      } else {
        groups.push({
          key: component.id,
          family: component.family,
          category: component.category,
          variants: [component],
          selectedId: component.id,
        });
      }
    }
    return groups;
  }, [category, draftTiers, housing.selectedComponents, search]);

  const getSlottedComponents = (componentIds: string[], slotCapacity = ownerSlotsAvailable) => {
    const slotted: string[] = [];
    for (const id of Array.from(new Set(componentIds))) {
      const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === id);
      if (!component || component.category === "structure") continue;
      if (slotted.length >= slotCapacity) break;
      slotted.push(id);
    }
    return slotted;
  };

  const saveHousing = (patch: Partial<typeof housing>) => {
    if (!activeProfile) return;
    const next = sanitizeHousing({ ...housing, ...patch });
    if (next.foundationBuilt) {
      next.selectedComponents = getSlottedComponents(next.selectedComponents, 1 + next.extraSlots);
    }
    updateProfile(activeProfile.id, {
      housing: next,
    });
  };

  const toggleComponent = (componentId: string) => {
    const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === componentId);
    if (!component) return;
    const next = new Set(housing.selectedComponents);
    if (next.has(componentId)) {
      next.delete(componentId);
    } else {
      if (!housing.foundationBuilt || summary.freeSlots <= 0) return;
      if (component.category === "idle" || component.category === "guest") {
        for (const selectedId of Array.from(next)) {
          const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
          if (existing?.family === component.family) next.delete(selectedId);
        }
      }
      if (getSlottedComponents([...Array.from(next), componentId]).includes(componentId)) next.add(componentId);
    }
    saveHousing({ selectedComponents: Array.from(next) });
  };

  const removeComponent = (componentId: string) => {
    saveHousing({ selectedComponents: housing.selectedComponents.filter((id) => id !== componentId) });
  };

  const setComponentTier = (family: string, componentId: string) => {
    const component = HOUSING_COMPONENTS.find((candidate) => candidate.id === componentId);
    if (!component) return;
    setDraftTiers((current) => ({ ...current, [family]: componentId }));
    const next = new Set(housing.selectedComponents);
    const familyAlreadySelected = Array.from(next).some((selectedId) => {
      const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
      return existing?.family === family;
    });
    if (!familyAlreadySelected) return;
    for (const selectedId of Array.from(next)) {
      const existing = HOUSING_COMPONENTS.find((candidate) => candidate.id === selectedId);
      if (existing?.family === family) next.delete(selectedId);
    }
    next.add(componentId);
    saveHousing({ selectedComponents: Array.from(next) });
  };

  const updateGuestBuff = (activity: HousingActivity, hours: number) => {
    const nextGuestBuffs = { ...housing.guestBuffs };
    if (hours > 0) nextGuestBuffs[activity] = hours;
    else delete nextGuestBuffs[activity];
    saveHousing({
      guestBuffs: nextGuestBuffs,
    });
  };

  return (
    <main className="container housing-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow"><Home size={16} /> Housing Manager</p>
          <h1>House Planner</h1>
          <p className="muted">
            Profile-scoped construction planner for idle-time bonuses, guest buffs, and build cost estimates.
          </p>
        </div>
        <div className="housing-status-card">
          <span>{activeProfile?.name || "No profile"}</span>
          <strong>{housing.mode === "owner" ? "Owner" : housing.mode === "guest" ? "Guest" : "No house"}</strong>
          <em>{summary.strongestIdleBonus ? `${getHousingActivityLabel(summary.strongestIdleBonus.activity)} +${formatHours(summary.strongestIdleBonus.hours)}` : "No active bonus"}</em>
        </div>
      </section>

      {!activeProfile ? (
        <section className="housing-panel empty-panel">
          <Castle size={28} />
          <h2>Create or select a profile first</h2>
          <p>Housing is stored per character profile so alts and mains do not share house setups.</p>
        </section>
      ) : (
        <>
          <section className="housing-grid top-grid">
            <div className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Mode</p>
                  <h2>Profile Housing</h2>
                </div>
                {housing.mode !== "none" && (
                  <button className="ghost-button" type="button" onClick={() => saveHousing({ mode: "none" })}>
                    <X size={16} /> Disable
                  </button>
                )}
              </div>

              <div className="mode-grid">
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    className={`mode-card ${housing.mode === option.mode ? "active" : ""}`}
                    onClick={() => saveHousing(option.mode === "none"
                      ? { mode: "none" }
                      : option.mode === "guest"
                        ? { mode: "guest" }
                        : { mode: "owner" })}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>

              {housing.mode === "owner" && (
                <div className="owner-setup-grid">
                  <ChoicePicker
                    label="House Location"
                    value={housing.location}
                    options={HOUSING_LOCATIONS.map((location) => ({ value: location, label: location }))}
                    open={openPicker === "location"}
                    setOpen={(open) => setOpenPicker(open ? "location" : null)}
                    onChange={(location) => saveHousing({ location })}
                    placeholder="Select location"
                  />
                  <button
                    type="button"
                    className={`foundation-toggle ${housing.foundationBuilt ? "active" : ""}`}
                    onClick={() => saveHousing({
                      foundationBuilt: !housing.foundationBuilt,
                      extraSlots: !housing.foundationBuilt ? housing.extraSlots : 0,
                      selectedComponents: !housing.foundationBuilt ? housing.selectedComponents : [],
                    })}
                  >
                    <strong>Foundation</strong>
                    <span>{housing.foundationBuilt ? "Built - 1 free slot unlocked" : "Build first to unlock slots"}</span>
                  </button>
                  <label className="housing-field compact-field">
                    <span>Extra Slots Built</span>
                    <small>Foundation gives 1 slot. Each extra slot adds 1 more component slot.</small>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={housing.extraSlots}
                      disabled={!housing.foundationBuilt}
                      onChange={(event) => {
                        const extraSlots = Math.min(15, Math.max(0, Number(event.target.value || 0)));
                        saveHousing({
                          extraSlots,
                          selectedComponents: getSlottedComponents(housing.selectedComponents, 1 + extraSlots),
                        });
                      }}
                    />
                  </label>
                </div>
              )}

              {housing.mode === "guest" && (
                <div className="guest-note">
                  <Users size={18} />
                  <span>Enter the host buffs this profile receives. No foundation or slots are needed for guest mode.</span>
                </div>
              )}
              {housing.mode === "none" && (
                <div className="guest-note inactive-note">
                  <Home size={18} />
                  <span>Housing buffs are disabled. Your owner build, guest buffs, and notes are preserved for when you switch back.</span>
                </div>
              )}
            </div>

            <div className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Summary</p>
                  <h2>Active Buffs</h2>
                </div>
                <span className={`access-pill ${summary.availableAnywhere ? "good" : "limited"}`}>
                  {summary.availableAnywhere ? "Available anywhere" : housing.mode !== "none" ? "Location-limited" : "Inactive"}
                </span>
              </div>

              <div className="stat-strip">
                <div><span>Components</span><strong>{summary.activeComponentCount}</strong></div>
                <div><span>Free Slots</span><strong>{summary.freeSlots}</strong></div>
                <div><span>Total Slots</span><strong>{summary.slotCapacity}/16</strong></div>
                <div><span>Build Cost</span><strong>{formatGold(selectedCost)}</strong></div>
                <div><span>Guests</span><strong>{summary.guestCapacity}</strong></div>
              </div>

              <div className="flag-grid">
                <span className={summary.remoteConduit ? "enabled" : ""}><MapPin size={15} /> Remote Conduit</span>
                <span className={summary.petQuarters ? "enabled" : ""}><Sparkles size={15} /> Pet Quarters</span>
                <span className={summary.houseLedger ? "enabled" : ""}><ShieldCheck size={15} /> House Ledger</span>
              </div>
            </div>
          </section>

          {housing.mode === "owner" && (
            <section className="housing-panel selected-setup-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Selected Setup</p>
                  <h2>Built Components</h2>
                </div>
                <div className={`slot-meter ${slotOverage ? "warning" : ""}`}>
                  <span>Slots used</span>
                  <strong>{summary.activeComponentCount}/{summary.slotCapacity}</strong>
                </div>
              </div>

              {slotOverage > 0 && (
                <div className="slot-warning">
                  <ShieldCheck size={17} />
                  <span>This setup is {slotOverage} slot{slotOverage === 1 ? "" : "s"} over capacity. Remove components or build more slots.</span>
                </div>
              )}

              <div className="selected-component-grid">
                {selectedComponentDetails.length ? selectedComponentDetails.map((component) => {
                  const cost = getComponentBuildCost(component, materialPrices);
                  return (
                    <article key={component.id} className="selected-component-row">
                      <div>
                        <strong>{component.family}</strong>
                        <span>
                          {component.activity
                            ? `${component.tier ? `T${component.tier} - ` : ""}${getHousingActivityLabel(component.activity)} +${formatHours(component.idleHours || 0)}`
                            : component.description}
                        </span>
                      </div>
                      <div className="selected-row-meta">
                        <small>{cost.missingMaterials.length ? "Needs price/data" : formatGold(cost.totalCost)}</small>
                        <button type="button" onClick={() => removeComponent(component.id)} aria-label={`Remove ${component.family}`}>
                          <X size={14} /> Remove
                        </button>
                      </div>
                    </article>
                  );
                }) : (
                  <div className="selected-empty">
                    <Package size={20} />
                    <span>No components selected yet. Build the foundation, then add rooms or special components from the planner.</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {housing.mode === "guest" && (
            <section className="housing-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Guest Setup</p>
                  <h2>Received Idle-Time Buffs</h2>
                  <p>Choose the tier of each host component you are using. T1 is 30m, then T2 1h, T3 2h, T4 3h, and T5 4h.</p>
                </div>
                <ChoicePicker
                  label={housing.guestRemoteConduit ? "Guest Scope" : "Guest Buff Location"}
                  value={housing.guestRemoteConduit ? "Available anywhere" : housing.location}
                  options={housing.guestRemoteConduit
                    ? [{ value: "Available anywhere", label: "Available anywhere", hint: "Remote Conduit is active" }]
                    : HOUSING_LOCATIONS.map((location) => ({ value: location, label: location, hint: "Host buffs apply here" }))}
                  open={openPicker === "guest-location"}
                  setOpen={(open) => setOpenPicker(open ? "guest-location" : null)}
                  onChange={(location) => saveHousing({ location })}
                  placeholder="Select buff location"
                />
              </div>
              <div className="guest-buff-grid">
                {BUFF_ACTIVITIES.map((activity) => {
                  const currentHours = Number(housing.guestBuffs[activity] || 0);
                  return (
                    <div key={activity} className={`guest-buff-card ${currentHours > 0 ? "active" : ""}`}>
                      <div>
                        <span>{getHousingActivityLabel(activity)}</span>
                        <strong>{currentHours > 0 ? `+${formatHours(currentHours)}` : "No buff"}</strong>
                      </div>
                      <div className="guest-tier-row" aria-label={`${getHousingActivityLabel(activity)} guest buff tier`}>
                        {GUEST_BUFF_OPTIONS.map((option) => (
                          <button
                            key={`${activity}-${option.label}`}
                            type="button"
                            className={currentHours === option.hours ? "active" : ""}
                            onClick={() => updateGuestBuff(activity, option.hours)}
                            title={option.hours > 0 ? `${option.label}: +${formatHours(option.hours)}` : "No received buff"}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="guest-specials">
                <button
                  type="button"
                  className={housing.guestRemoteConduit ? "active" : ""}
                  onClick={() => saveHousing({ guestRemoteConduit: !housing.guestRemoteConduit })}
                >
                  <MapPin size={16} />
                  <span>
                    <strong>Remote Conduit</strong>
                    <small>Host makes these received buffs available anywhere.</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={housing.guestPetQuarters ? "active" : ""}
                  onClick={() => saveHousing({ guestPetQuarters: !housing.guestPetQuarters })}
                >
                  <Sparkles size={16} />
                  <span>
                    <strong>Pet Quarters</strong>
                    <small>Track if the host house gives pet sleep support.</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={housing.guestHouseLedger ? "active" : ""}
                  onClick={() => saveHousing({ guestHouseLedger: !housing.guestHouseLedger })}
                >
                  <ShieldCheck size={16} />
                  <span>
                    <strong>House Ledger</strong>
                    <small>Track if this guest setup includes ledger access.</small>
                  </span>
                </button>
              </div>
            </section>
          )}

          <section className={`housing-panel planner-panel ${housing.mode !== "owner" ? "planner-disabled" : ""}`}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Planner</p>
                <h2>Components</h2>
                {housing.mode !== "owner" && (
                  <p className="planner-mode-note">Choose Owner mode to build a foundation, add slots, and plan components. Guest mode uses received buffs instead.</p>
                )}
              </div>
              {housing.mode === "owner" && (
              <div className="planner-controls">
                <label className="search-box">
                  <Search size={17} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search component, buff, material..." />
                </label>
                <ChoicePicker
                  value={category}
                  options={[...CATEGORY_OPTIONS]}
                  open={openPicker === "category"}
                  setOpen={(open) => setOpenPicker(open ? "category" : null)}
                  onChange={setCategory}
                />
              </div>
              )}
            </div>

            {housing.mode === "owner" ? (
            <div className="component-grid">
              {componentGroups.map((group) => {
                const component = group.variants.find((variant) => variant.id === group.selectedId) || group.variants[0];
                if (!component) return null;
                const cost = getComponentBuildCost(component, materialPrices);
                const isSelected = selected.has(component.id);
                const canAdd = isSelected || (housing.foundationBuilt && summary.freeSlots > 0);
                return (
                  <article key={group.key} className={`component-card ${isSelected ? "selected" : ""}`}>
                    <div className="component-head">
                      <div className="component-icon"><Package size={19} /></div>
                      <div>
                        <h3>{group.family}</h3>
                        <p>{component.activity ? `${getHousingActivityLabel(component.activity)} +${formatHours(component.idleHours || 0)}` : component.description}</p>
                      </div>
                    </div>

                    {group.variants.length > 1 && (
                      <div className="tier-selector" aria-label={`${group.family} tier`}>
                        {group.variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            className={variant.id === component.id ? "active" : ""}
                            onClick={() => setComponentTier(group.family, variant.id)}
                          >
                            {variant.tier ? `T${variant.tier}` : variant.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="component-meta">
                      <span><Coins size={14} /> {formatGold(component.goldCost)}</span>
                      {component.levelRequired && <span>Level {component.levelRequired}</span>}
                      {component.guestCapacity && <span>{component.guestCapacity} guest{component.guestCapacity > 1 ? "s" : ""}</span>}
                    </div>

                    <div className="material-list">
                      {component.materials.length ? component.materials.map((material) => (
                        <span key={material.name}>{material.quantity.toLocaleString()} {material.name}</span>
                      )) : <span>No material data needed</span>}
                    </div>

                    <div className="component-footer">
                      <div>
                        <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                          {cost.missingMaterials.length ? "Needs price/data" : formatGold(cost.totalCost)}
                        </span>
                        <small>{cost.missingMaterials.length ? `${cost.missingMaterials.length} missing prices` : "Gold + materials"}</small>
                      </div>
                      <button
                        type="button"
                        className={isSelected ? "selected-button" : "add-button"}
                        disabled={!canAdd}
                        onClick={() => toggleComponent(component.id)}
                      >
                        {isSelected ? <><Check size={15} /> Selected</> : !housing.foundationBuilt && housing.mode === "owner" ? "Build foundation first" : summary.freeSlots <= 0 && housing.mode === "owner" ? "No free slot" : "Add"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            ) : (
              <div className="planner-empty-state">
                <Home size={24} />
                <strong>{housing.mode === "guest" ? "Guest buffs are entered above" : "Housing buffs are disabled"}</strong>
                <span>{housing.mode === "guest" ? "Component slots are only needed when this profile owns a house." : "Switch back to Owner or Guest to reactivate the preserved setup."}</span>
              </div>
            )}
          </section>

          <section className="housing-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Buffs</p>
                <h2>Idle-Time Breakdown</h2>
              </div>
            </div>
            <div className="buff-grid">
              {BUFF_ACTIVITIES.map((activity) => (
                <div key={activity} className={summary.idleHours[activity] > 0 ? "active" : ""}>
                  <span>{getHousingActivityLabel(activity)}</span>
                  <strong>{formatHours(summary.idleHours[activity])}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="housing-panel">
            <label className="housing-field">
              <span>Notes</span>
              <textarea
                value={housing.notes}
                onChange={(event) => saveHousing({ notes: event.target.value })}
                placeholder="Private notes about this profile's house, guest host, or planned upgrades."
              />
            </label>
          </section>
        </>
      )}

      <style jsx>{`
        .housing-page {
          padding-bottom: 4rem;
        }
        .page-title-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 1.25rem;
          align-items: stretch;
          margin-bottom: 1.25rem;
        }
        .page-title-row h1 {
          margin: 0.25rem 0 0.45rem;
          font-size: clamp(2rem, 4vw, 3.75rem);
          letter-spacing: 0;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
          font-weight: 800;
          margin: 0;
        }
        .muted,
        .housing-panel p,
        .housing-status-card em,
        .component-card p {
          color: var(--text-muted);
        }
        .housing-status-card,
        .housing-panel,
        .component-card {
          border: 1px solid var(--border-subtle);
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
          border-radius: 8px;
          box-shadow: 0 16px 45px rgba(0,0,0,0.18);
        }
        .housing-status-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.45rem;
          min-width: 0;
          padding: 1.25rem;
        }
        .housing-status-card span,
        .housing-status-card em {
          font-size: 0.82rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-status-card strong {
          color: #fff;
          font-size: 1.4rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.7fr);
          gap: 1rem;
        }
        .housing-panel {
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .empty-panel {
          min-height: 260px;
          display: grid;
          place-items: center;
          text-align: center;
          align-content: center;
          gap: 0.75rem;
        }
        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .panel-heading h2 {
          margin: 0.2rem 0 0;
          font-size: 1.35rem;
        }
        .ghost-button,
        .add-button,
        .selected-button {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.04);
          color: #fff;
          border-radius: 7px;
          padding: 0.65rem 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 800;
          cursor: pointer;
        }
        .mode-grid,
        .stat-strip,
        .flag-grid,
        .guest-buff-grid,
        .buff-grid {
          display: grid;
          gap: 0.75rem;
        }
        .mode-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
        }
        .mode-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          border-radius: 8px;
          padding: 0.9rem;
          color: var(--text-muted);
          text-align: left;
          cursor: pointer;
          min-width: 0;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .mode-card:hover,
        .component-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.45);
        }
        .mode-card strong,
        .mode-card span {
          display: block;
        }
        .mode-card strong {
          color: #fff;
          margin-bottom: 0.3rem;
        }
        .mode-card.active,
        .component-card.selected {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.08);
        }
        .housing-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .housing-field span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-field input,
        .housing-field textarea,
        .search-box input {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          color: #fff;
          border-radius: 7px;
          padding: 0.75rem 0.85rem;
          font: inherit;
          font-weight: 700;
        }
        .housing-field textarea {
          min-height: 110px;
          resize: vertical;
        }
        .housing-field {
          margin-top: 1rem;
        }
        .housing-field small {
          color: var(--text-muted);
          line-height: 1.35;
        }
        .owner-setup-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
          gap: 0.8rem;
          align-items: end;
          margin-top: 1rem;
        }
        .compact-field {
          margin-top: 0;
        }
        :global(.choice-picker) {
          position: relative;
          min-width: 180px;
          color: #fff;
        }
        :global(.choice-label) {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }
        :global(.choice-trigger) {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.25));
          color: #fff;
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          min-width: 0;
        }
        :global(.choice-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.choice-menu) {
          position: absolute;
          z-index: 40;
          top: calc(100% + 0.45rem);
          left: 0;
          right: 0;
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(5, 10, 13, 0.98);
          border-radius: 8px;
          padding: 0.4rem;
          box-shadow: 0 18px 50px rgba(0,0,0,0.42);
          max-height: min(320px, 52vh);
          overflow-y: auto;
        }
        :global(.choice-menu-head) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.45rem 0.5rem 0.55rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.68rem;
          font-weight: 900;
        }
        :global(.choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
        }
        :global(.choice-menu button) {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.72rem 0.75rem;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }
        :global(.choice-menu button.active),
        :global(.choice-menu button:hover) {
          background: rgba(56, 189, 248, 0.12);
          color: #fff;
        }
        :global(.choice-menu .choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
          text-align: center;
        }
        :global(.choice-menu .choice-menu-head button:hover) {
          border-color: rgba(56, 189, 248, 0.45);
          background: rgba(56, 189, 248, 0.12);
        }
        :global(.choice-menu strong),
        :global(.choice-menu small) {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        :global(.choice-menu small) {
          margin-top: 0.25rem;
          color: var(--text-muted);
        }
        .foundation-toggle {
          min-height: 48px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .foundation-toggle strong,
        .foundation-toggle span {
          display: block;
        }
        .foundation-toggle strong {
          color: #fff;
        }
        .foundation-toggle span {
          margin-top: 0.2rem;
          font-size: 0.8rem;
        }
        .foundation-toggle.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: var(--text-success);
        }
        .guest-note {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-top: 1rem;
          padding: 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 8px;
          color: #fff;
          background: rgba(56, 189, 248, 0.08);
        }
        .access-pill {
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          padding: 0.45rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .access-pill.good {
          color: var(--text-success);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .access-pill.limited {
          color: #fbbf24;
          border-color: rgba(251, 191, 36, 0.35);
        }
        .stat-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .stat-strip div,
        .flag-grid span,
        .buff-grid div {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .stat-strip span,
        .component-footer small {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }
        .stat-strip strong {
          display: block;
          color: #fff;
          margin-top: 0.25rem;
          font-size: 1.15rem;
        }
        .flag-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .flag-grid span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .flag-grid span.enabled {
          color: var(--text-success);
        }
        .selected-setup-panel {
          border-color: rgba(56, 189, 248, 0.24);
        }
        .slot-meter {
          min-width: 120px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.7rem 0.85rem;
        }
        .slot-meter span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .slot-meter strong {
          display: block;
          margin-top: 0.18rem;
          color: #fff;
          font-size: 1.05rem;
        }
        .slot-meter.warning {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(248, 113, 113, 0.08);
        }
        .slot-warning {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 1px solid rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 8px;
          padding: 0.85rem;
          margin-bottom: 0.85rem;
          font-weight: 750;
        }
        .selected-component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 0.75rem;
        }
        .selected-component-row,
        .selected-empty {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .selected-component-row {
          display: flex;
          justify-content: space-between;
          gap: 0.85rem;
          align-items: center;
        }
        .selected-component-row strong,
        .selected-component-row span {
          display: block;
        }
        .selected-component-row strong {
          color: #fff;
        }
        .selected-component-row span {
          margin-top: 0.22rem;
          color: var(--text-muted);
          font-size: 0.83rem;
        }
        .selected-row-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-shrink: 0;
        }
        .selected-row-meta small {
          color: #fff;
          font-weight: 900;
          white-space: nowrap;
        }
        .selected-row-meta button {
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 7px;
          padding: 0.48rem 0.6rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 800;
          cursor: pointer;
        }
        .selected-empty {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          color: var(--text-muted);
        }
        .guest-buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }
        .guest-buff-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .guest-buff-card.active {
          border-color: rgba(74, 222, 128, 0.32);
          background: rgba(74, 222, 128, 0.06);
        }
        .guest-buff-card > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: baseline;
          margin-bottom: 0.7rem;
        }
        .guest-buff-card span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .guest-buff-card strong {
          color: #fff;
          white-space: nowrap;
        }
        .guest-tier-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 4.5rem), 1fr));
          gap: 0.35rem;
        }
        .guest-tier-row button {
          min-height: 36px;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          border-radius: 7px;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          cursor: pointer;
        }
        .guest-tier-row button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .guest-specials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .guest-specials button {
          min-height: 74px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          text-align: left;
          cursor: pointer;
        }
        .guest-specials button.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: #fff;
        }
        .guest-specials strong,
        .guest-specials small {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .guest-specials small {
          margin-top: 0.2rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .planner-controls {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .planner-mode-note {
          max-width: 620px;
          margin: 0.35rem 0 0;
          font-size: 0.9rem;
        }
        .planner-empty-state {
          min-height: 180px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 0.55rem;
          text-align: center;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          background: rgba(0,0,0,0.18);
        }
        .planner-empty-state strong {
          color: #fff;
          font-size: 1.05rem;
        }
        .planner-empty-state span {
          max-width: 420px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: min(420px, 100%);
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          border-radius: 8px;
          padding: 0 0.75rem;
        }
        .search-box input {
          border: 0;
          background: transparent;
          padding-left: 0;
        }
        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 1rem;
        }
        .component-card {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .component-head {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr);
          gap: 0.75rem;
          align-items: start;
        }
        .component-icon {
          width: 46px;
          height: 46px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.25);
          color: var(--text-accent);
        }
        .component-card h3 {
          margin: 0;
          color: #fff;
          font-size: 1rem;
        }
        .component-card p {
          margin: 0.25rem 0 0;
          font-size: 0.86rem;
        }
        .component-meta,
        .material-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .tier-selector {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.4rem;
        }
        .tier-selector button {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.24);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.45rem 0.35rem;
          font-weight: 900;
          cursor: pointer;
        }
        .tier-selector button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .component-meta span,
        .material-list span {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.35rem 0.55rem;
          font-size: 0.76rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .component-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: auto;
          padding-top: 0.8rem;
          border-top: 1px solid var(--border-subtle);
        }
        .component-footer > div {
          min-width: 0;
        }
        .component-footer span {
          color: #fff;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .component-footer .needs-data {
          color: #fbbf24;
        }
        .add-button {
          background: rgba(56, 189, 248, 0.13);
          border-color: rgba(56, 189, 248, 0.35);
        }
        .add-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          background: rgba(255,255,255,0.035);
          border-color: var(--border-subtle);
        }
        .selected-button {
          background: rgba(74, 222, 128, 0.13);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        .buff-grid div {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          color: var(--text-muted);
        }
        .buff-grid div.active {
          border-color: rgba(74, 222, 128, 0.35);
          color: #fff;
        }
        .buff-grid strong {
          color: inherit;
        }
        @media (max-width: 920px) {
          .page-title-row,
          .housing-grid {
            grid-template-columns: 1fr;
          }
          .mode-grid,
          .stat-strip,
          .flag-grid,
          .owner-setup-grid,
          .guest-specials {
            grid-template-columns: 1fr;
          }
          .panel-heading {
            flex-direction: column;
            align-items: stretch;
          }
          .planner-controls {
            justify-content: stretch;
          }
          .planner-controls,
          .search-box,
          :global(.choice-picker) {
            width: 100%;
          }
          .selected-component-row {
            align-items: stretch;
            flex-direction: column;
          }
          .selected-row-meta {
            justify-content: space-between;
          }
        }
        @media (max-width: 640px) {
          .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
        }
        @media (max-width: 520px) {
          .housing-panel {
            padding: 1rem;
          }
          .component-grid {
            grid-template-columns: 1fr;
          }
          .guest-buff-grid {
            grid-template-columns: 1fr;
          }
          .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .add-button,
          .selected-button {
            justify-content: center;
          }
          :global(.choice-menu) {
            position: fixed;
            left: 0.75rem;
            right: 0.75rem;
            top: auto;
            bottom: 0.75rem;
            max-height: min(420px, 70dvh);
          }
        }
      `}</style>
    </main>
  );
}
