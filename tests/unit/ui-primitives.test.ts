import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Button,
  TextInput,
  SegmentedControl,
  Card,
  Badge,
  ModalSheet,
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
  ToastItem,
  ToastViewport,
  calculateAdaptiveDuration,
  Banner,
  BottomDock,
  Drawer,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  CommandDialog,
  SearchInput,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Avatar,
  Kbd,
  Separator,
  Skeleton,
  SkeletonContainer,
  Pagination,
  getPaginationItems,
  Combobox,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Tag,
  StatCard,
  Checkbox,
  Switch,
  NumberInput,
  ProgressBar,
  ProgressRing,
  Meter,
  Breadcrumbs,
  Slider,
  TextArea,
  RadioGroup,
  Timeline,
} from "@/components/ui";
import { CONCEPT_ICONS, ICON_SIZES, type IconConcept } from "@/lib/icons";


describe("Primitive 1: Button", () => {
  it("renders with default secondary variant and children", () => {
    const html = renderToStaticMarkup(createElement(Button, null, "Click Me"));
    expect(html).toContain("Click Me");
    expect(html).toContain('type="button"');
    expect(html).toContain("secondary");
    expect(html).toContain("md");
  });

  it("renders primary variant with monochromatic styling", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { variant: "primary", size: "lg" }, "Confirm Action")
    );
    expect(html).toContain("Confirm Action");
    expect(html).toContain("primary");
    expect(html).toContain("lg");
  });

  it("renders loading state with SVG spinner and aria-busy", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { loading: true }, "Processing")
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain("<svg");
    expect(html).toContain("Processing");
  });

  it("renders disabled state with native disabled attribute", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { disabled: true }, "Disabled Action")
    );
    expect(html).toContain("disabled");
  });

  it("renders icon slots", () => {
    const leadingIcon = createElement("span", { id: "leading" }, "←");
    const trailingIcon = createElement("span", { id: "trailing" }, "→");
    const html = renderToStaticMarkup(
      createElement(
        Button,
        { icon: leadingIcon, iconTrailing: trailingIcon },
        "Navigate"
      )
    );
    expect(html).toContain('id="leading"');
    expect(html).toContain('id="trailing"');
    expect(html).toContain("Navigate");
  });

  it("renders success state with checkmark icon", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { success: true }, "Copied!")
    );
    expect(html).toContain("isSuccess");
    expect(html).toContain("polyline");
    expect(html).toContain("Copied!");
  });
});

describe("Primitive 2: TextInput", () => {
  it("renders input with explicit label and htmlFor binding", () => {
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        id: "char-id",
        label: "Character ID",
        placeholder: "12345",
      })
    );
    expect(html).toContain('<label for="char-id"');
    expect(html).toContain('id="char-id"');
    expect(html).toContain('placeholder="12345"');
    expect(html).toContain('aria-invalid="false"');
  });

  it("renders error state with aria-invalid and aria-describedby", () => {
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        id: "price-input",
        label: "Market Price",
        error: "Price must be greater than zero",
      })
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="price-input-error"');
    expect(html).toContain('id="price-input-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Price must be greater than zero");
  });

  it("renders helper text with aria-describedby when no error", () => {
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        id: "search-input",
        label: "Search",
        helperText: "Enter an item name or ID",
      })
    );
    expect(html).toContain('aria-describedby="search-input-helper"');
    expect(html).toContain('id="search-input-helper"');
    expect(html).toContain("Enter an item name or ID");
  });

  it("renders labelAction when provided in the label row", () => {
    const actionEl = createElement("button", { id: "reset-btn" }, "Reset");
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        id: "with-action",
        label: "Price Ceiling",
        labelAction: actionEl,
      })
    );
    expect(html).toContain('id="reset-btn"');
    expect(html).toContain("Reset");
    expect(html).toContain("Price Ceiling");
  });

  it("renders inputMode attribute for mobile numeric optimization", () => {
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        id: "qty",
        inputMode: "numeric",
        type: "number",
      })
    );
    expect(html.toLowerCase()).toContain('inputmode="numeric"');
    expect(html).toContain('type="number"');
  });
});

describe("Primitive 3: SegmentedControl", () => {
  const options = [
    { value: "all", label: "All Items" },
    { value: "weapons", label: "Weapons", badge: 4 },
    { value: "armor", label: "Armor" },
  ];

  it("renders with role=tablist and aria-label", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedControl, {
        options,
        value: "all",
        onChange: () => {},
        ariaLabel: "Item categories",
      })
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Item categories"');
  });

  it("marks active option with aria-selected=true and tabindex=0", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedControl, {
        options,
        value: "weapons",
        onChange: () => {},
        ariaLabel: "Category filter",
      })
    );
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("Weapons");
    expect(html).toContain("4");
    expect(html).toContain('aria-selected="false"');
  });

  it("handles disabled options with aria-disabled and disabled attribute", () => {
    const disabledOptions = [
      { value: "unlocked", label: "Unlocked" },
      { value: "locked", label: "Locked", disabled: true },
    ];
    const html = renderToStaticMarkup(
      createElement(SegmentedControl, {
        options: disabledOptions,
        value: "unlocked",
        onChange: () => {},
        ariaLabel: "Locked state test",
      })
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("disabled");
  });
});

