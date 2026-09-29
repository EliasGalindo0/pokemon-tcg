import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseCardQuery } from "@/lib/card-query";
import { fail, ok, toResponse } from "@/lib/http";
import { parseCardPayload } from "@/lib/validators";
import { createCard, listCards } from "@/services/cards";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return toResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const query = parseCardQuery({
    q: searchParams.get("q") ?? undefined,
    setId: searchParams.get("setId") ?? undefined,
    rarity: searchParams.get("rarity") ?? undefined,
    condition: searchParams.get("condition") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  try {
    return ok(await listCards(user.id, query));
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return toResponse(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const parsed = parseCardPayload(body);
  if (!parsed.success) {
    return fail("Dados inválidos.", 422, { fieldErrors: parsed.fieldErrors });
  }

  try {
    const card = await createCard(user.id, parsed.data);
    revalidatePath("/", "layout");
    return ok(card, 201);
  } catch (error) {
    return toResponse(error);
  }
}
