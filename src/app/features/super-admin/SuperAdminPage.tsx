import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../contexts/AuthContext";

const inputClass = "w-full rounded-lg border border-input bg-input-background px-3 py-3 text-sm outline-none transition focus:border-accent-red focus:ring-2 focus:ring-accent-red/20";

interface AdminAccount {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  isBlocked: boolean;
  fullName: string;
  companyId: string | null;
  companyName: string | null;
  currency: string | null;
  mustChangePassword: boolean;
}

function getPasswordIssues(password: string) {
  const issues = [];
  if (password.length < 12) issues.push("12 caracteres minimum");
  if (!/[a-z]/.test(password)) issues.push("une minuscule");
  if (!/[A-Z]/.test(password)) issues.push("une majuscule");
  if (!/\d/.test(password)) issues.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("un caractere special");
  return issues;
}

function formatDate(value: string | null) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SuperAdmin() {
  const { session, user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("CHF");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailConfirm, setEmailConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [resetAccount, setResetAccount] = useState<AdminAccount | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmation, setConfirmation] = useState<{ action: "block" | "unblock" | "delete"; account: AdminAccount } | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [created, setCreated] = useState<{ companyId: string; userId: string; email: string; temporaryPassword: string } | null>(null);
  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const resetPasswordIssues = useMemo(() => getPasswordIssues(resetPassword), [resetPassword]);
  const apiUrl = import.meta.env.VITE_ADMIN_API_URL?.trim() || "http://127.0.0.1:3001";

  async function adminFetch(path: string, init: RequestInit = {}) {
    if (!session?.access_token) {
      throw new Error("Session super-admin introuvable.");
    }

    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (response.status === 204) {
      return null;
    }

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Action impossible.");
    }
    return payload;
  }

  async function loadAccounts() {
    if (!session?.access_token) return;
    setAccountsLoading(true);
    try {
      const payload = await adminFetch("/api/admin/accounts");
      setAccounts(payload.accounts ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, [session?.access_token]);

  function replaceAccount(account: AdminAccount) {
    setAccounts((current) => current.map((item) => (item.id === account.id ? account : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreated(null);

    if (passwordIssues.length > 0) {
      toast.error(`Mot de passe incomplet : ${passwordIssues.join(", ")}.`);
      return;
    }

    setLoading(true);

    try {
      const payload = await adminFetch("/api/admin/accounts", {
        method: "POST",
        body: JSON.stringify({
          companyName,
          currency,
          fullName,
          email,
          password,
          emailConfirm,
        }),
      });

      setCreated({
        companyId: payload.company.id,
        userId: payload.user.id,
        email: payload.user.email,
        temporaryPassword: password,
      });
      setCompanyName("");
      setFullName("");
      setEmail("");
      setPassword("");
      setEmailConfirm(true);
      toast.success("Compte entreprise cree.");
      await loadAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Creation impossible.");
    } finally {
      setLoading(false);
    }
  }

  function openConfirmation(action: "block" | "unblock" | "delete", account: AdminAccount) {
    setConfirmation({ action, account });
    setConfirmationEmail("");
  }

  function closeConfirmation() {
    setConfirmation(null);
    setConfirmationEmail("");
  }

  async function toggleBlock(account: AdminAccount) {
    setActionUserId(account.id);
    try {
      const payload = await adminFetch(`/api/admin/accounts/${account.id}/block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked: !account.isBlocked }),
      });
      replaceAccount(payload.account);
      toast.success(account.isBlocked ? "Compte debloque." : "Compte bloque.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Modification impossible.");
    } finally {
      setActionUserId(null);
    }
  }

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetAccount) return;

    if (resetPasswordIssues.length > 0) {
      toast.error(`Mot de passe incomplet : ${resetPasswordIssues.join(", ")}.`);
      return;
    }

    setActionUserId(resetAccount.id);
    try {
      const payload = await adminFetch(`/api/admin/accounts/${resetAccount.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetPassword }),
      });
      replaceAccount(payload.account);
      toast.success("Mot de passe temporaire mis a jour.");
      setCreated({
        companyId: payload.account.companyId ?? "",
        userId: payload.account.id,
        email: payload.account.email,
        temporaryPassword: resetPassword,
      });
      setResetAccount(null);
      setResetPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset impossible.");
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteAccount(account: AdminAccount) {
    setActionUserId(account.id);
    try {
      await adminFetch(`/api/admin/accounts/${account.id}`, { method: "DELETE" });
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      toast.success("Compte supprime.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setActionUserId(null);
    }
  }

  async function submitConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmation) return;

    if (confirmationEmail.trim().toLowerCase() !== confirmation.account.email.toLowerCase()) {
      toast.error("Adresse mail differente, action annulee.");
      return;
    }

    const { action, account } = confirmation;
    closeConfirmation();

    if (action === "delete") {
      await deleteAccount(account);
      return;
    }

    await toggleBlock(account);
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Super Admin" subtitle="Creer, consulter et gerer les comptes entreprises" />

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.35fr] gap-6">
        <div className="space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="border-b border-glass-border px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-red text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Nouveau client</h2>
                  <p className="text-sm text-muted-foreground">Entreprise, compte et mot de passe temporaire.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-[1fr_120px] gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Entreprise</span>
                  <input required value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={inputClass} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Devise</span>
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={inputClass}>
                    <option>CHF</option>
                    <option>EUR</option>
                    <option>USD</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Nom complet</span>
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Email de connexion</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Mot de passe temporaire a communiquer</span>
                <input required type="text" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
              </label>

              <div className="rounded-lg border border-glass-border bg-white/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Regles mot de passe</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["12 caracteres minimum", "une minuscule", "une majuscule", "un chiffre", "un caractere special"].map((rule) => {
                    const valid = !passwordIssues.includes(rule);
                    return (
                      <span key={rule} className={`rounded-md px-2 py-1 text-xs ${valid ? "bg-emerald-500/12 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                        {rule}
                      </span>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-glass-border bg-white/5 px-4 py-3">
                <input type="checkbox" checked={emailConfirm} onChange={(event) => setEmailConfirm(event.target.checked)} />
                <span className="text-sm text-muted-foreground">Marquer l'email comme confirme pour eviter le passage par la boite mail</span>
              </label>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-red px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-accent-red/90 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? "Creation..." : "Creer l'entreprise et le compte"}
              </motion.button>
            </form>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-accent-red" />
              <h3 className="font-semibold text-foreground">Session SA</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Connecte avec</p>
              <p className="font-medium text-foreground break-all">{user?.email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Le serveur verifie cet email avec `SUPER_ADMIN_EMAILS` avant d'utiliser la cle service role.
            </p>
          </GlassCard>
        </div>

        <div className="space-y-6">
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
                onClick={() => void loadAccounts()}
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
                    const isSelf = account.id === user?.id;
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
                              onClick={() => setResetAccount(account)}
                              disabled={isBusy}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                              aria-label="Changer le mot de passe"
                              title="Changer le mot de passe"
                            >
                              <LockKeyhole className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openConfirmation(account.isBlocked ? "unblock" : "block", account)}
                              disabled={isSelf || isBusy}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                              aria-label={account.isBlocked ? "Debloquer le compte" : "Bloquer le compte"}
                              title={account.isBlocked ? "Debloquer" : "Bloquer"}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openConfirmation("delete", account)}
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

          {created && (
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
          )}
        </div>
      </div>

      {resetAccount && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <GlassCard className="w-full max-w-lg space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nouveau mot de passe temporaire</h3>
              <p className="mt-1 text-sm text-muted-foreground break-all">{resetAccount.email}</p>
            </div>
            <form onSubmit={submitResetPassword} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Mot de passe temporaire</span>
                <input required type="text" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className={inputClass} />
              </label>
              <div className="flex flex-wrap gap-2">
                {["12 caracteres minimum", "une minuscule", "une majuscule", "un chiffre", "un caractere special"].map((rule) => {
                  const valid = !resetPasswordIssues.includes(rule);
                  return (
                    <span key={rule} className={`rounded-md px-2 py-1 text-xs ${valid ? "bg-emerald-500/12 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                      {rule}
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResetAccount(null);
                    setResetPassword("");
                  }}
                  className="rounded-lg border border-glass-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionUserId === resetAccount.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-red/90 disabled:opacity-60"
                >
                  <LockKeyhole className="h-4 w-4" />
                  Mettre a jour
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {confirmation && (
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
                    setConfirmationEmail(confirmation.account.email);
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

            <form onSubmit={submitConfirmation} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Adresse mail a recopier</span>
                <input
                  required
                  type="email"
                  value={confirmationEmail}
                  onChange={(event) => setConfirmationEmail(event.target.value)}
                  className={inputClass}
                  placeholder={confirmation.account.email}
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="rounded-lg border border-glass-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={confirmationEmail.trim().toLowerCase() !== confirmation.account.email.toLowerCase()}
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
      )}
    </div>
  );
}
