"use client";

import { useMemo } from "react";
import { GameImage } from "@/components/GameImage";
import {
  Button,
  Card,
  Combobox,
  type ComboboxOption,
  Icon,
  NumberInput,
} from "@/components/ui";
import type { CartRecipeOption } from "../types";
import styles from "../page.module.css";

interface CraftingCartBarProps {
  recipeOptions: CartRecipeOption[];
  selectedRecipeName: string;
  recipeQuery: string;
  onRecipeQueryChange: (q: string) => void;
  onSelectRecipe: (name: string, label?: string) => void;
  addAmount: number;
  onAddAmountChange: (qty: number) => void;
  onAddSelected: () => void;
  getItemImageUrl: (name: string) => string | undefined;
}

export function CraftingCartBar({
  recipeOptions,
  selectedRecipeName,
  recipeQuery,
  onRecipeQueryChange,
  onSelectRecipe,
  addAmount,
  onAddAmountChange,
  onAddSelected,
  getItemImageUrl,
}: CraftingCartBarProps) {
  const comboboxOptions = useMemo<ComboboxOption[]>(() => {
    return recipeOptions.map((opt) => {
      const imgUrl = getItemImageUrl(opt.name);
      return {
        id: opt.name,
        label: opt.name,
        meta: `Lv ${opt.recipe.level}`,
        rarity: opt.quality.toLowerCase(),
        icon: imgUrl ? (
          <GameImage src={imgUrl} alt="" width={20} height={20} className={styles.thumbSm} />
        ) : undefined,
      };
    });
  }, [getItemImageUrl, recipeOptions]);

  const canAdd =
    Boolean(selectedRecipeName) ||
    recipeOptions.some((opt) => opt.name.toLowerCase() === recipeQuery.trim().toLowerCase());

  return (
    <Card padding="md" className={styles.addBarCard}>
      <div className={styles.addBarRow}>
        <div className={styles.comboboxSlot}>
          <Combobox
            options={comboboxOptions}
            value={recipeQuery}
            onChange={(nextQuery) => {
              onRecipeQueryChange(nextQuery);
              if (!nextQuery.trim()) {
                onSelectRecipe("");
              }
            }}
            onSelect={(opt) => onSelectRecipe(String(opt.id), opt.label)}
            placeholder="Search a potion or essence to add..."
            aria-label="Search a potion or essence to add"
            emptyMessage="No matching Alchemy recipe found"
          />
        </div>

        <div className={styles.qtySlot}>
          <NumberInput
            ariaLabel="Recipe quantity"
            value={addAmount}
            min={1}
            max={999999}
            step={10}
            showSteppers
            onChange={(val) => onAddAmountChange(Math.max(1, val))}
          />
        </div>

        <Button
          variant="primary"
          size="md"
          className={styles.addBtn}
          disabled={!canAdd}
          icon={<Icon name="plus" size="xs" aria-hidden="true" />}
          onClick={onAddSelected}
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
