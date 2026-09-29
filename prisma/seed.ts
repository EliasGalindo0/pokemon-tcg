import { PrismaClient, type Condition, type Language, type Rarity } from "@prisma/client";

const prisma = new PrismaClient();

const BOOTSTRAP_ADMIN_ID = "owner_bootstrap_admin";

const sets = [
  { name: "Base Set", code: "BS" },
  { name: "Fossil", code: "FO" },
  { name: "Scarlet & Violet", code: "SVI" },
  { name: "Paldean Fates", code: "PAF" },
];

type SeedCard = {
  name: string;
  set: string;
  cardNumber: string;
  rarity: Rarity;
  condition: Condition;
  language: Language;
  marketValue: string;
  purchasePrice: string | null;
  quantity: number;
};

const cards: SeedCard[] = [
  { name: "Charizard", set: "Base Set", cardNumber: "4/102", rarity: "RARE_HOLO", condition: "NEAR_MINT", language: "EN", marketValue: "2500.00", purchasePrice: "1800.00", quantity: 1 },
  { name: "Blastoise", set: "Base Set", cardNumber: "2/102", rarity: "RARE_HOLO", condition: "LIGHTLY_PLAYED", language: "EN", marketValue: "400.00", purchasePrice: "200.00", quantity: 1 },
  { name: "Pikachu", set: "Base Set", cardNumber: "58/102", rarity: "COMMON", condition: "MINT", language: "EN", marketValue: "15.00", purchasePrice: "10.00", quantity: 4 },
  { name: "Professor Oak", set: "Base Set", cardNumber: "88/102", rarity: "UNCOMMON", condition: "LIGHTLY_PLAYED", language: "EN", marketValue: "2.00", purchasePrice: "1.00", quantity: 1 },
  { name: "Zapdos", set: "Fossil", cardNumber: "15/62", rarity: "RARE_HOLO", condition: "NEAR_MINT", language: "EN", marketValue: "80.00", purchasePrice: "40.00", quantity: 1 },
  { name: "Muk", set: "Fossil", cardNumber: "13/62", rarity: "RARE", condition: "MODERATELY_PLAYED", language: "PT_BR", marketValue: "8.00", purchasePrice: "5.00", quantity: 2 },
  { name: "Gengar", set: "Fossil", cardNumber: "5/62", rarity: "RARE_HOLO", condition: "HEAVILY_PLAYED", language: "JA", marketValue: "30.00", purchasePrice: null, quantity: 1 },
  { name: "Miraidon", set: "Scarlet & Violet", cardNumber: "81/198", rarity: "RARE", condition: "MINT", language: "PT_BR", marketValue: "3.00", purchasePrice: "2.00", quantity: 3 },
  { name: "Koraidon", set: "Scarlet & Violet", cardNumber: "124/198", rarity: "ULTRA_RARE", condition: "NEAR_MINT", language: "EN", marketValue: "45.00", purchasePrice: "30.00", quantity: 1 },
  { name: "Iono", set: "Scarlet & Violet", cardNumber: "185/198", rarity: "SPECIAL_ILLUSTRATION_RARE", condition: "MINT", language: "EN", marketValue: "90.00", purchasePrice: "70.00", quantity: 1 },
  { name: "Gardevoir ex", set: "Scarlet & Violet", cardNumber: "86/198", rarity: "DOUBLE_RARE", condition: "NEAR_MINT", language: "PT_BR", marketValue: "12.00", purchasePrice: "9.00", quantity: 1 },
  { name: "Charizard ex", set: "Paldean Fates", cardNumber: "234/091", rarity: "SPECIAL_ILLUSTRATION_RARE", condition: "MINT", language: "EN", marketValue: "320.00", purchasePrice: "250.00", quantity: 1 },
  { name: "Mew ex", set: "Paldean Fates", cardNumber: "232/091", rarity: "HYPER_RARE", condition: "NEAR_MINT", language: "JA", marketValue: "40.00", purchasePrice: "25.00", quantity: 1 },
  { name: "Pikachu", set: "Paldean Fates", cardNumber: "18/091", rarity: "SHINY_RARE", condition: "MINT", language: "EN", marketValue: "20.00", purchasePrice: "15.00", quantity: 2 },
];

async function ensureOwner() {
  return prisma.user.upsert({
    where: { id: BOOTSTRAP_ADMIN_ID },
    update: {},
    create: {
      id: BOOTSTRAP_ADMIN_ID,
      username: "admin",
      displayName: "Administrador",
      passwordHash: "bootstrap",
      role: "ADMIN",
      active: true,
      mustChangeCredentials: true,
    },
  });
}

async function main() {
  const owner = await ensureOwner();
  const existing = await prisma.card.count({ where: { userId: owner.id } });
  if (existing > 0) {
    console.log("O banco já tem cartas. Seed ignorado.");
    return;
  }

  const setIds = new Map<string, string>();
  for (const set of sets) {
    const created = await prisma.set.create({
      data: {
        name: set.name,
        code: set.code,
        userId: owner.id,
      },
    });
    setIds.set(set.name, created.id);
  }

  const now = Date.now();
  await prisma.card.createMany({
    data: cards.map((card, index) => ({
      userId: owner.id,
      name: card.name,
      setId: setIds.get(card.set)!,
      cardNumber: card.cardNumber,
      rarity: card.rarity,
      condition: card.condition,
      language: card.language,
      marketValue: card.marketValue,
      purchasePrice: card.purchasePrice,
      quantity: card.quantity,
      createdAt: new Date(now - (cards.length - index) * 60_000),
    })),
  });

  console.log(`Seed concluído: ${sets.length} coleções e ${cards.length} cartas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
