"use client";

import { useActionState, useState } from "react";
import { CardBack } from "@/components/cards/card-back";
import { CatalogSearch } from "@/components/cards/catalog-search";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type { ActionState } from "@/actions/cards";
import { moneyToInput } from "@/lib/format";
import {
  CONDITION_LABEL,
  CONDITIONS,
  LANGUAGE_LABEL,
  LANGUAGES,
  RARITY_LABEL,
  RARITY_RANK,
  optionsFrom,
} from "@/lib/labels";
import type { CatalogHit } from "@/types/catalog";
import type { CardDTO, SetDTO } from "@/types/card";

const rarityOptions = optionsFrom(RARITY_LABEL, RARITY_RANK);

type FormState = {
  name: string;
  setId: string;
  newSetName: string;
  newSetCode: string;
  cardNumber: string;
  rarity: string;
  condition: string;
  language: string;
  marketValue: string;
  purchasePrice: string;
  quantity: string;
  imageUrl: string;
};

function initialState(card?: CardDTO): FormState {
  return {
    name: card?.name ?? "",
    setId: card?.set.id ?? "",
    newSetName: "",
    newSetCode: "",
    cardNumber: card?.cardNumber ?? "",
    rarity: card?.rarity ?? "RARE",
    condition: card?.condition ?? "NEAR_MINT",
    language: card?.language ?? "PT_BR",
    marketValue: card ? moneyToInput(card.marketValue) : "",
    purchasePrice: card?.purchasePrice ? moneyToInput(card.purchasePrice) : "",
    quantity: String(card?.quantity ?? 1),
    imageUrl: card?.imageUrl ?? "",
  };
}

export function CardForm({
  action,
  sets,
  card,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  sets: SetDTO[];
  card?: CardDTO;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const [form, setForm] = useState<FormState>(() => initialState(card));
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [priceNote, setPriceNote] = useState<string | null>(null);

  function applyCatalog(hit: CatalogHit) {
    const existing = sets.find(
      (set) => set.name.localeCompare(hit.setName, "pt-BR", { sensitivity: "accent" }) === 0,
    );
    setFilePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setPriceNote(
      hit.marketValue && hit.sourceAmount && hit.sourceCurrency
        ? `Convertido de ${hit.sourceCurrency === "USD" ? "US$" : "€"} ${hit.sourceAmount.replace(".", ",")} para reais, pela cotação do dia.`
        : null,
    );
    setForm((current) => ({
      ...current,
      name: hit.name,
      setId: existing?.id ?? "",
      newSetName: existing ? "" : hit.setName,
      newSetCode: existing ? "" : hit.setCode,
      cardNumber: hit.cardNumber,
      rarity: hit.rarity,
      language: hit.language,
      imageUrl: hit.imageUrl ?? "",
      marketValue: hit.marketValue ? moneyToInput(hit.marketValue) : current.marketValue,
    }));
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const previewSrc =
    filePreview ||
    (form.imageUrl.startsWith("http") || form.imageUrl.startsWith("/uploads/") ? form.imageUrl : "");
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <CatalogSearch language={form.language} onPick={applyCatalog} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        {state.message ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-ember sm:col-span-2" role="alert">
            {state.message}
          </p>
        ) : null}

        <Field label="Nome" name="name" error={errors.name}>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
            className={controlClass}
          />
        </Field>
        <Field label="Número" name="cardNumber" error={errors.cardNumber} hint="Ex.: 4/102">
          <input
            id="cardNumber"
            name="cardNumber"
            value={form.cardNumber}
            onChange={(event) => update("cardNumber", event.target.value)}
            className={controlClass}
          />
        </Field>

        <Field label="Coleção" name="setId" error={errors.setId}>
          <select
            id="setId"
            name="setId"
            value={form.setId}
            onChange={(event) => update("setId", event.target.value)}
            className={controlClass}
          >
            <option value="">Selecione</option>
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.code ? `${set.name} (${set.code})` : set.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ou nova coleção" name="newSetName" error={errors.newSetName}>
          <input
            id="newSetName"
            name="newSetName"
            value={form.newSetName}
            onChange={(event) => update("newSetName", event.target.value)}
            placeholder="Scarlet & Violet"
            className={controlClass}
          />
        </Field>
        <Field label="Código da coleção" name="newSetCode" error={errors.newSetCode} hint="Opcional, só ao criar uma coleção nova.">
          <input
            id="newSetCode"
            name="newSetCode"
            value={form.newSetCode}
            onChange={(event) => update("newSetCode", event.target.value)}
            placeholder="SVI"
            className={controlClass}
          />
        </Field>
        <Field label="Quantidade" name="quantity" error={errors.quantity}>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={999}
            value={form.quantity}
            onChange={(event) => update("quantity", event.target.value)}
            required
            className={controlClass}
          />
        </Field>

        <Field label="Raridade" name="rarity" error={errors.rarity}>
          <select
            id="rarity"
            name="rarity"
            value={form.rarity}
            onChange={(event) => update("rarity", event.target.value)}
            className={controlClass}
          >
            {rarityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Condição" name="condition" error={errors.condition}>
          <select
            id="condition"
            name="condition"
            value={form.condition}
            onChange={(event) => update("condition", event.target.value)}
            className={controlClass}
          >
            {CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Idioma" name="language" error={errors.language}>
          <select
            id="language"
            name="language"
            value={form.language}
            onChange={(event) => update("language", event.target.value)}
            className={controlClass}
          >
            {LANGUAGES.map((value) => (
              <option key={value} value={value}>
                {LANGUAGE_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor de mercado (R$)" name="marketValue" error={errors.marketValue} hint={priceNote ?? undefined}>
          <input
            id="marketValue"
            name="marketValue"
            inputMode="decimal"
            value={form.marketValue}
            onChange={(event) => update("marketValue", event.target.value)}
            placeholder="0,00"
            required
            className={controlClass}
          />
        </Field>
        <Field label="Preço pago (R$)" name="purchasePrice" error={errors.purchasePrice} hint="Deixe em branco se não souber.">
          <input
            id="purchasePrice"
            name="purchasePrice"
            inputMode="decimal"
            value={form.purchasePrice}
            onChange={(event) => update("purchasePrice", event.target.value)}
            placeholder="0,00"
            className={controlClass}
          />
        </Field>
        <Field label="URL da imagem" name="imageUrl" error={errors.imageUrl} hint="Ou envie um arquivo abaixo. O arquivo tem prioridade.">
          <input
            id="imageUrl"
            name="imageUrl"
            value={form.imageUrl}
            onChange={(event) => update("imageUrl", event.target.value)}
            placeholder="https://"
            className={controlClass}
          />
        </Field>
        <Field label="Arquivo" name="imageFile">
          <input
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={`${controlClass} file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-3 file:py-1 file:text-xs file:text-paper`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFilePreview((current) => {
                if (current) URL.revokeObjectURL(current);
                return file ? URL.createObjectURL(file) : null;
              });
            }}
          />
        </Field>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : submitLabel}
          </Button>
        </div>
      </form>

      <aside className="order-first lg:order-none">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Prévia</p>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_16px_40px_-28px_rgba(28,25,23,0.7)]">
          <div className="aspect-[5/7] bg-navy">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <CardBack />
            )}
          </div>
          <div className="p-3">
            <p className="font-display text-lg leading-tight">{form.name || "Nome da carta"}</p>
            <p className="text-sm text-muted">{form.marketValue ? `R$ ${form.marketValue}` : "Sem valor"}</p>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
