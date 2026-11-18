import { GameImage } from "./GameImage";

export function GoldIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <GameImage
      src="https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/gold_coin.png"
      alt="Gold"
      width={size}
      height={size}
      className={className || "gold-coin-inline"}
      sizes={`${size}px`}
      aria-hidden="true"
    />
  );
}