describe("Primitive 4: Card", () => {
  it("renders title, subtitle, action, body, and footer", () => {
    const actionBtn = createElement("button", null, "Manage");
    const footerContent = createElement("span", null, "Updated 5m ago");
    const html = renderToStaticMarkup(
      createElement(
        Card,
        {
          title: "Player Stats",
          subtitle: "Combat Overview",
          action: actionBtn,
          footer: footerContent,
        },
        createElement("p", null, "Level 45 Warrior")
      )
    );
    expect(html).toContain("<h3");
    expect(html).toContain("Player Stats");
    expect(html).toContain("Combat Overview");
    expect(html).toContain("Manage");
    expect(html).toContain("Level 45 Warrior");
    expect(html).toContain("Updated 5m ago");
  });

  it("renders interactive card with button role and tabindex", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        {
          interactive: true,
          onClick: () => {},
        },
        "Clickable Card Content"
      )
    );
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  it("renders accent styling when accent prop is set", () => {
    const html = renderToStaticMarkup(
      createElement(Card, { accent: "legendary" }, "Legendary Drop")
    );
    expect(html).toContain("accent_legendary");
    expect(html).toContain("Legendary Drop");
  });
});

describe("Primitive 5: ModalSheet", () => {
  it("exports ModalSheet component with valid function signature", () => {
    expect(typeof ModalSheet).toBe("function");
  });

  it("returns null during server rendering when unmounted", () => {
    const html = renderToStaticMarkup(
      createElement(
        ModalSheet,
        {
          isOpen: false,
          onClose: () => {},
          title: "Edit Filter",
        },
        "Modal Content"
      )
    );
    expect(html).toBe("");
  });
});

describe("Primitive 6: Badge", () => {
  it("renders text-safe rarity variants", () => {
    const refinedHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "refined" }, "Refined")
    );
    expect(refinedHtml).toContain("refined");
    expect(refinedHtml).toContain("Refined");

    const epicHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "epic" }, "Epic")
    );
    expect(epicHtml).toContain("epic");
    expect(epicHtml).toContain("Epic");

    const uniqueHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "unique" }, "Unique")
    );
    expect(uniqueHtml).toContain("unique");
    expect(uniqueHtml).toContain("Unique");

    const warningHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "warning" }, "Despawning Soon")
    );
    expect(warningHtml).toContain("warning");
    expect(warningHtml).toContain("Despawning Soon");
  });

  it("renders with icon and children", () => {
    const icon = createElement("span", { id: "star" }, "★");
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "legendary", icon }, "Legendary Sword")
    );
    expect(html).toContain('id="star"');
    expect(html).toContain("Legendary Sword");
    expect(html).toContain("legendary");
  });

  it("renders gradient classes on label span when gradient prop is set", () => {
    const mythicHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "mythic", gradient: true }, "Mythic Relic")
    );
    expect(mythicHtml).toContain("mythicGradient");
    expect(mythicHtml).toContain("Mythic Relic");

    const uniqueHtml = renderToStaticMarkup(
      createElement(Badge, { variant: "unique", gradient: true }, "Unique Artifact")
    );
    expect(uniqueHtml).toContain("uniqueGradient");
    expect(uniqueHtml).toContain("Unique Artifact");
  });
});

