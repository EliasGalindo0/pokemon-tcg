"use client";

import { useActionState, useState } from "react";
import {
  inviteUserAction,
  resetPasswordAction,
  toggleUserActiveAction,
  type UserActionState,
} from "@/actions/auth";
import type { UserDTO } from "@/services/users";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";

const inviteInitial: UserActionState = {};

function CredentialsBox({
  username,
  password,
  onDismiss,
}: {
  username: string;
  password: string;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-3xl border border-ember/30 bg-ember/5 p-4 text-sm">
      <p className="font-medium text-ink">Envie estes dados agora — a senha não aparece de novo.</p>
      <dl className="mt-3 space-y-2 font-mono text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="text-muted">Usuário:</dt>
          <dd className="font-semibold">{username}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-muted">Senha:</dt>
          <dd className="font-semibold">{password}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        No primeiro acesso, a pessoa será obrigada a trocar usuário e senha.
      </p>
      <Button type="button" variant="secondary" className="mt-3" onClick={onDismiss}>
        Já anotei
      </Button>
    </div>
  );
}

function InviteForm({ onInvite }: { onInvite: (state: UserActionState) => void }) {
  const [state, action, pending] = useActionState(async (prev: UserActionState, formData: FormData) => {
    const next = await inviteUserAction(prev, formData);
    onInvite(next);
    return next;
  }, inviteInitial);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-line bg-card p-5">
      <Field label="Nome do amigo" name="displayName" hint="Só para você identificar; ele pode alterar depois.">
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={60}
          placeholder="Nome do amigo"
          className={controlClass}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="role" value="ADMIN" className="rounded border-line" />
        Liberar como administrador
      </label>
      {state.message && !state.invite ? (
        <p className="text-sm text-ember" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Gerando…" : "Gerar convite"}
      </Button>
    </form>
  );
}

function UserRow({
  user,
  selfId,
  onReset,
}: {
  user: UserDTO;
  selfId: string;
  onReset: (state: UserActionState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setMessage(null);
    const result = await toggleUserActiveAction(user.id, !user.active);
    setMessage(result.message ?? null);
    setBusy(false);
  }

  async function reset() {
    if (!confirm(`Gerar nova senha provisória para ${user.displayName}?`)) return;
    setBusy(true);
    setMessage(null);
    const result = await resetPasswordAction(user.id);
    onReset(result);
    setMessage(result.message ?? null);
    setBusy(false);
  }

  return (
    <li className="rounded-3xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{user.displayName}</p>
          <p className="text-sm text-muted">
            @{user.username} · {user.role === "ADMIN" ? "Admin" : "Membro"}
            {user.mustChangeCredentials ? " · troca pendente" : ""}
            {!user.active ? " · desativado" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.id !== selfId ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void toggle()}>
              {user.active ? "Desativar" : "Reativar"}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void reset()}>
            Nova senha provisória
          </Button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs text-muted">{message}</p> : null}
    </li>
  );
}

export function UsersAdmin({ users, selfId }: { users: UserDTO[]; selfId: string }) {
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  function takeInvite(state: UserActionState) {
    if (state.invite) {
      setCredentials({
        username: state.invite.provisionalUsername,
        password: state.invite.provisionalPassword,
      });
    }
  }

  return (
    <div className="space-y-8">
      {credentials ? (
        <CredentialsBox
          username={credentials.username}
          password={credentials.password}
          onDismiss={() => setCredentials(null)}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Convidar amigo</h2>
        <p className="text-sm text-muted">
          Gera usuário e senha provisórios. Envie os dois; no primeiro acesso ele escolhe os definitivos.
        </p>
        <InviteForm onInvite={takeInvite} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Contas</h2>
        <ul className="space-y-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} selfId={selfId} onReset={takeInvite} />
          ))}
        </ul>
      </section>
    </div>
  );
}
