import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { fail, ok, toResponse } from "@/lib/http";
import { parseCardPayload } from "@/lib/validators";
import { deleteCard, getCard, updateCard } from "@/services/cards";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return toResponse(error);
  }

  const { id } = await context.params;
  const card = await getCard(user.id, id);
  if (!card) return fail("Carta não encontrada.", 404);
  return ok(card);
}

export async function PATCH(request: Request, context: Context) {
  let user;
  try {
    user = await requireUser();
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

  const parsed = parseCardPayload(body);
  if (!parsed.success) {
    return fail("Dados inválidos.", 422, { fieldErrors: parsed.fieldErrors });
  }

  try {
    const card = await updateCard(user.id, id, parsed.data);
    revalidatePath("/", "layout");
    return ok(card);
  } catch (error) {
    return toResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return toResponse(error);
  }

  const { id } = await context.params;
  try {
    await deleteCard(user.id, id);
    revalidatePath("/", "layout");
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.status);
    return toResponse(error);
  }
}
