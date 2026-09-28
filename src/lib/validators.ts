import { z } from "zod";
import { CONDITIONS, DECK_FORMATS, LANGUAGES, RARITIES } from "@/lib/labels";
import type { CardPayload } from "@/types/card";
import type { DeckPayload } from "@/types/deck";

function readMoney(value: unknown, empty: "null" | "missing") {
  if (value === undefined || value === null) return empty === "null" ? null : undefined;
  const raw = String(value).trim().replace(",", ".");
  if (!raw) return empty === "null" ? null : undefined;
  return Number(raw);
}

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length ? trimmed : undefined;
    })
    .refine((value) => value === undefined || value.length <= max, "Texto longo demais.");

export const cardPayloadSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome.").max(120, "Nome muito longo."),
    setId: optionalText(40),
    newSetName: optionalText(80),
    newSetCode: optionalText(16),
    cardNumber: optionalText(20),
    rarity: z.enum(RARITIES, { message: "Raridade inválida." }),
    condition: z.enum(CONDITIONS, { message: "Condição inválida." }),
    language: z.enum(LANGUAGES, { message: "Idioma inválido." }),
    marketValue: z.preprocess(
      (value) => readMoney(value, "missing"),
      z
        .number({
          invalid_type_error: "Informe o valor de mercado.",
          required_error: "Informe o valor de mercado.",
        })
        .min(0, "Valor não pode ser negativo.")
        .max(1_000_000, "Valor alto demais."),
    ),
    purchasePrice: z.preprocess(
      (value) => readMoney(value, "null"),
      z
        .number({ invalid_type_error: "Preço pago inválido." })
        .min(0, "Preço não pode ser negativo.")
        .max(1_000_000, "Preço alto demais.")
        .nullable(),
    ),
    quantity: z.preprocess(
      (value) => {
        if (typeof value === "number") return value;
        const raw = String(value ?? "").trim();
        if (!raw) return undefined;
        return Number(raw);
      },
      z
        .number({
          invalid_type_error: "Informe a quantidade.",
          required_error: "Informe a quantidade.",
        })
        .int("Quantidade precisa ser inteira.")
        .min(1, "Mínimo de 1.")
        .max(999, "Máximo de 999."),
    ),
    imageUrl: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        const trimmed = value?.trim() ?? "";
        return trimmed.length ? trimmed : null;
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.setId && !data.newSetName) {
      ctx.addIssue({
        code: "custom",
        path: ["newSetName"],
        message: "Escolha uma coleção ou informe uma nova.",
      });
    }

    if (!data.imageUrl) return;
    const local = data.imageUrl.startsWith("/uploads/") && !data.imageUrl.includes("..");
    let remote = false;
    try {
      const parsed = new URL(data.imageUrl);
      remote = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      remote = false;
    }
    if (!local && !remote) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Use uma URL http(s) ou envie um arquivo.",
      });
    }
  });

export type ParseResult =
  | { success: true; data: CardPayload }
  | { success: false; fieldErrors: Record<string, string> };

export function parseCardPayload(input: unknown): ParseResult {
  const parsed = cardPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  return { success: true, data: parsed.data };
}

export const deckPayloadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do deck.").max(80, "Nome muito longo."),
  format: z.enum(DECK_FORMATS, { message: "Formato inválido." }),
});

export type DeckParseResult =
  | { success: true; data: DeckPayload }
  | { success: false; fieldErrors: Record<string, string> };

export function parseDeckPayload(input: unknown): DeckParseResult {
  const parsed = deckPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }
  return { success: true, data: parsed.data };
}
