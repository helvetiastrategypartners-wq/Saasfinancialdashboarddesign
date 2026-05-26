export const inputClass = "w-full rounded-lg border border-input bg-input-background px-3 py-3 text-sm outline-none transition focus:border-accent-red focus:ring-2 focus:ring-accent-red/20";

export function formatDate(value: string | null) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

