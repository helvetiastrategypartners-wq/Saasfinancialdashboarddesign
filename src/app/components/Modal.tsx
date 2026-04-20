import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";

export const inputCls = "w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Overlay({
  children, onClose, small = false, title,
}: {
  children: ReactNode; onClose?: () => void; small?: boolean; title?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative rounded-2xl p-8 border border-glass-border shadow-2xl w-full ${small ? "max-w-md" : "max-w-lg"}`}
        style={{ background: "var(--popover)" }}
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {title && <h2 className="text-xl font-semibold text-foreground mb-6">{title}</h2>}
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border border-glass-border"
      style={{ background: "var(--popover)" }}
    >
      <CheckCircle className="w-5 h-5 text-accent-blue shrink-0" />
      <span className="text-sm font-medium text-foreground">{message}</span>
    </motion.div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => setMsg(m);
  const hide = () => setMsg(null);
  const ToastEl = (
    <AnimatePresence>
      {msg && <Toast message={msg} onDone={hide} />}
    </AnimatePresence>
  );
  return { show, ToastEl };
}

export function DeleteConfirm({
  label, detail, onConfirm, onCancel, loading,
}: {
  label: string; detail?: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <Overlay onClose={onCancel} small>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
          <X className="w-5 h-5 text-accent-red" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{label}</h2>
      </div>
      {detail && <p className="text-sm text-muted-foreground mb-6">{detail}</p>}
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
          Annuler
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50"
        >
          Supprimer
        </motion.button>
      </div>
    </Overlay>
  );
}
