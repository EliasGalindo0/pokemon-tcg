import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, toResponse } from "@/lib/http";
import { getDeck, setDeckCardQuantity } from "@/services/decks";

type Context = { params: Promise<{ id: string }> };

const entrySchema = z.object({
  cardId: z.string().trim().min(1, "Informe a carta."),
  quantity: z.number().int().min(0).max(60),
});

export async function PUT(request: Request, context: Context) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    return toResponse(error);
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) return fail("Dados inválidos.", 422);

  try {
    await setDeckCardQuantity(user.id, id, parsed.data.cardId, parsed.data.quantity);
    revalidatePath("/", "layout");
    const deck = await getDeck(user.id, id);
    return ok(deck);
  } catch (error) {
    return toResponse(error);
  }
}
