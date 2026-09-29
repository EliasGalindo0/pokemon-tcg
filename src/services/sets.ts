import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import type { SetDTO } from "@/types/card";

function toSet(set: { id: string; name: string; code: string | null }): SetDTO {
  return { id: set.id, name: set.name, code: set.code };
}

export async function listSets(userId: string) {
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:sets`;
  const cached = await cacheGet<SetDTO[]>(key);
  if (cached) return cached;

  const sets = await prisma.set.findMany({ where: { userId }, orderBy: { name: "asc" } });
  const result = sets.map(toSet);
  await cacheSet(key, result, 60);
  return result;
}

export async function resolveSet(
  userId: string,
  input: { setId?: string; newSetName?: string; newSetCode?: string },
) {
  const name = input.newSetName?.trim();
  if (name) {
    const existing = await prisma.set.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;

    try {
      return await prisma.set.create({
        data: { userId, name, code: input.newSetCode?.trim() || null },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await prisma.set.findFirst({
          where: { userId, name: { equals: name, mode: "insensitive" } },
        });
        if (raced) return raced;
      }
      throw error;
    }
  }

  if (!input.setId) throw new AppError("Escolha uma coleção ou informe uma nova.");

  const set = await prisma.set.findFirst({ where: { id: input.setId, userId } });
  if (!set) throw new AppError("Coleção não encontrada.", 404);
  return set;
}
