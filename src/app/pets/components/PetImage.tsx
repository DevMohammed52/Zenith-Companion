import { PawPrint } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import type { PetRecord } from "../types";

export function PetImage({ pet }: { pet: PetRecord }) {
  const image = pet.imageUrl || pet.egg?.imageUrl;
  return (
    <div className="pet-avatar">
      {image ? (
        <GameImage
          src={image}
          alt=""
          width={44}
          height={44}
          sizes="44px"
          className={pet.name === "Dead Wyrmshadow" ? "pet-image-upside-down" : undefined}
          loading="lazy"
        />
      ) : (
        <PawPrint size={30} />
      )}
    </div>
  );
}
