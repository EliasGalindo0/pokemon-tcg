import { revalidatePath } from "next/cache";
import { fail, ok, toResponse } from "@/lib/http";
import { parseDeckPayload } from "@/lib/validators";
import { createDeck, listDecks } from "@/services/decks";

export async function GET() {
  try {
    return ok(await listDecks());
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const parsed = parseDeckPayload(body);
  if (!parsed.success) return fail("Dados inválidos.", 422, { fieldErrors: parsed.fieldErrors });

  try {
    const deck = await createDeck(parsed.data);
    revalidatePath("/", "layout");
    return ok(deck, 201);
  } catch (error) {
    return toResponse(error);
  }
}
