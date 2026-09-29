import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/auth-cookie";

const WRITE_PREFIXES = ["/cards/new", "/decks/new", "/ofertas"];

function isWritePath(pathname: string) {
  if (WRITE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  if (/^\/cards\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

export function proxy(request: NextRequest) {
  if (!isWritePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  if (request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next();
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/cards/new", "/cards/:id/edit", "/decks/new", "/ofertas/:path*"],
};
