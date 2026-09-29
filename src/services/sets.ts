import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { bumpCacheVersion, cacheGet, cacheSet, getCacheVersion } from "@/lib/redis";
import type { SetDTO } from "@/types/card";

function toSet(set: {
  id: string;
  name: string;
  code: string | null;
  isPublic?: boolean;
  _count?: { cards: number };
}): SetDTO {
  return {
    id: set.id,
    name: set.name,
    code: set.code,
    isPublic: set.isPublic,
    cardCount: set._count?.cards,
  };
}

export async function listSets(userId: string, options?: { publicOnly?: boolean }) {
  const version = await getCacheVersion();
  const key = `v${version}:u:${userId}:sets:v2:${options?.publicOnly ? "pub" : "all"}`;
  const cached = await cacheGet<SetDTO[]>(key);
  if (cached) return cached;

  const sets = await prisma.set.findMany({
    where: { userId, ...(options?.publicOnly ? { isPublic: true } : {}) },
    orderBy: { name: "asc" },
    include: { _count: { select: { cards: true } } },
  });
  const result = sets.map(toSet);
  await cacheSet(key, result, 60);
  return result;
}

export async function setSetPublic(userId: string, setId: string, isPublic: boolean) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) throw new AppError("Coleção não encontrada.", 404);

  const updated = await prisma.set.update({
    where: { id: setId },
    data: { isPublic },
    include: { _count: { select: { cards: true } } },
  });
  await bumpCacheVersion();
  return toSet(updated);
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
        data: { userId, name, code: input.newSetCode?.trim() || null, isPublic: false },
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
