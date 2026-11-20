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
} from "@/components/ui";

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
});
