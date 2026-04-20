import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, ArrowLeftRight, FileText, Users, TrendingUp, LineChart, BarChart3, Settings, Wallet, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedBackground } from "./AnimatedBackground";
import { useTheme } from "../contexts/ThemeContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, section: "PILOTAGE" },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight, section: "OPÉRATIONS" },
  { path: "/invoices", label: "Factures", icon: FileText, section: "OPÉRATIONS" },
  { path: "/clients", label: "Clients", icon: Users, section: "OPÉRATIONS" },
  { path: "/marketing", label: "Marketing", icon: TrendingUp, section: "CROISSANCE" },
  { path: "/forecast", label: "Prévisions", icon: LineChart, section: "CROISSANCE" },
  { path: "/reports", label: "Rapports", icon: BarChart3, section: "INSIGHTS" },
  { path: "/settings", label: "Paramètres", icon: Settings, section: "ADMIN" },
];

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex h-screen w-full relative ${theme === 'dark' ? 'dark' : ''}`}>
      <AnimatedBackground />
      
      {/* Sidebar */}
      <aside 
        className="w-64 h-full flex flex-col border-r backdrop-blur-2xl relative overflow-hidden z-10" 
        style={{ 
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)', 
          background: theme === 'dark' ? 'rgba(12, 12, 18, 0.6)' : 'rgba(255, 255, 255, 0.7)' 
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom right, rgba(59,130,246,0.02), transparent)" }} />
        {/* Logo */}
        <div className="p-6 pb-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-accent-red flex items-center justify-center shadow-xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">HSP</h1>
              <p className="text-xs text-muted-foreground mt-1">Strategy & Finance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 relative z-10 overflow-y-auto">
          {["PILOTAGE", "OPÉRATIONS", "CROISSANCE", "INSIGHTS", "ADMIN"].map((section) => {
            const sectionItems = navItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section}>
                <p className="text-xs font-semibold text-muted-foreground/60 mb-2 px-3 tracking-wider">{section}</p>
                <div className="space-y-1">
                  {sectionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Link to={item.path} key={item.path}>
                        <motion.div
                          whileHover={{ scale: 1.01, x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'text-accent-red bg-accent-red-muted border border-accent-red/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-glass-hover border border-transparent'
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

        {/* Footer */}
        <div className="p-4 border-t border-glass-border relative z-10 space-y-3">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl backdrop-blur-xl text-sm font-medium transition-all duration-200 border"
            style={{ 
              background: 'var(--glass-bg)', 
              borderColor: 'var(--glass-border)',
            }}
          >
            {theme === 'dark' ? (
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
          
          {/* Support Info */}
          <div className="px-4 py-3 rounded-xl backdrop-blur-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <p className="text-xs text-muted-foreground">Support</p>
            <p className="text-sm text-foreground">management@hspgroup.ch</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}