import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaModels?: string };

const models = "user,card,deck,deckEntry,tradeSet,tradeEntry,tradeOffer";
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma && globalForPrisma.prismaModels !== models) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaModels = models;
}
