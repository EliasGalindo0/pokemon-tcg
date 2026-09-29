import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, ok, toResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion } from "@/lib/redis";
import { listSets } from "@/services/sets";

const setSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coleção.").max(80),
  code: z.string().trim().max(16).optional().or(z.literal("")),
});

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return toResponse(error);
  }

  try {
    return ok(await listSets(user.id));
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

  const parsed = setSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.", 422);

  try {
    const existing = await prisma.set.findFirst({
      where: { userId: user.id, name: { equals: parsed.data.name, mode: "insensitive" } },
    });
    if (existing) return fail("Já existe uma coleção com esse nome.", 409);

    const set = await prisma.set.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        code: parsed.data.code?.trim() || null,
      },
    });
    await bumpCacheVersion();
    revalidatePath("/", "layout");
    return ok({ id: set.id, name: set.name, code: set.code }, 201);
  } catch (error) {
    return toResponse(error);
  }
}
