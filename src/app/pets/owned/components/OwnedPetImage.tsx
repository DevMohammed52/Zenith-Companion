"use client";

import { useState } from "react";
import { PawPrint } from "lucide-react";

export function OwnedPetImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <PawPrint size={24} aria-hidden="true" />;

  return (
    <img
      src={src}
      alt=""
      width={51}
      height={51}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
