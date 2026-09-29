"use client";

import { useEffect, useState } from "react";

function englishAssetUrl(url: string) {
  return url.replace(/^(https?:\/\/assets\.tcgdex\.net)\/[a-z]{2}(\/)/i, "$1/en$2");
}

export function CatalogImg({
  src,
  alt = "",
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [englishSrc, setEnglishSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setEnglishSrc(null);
    setFailed(false);
  }, [src]);

  const current = failed ? null : (englishSrc ?? src ?? null);

  if (!current) {
    return <>{fallback ?? null}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={current}
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (!englishSrc && src) {
          const en = englishAssetUrl(src);
          if (en !== src) {
            setEnglishSrc(en);
            return;
          }
        }
        setFailed(true);
      }}
    />
  );
}
