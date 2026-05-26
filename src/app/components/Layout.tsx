import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Users,
  TrendingUp,
  LineChart,
  BarChart3,
  Settings,
  Wallet,
  Sun,
  Moon,
  LogOut,
  LifeBuoy,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedBackground } from "./AnimatedBackground";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, section: "PILOTAGE" },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight, section: "OPERATIONS" },
  { path: "/invoices", label: "Factures", icon: FileText, section: "OPERATIONS" },
  { path: "/clients", label: "Clients", icon: Users, section: "OPERATIONS" },
  { path: "/marketing", label: "Marketing", icon: TrendingUp, section: "CROISSANCE" },
  { path: "/forecast", label: "Previsions", icon: LineChart, section: "CROISSANCE" },
  { path: "/reports", label: "Rapports", icon: BarChart3, section: "INSIGHTS" },
  { path: "/settings", label: "Parametres", icon: Settings, section: "ADMIN" },
];

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className={`flex h-screen w-full relative ${theme === "dark" ? "dark" : ""}`}>
      <AnimatedBackground />

      <aside
        className="w-64 h-full flex flex-col border-r backdrop-blur-2xl relative overflow-hidden z-10"
        style={{
          borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
          background: theme === "dark" ? "rgba(12, 12, 18, 0.6)" : "rgba(255, 255, 255, 0.7)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom right, rgba(59,130,246,0.02), transparent)" }}
        />

        <header className="px-5 pt-5 pb-4 relative z-10 border-b border-glass-border/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-red flex items-center justify-center shadow-xl shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">HSP</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Strategy & Finance</p>
            </div>
          </div>

          <div
            className="mt-4 px-3.5 py-3 rounded-lg backdrop-blur-xl"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Session</p>
            <p className="mt-1 text-sm text-foreground truncate">{user?.email}</p>
          </div>
        </header>

        <nav className="flex-1 px-4 py-5 space-y-5 relative z-10 overflow-y-auto">
          {["PILOTAGE", "OPERATIONS", "CROISSANCE", "INSIGHTS", "ADMIN"].map((section) => {
            const sectionItems = navItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) {
              return null;
            }

            return (
              <div key={section}>
                <p className="text-[11px] font-semibold text-muted-foreground/60 mb-2 px-3 tracking-wider">{section}</p>
                <div className="space-y-1.5">
                  {sectionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Link to={item.path} key={item.path}>
                        <motion.div
                          whileHover={{ scale: 1.01, x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "text-accent-red bg-accent-red-muted border border-accent-red/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-glass-hover border border-transparent"
                          }`}
                        >
                          <Icon className="w-4 h-4 relative z-10" />
                          <span className="relative z-10 text-sm font-medium">{item.label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <footer className="p-4 border-t border-glass-border relative z-10 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-xl text-sm font-medium transition-all duration-200 border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
            }}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Mode Sombre</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-xl text-sm font-medium transition-all duration-200 border text-muted-foreground hover:text-foreground"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Deconnexion</span>
          </motion.button>

          <div
            className="px-3.5 py-3 rounded-lg backdrop-blur-xl"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <div className="flex items-start gap-2.5">
              <LifeBuoy className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Support</p>
                <p className="text-sm text-foreground truncate">management@hspgroup.ch</p>
              </div>
            </div>
          </div>
        </footer>
      </aside>

      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
