export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
