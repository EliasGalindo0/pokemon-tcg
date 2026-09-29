import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/auth";

function redirectIfMustChange(user: SessionUser, nextPath: string) {
  if (user.mustChangeCredentials && nextPath !== "/conta") {
    redirect("/conta");
  }
}

/** Soft cookie gate is in proxy.ts; this enforces ADMIN role on server pages. */
export async function requireAdminPage(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  redirectIfMustChange(user, nextPath);
  if (user.role !== "ADMIN") redirect("/trocas");
  return user;
}

export async function requireUserPage(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  redirectIfMustChange(user, nextPath);
  return user;
}

export { getSessionUser, isAdmin };
