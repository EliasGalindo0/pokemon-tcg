import Link from "next/link";
import { controlClass } from "@/components/ui/field";
import { CONDITION_LABEL, CONDITIONS, RARITY_LABEL, RARITY_RANK, optionsFrom } from "@/lib/labels";
import type { SetDTO } from "@/types/card";

const rarityOptions = optionsFrom(RARITY_LABEL, RARITY_RANK);
const conditionOptions = CONDITIONS.map((value) => ({ value, label: CONDITION_LABEL[value] }));

export function CardFilters({
  sets,
  values,
}: {
  sets: SetDTO[];
  values: { q?: string; setId?: string; rarity?: string; condition?: string; sort?: string };
}) {
  return (
    <form action="/cards" className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-12">
      <label className="md:col-span-4">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Nome</span>
        <input
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder="Buscar por nome"
          className={controlClass}
        />
      </label>
      <label className="md:col-span-3">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Coleção</span>
        <select name="setId" defaultValue={values.setId ?? ""} className={controlClass}>
          <option value="">Todas</option>
          {sets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Raridade</span>
        <select name="rarity" defaultValue={values.rarity ?? ""} className={controlClass}>
          <option value="">Todas</option>
          {rarityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="md:col-span-1">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Condição</span>
        <select name="condition" defaultValue={values.condition ?? ""} className={controlClass}>
          <option value="">Todas</option>
          {conditionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Ordenar</span>
        <select name="sort" defaultValue={values.sort ?? "recent"} className={controlClass}>
          <option value="recent">Mais recentes</option>
          <option value="name">Nome A–Z</option>
          <option value="number">Número 0–9</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-12">
        <button type="submit" className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-paper">
          Filtrar
        </button>
        <Link href="/cards" className="text-sm text-muted underline-offset-4 hover:underline">
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}
