"use client";

import Image from "next/image";

type StickerProps = {
  src: string;
  alt: string;
  className?: string; // buat atur posisi: top-.. left-.. rotate-.. dll
  size?: number;      // px
};

export default function Sticker({ src, alt, className = "", size = 64 }: StickerProps) {
  return (
    <div
      className={[
        "pointer-events-none select-none",
        "absolute z-20 drop-shadow-md",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority={false}
      />
    </div>
  );
}
