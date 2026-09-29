import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, toResponse } from "@/lib/http";
import { parseDeckPayload } from "@/lib/validators";
import { createDeck, listDecks } from "@/services/decks";

export async function GET() {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    return toResponse(error);
  }

  try {
    return ok(await listDecks(user.id));
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    return toResponse(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const parsed = parseDeckPayload(body);
  if (!parsed.success) return fail("Dados inválidos.", 422, { fieldErrors: parsed.fieldErrors });

  try {
    const deck = await createDeck(user.id, parsed.data);
    revalidatePath("/", "layout");
    return ok(deck, 201);
  } catch (error) {
    return toResponse(error);
  }
}
