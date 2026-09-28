import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, toResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion } from "@/lib/redis";
import { listSets } from "@/services/sets";

const setSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coleção.").max(80),
  code: z.string().trim().max(16).optional().or(z.literal("")),
});

export async function GET() {
  try {
    return ok(await listSets());
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

  const parsed = setSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.", 422);

  try {
    const existing = await prisma.set.findFirst({
      where: { name: { equals: parsed.data.name, mode: "insensitive" } },
    });
    if (existing) return fail("Já existe uma coleção com esse nome.", 409);

    const set = await prisma.set.create({
      data: {
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
