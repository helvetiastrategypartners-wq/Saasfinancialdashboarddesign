import { KeyRound } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";

interface SessionCardProps {
  email?: string;
}

export function SessionCard({ email }: SessionCardProps) {
  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-3">
        <KeyRound className="h-5 w-5 text-accent-red" />
        <h3 className="font-semibold text-foreground">Session SA</h3>
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">Connecte avec</p>
        <p className="font-medium text-foreground break-all">{email}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Le serveur verifie cet email avec `SUPER_ADMIN_EMAILS` avant d'utiliser la cle service role.
      </p>
    </GlassCard>
  );
}

