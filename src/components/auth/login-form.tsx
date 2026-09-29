"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";

const initial: LoginState = {};

export function LoginForm({ next = "/" }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-line bg-card p-5">
      <input type="hidden" name="next" value={safeNext} />
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Usuário</span>
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          className={controlClass}
          placeholder="seu.usuario"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Senha</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={controlClass}
          placeholder="Sua senha"
        />
      </label>
      {state.message ? (
        <p className="text-sm text-ember" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
