import { revalidatePath } from "next/cache";
import { fail, ok, toResponse } from "@/lib/http";
import { parseDeckPayload } from "@/lib/validators";
import { deleteDeck, getDeck, updateDeck } from "@/services/decks";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const deck = await getDeck(id);
  if (!deck) return fail("Deck não encontrado.", 404);
  return ok(deck);
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const parsed = parseDeckPayload(body);
  if (!parsed.success) return fail("Dados inválidos.", 422, { fieldErrors: parsed.fieldErrors });

  try {
    const deck = await updateDeck(id, parsed.data);
    revalidatePath("/", "layout");
    return ok(deck);
  } catch (error) {
    return toResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    await deleteDeck(id);
    revalidatePath("/", "layout");
    return new Response(null, { status: 204 });
  } catch (error) {
    return toResponse(error);
  }
}
