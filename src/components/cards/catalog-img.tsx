"use client";

import { useState } from "react";

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
  const [current, setCurrent] = useState(src ?? null);
  const [failed, setFailed] = useState(!src);

  if (failed || !current) {
    return <>{fallback ?? null}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        const en = englishAssetUrl(current);
        if (en !== current) {
          setCurrent(en);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
