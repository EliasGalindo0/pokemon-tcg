export default function CardsLoading() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-10 w-40 animate-pulse rounded-xl bg-line" />
      <div className="h-28 animate-pulse rounded-2xl bg-line" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[5/7] animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
    </div>
  );
}
