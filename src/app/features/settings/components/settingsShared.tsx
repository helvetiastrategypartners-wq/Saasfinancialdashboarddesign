import { motion } from "motion/react";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function ToggleSetting({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glass-border">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button onClick={() => setChecked((value) => !value)} className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-accent-blue" : "bg-white/20"}`}>
        <motion.div
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg"
        />
      </button>
    </div>
  );
}

export function SaveButton({
  onClick,
  loading,
  label = "Enregistrer les modifications",
  white = false,
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  white?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors shadow-lg disabled:opacity-50 ${white ? "bg-white text-background hover:bg-white/90" : "bg-accent-red text-white hover:bg-accent-red/90"}`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      {label}
    </motion.button>
  );
}

export const PLANS = [
  { id: "starter", name: "Starter", price: "CHF 29/mois", features: ["5 utilisateurs", "Rapports de base", "Export CSV"] },
  { id: "pro", name: "Professionnel", price: "CHF 99/mois", features: ["Illimite", "Rapports avances", "AI Extraction", "Export PDF"] },
  { id: "enterprise", name: "Enterprise", price: "Sur devis", features: ["Tout le Pro", "SSO / SAML", "SLA 99.9%", "Support dedie"] },
];
