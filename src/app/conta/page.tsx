import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { SetsVisibilityForm } from "@/components/auth/sets-visibility-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUserPage } from "@/lib/auth-page";
import { listSets } from "@/services/sets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sua conta",
};

export default async function ContaPage() {
  const user = await requireUserPage("/conta");
  const sets = user.mustChangeCredentials ? [] : await listSets(user.id);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader
        kicker="Acesso"
        title={user.mustChangeCredentials ? "Defina seu acesso" : "Sua conta"}
        description={
          user.mustChangeCredentials
            ? "Troque o usuário e a senha provisórios antes de usar o álbum."
            : "Altere usuário, senha e a privacidade de cada coleção."
        }
      />
      {!user.mustChangeCredentials ? <SetsVisibilityForm sets={sets} /> : null}
      <AccountForm
        username={user.username}
        displayName={user.displayName}
        mustChange={user.mustChangeCredentials}
      />
    </div>
  );
}
