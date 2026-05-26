import { FormEvent, useMemo, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { GlassCard } from "../../../components/ui/GlassCard";
import { getPasswordIssues } from "../passwordRules";
import type { CreateAccountInput } from "../types";
import { inputClass } from "./shared";
import { PasswordRulePills } from "./PasswordRulePills";

interface CreateAccountFormProps {
  loading: boolean;
  onCreate: (input: CreateAccountInput) => Promise<boolean>;
}

export function CreateAccountForm({ loading, onCreate }: CreateAccountFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("CHF");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailConfirm, setEmailConfirm] = useState(true);
  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordIssues.length > 0) {
      toast.error(`Mot de passe incomplet : ${passwordIssues.join(", ")}.`);
      return;
    }

    const created = await onCreate({
      companyName,
      currency,
      fullName,
      email,
      password,
      emailConfirm,
    });

    if (!created) return;

    setCompanyName("");
    setFullName("");
    setEmail("");
    setPassword("");
    setEmailConfirm(true);
  }

  return (
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
          <div className="mt-2">
            <PasswordRulePills issues={passwordIssues} />
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
  );
}

