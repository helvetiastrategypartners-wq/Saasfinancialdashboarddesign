import { FormEvent, useMemo, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../../components/ui/GlassCard";
import { getPasswordIssues } from "../passwordRules";
import type { AdminAccount } from "../types";
import { inputClass } from "./shared";
import { PasswordRulePills } from "./PasswordRulePills";

interface ResetPasswordDialogProps {
  account: AdminAccount;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<boolean>;
}

export function ResetPasswordDialog({ account, busy, onCancel, onSubmit }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordIssues.length > 0) {
      toast.error(`Mot de passe incomplet : ${passwordIssues.join(", ")}.`);
      return;
    }

    const updated = await onSubmit(password);
    if (updated) {
      setPassword("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <GlassCard className="w-full max-w-lg space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Nouveau mot de passe temporaire</h3>
          <p className="mt-1 text-sm text-muted-foreground break-all">{account.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Mot de passe temporaire</span>
            <input required type="text" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          <PasswordRulePills issues={passwordIssues} />
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
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-red/90 disabled:opacity-60"
            >
              <LockKeyhole className="h-4 w-4" />
              Mettre a jour
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

