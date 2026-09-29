import Link from "next/link";

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function PageLink({
  href,
  children,
  disabled = false,
  current = false,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  current?: boolean;
}) {
  const className = `rounded-full px-3 py-1.5 text-sm ${
    current ? "bg-navy text-paper" : "border border-line bg-card text-ink hover:bg-white"
  }`;

  if (disabled) {
    return <span className="rounded-full px-3 py-1.5 text-sm text-stone-400">{children}</span>;
  }

  return (
    <Link href={href} className={className} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function Pagination({
  page,
  pageCount,
  params,
  basePath = "/cards",
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1,
  );

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
      <PageLink href={hrefFor(basePath, params, page - 1)} disabled={page <= 1}>
        Anterior
      </PageLink>
      {pages.map((item, index) => {
        const previous = pages[index - 1];
        return (
          <span key={item} className="flex items-center gap-2">
            {previous && item - previous > 1 ? <span className="px-1 text-muted">…</span> : null}
            <PageLink href={hrefFor(basePath, params, item)} current={item === page}>
              {item}
            </PageLink>
          </span>
        );
      })}
      <PageLink href={hrefFor(basePath, params, page + 1)} disabled={page >= pageCount}>
        Próxima
      </PageLink>
    </nav>
  );
}
