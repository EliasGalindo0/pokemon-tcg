import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  const { next } = await searchParams;
  if (user) {
    if (user.mustChangeCredentials) redirect("/conta");
    redirect(user.role === "ADMIN" ? next || "/" : next || "/cards");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Acesso</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Entre com o usuário liberado pelo administrador. Visitantes podem ver coleções e trocas sem login.
        </p>
      </div>
      <LoginForm next={next ?? "/"} />
      <p className="text-center text-sm text-muted">
        <Link href="/trocas" className="text-navy hover:underline">
          Ver cartas para troca sem entrar
        </Link>
      </p>
    </div>
  );
}
