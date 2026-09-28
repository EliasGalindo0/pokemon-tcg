export function SetTag({
  name,
  logoUrl,
  className = "",
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (!logoUrl) return null;

  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={name} className="h-8 w-auto" />
    </span>
  );
}
