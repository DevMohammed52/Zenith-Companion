"use client";

import Link from "next/link";
import { BackToTop, Banner, Icon, Skeleton, SkeletonContainer } from "@/components/ui";
import { CraftingCartBar } from "./components/CraftingCartBar";
import { CraftingCartView } from "./components/CraftingCartView";
import { useCraftingPageState } from "./hooks/useCraftingPageState";
import styles from "./page.module.css";

export default function CraftingPage() {
  const s = useCraftingPageState();

  return (
    <main className={styles.pageShell} aria-labelledby="crafting-cart-heading">
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 id="crafting-cart-heading" className={styles.title}>Crafting Cart</h1>
          <p className={styles.subtitle}>
            Add Alchemy recipes to calculate exact ingredients, vials, and gold needed.
          </p>
        </div>

        <div className={styles.headerMetaRow}>
          <span className={styles.taxNote}>
            {s.membershipActive ? "Member 12% market tax" : "Standard 15% market tax"}
          </span>
          <Link href="/alchemy" className={styles.navLink}>
            <Icon name="alchemy" size="xs" aria-hidden="true" />
            <span>Alchemy Profit</span>
          </Link>
        </div>
      </header>

      {s.hasMarketError && (
        <Banner
          variant="error"
          action={{ label: "Retry", onClick: s.retryMarketLoad }}
        >
          Market prices could not load right now. Retry to calculate cart costs.
        </Banner>
      )}

      {s.loading ? (
        <SkeletonContainer announcement="Loading market prices and crafting cart...">
          <div className={styles.skeletonStack}>
            <Skeleton variant="rectangular" height={72} />
            <Skeleton variant="rectangular" height={240} />
          </div>
        </SkeletonContainer>
      ) : (
        <>
          <CraftingCartBar
            recipeOptions={s.recipeOptions}
            selectedRecipeName={s.selectedRecipeName}
            recipeQuery={s.recipeQuery}
            onRecipeQueryChange={s.setRecipeQuery}
            onSelectRecipe={s.selectRecipe}
            addAmount={s.addAmount}
            onAddAmountChange={s.setAddAmount}
            onAddSelected={s.handleAddSelected}
            getItemImageUrl={s.getItemImageUrl}
          />

          <CraftingCartView
            plan={s.plan}
            totals={s.totals}
            starterRecipes={s.starterRecipes}
            vials={s.needsByGroup.vials}
            ingredients={s.needsByGroup.ingredients}
            checkedNeedNames={s.checkedNeedNames}
            copiedList={s.copiedList}
            undoSnapshot={s.undoSnapshot}
            onQuickAdd={s.handleQuickAdd}
            onSetQuantity={s.setCartQuantity}
            onRemoveItem={s.removeCartItem}
            onClearCart={s.handleClearCart}
            onUndoClear={s.handleUndoClear}
            onToggleChecked={s.toggleNeedChecked}
            onClearChecked={s.clearCheckedNeeds}
            onCopyMarketList={() => {
              void s.copyMarketList();
            }}
            getItemImageUrl={s.getItemImageUrl}
            getItemQuality={s.getItemQuality}
            onInspectItem={s.inspectItem}
            onPrefetchItem={s.prefetchItem}
          />
        </>
      )}

      <BackToTop />
    </main>
  );
}
