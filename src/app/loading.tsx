export default function Loading() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-10 w-48 animate-pulse rounded-xl bg-line" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-line" />
        <div className="h-28 animate-pulse rounded-2xl bg-line" />
        <div className="h-28 animate-pulse rounded-2xl bg-line" />
      </div>
    </div>
  );
}
