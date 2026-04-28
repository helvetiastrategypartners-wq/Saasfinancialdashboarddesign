import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { ComponentType } from "react";

type ExportButtonComponent = ComponentType<{ title?: string }>;

export function DeferredExportButton({ title }: { title: string }) {
  const [ExportButton, setExportButton] = useState<ExportButtonComponent | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadExportButton() {
    if (ExportButton || loading) {
      return;
    }

    setLoading(true);
    const module = await import("../../../components/ExportButton");
    setExportButton(() => module.default);
    setLoading(false);
  }

  if (ExportButton) {
    return <ExportButton title={title} />;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={loadExportButton}
      onFocus={loadExportButton}
      onClick={loadExportButton}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-glass-border bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-70"
    >
      <Download className="w-4 h-4" />
      {loading ? "Chargement..." : "Exports"}
    </motion.button>
  );
}
