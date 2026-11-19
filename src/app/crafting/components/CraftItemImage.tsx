"use client";

import { useState, type ReactNode } from "react";

export default function CraftItemImage({
    className,
    fallbackClassName,
    src,
    size,
    children,
}: {
    className: string;
    fallbackClassName: string;
    src: string;
    size: number;
    children: ReactNode;
}) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <span className={`${className} ${fallbackClassName}`} aria-hidden="true">
                {children}
            </span>
        );
    }

    return (
        <img
            className={className}
            src={src}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
        />
    );
}
