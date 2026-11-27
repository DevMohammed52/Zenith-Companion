import type { Recipe } from "@/constants";
import type {
  CraftingQueuePlan,
  QueueNeedRow,
  QueuePriceSource,
  QueueSaleSource,
} from "@/lib/crafting-queue";
import type { CartFinancialTotals } from "./utils/cart-math";

export interface CartRecipeOption {
  name: string;
  recipe: Recipe;
  quality: string;
  profitEach: number;
}

export function formatSaleSource(source: QueueSaleSource): string {
  if (source === "custom") return "CUSTOM";
  if (source === "market") return "MARKET";
  if (source === "vendor") return "VENDOR";
  return "NO SALE";
}

export function formatPriceSource(source: QueuePriceSource | string): string {
  if (source === "custom") return "custom";
  if (source === "vendor") return "vendor";
  if (source === "market") return "market";
  return "missing";
}

export interface UseCraftingPageStateReturn {
  loading: boolean;
  hasMarketError: boolean;
  retryMarketLoad: () => void;
  plan: CraftingQueuePlan;
  totals: CartFinancialTotals;
  taxRatePercent: number;
  membershipActive: boolean;

  // Picker
  recipeOptions: CartRecipeOption[];
  starterRecipes: CartRecipeOption[];
  selectedRecipeName: string;
  recipeQuery: string;
  setRecipeQuery: (q: string) => void;
  selectRecipe: (name: string, label?: string) => void;
  addAmount: number;
  setAddAmount: (qty: number) => void;
  handleAddSelected: () => void;
  handleQuickAdd: (name: string, quantity: number) => void;

  // Cart items
  setCartQuantity: (name: string, quantity: number) => void;
  removeCartItem: (name: string) => void;
  undoSnapshot: Record<string, number> | null;
  handleClearCart: () => void;
  handleUndoClear: () => void;

  // Shopping list checkboxes & export
  checkedNeedNames: Record<string, boolean>;
  toggleNeedChecked: (name: string) => void;
  clearCheckedNeeds: () => void;
  copiedList: boolean;
  copyMarketList: () => Promise<void>;

  // Helpers & modal
  getItemImageUrl: (name: string) => string | undefined;
  getItemQuality: (name: string) => string;
  inspectItem: (name: string) => void;
  prefetchItem: (name: string) => void;
  needsByGroup: {
    vials: QueueNeedRow[];
    ingredients: QueueNeedRow[];
  };
}
