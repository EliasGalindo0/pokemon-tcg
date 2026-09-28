export function Pokeball({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fffdf8" stroke="#142033" strokeWidth="3" />
      <path d="M4.5 32a27.5 27.5 0 0 1 55 0" fill="#e23d2b" />
      <path d="M3 29.5h58v5H3z" fill="#142033" />
      <circle cx="32" cy="32" r="9" fill="#fffdf8" stroke="#142033" strokeWidth="3" />
      <circle cx="32" cy="32" r="4" fill="#142033" />
    </svg>
  );
}
