import { Ban, Building2, LockKeyhole, RefreshCw, Trash2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import type { AdminAccount, ConfirmationAction } from "../types";
import { formatDate } from "./shared";

interface AccountsTableProps {
  accounts: AdminAccount[];
  accountsLoading: boolean;
  actionUserId: string | null;
  currentUserId?: string;
  onRefresh: () => void;
  onResetPassword: (account: AdminAccount) => void;
  onConfirmAction: (action: ConfirmationAction, account: AdminAccount) => void;
}

export function AccountsTable({
  accounts,
  accountsLoading,
  actionUserId,
  currentUserId,
  onRefresh,
  onResetPassword,
  onConfirmAction,
}: AccountsTableProps) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/8 text-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Comptes entreprises</h2>
            <p className="text-sm text-muted-foreground">{accounts.length} compte{accounts.length > 1 ? "s" : ""} visible{accounts.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={accountsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-glass-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${accountsLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Compte</th>
              <th className="px-4 py-3 font-medium">Entreprise</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Derniere connexion</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const isSelf = account.id === currentUserId;
              const isBusy = actionUserId === account.id;
              return (
                <tr key={account.id} className="border-t border-glass-border/70">
                  <td className="px-6 py-4 align-top">
                    <p className="font-medium text-foreground">{account.fullName || "Sans nom"}</p>
                    <p className="mt-1 text-muted-foreground break-all">{account.email}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{account.id}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-foreground">{account.companyName ?? "Aucune entreprise"}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{account.companyId ?? "-"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs ${account.isBlocked ? "bg-red-500/12 text-red-400" : "bg-emerald-500/12 text-emerald-400"}`}>
                        {account.isBlocked ? "Bloque" : "Actif"}
                      </span>
                      {account.mustChangePassword && (
                        <span className="rounded-md bg-amber-500/12 px-2 py-1 text-xs text-amber-300">
                          MDP a changer
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded-md bg-accent-blue/12 px-2 py-1 text-xs text-accent-blue">
                          Vous
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    {formatDate(account.lastSignInAt)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onResetPassword(account)}
                        disabled={isBusy}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                        aria-label="Changer le mot de passe"
                        title="Changer le mot de passe"
                      >
                        <LockKeyhole className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirmAction(account.isBlocked ? "unblock" : "block", account)}
                        disabled={isSelf || isBusy}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                        aria-label={account.isBlocked ? "Debloquer le compte" : "Bloquer le compte"}
                        title={account.isBlocked ? "Debloquer" : "Bloquer"}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirmAction("delete", account)}
                        disabled={isSelf || isBusy}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-red-500/30 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        aria-label="Supprimer le compte"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!accountsLoading && accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  Aucun compte trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

