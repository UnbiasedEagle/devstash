"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SignedImageProps {
  src: string;
  alt: string;
  className?: string;
}

// The link is short-lived, so on a page that stays open it eventually stops working. The image then gives way to a quiet placeholder instead of a broken-image icon
export default function SignedImage({ src, alt, className }: SignedImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-6" />
      </div>
    );
  }

  return (
    // A signed link to a private bucket can't go through the image optimizer, which would fetch it and keep a copy under its own address
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
