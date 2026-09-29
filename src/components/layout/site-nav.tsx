"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/nav-link";

export type SiteNavItem = {
  href: string;
  label: string;
};

export function SiteNav({
  items,
  mobileExtras = [],
}: {
  items: SiteNavItem[];
  mobileExtras?: SiteNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();
  const mobileItems = [...items, ...mobileExtras];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} tone="dark">
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="lg:hidden">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-paper hover:bg-white/10"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-navy/40"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <nav
              id={panelId}
              aria-label="Principal"
              className="absolute left-0 right-0 top-full z-40 max-h-[min(70vh,28rem)] overflow-y-auto border-b border-white/10 bg-navy px-4 py-3 shadow-lg"
            >
              <ul className="flex flex-col gap-1">
                {mobileItems.map((item) => (
                  <li key={item.href} className="[&_a]:block [&_a]:w-full">
                    <NavLink href={item.href} tone="dark">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        ) : null}
      </div>
    </>
  );
}