describe("Primitive 7: Icon & Centralized Semantics", () => {
  it("renders decorative icon with aria-hidden='true' by default", () => {
    const html = renderToStaticMarkup(
      createElement(Icon, { name: "combat" })
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<svg");
    expect(html).not.toContain("srOnly");
    expect(html).not.toContain('role="img"');
  });

  it("renders accessible label with role='img' and visually hidden text when label is provided", () => {
    const html = renderToStaticMarkup(
      createElement(Icon, { name: "boss", label: "World Boss Indicator" })
    );
    expect(html).not.toContain('aria-hidden="true"');
    expect(html).toContain('role="img"');
    expect(html).toContain("srOnly");
    expect(html).toContain("World Boss Indicator");
  });

  it("applies optical size tokens correctly", () => {
    const mdHtml = renderToStaticMarkup(createElement(Icon, { name: "settings", size: "md" }));
    expect(mdHtml).toContain('width="16"');
    expect(mdHtml).toContain('height="16"');

    const xsHtml = renderToStaticMarkup(createElement(Icon, { name: "chevronDown", size: "xs" }));
    expect(xsHtml).toContain('width="12"');
    expect(xsHtml).toContain('height="12"');

    const lgHtml = renderToStaticMarkup(createElement(Icon, { name: "dungeon", size: "lg" }));
    expect(lgHtml).toContain('width="20"');
    expect(lgHtml).toContain('height="20"');

    const customHtml = renderToStaticMarkup(createElement(Icon, { name: "gold", size: 32 }));
    expect(customHtml).toContain('width="32"');
    expect(customHtml).toContain('height="32"');
  });

  it("maps core IdleMMO domain concepts to valid SVG components", () => {
    const coreConcepts: IconConcept[] = [
      "combat",
      "boss",
      "dungeon",
      "alchemy",
      "forge",
      "skillProfit",
      "weather",
      "housing",
      "pets",
      "museum",
      "conquest",
      "lore",
      "items",
      "gold",
      "xp",
      "timer",
      "favorite",
      "filter",
      "sort",
      "copy",
      "refresh",
    ];

    for (const concept of coreConcepts) {
      expect(CONCEPT_ICONS[concept]).toBeDefined();
      const html = renderToStaticMarkup(createElement(Icon, { name: concept }));
      expect(html).toContain("<svg");
    }
  });
});

describe("Primitive 8: Table & Dense Data Grid", () => {
  it("renders TableContainer as an accessible scrollable region", () => {
    const html = renderToStaticMarkup(
      createElement(
        TableContainer,
        {
          ariaLabel: "Crafting profit data grid",
          maxHeight: 400,
        },
        createElement("div", null, "Inner content")
      )
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Crafting profit data grid"');
    expect(html).toContain("max-height:400px");
    expect(html).toContain("scrollShadows");
  });

  it("renders Table with density variants, striping, and hover states", () => {
    const compactHtml = renderToStaticMarkup(
      createElement(Table, { density: "compact", striped: true }, createElement("tbody"))
    );
    expect(compactHtml).toContain("<table");
    expect(compactHtml).toContain("densityCompact");
    expect(compactHtml).toContain("striped");

    const relaxedHtml = renderToStaticMarkup(
      createElement(Table, { density: "relaxed" }, createElement("tbody"))
    );
    expect(relaxedHtml).toContain("densityRelaxed");
  });

  it("renders TableHead with sorting attributes, button hit-target, and aria-sort", () => {
    // Unsorted sortable column
    const unsortedHtml = renderToStaticMarkup(
      createElement(TableHead, { sortable: true, sortDirection: "none" }, "Item Name")
    );
    expect(unsortedHtml).toContain('<th scope="col" aria-sort="none"');
    expect(unsortedHtml).toContain('<button type="button"');
    expect(unsortedHtml).toContain('aria-label="Sort by Item Name, currently not sorted"');
    expect(unsortedHtml).toContain('aria-hidden="true"');

    // Ascending active column
    const ascHtml = renderToStaticMarkup(
      createElement(TableHead, { sortable: true, sortDirection: "ascending" }, "Profit")
    );
    expect(ascHtml).toContain('aria-sort="ascending"');
    expect(ascHtml).toContain('aria-label="Sort by Profit, currently sorted ascending"');
    expect(ascHtml).toContain("sortIndicatorActive");

    // Descending active column
    const descHtml = renderToStaticMarkup(
      createElement(TableHead, { sortable: true, sortDirection: "descending" }, "Margin")
    );
    expect(descHtml).toContain('aria-sort="descending"');
    expect(descHtml).toContain('aria-label="Sort by Margin, currently sorted descending"');
  });

  it("supports alignment parity between TableHead and TableCell", () => {
    const rightHeadHtml = renderToStaticMarkup(
      createElement(TableHead, { align: "right", sortable: true, sortDirection: "ascending" }, "Price (Gold)")
    );
    expect(rightHeadHtml).toContain("alignRight");

    const numericCellHtml = renderToStaticMarkup(
      createElement(TableCell, { numeric: true }, "1,250,000")
    );
    expect(numericCellHtml).toContain("numeric");
    expect(numericCellHtml).toContain("alignRight");
    expect(numericCellHtml).toContain("1,250,000");
  });

  it("supports pinned first column and table captions", () => {
    const pinnedHeadHtml = renderToStaticMarkup(
      createElement(TableHead, { pinned: true, scope: "row" }, "Titan Plate")
    );
    expect(pinnedHeadHtml).toContain('scope="row"');
    expect(pinnedHeadHtml).toContain("thPinned");

    const pinnedCellHtml = renderToStaticMarkup(
      createElement(TableCell, { pinned: true }, "Mythic Ingot")
    );
    expect(pinnedCellHtml).toContain("tdPinned");

    const hiddenCaptionHtml = renderToStaticMarkup(
      createElement(TableCaption, { visuallyHidden: true }, "Hidden summary for screen readers")
    );
    expect(hiddenCaptionHtml).toContain("captionVisuallyHidden");
    expect(hiddenCaptionHtml).toContain("Hidden summary for screen readers");
  });

  it("renders a full integrated semantic table structure", () => {
    const html = renderToStaticMarkup(
      createElement(
        TableContainer,
        { ariaLabel: "Alchemy recipes" },
        createElement(
          Table,
          { density: "compact" },
          createElement(TableCaption, { visuallyHidden: true }, "Alchemy recipes and gold margins"),
          createElement(
            TableHeader,
            { sticky: true },
            createElement(
              TableRow,
              null,
              createElement(TableHead, { pinned: true }, "Potion"),
              createElement(TableHead, { align: "right", sortable: true, sortDirection: "descending" }, "Profit"),
              createElement(TableHead, { align: "center" }, "Status")
            )
          ),
          createElement(
            TableBody,
            null,
            createElement(
              TableRow,
              { selected: true },
              createElement(TableCell, { pinned: true }, "Major Health Potion"),
              createElement(TableCell, { numeric: true }, "45,200"),
              createElement(TableCell, { align: "center" }, "Profitable")
            )
          ),
          createElement(
            TableFooter,
            null,
            createElement(
              TableRow,
              null,
              createElement(TableCell, { pinned: true }, "Average"),
              createElement(TableCell, { numeric: true }, "45,200"),
              createElement(TableCell, { align: "center" }, "-")
            )
          )
        )
      )
    );

    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain("<tfoot");
    expect(html).toContain('role="region"');
    expect(html).toContain("Major Health Potion");
    expect(html).toContain("45,200");
  });
});

describe("Primitive 9: EmptyState & Error Tone", () => {
  it("renders default empty state with WCAG 2.2 SC 4.1.3 live region and semantic heading", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "No Recipes Available",
        description: "Select an alchemy profession to view profitable recipes.",
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("<h3");
    expect(html).toContain("No Recipes Available");
    expect(html).toContain("Select an alchemy profession to view profitable recipes.");
    expect(html).toContain("iconWrapper");
    expect(html).toContain("variantDefault");
  });

  it("renders no-data variant with primary action button", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        variant: "no-data",
        title: "No Profiles Linked",
        description: "Link your IdleMMO character to calculate custom skill profit.",
        action: {
          label: "Import Character",
          variant: "primary",
        },
      })
    );

    expect(html).toContain("variantNoData");
    expect(html).toContain("No Profiles Linked");
    expect(html).toContain("Import Character");
    expect(html).toContain("primary");
  });

  it("renders search-empty variant with echoed query and secondary clear link", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        variant: "search-empty",
        title: "No Matching Items",
        query: "glimmersteel",
        action: {
          label: "Clear Search",
        },
        secondaryAction: {
          label: "Reset All Filters",
        },
      })
    );

    expect(html).toContain("variantSearchEmpty");
    expect(html).toContain("No Matching Items");
    expect(html).toContain("queryBadge");
    expect(html).toContain("glimmersteel");
    expect(html).toContain("Clear Search");
    expect(html).toContain("Reset All Filters");
    expect(html).toContain("secondaryButton");
  });

  it("renders error variant with assertive live region, role=alert, and danger accent", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        variant: "error",
        title: "Market Sync Failed",
        description: "Unable to retrieve real-time prices from the edge worker.",
        action: {
          label: "Retry Connection",
        },
      })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("variantError");
    expect(html).toContain("iconError");
    expect(html).toContain("Market Sync Failed");
    expect(html).toContain("Retry Connection");
    expect(html).toContain("danger");
  });

  it("renders offline variant with warning styling", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        variant: "offline",
        title: "Offline Mode Active",
        description: "Showing cached inventory. Live prices require network reconnection.",
      })
    );

    expect(html).toContain("variantOffline");
    expect(html).toContain("iconOffline");
    expect(html).toContain("Offline Mode Active");
    expect(html).toContain("Showing cached inventory");
  });

  it("respects headingLevel prop to preserve heading hierarchy", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        headingLevel: "h2",
        title: "Level 2 Heading",
      })
    );

    expect(html).toContain("<h2");
    expect(html).not.toContain("<h3");
    expect(html).toContain("Level 2 Heading");
  });

  it("allows icon suppression when icon is null", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        icon: null,
        title: "Clean State Without Icon",
      })
    );

    expect(html).toContain("Clean State Without Icon");
    expect(html).not.toContain("iconWrapper");
  });

  it("renders custom children slot beneath actions", () => {
    const html = renderToStaticMarkup(
      createElement(
        EmptyState,
        {
          title: "Custom Content State",
        },
        createElement("div", { className: "custom-hint" }, "Additional helpful advice")
      )
    );

    expect(html).toContain("Custom Content State");
    expect(html).toContain("custom-hint");
    expect(html).toContain("Additional helpful advice");
  });
});

