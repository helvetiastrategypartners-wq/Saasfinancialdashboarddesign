import { FormEvent, useState } from "react";
import { Ban, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../../components/ui/GlassCard";
import type { ConfirmationState } from "../types";
import { inputClass } from "./shared";

interface ConfirmAccountActionDialogProps {
  confirmation: ConfirmationState;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmAccountActionDialog({ confirmation, onCancel, onConfirm }: ConfirmAccountActionDialogProps) {
  const [email, setEmail] = useState("");
  const isValid = email.trim().toLowerCase() === confirmation.account.email.toLowerCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) {
      toast.error("Adresse mail differente, action annulee.");
      return;
    }

    await onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <GlassCard className="w-full max-w-lg space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {confirmation.action === "delete" && "Supprimer ce compte"}
            {confirmation.action === "block" && "Bloquer ce compte"}
            {confirmation.action === "unblock" && "Debloquer ce compte"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pour confirmer, copiez l'adresse mail du compte dans le champ ci-dessous.
          </p>
        </div>

        <div className="rounded-lg border border-glass-border bg-white/5 p-4 text-sm">
          <p className="text-muted-foreground">Compte concerne</p>
          <p className="mt-1 font-medium text-foreground">{confirmation.account.fullName || "Sans nom"}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-mono text-foreground break-all">{confirmation.account.email}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(confirmation.account.email);
                setEmail(confirmation.account.email);
                toast.success("Adresse mail copiee.");
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-glass-border text-muted-foreground transition hover:text-foreground"
              aria-label="Copier l'adresse mail"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {confirmation.action === "delete" && (
            <p className="mt-3 text-xs text-red-300">
              Le compte Auth sera supprime. L'entreprise et ses donnees restent en base.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Adresse mail a recopier</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder={confirmation.account.email}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-glass-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                confirmation.action === "delete" ? "bg-red-600 hover:bg-red-500" : "bg-accent-red hover:bg-accent-red/90"
              }`}
            >
              {confirmation.action === "delete" ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              Confirmer
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

