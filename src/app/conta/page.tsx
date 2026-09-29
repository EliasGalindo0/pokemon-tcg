import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { CollectionVisibilityForm } from "@/components/auth/collection-visibility-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUserPage } from "@/lib/auth-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sua conta",
};

export default async function ContaPage() {
  const user = await requireUserPage("/conta");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader
        kicker="Acesso"
        title={user.mustChangeCredentials ? "Defina seu acesso" : "Sua conta"}
        description={
          user.mustChangeCredentials
            ? "Troque o usuário e a senha provisórios antes de usar o álbum."
            : "Altere usuário, nome, senha e a privacidade da coleção."
        }
      />
      {!user.mustChangeCredentials ? (
        <CollectionVisibilityForm collectionPublic={user.collectionPublic} />
      ) : null}
      <AccountForm
        username={user.username}
        displayName={user.displayName}
        mustChange={user.mustChangeCredentials}
      />
    </div>
  );
}
