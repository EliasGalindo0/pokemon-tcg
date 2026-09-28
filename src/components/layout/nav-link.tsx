"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  tone = "light",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const styles =
    tone === "dark"
      ? active
        ? "bg-paper text-navy"
        : "text-white/80 hover:bg-white/10 hover:text-white"
      : active
        ? "bg-navy text-paper"
        : "text-ink hover:bg-white/80";

  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${styles}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
