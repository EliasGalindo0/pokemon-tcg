export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-2xl border border-line border-t-4 border-t-ember bg-card px-5 py-4 shadow-[0_12px_30px_-24px_rgba(20,32,51,0.8)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </section>
  );
}
