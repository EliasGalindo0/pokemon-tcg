"use client";

import { useActionState } from "react";
import { updateAccountAction, type AccountActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";

const initial: AccountActionState = {};

export function AccountForm({
  username,
  displayName,
  mustChange,
}: {
  username: string;
  displayName: string;
  mustChange: boolean;
}) {
  const [state, action, pending] = useActionState(updateAccountAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-line bg-card p-5">
      {mustChange ? (
        <p className="rounded-2xl bg-ember/10 px-3 py-2 text-sm text-ember">
          Este é o primeiro acesso (ou um reset). Defina um usuário e uma senha novos — diferentes dos
          provisórios — para continuar.
        </p>
      ) : null}

      <Field label="Nome de exibição" name="displayName" hint="Como você aparece nas ofertas.">
        <input
          id="displayName"
          name="displayName"
          required
          defaultValue={displayName}
          minLength={2}
          maxLength={60}
          className={controlClass}
        />
      </Field>

      <Field
        label="Novo usuário"
        name="username"
        hint="3–24 caracteres: letras minúsculas, números e _."
      >
        <input
          id="username"
          name="username"
          required
          defaultValue={mustChange ? "" : username}
          placeholder={mustChange ? `não use ${username}` : username}
          autoComplete="username"
          pattern="[a-z0-9_]{3,24}"
          className={controlClass}
        />
      </Field>

      <Field label="Senha atual (provisória ou a sua)" name="currentPassword">
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={controlClass}
        />
      </Field>

      <Field label="Nova senha" name="newPassword" hint="Mínimo de 6 caracteres.">
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={controlClass}
        />
      </Field>

      {state.message ? (
        <p className="text-sm text-ember" role="alert">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando…" : mustChange ? "Definir acesso e continuar" : "Atualizar conta"}
      </Button>
    </form>
  );
}
