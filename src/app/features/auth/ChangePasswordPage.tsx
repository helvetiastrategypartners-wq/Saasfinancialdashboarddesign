import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AnimatedBackground } from "../../components/AnimatedBackground";
import { useAuth } from "../../contexts/AuthContext";

const inputClass = "w-full rounded-lg border border-input bg-input-background pl-10 pr-11 py-3 text-sm outline-none transition focus:border-accent-red focus:ring-2 focus:ring-accent-red/20";

function getPasswordIssues(password: string) {
  const issues = [];
  if (password.length < 12) issues.push("12 caracteres minimum");
  if (!/[a-z]/.test(password)) issues.push("une minuscule");
  if (!/[A-Z]/.test(password)) issues.push("une majuscule");
  if (!/\d/.test(password)) issues.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("un caractere special");
  return issues;
}

export function ChangePassword() {
  const { user, loading, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordIssues.length > 0) {
      toast.error(`Mot de passe incomplet : ${passwordIssues.join(", ")}.`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!user) {
      toast.error("Session introuvable.");
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);

      toast.success("Mot de passe mis a jour.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise a jour impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <AnimatedBackground />
      <main className="relative z-10 min-h-screen grid place-items-center px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[460px] rounded-lg border border-glass-border bg-card/82 backdrop-blur-2xl shadow-2xl"
        >
          <div className="p-7 space-y-7">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-accent-red flex items-center justify-center shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
                <p className="text-sm text-muted-foreground">Remplacez le mot de passe temporaire.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Mot de passe</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-glass-hover hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Confirmer</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                  />
                </span>
              </label>

              <div className="flex flex-wrap gap-2 rounded-lg border border-glass-border bg-white/5 px-3 py-3">
                {["12 caracteres minimum", "une minuscule", "une majuscule", "un chiffre", "un caractere special"].map((rule) => {
                  const valid = !passwordIssues.includes(rule);
                  return (
                    <span key={rule} className={`rounded-md px-2 py-1 text-xs ${valid ? "bg-emerald-500/12 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                      {rule}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-accent-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-red/90 disabled:opacity-60"
                >
                  {submitting ? "Mise a jour..." : "Changer le mot de passe"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-lg border border-glass-border px-4 py-3 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Quitter
                </button>
              </div>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
