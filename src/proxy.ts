import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/auth-cookie";

const AUTH_PREFIXES = ["/cards", "/decks", "/ofertas", "/album", "/admin", "/conta"];

function needsAuth(pathname: string) {
  if (pathname === "/") return true;
  if (AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  if (!needsAuth(request.nextUrl.pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/",
    "/album",
    "/album/:path*",
    "/decks",
    "/decks/:path*",
    "/cards",
    "/cards/:path*",
    "/ofertas",
    "/ofertas/:path*",
    "/admin",
    "/admin/:path*",
    "/conta",
    "/trocas",
    "/trocas/:path*",
    "/galeria",
    "/galeria/:path*",
    "/login",
  ],
};
