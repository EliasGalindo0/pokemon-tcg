import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAdmin()) redirect("/");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Acesso</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Só o dono da coleção pode cadastrar e editar. Visitantes continuam no modo leitura para
          propor trocas.
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
