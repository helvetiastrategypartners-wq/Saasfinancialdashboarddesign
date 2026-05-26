import { motion } from "motion/react";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Overlay } from "../../../components/Modal";
import { AI_STEPS } from "../hooks";

interface InvoiceAIModalProps {
  aiStep: number;
  onClose: () => void;
  onOpenForm: () => void;
}

export function InvoiceAIModal({ aiStep, onClose, onOpenForm }: InvoiceAIModalProps) {
  return (
    <Overlay onClose={aiStep >= 4 ? onClose : undefined} small>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent-red" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">AI Extraction</h2>
      </div>
      <div className="space-y-3 mb-6">
        {AI_STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-3">
            {aiStep > index ? (
              <CheckCircle className="w-5 h-5 text-accent-blue shrink-0" />
            ) : aiStep === index ? (
              <Loader2 className="w-5 h-5 text-accent-red animate-spin shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-glass-border shrink-0" />
            )}
            <span className={`text-sm ${aiStep > index ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
          </div>
        ))}
      </div>
      {aiStep >= 4 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-4">
            Extraction terminee. Verifiez et completez les champs avant d'enregistrer.
          </p>
          <button onClick={onOpenForm} className="w-full py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors font-medium">
            Ouvrir le formulaire
          </button>
        </motion.div>
      )}
    </Overlay>
  );
}