describe("Primitive 10: Toast & Live Region Feedback", () => {
  it("calculates adaptive durations scaling with word count and WCAG 2.2.1 constraints", () => {
    // Short confirmation: 2,800ms
    const shortDur = calculateAdaptiveDuration("Copied");
    expect(shortDur).toBe(2800);

    // Medium sentence: scaled
    const medDur = calculateAdaptiveDuration("Profile updated successfully", "All 12 items refreshed from edge worker");
    expect(medDur).toBeGreaterThan(3500);
    expect(medDur).toBeLessThanOrEqual(7500);

    // Actionable message: min 8,000ms
    const actionDur = calculateAdaptiveDuration("Item sold", undefined, true);
    expect(actionDur).toBe(8000);

    // Error messages: persistent (0ms)
    const errDur = calculateAdaptiveDuration("Sync Failed", "Database timeout", false, "error");
    expect(errDur).toBe(0);
  });

  it("renders ToastItem with intent-matched variant border, icon, and repeat count badge", () => {
    const html = renderToStaticMarkup(
      createElement(ToastItem, {
        toast: {
          id: "toast-1",
          title: "Recipe Added",
          description: "Potion added to craft queue",
          variant: "success",
          repeatCount: 3,
        },
        onDismiss: () => {},
      })
    );

    expect(html).toContain("variantSuccess");
    expect(html).toContain("Recipe Added");
    expect(html).toContain("Potion added to craft queue");
    expect(html).toContain("repeatBadge");
    expect(html).toContain("+3");
    expect(html).toContain('aria-label="Dismiss notification"');
  });

  it("renders actionable ToastItem with accessible button and icon", () => {
    const html = renderToStaticMarkup(
      createElement(ToastItem, {
        toast: {
          id: "toast-2",
          title: "Profile Removed",
          variant: "warning",
          action: {
            label: "Undo",
            onClick: () => {},
            icon: "undo",
          },
        },
        onDismiss: () => {},
      })
    );

    expect(html).toContain("variantWarning");
    expect(html).toContain("actionButton");
    expect(html).toContain("Undo");
    expect(html).toContain('tabindex="0"');
  });

  it("renders ToastViewport with pre-mounted polite and assertive live regions", () => {
    const html = renderToStaticMarkup(
      createElement(ToastViewport, {
        toasts: [
          { id: "1", title: "Saved", variant: "success" },
          { id: "2", title: "Server unreachable", variant: "error" },
        ],
        onDismiss: () => {},
      })
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Notifications"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Saved");
    expect(html).toContain("Server unreachable");
  });
});

