import Image, { type ImageProps } from "next/image";
import type { ReactNode } from "react";
import { getTrustedGameImageUrl } from "@/lib/trusted-image";

type GameImageProps = Omit<ImageProps, "alt" | "src"> & {
  alt: string;
  fallback?: ReactNode;
  fallbackSrc?: string;
  src?: string | null;
};

export function GameImage({
  alt,
  fallback = null,
  fallbackSrc,
  src,
  ...imageProps
}: GameImageProps) {
  const imageSrc = getTrustedGameImageUrl(src) || getTrustedGameImageUrl(fallbackSrc);

  if (!imageSrc) {
    return <>{fallback}</>;
  }

  return <Image {...imageProps} alt={alt} src={imageSrc} />;
}
