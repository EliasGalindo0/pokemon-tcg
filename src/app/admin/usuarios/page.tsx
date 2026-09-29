import type { Metadata } from "next";
import { UsersAdmin } from "@/components/auth/users-admin";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdminPage } from "@/lib/auth-page";
import { listUsers } from "@/services/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usuários",
};

export default async function AdminUsersPage() {
  const admin = await requireAdminPage("/admin/usuarios");
  const users = await listUsers();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        kicker="Administração"
        title="Usuários"
        description="Convide amigos com acesso provisório. Cada um troca usuário e senha no primeiro login."
      />
      <UsersAdmin users={users} selfId={admin.id} />
    </div>
  );
}