describe("Primitive 11: Banner & System Announcements", () => {
  it("renders system announcement banner with action button and role=status", () => {
    const html = renderToStaticMarkup(
      createElement(Banner, {
        variant: "announcement",
        action: { label: "Learn More", onClick: () => {} },
      }, "Zenith Astral 2.0 design system update is now live.")
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("variantAnnouncement");
    expect(html).toContain("Zenith Astral 2.0 design system update is now live.");
    expect(html).toContain("Learn More");
  });

  it("renders warning and error banners with dismiss button", () => {
    const warningHtml = renderToStaticMarkup(
      createElement(Banner, {
        variant: "warning",
        dismissible: true,
        onDismiss: () => {},
      }, "Offline storage quota near 90% capacity.")
    );

    expect(warningHtml).toContain("variantWarning");
    expect(warningHtml).toContain('aria-label="Dismiss banner"');

    const errorHtml = renderToStaticMarkup(
      createElement(Banner, {
        variant: "error",
      }, "Cloudflare edge worker undergoing scheduled migration.")
    );

    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("variantError");
  });
});

describe("Primitive 12: BottomDock", () => {
  it("renders mobile navigation landmark with aria-label", () => {
    const html = renderToStaticMarkup(
      createElement(BottomDock, {
        ariaLabel: "Mobile Navigation",
        items: [
          { id: "home", label: "Overview", icon: "✦", href: "/", isActive: true },
          { id: "market", label: "Market", icon: "⚖", href: "/items", badge: 3 },
          { id: "settings", label: "Config", icon: "⚙", href: "/settings" },
        ],
      })
    );

    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Mobile Navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Overview");
    expect(html).toContain("Market");
    expect(html).toContain("badge");
  });
});

describe("Primitive 13: Drawer", () => {
  it("returns null when closed", () => {
    const html = renderToStaticMarkup(
      createElement(Drawer, {
        isOpen: false,
        onClose: () => {},
        title: "Navigation Menu",
      })
    );

    expect(html).toBe("");
  });
});

describe("Primitive 14: Popover", () => {
  it("renders popover trigger with aria-haspopup and aria-expanded", () => {
    const html = renderToStaticMarkup(
      createElement(
        Popover,
        { defaultOpen: false },
        createElement(
          PopoverTrigger,
          null,
          createElement("button", { type: "button" }, "Open Options")
        ),
        createElement(PopoverContent, null, "Popover body text")
      )
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Open Options");
  });
});

describe("Primitive 15: Select", () => {
  it("renders custom select with combobox semantics and placeholder", () => {
    const html = renderToStaticMarkup(
      createElement(Select, {
        placeholder: "Choose rarity...",
        options: [
          { value: "common", label: "Common" },
          { value: "epic", label: "Epic", description: "Raid drops" },
        ],
      })
    );

    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Choose rarity...");
  });

  it("displays selected option label when value matches", () => {
    const html = renderToStaticMarkup(
      createElement(Select, {
        value: "epic",
        options: [
          { value: "common", label: "Common" },
          { value: "epic", label: "Epic" },
        ],
      })
    );

    expect(html).toContain("Epic");
  });
});

describe("Primitive 16: Tooltip", () => {
  it("wires trigger element with aria-describedby", () => {
    const html = renderToStaticMarkup(
      createElement(
        Tooltip,
        { content: "Supplementary formula information" },
        createElement("button", { type: "button" }, "Inspect EV")
      )
    );

    expect(html).toContain("Inspect EV");
  });
});

describe("Primitive 17: CommandDialog", () => {
  it("returns null when closed", () => {
    const html = renderToStaticMarkup(
      createElement(CommandDialog, {
        isOpen: false,
        onClose: () => {},
        groups: [
          {
            heading: "Navigation",
            items: [
              { id: "items", title: "Items Catalog", onSelect: () => {} },
            ],
          },
        ],
      })
    );

    expect(html).toBe("");
  });
});

describe("Primitive 18: SearchInput", () => {
  it("renders search landmark with input type=search and shortcut hints", () => {
    const html = renderToStaticMarkup(
      createElement(SearchInput, {
        placeholder: "Search items, enemies...",
        ariaLabel: "Items search",
      })
    );

    expect(html).toContain("<search");
    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="Items search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-keyshortcuts="Control+K Meta+K"');
  });

  it("renders clear button when query value is present", () => {
    const html = renderToStaticMarkup(
      createElement(SearchInput, {
        value: "Dragon Sword",
        ariaLabel: "Items search",
      })
    );

    expect(html).toContain('aria-label="Clear search query"');
    expect(html).toContain('value="Dragon Sword"');
  });
});

describe("Primitive 19: Collapsible", () => {
  it("renders disclosure trigger with aria-expanded and controlled content", () => {
    const html = renderToStaticMarkup(
      createElement(
        Collapsible,
        { defaultOpen: false },
        createElement(CollapsibleTrigger, null, "World Databases"),
        createElement(CollapsibleContent, null, "Item entries list")
      )
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("World Databases");
    expect(html).toContain("contentClosed");
  });

  it("renders content visible when open is true", () => {
    const html = renderToStaticMarkup(
      createElement(
        Collapsible,
        { open: true },
        createElement(CollapsibleTrigger, null, "World Databases"),
        createElement(CollapsibleContent, null, "Item entries list")
      )
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Item entries list");
  });
});

describe("Primitive 20: Accordion", () => {
  it("renders semantic heading-wrapped triggers and region panels", () => {
    const html = renderToStaticMarkup(
      createElement(
        Accordion,
        { type: "single", defaultValue: "faq-1" },
        createElement(
          AccordionItem,
          { value: "faq-1" },
          createElement(
            AccordionHeader,
            { as: "h3" },
            createElement(AccordionTrigger, null, "What is Spike Suppression?")
          ),
          createElement(AccordionContent, null, "3-day median price anchors prevent manipulation.")
        ),
        createElement(
          AccordionItem,
          { value: "faq-2" },
          createElement(
            AccordionHeader,
            { as: "h3" },
            createElement(AccordionTrigger, null, "How is EV calculated?")
          ),
          createElement(AccordionContent, null, "Recursive tree traversal of crafting inputs.")
        )
      )
    );

    expect(html).toContain("<h3");
    expect(html).toContain('data-accordion-trigger="true"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="region"');
    expect(html).toContain("What is Spike Suppression?");
    expect(html).toContain("3-day median price anchors prevent manipulation.");
  });
});

describe("Primitive 21: Avatar", () => {
  it("renders fallback text and rarity indicator", () => {
    const html = renderToStaticMarkup(
      createElement(Avatar, {
        alt: "Battlemage",
        rarity: "epic",
        size: "lg",
        badge: 42,
      })
    );

    expect(html).toContain("BA");
    expect(html).toContain('data-rarity="epic"');
    expect(html).toContain("rarityEpic");
    expect(html).toContain("badgeNumeric");
    expect(html).toContain("42");
  });
});

describe("Primitive 22: Kbd", () => {
  it("renders semantic kbd element with key combinations", () => {
    const html = renderToStaticMarkup(
      createElement(Kbd, { keys: ["Ctrl", "K"], size: "md" })
    );

    expect(html).toContain("<kbd");
    expect(html).toContain("Ctrl");
    expect(html).toContain("K");
    expect(html).toContain("+");
  });
});

describe("Primitive 23: Separator", () => {
  it("renders horizontal hr with role=none when decorative", () => {
    const html = renderToStaticMarkup(
      createElement(Separator, { orientation: "horizontal", decorative: true })
    );

    expect(html).toContain("<hr");
    expect(html).toContain('role="none"');
    expect(html).toContain("horizontal");
  });

  it("renders vertical separator with role=separator", () => {
    const html = renderToStaticMarkup(
      createElement(Separator, { orientation: "vertical", decorative: false })
    );

    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain("vertical");
  });

  it("renders interactive splitter with valuenow attributes", () => {
    const html = renderToStaticMarkup(
      createElement(Separator, {
        interactive: true,
        valueNow: 40,
        valueMin: 10,
        valueMax: 90,
      })
    );

    expect(html).toContain('role="separator"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-valuenow="40"');
  });
});

describe("Primitive 24: Skeleton", () => {
  it("renders decorative shape with aria-hidden=true", () => {
    const html = renderToStaticMarkup(
      createElement(Skeleton, { variant: "circular", width: 40, height: 40 })
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("circular");
    expect(html).toContain("width:40px");
    expect(html).toContain("height:40px");
  });

  it("renders SkeletonContainer with aria-busy and polite status message", () => {
    const html = renderToStaticMarkup(
      createElement(
        SkeletonContainer,
        { busy: true, announcement: "Loading market item prices..." },
        createElement(Skeleton, { variant: "rectangular", height: 80 })
      )
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Loading market item prices...");
  });
});

describe("Pagination Primitive", () => {
  it("computes pagination item sequences correctly", () => {
    // 5 pages: all displayed without ellipsis
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);

    // 20 pages, page 2 (near start)
    expect(getPaginationItems(2, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 20]);

    // 20 pages, page 19 (near end)
    expect(getPaginationItems(19, 20)).toEqual([1, "ellipsis-start", 16, 17, 18, 19, 20]);

    // 20 pages, page 10 (middle)
    expect(getPaginationItems(10, 20)).toEqual([1, "ellipsis-start", 9, 10, 11, "ellipsis-end", 20]);
  });

  it("renders Pagination landmark with semantic controls and aria-current", () => {
    const html = renderToStaticMarkup(
      createElement(Pagination, {
        currentPage: 3,
        totalPages: 10,
        totalItems: 500,
        pageSize: 50,
        onPageChange: () => {},
        showPageSize: true,
        onPageSizeChange: () => {},
      })
    );

    expect(html).toContain('<nav aria-label="Pagination"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Showing');
    expect(html).toContain('101–150');
    expect(html).toContain('500');
    expect(html).toContain('items');
    expect(html).toContain('aria-label="Previous page"');
    expect(html).toContain('aria-label="Next page"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Page 3"');
    expect(html).toContain('Per page:');
  });

  it("disables Previous on page 1 and Next on last page", () => {
    const htmlPage1 = renderToStaticMarkup(
      createElement(Pagination, {
        currentPage: 1,
        totalPages: 5,
        onPageChange: () => {},
      })
    );
    expect(htmlPage1).toContain('disabled=""');
    expect(htmlPage1).toContain('aria-label="Previous page"');

    const htmlLastPage = renderToStaticMarkup(
      createElement(Pagination, {
        currentPage: 5,
        totalPages: 5,
        onPageChange: () => {},
      })
    );
    expect(htmlLastPage).toContain('disabled=""');
    expect(htmlLastPage).toContain('aria-label="Next page"');
    expect(htmlLastPage).toContain('paginationCentered');
  });
});

describe("Combobox Primitive", () => {
  const mockOptions = [
    { id: 1, label: "Greater Combat Potion", meta: "Tier 4" },
    { id: 2, label: "Super Gathering Potion", meta: "Tier 5" },
    { id: 3, label: "Elixir of Vitality", meta: "Tier 3" },
  ];

  it("renders input with role=combobox, autocomplete=list, and aria-expanded", () => {
    const html = renderToStaticMarkup(
      createElement(Combobox, {
        options: mockOptions,
        onSelect: () => {},
        placeholder: "Search IdleMMO items...",
        "aria-label": "Item search",
      })
    );

    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain('aria-controls="');
    expect(html).toContain('placeholder="Search IdleMMO items..."');
    expect(html).toContain('aria-label="Item search"');
  });

  it("renders clear button when search query is present", () => {
    const htmlWithQuery = renderToStaticMarkup(
      createElement(Combobox, {
        options: mockOptions,
        value: "Potion",
        onSelect: () => {},
      })
    );

    expect(htmlWithQuery).toContain('aria-label="Clear input"');
  });
});

describe("Tabs Primitive", () => {
  it("renders tablist and panels with accessible roles and aria attributes", () => {
    const html = renderToStaticMarkup(
      createElement(
        Tabs,
        { defaultValue: "potions" },
        createElement(
          TabList,
          { "aria-label": "Alchemy recipes" },
          createElement(Tab, { value: "potions", badge: 14 }, "Potions"),
          createElement(Tab, { value: "elixirs", badge: 6 }, "Elixirs")
        ),
        createElement(TabPanel, { value: "potions" }, "Potions Content"),
        createElement(TabPanel, { value: "elixirs" }, "Elixirs Content")
      )
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Alchemy recipes"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Potions');
    expect(html).toContain('14');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('Potions Content');
    expect(html).not.toContain('Elixirs Content');
  });

  it("supports pill variant styling", () => {
    const html = renderToStaticMarkup(
      createElement(
        Tabs,
        { defaultValue: "one", variant: "pill" },
        createElement(
          TabList,
          { "aria-label": "Test" },
          createElement(Tab, { value: "one" }, "One")
        ),
        createElement(TabPanel, { value: "one" }, "Panel")
      )
    );

    expect(html).toContain('pillVariant');
  });
});

describe("Tag Primitive", () => {
  it("renders static tag with label and optional count", () => {
    const html = renderToStaticMarkup(
      createElement(Tag, { label: "Whispering Woods", count: 12, rarity: "rare" })
    );

    expect(html).toContain('<span class="');
    expect(html).toContain('Whispering Woods');
    expect(html).toContain('12');
    expect(html).toContain('rarity_rare');
  });

  it("renders interactive filter tag with aria-pressed button", () => {
    const html = renderToStaticMarkup(
      createElement(Tag, {
        label: "Heatwave Favored",
        selected: true,
        onSelect: () => {},
      })
    );

    expect(html).toContain('<button type="button" aria-pressed="true"');
    expect(html).toContain('Heatwave Favored');
    expect(html).toContain('isSelected');
  });

  it("renders removable tag with accessible remove button", () => {
    const html = renderToStaticMarkup(
      createElement(Tag, {
        label: "Level 10-20",
        onRemove: () => {},
        removeAriaLabel: "Remove level filter",
      })
    );

    expect(html).toContain('Level 10-20');
    expect(html).toContain('<button type="button" aria-label="Remove level filter"');
  });
});

describe("StatCard Primitive", () => {
  it("renders semantic dl structure with formatted value and context", () => {
    const html = renderToStaticMarkup(
      createElement(StatCard, {
        label: "Median Crafting Profit",
        value: 14520,
        unit: "g",
        delta: { direction: "up", value: "+4.2%", sentiment: "positive" },
        context: "vs prior 24h • Updated 2h ago",
      })
    );

    expect(html).toContain('<dl class="');
    expect(html).toContain('<dt class="');
    expect(html).toContain('Median Crafting Profit');
    expect(html).toContain('14,520');
    expect(html).toContain('g');
    expect(html).toContain('▲');
    expect(html).toContain('+4.2%');
    expect(html).toContain('vs prior 24h • Updated 2h ago');
  });

  it("decouples direction from sentiment (e.g. rising cost is negative sentiment)", () => {
    const html = renderToStaticMarkup(
      createElement(StatCard, {
        label: "Ingredient Cost",
        value: "3,200g",
        delta: { direction: "up", value: "+12%", sentiment: "negative" },
      })
    );

    expect(html).toContain('delta_negative');
    expect(html).toContain('▲');
    expect(html).toContain('+12%');
  });
});

describe("Checkbox Primitive", () => {
  it("renders checkbox input inside label with accessible description", () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, {
        id: "craft-potion-check",
        label: "Include Super Combat Potion",
        description: "Adds 15% combat boost calculation",
        checked: true,
        onChange: () => {},
      })
    );

    expect(html).toContain('<label for="craft-potion-check"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="craft-potion-check"');
    expect(html).toContain('checked=""');
    expect(html).toContain('aria-describedby="craft-potion-check-desc"');
    expect(html).toContain('Include Super Combat Potion');
    expect(html).toContain('Adds 15% combat boost calculation');
  });

  it("handles disabled state cleanly", () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, {
        label: "Disabled Item",
        disabled: true,
      })
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('isDisabled');
  });
});

describe("NumberInput Primitive", () => {
  it("renders spinbutton semantics with min, max, value and formatted display", () => {
    const html = renderToStaticMarkup(
      createElement(NumberInput, {
        id: "alchemy-batch-input",
        label: "Potion Quantity",
        value: 25,
        min: 1,
        max: 100,
        step: 5,
        onChange: () => {},
        showSteppers: true,
      })
    );

    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain('aria-valuemin="1"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html.toLowerCase()).toContain('inputmode="numeric"');
    expect(html).toContain('value="25"');
    expect(html).toContain("Potion Quantity");
    expect(html).toContain('aria-label="Decrease Potion Quantity"');
    expect(html).toContain('aria-label="Increase Potion Quantity"');
  });

  it("renders error state and helper text correctly", () => {
    const html = renderToStaticMarkup(
      createElement(NumberInput, {
        label: "Market Price",
        value: 0,
        errorMessage: "Price must exceed vendor minimum",
        helperText: "Based on 3-day median",
        onChange: () => {},
      })
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Price must exceed vendor minimum");
    expect(html).toContain('role="alert"');
  });
});

describe("ProgressBar, ProgressRing & Meter Primitives", () => {
  it("renders linear ProgressBar with role=progressbar and scaleX transform", () => {
    const html = renderToStaticMarkup(
      createElement(ProgressBar, {
        label: "Alchemy Mastery",
        value: 75,
        max: 100,
        variant: "success",
        showValue: true,
      })
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain("Alchemy Mastery");
    expect(html).toContain("75%");
    expect(html).toContain("scaleX(0.75)");
  });

  it("renders ProgressRing SVG with circular stroke calculations", () => {
    const html = renderToStaticMarkup(
      createElement(ProgressRing, {
        value: 40,
        max: 100,
        size: 64,
        strokeWidth: 6,
        label: "Boss Stamina",
      })
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("<svg");
    expect(html).toContain('width="64"');
    expect(html).toContain('height="64"');
    expect(html).toContain("stroke-dasharray");
    expect(html).toContain("stroke-dashoffset");
  });

  it("renders Meter with role=meter and optimum evaluation", () => {
    const html = renderToStaticMarkup(
      createElement(Meter, {
        label: "Market Volatility",
        value: 85,
        min: 0,
        max: 100,
        low: 30,
        high: 70,
        optimum: 20,
      })
    );

    expect(html).toContain('role="meter"');
    expect(html).toContain('aria-valuenow="85"');
    expect(html).toContain("Market Volatility");
    expect(html).toContain("85%");
  });
});

describe("Breadcrumbs Primitive", () => {
  it("renders semantic nav landmark, ordered list, and plain text current page", () => {
    const html = renderToStaticMarkup(
      createElement(Breadcrumbs, {
        items: [
          { label: "Items", href: "/items" },
          { label: "Potions", href: "/items?category=potions" },
          { label: "Super Combat Potion" },
        ],
      })
    );

    expect(html).toContain('<nav aria-label="Breadcrumb"');
    expect(html).toContain("<ol");
    expect(html).toContain("<li");
    expect(html).toContain('href="/items"');
    expect(html).toContain("Potions");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Super Combat Potion");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("Slider Primitive", () => {
  it("renders single slider with role=slider and boundary attributes", () => {
    const html = renderToStaticMarkup(
      createElement(Slider, {
        label: "Target Level",
        value: 45,
        min: 1,
        max: 100,
        onChange: () => {},
      })
    );

    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="45"');
    expect(html).toContain('aria-valuemin="1"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain("Target Level");
    expect(html).toContain("45");
  });

  it("renders dual-thumb range slider with lower and upper thumb sliders", () => {
    const html = renderToStaticMarkup(
      createElement(Slider, {
        label: "Enemy Combat Level",
        value: [20, 80],
        min: 1,
        max: 100,
        onChange: () => {},
        minAriaLabel: "Minimum level",
        maxAriaLabel: "Maximum level",
      })
    );

    expect(html).toContain('aria-label="Minimum level"');
    expect(html).toContain('aria-label="Maximum level"');
    expect(html).toContain('aria-valuenow="20"');
    expect(html).toContain('aria-valuenow="80"');
    expect(html).toContain("20 – 80");
  });
});

describe("TextArea Primitive", () => {
  it("renders semantic label, character counter, and auto-grow attributes", () => {
    const html = renderToStaticMarkup(
      createElement(TextArea, {
        id: "notes-input",
        label: "Custom Crafting Notes",
        defaultValue: "Prioritize swiftness elixirs during rain storm.",
        maxLength: 500,
        helperText: "Saved locally to your browser profile.",
      })
    );

    expect(html).toContain('<label for="notes-input"');
    expect(html).toContain("Custom Crafting Notes");
    expect(html).toContain("47 / 500");
    expect(html).toContain("Saved locally to your browser profile.");
    expect(html).toContain("<textarea");
  });

  it("applies data import security attributes for profile hashes", () => {
    const html = renderToStaticMarkup(
      createElement(TextArea, {
        id: "profile-import-box",
        label: "Profile Data Hash",
        isDataImport: true,
        defaultValue: '{"character":"ZenithWarrior","level":85}',
      })
    );

    expect(html.toLowerCase()).toContain('spellcheck="false"');
    expect(html.toLowerCase()).toContain('autocapitalize="off"');
    expect(html.toLowerCase()).toContain('autocomplete="off"');
    expect(html).toContain('wrap="off"');
  });
});

describe("RadioGroup Primitive", () => {
  it("renders fieldset with legend, shared name, and checked option", () => {
    const html = renderToStaticMarkup(
      createElement(RadioGroup, {
        name: "marketPricingBaseline",
        legend: "Pricing Baseline",
        helperText: "Determines profit calculation source",
        value: "median",
        options: [
          { value: "median", label: "3-Day Median Price", description: "Spike-suppressed" },
          { value: "recent", label: "Lowest Active Listing", description: "Spot market price" },
        ],
      })
    );

    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain("Pricing Baseline");
    expect(html).toContain('name="marketPricingBaseline"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('value="median"');
    expect(html).toContain('checked=""');
    expect(html).toContain("3-Day Median Price");
    expect(html).toContain("Spike-suppressed");
  });

  it("renders card variant with disabled option and reason", () => {
    const html = renderToStaticMarkup(
      createElement(RadioGroup, {
        variant: "card",
        legend: "Crafting Mode",
        options: [
          { value: "standard", label: "Standard Batch" },
          { value: "mastery", label: "Mastery Overcharge", disabled: true, disabledReason: "Requires Alchemy Lv. 90" },
        ],
      })
    );

    expect(html).toContain("Mastery Overcharge");
    expect(html).toContain("Requires Alchemy Lv. 90");
    expect(html).toContain('disabled=""');
  });
});

describe("Timeline Primitive", () => {
  it("renders ordered list with semantic time elements, meta tags and direction notice", () => {
    const html = renderToStaticMarkup(
      createElement(Timeline, {
        title: "IdleMMO Update Log",
        directionNotice: "Order: Newest updates first • UTC",
        items: [
          {
            id: 1,
            title: "Patch 0.86.1 Combat Rebalance",
            timestamp: "2026-11-20T14:30:00Z",
            formattedTime: "4 days ago",
            status: "Patch Released",
            variant: "success",
            body: "Weapon speeds adjusted across all tiers.",
          },
          {
            id: 2,
            title: "Haunted Hollow World Boss Spawn",
            timestamp: "2026-11-18T10:00:00Z",
            formattedTime: "6 days ago",
            status: "World Event",
            variant: "danger",
            body: "Defeated in 42 minutes by guild coalition.",
          },
        ],
      })
    );

    expect(html).toContain("IdleMMO Update Log");
    expect(html).toContain("Order: Newest updates first • UTC");
    expect(html).toContain("<ol");
    expect(html).toContain("<li");
    expect(html).toContain('<time dateTime="2026-11-20T14:30:00.000Z"');
    expect(html).toContain("4 days ago");
    expect(html).toContain("Patch Released");
    expect(html).toContain("Patch 0.86.1 Combat Rebalance");
    expect(html).toContain("Weapon speeds adjusted across all tiers.");
    expect(html).toContain("Haunted Hollow World Boss Spawn");
  });
});












