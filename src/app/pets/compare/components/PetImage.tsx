"use client";

import { useState } from "react";
import { PawPrint } from "lucide-react";
import { getPetImage, isUpsideDownPet, type PetRecord } from "@/lib/pets";
import styles from "../page.module.css";

export function PetImage({ pet }: { pet: PetRecord }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const image = getPetImage(pet);

  return (
    <div className={styles.petAvatar}>
      {(!image || failed || !loaded) && <PawPrint size={28} aria-hidden="true" />}
      {image && !failed ? (
        <img
          src={image}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className={`${loaded ? styles.petImageLoaded : styles.petImageLoading} ${
            isUpsideDownPet(pet) ? styles.petImageUpsideDown : ""
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
