import { Outlet } from "react-router";
import { Building2, LogOut, ShieldCheck, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedBackground } from "./AnimatedBackground";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function SuperAdminLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen relative bg-background text-foreground ${theme === "dark" ? "dark" : ""}`}>
      <AnimatedBackground />
      <header className="sticky top-0 z-20 border-b border-glass-border backdrop-blur-2xl" style={{ background: "var(--glass-bg)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-red text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">HSP Super Admin</p>
              <p className="text-xs text-muted-foreground">Gestion des entreprises et comptes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-glass-border px-3 py-2 text-sm text-muted-foreground md:flex">
              <Building2 className="h-4 w-4" />
              <span className="max-w-64 truncate">{user?.email}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-lg border border-glass-border text-muted-foreground transition hover:text-foreground"
              style={{ background: "var(--glass-bg)" }}
              aria-label="Changer de theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void signOut()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-glass-border px-3 text-sm text-muted-foreground transition hover:text-foreground"
              style={{ background: "var(--glass-bg)" }}
            >
              <LogOut className="h-4 w-4" />
              Deconnexion
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
