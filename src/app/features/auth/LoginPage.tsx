import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, Mail, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AnimatedBackground } from "../../components/AnimatedBackground";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
  const { user, loading, error, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Connexion impossible.";
      toast.error(message);
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
          className="w-full max-w-[420px] rounded-lg border border-glass-border bg-card/82 backdrop-blur-2xl shadow-2xl"
        >
          <div className="p-7 space-y-7">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-accent-red flex items-center justify-center shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HSP</h1>
                <p className="text-sm text-muted-foreground">Strategy & Finance</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background pl-10 pr-3 py-3 text-sm outline-none transition focus:border-accent-red focus:ring-2 focus:ring-accent-red/20"
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Mot de passe</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background pl-10 pr-11 py-3 text-sm outline-none transition focus:border-accent-red focus:ring-2 focus:ring-accent-red/20"
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

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || submitting}
                className="w-full rounded-lg bg-accent-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-red/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Connexion..." : "Se connecter"}
              </motion.button>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
