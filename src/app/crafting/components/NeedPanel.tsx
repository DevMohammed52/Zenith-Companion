"use client";

import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { formatGold } from "@/lib/format";
import type { QueueNeedRow, QueueRecipeNeedRow } from "@/lib/crafting-queue";
import { formatPriceSource } from "../types";
import CraftItemImage from "./CraftItemImage";

export default function NeedPanel({
    title,
    icon,
    rows,
    emptyText,
    footerLabel,
    renderSubline,
    getItemImage,
    openItemByName,
    prefetchItem,
}: {
    title: string;
    icon: ReactNode;
    rows: QueueNeedRow[] | QueueRecipeNeedRow[];
    emptyText?: string;
    footerLabel?: string;
    renderSubline?: (row: QueueRecipeNeedRow) => string;
    getItemImage: (name: string) => string;
    openItemByName: (name: string) => void;
    prefetchItem: (name: string) => void;
}) {
    const total = rows.reduce((sum, row) => sum + row.totalPrice, 0);

    return (
        <div className="table-container craft-panel craft-need-panel">
            <h3 className="craft-panel-title">
                <span>{icon} {title}</span>
                <em>{rows.length.toLocaleString()} line{rows.length === 1 ? "" : "s"}</em>
            </h3>
            {rows.length === 0 ? (
                <div className="craft-empty-state compact">
                    <Package size={22} aria-hidden="true" />
                    {emptyText || "Nothing needed for the current queue."}
                </div>
            ) : (
                <div className="craft-need-list">
                    {rows.map((row) => (
                        <button
                            type="button"
                            key={row.name}
                            onClick={() => openItemByName(row.name)}
                            onMouseEnter={() => prefetchItem(row.name)}
                            className="source-row group"
                        >
                            <div className="craft-need-main">
                                <CraftItemImage
                                    className="craft-need-image"
                                    fallbackClassName="craft-need-image-fallback"
                                    src={getItemImage(row.name)}
                                    size={30}
                                >
                                    <Package size={13} />
                                </CraftItemImage>
                                <span className="craft-need-name group-hover:text-accent transition-colors">
                                    <span className="text-muted">{row.quantity.toLocaleString()}x</span> {row.name}
                                </span>
                            </div>
                            <div className="craft-need-price">
                                <div className={`mono ${row.source === "missing" ? "text-danger" : "text-accent"}`}>
                                    {row.totalPrice > 0 ? `${formatGold(row.totalPrice)}g` : "-"}
                                </div>
                                <div className="craft-need-subline">
                                    {row.unitPrice > 0 ? `${formatGold(row.unitPrice)}g ea - ${formatPriceSource(row.source)}` : "Missing price"}
                                </div>
                                {renderSubline && "maxUses" in row && (
                                    <div className="craft-need-subline">{renderSubline(row)}</div>
                                )}
                            </div>
                        </button>
                    ))}
                    {footerLabel && (
                        <div className="craft-need-footer">
                            <span>{footerLabel}</span>
                            <span className="mono text-accent">{formatGold(total)}g</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
