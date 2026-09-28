"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-ember transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Excluindo…" : label}
    </button>
  );
}

export function DeleteCardButton({
  action,
  label = "Excluir",
  confirm = "Remover esta carta da coleção?",
}: {
  action: () => Promise<void>;
  label?: string;
  confirm?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      <SubmitButton label={label} />
    </form>
  );
}
