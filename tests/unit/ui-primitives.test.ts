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

