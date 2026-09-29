import Link from "next/link";

export type CollectorListItem = {
  username: string;
  displayName: string;
  href: string;
  meta: string;
  images?: string[];
};

export function CollectorList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: CollectorListItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
        <h2 className="font-display text-3xl">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.username}>
          <Link
            href={item.href}
            className="group flex flex-wrap items-center justify-between gap-3 py-4 transition hover:text-ember"
          >
            <span className="flex min-w-0 items-center gap-3">
              {item.images && item.images.length > 0 ? (
                <span className="flex -space-x-2">
                  {item.images.slice(0, 3).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="h-10 w-7 rounded-md border border-paper object-cover shadow-sm"
                    />
                  ))}
                </span>
              ) : null}
              <span>
                <span className="block font-display text-2xl tracking-tight group-hover:text-ember">
                  {item.displayName}
                </span>
                <span className="text-sm text-muted">@{item.username}</span>
              </span>
            </span>
            <span className="text-sm text-muted">{item.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
