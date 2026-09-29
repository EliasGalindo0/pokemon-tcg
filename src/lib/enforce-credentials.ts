import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_WHILE_MUST_CHANGE = new Set(["/conta", "/login"]);

/** Redirects provisional users away from the rest of the app until they set credentials. */
export async function enforceCredentialChange() {
  const user = await getSessionUser();
  if (!user?.mustChangeCredentials) return;

  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!pathname || ALLOWED_WHILE_MUST_CHANGE.has(pathname)) return;
  redirect("/conta");
}
