import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrocaSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/trocas?tab=${encodeURIComponent(id)}`);
}
