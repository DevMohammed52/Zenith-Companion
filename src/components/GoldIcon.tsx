import { GameImage } from "./GameImage";

const INLINE_CURRENCY_STYLE = {
  display: "inline-block",
  verticalAlign: "-0.15em",
  objectFit: "contain" as const,
  flexShrink: 0,
};

export function GoldIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <GameImage
      src="https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/gold_coin.png"
      alt="Gold"
      width={size}
      height={size}
      className={className || "gold-coin-inline"}
      style={INLINE_CURRENCY_STYLE}
      sizes={`${size}px`}
      aria-hidden="true"
    />
  );
}

export function TokenIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <GameImage
      src="https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/global/token.png"
      alt="Tokens"
      width={size}
      height={size}
      className={className || "currency-icon-inline"}
      style={INLINE_CURRENCY_STYLE}
      sizes={`${size}px`}
      aria-hidden="true"
    />
  );
}

export function ShardIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <GameImage
      src="https://cdn.idle-mmo.com/cdn-cgi/image/width=20,height=20,format=auto/uploaded/skins/01JVYWCX6QE35GBJQ9TV02G033.png"
      alt="Shards"
      width={size}
      height={size}
      className={className || "currency-icon-inline"}
      style={INLINE_CURRENCY_STYLE}
      sizes={`${size}px`}
      aria-hidden="true"
    />
  );
}
