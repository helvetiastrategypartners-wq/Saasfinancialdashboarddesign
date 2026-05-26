import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../../components/ui/GlassCard";
import type { CreatedAccount } from "../types";

interface CreatedCredentialsCardProps {
  created: CreatedAccount;
}

export function CreatedCredentialsCard({ created }: CreatedCredentialsCardProps) {
  return (
    <GlassCard className="space-y-4 border-emerald-500/30">
      <div className="flex items-center gap-3 text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
        <h3 className="font-semibold">Identifiants a communiquer</h3>
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Identifiant</p>
          <p className="font-mono text-foreground break-all">{created.email}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-3">
          <p className="text-muted-foreground">Mot de passe temporaire</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-foreground break-all">{created.temporaryPassword}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(created.temporaryPassword);
                toast.success("Mot de passe copie.");
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-glass-border text-muted-foreground transition hover:text-foreground"
              aria-label="Copier le mot de passe temporaire"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

