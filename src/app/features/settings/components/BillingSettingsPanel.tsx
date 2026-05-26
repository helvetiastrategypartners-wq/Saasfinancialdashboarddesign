import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, Download } from "lucide-react";
import { useState } from "react";
import { Field, Overlay, inputCls, useToast } from "../../../components/Modal";
import { PLANS, SectionHeader } from "./settingsShared";

export function BillingSettingsPanel() {
  const { show, ToastEl } = useToast();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  function downloadInvoice(date: string, amount: string) {
    const blob = new Blob([`FACTURE\n\nDate : ${date}\nMontant : ${amount}\nStatut : Payee\n\nCabinet Conseil SA\nPlan Professionnel\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement("a"), {
      href: url,
      download: `facture-${date.replace(/\s/g, "-")}.txt`,
    });
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function savePlan() {
    setShowPlanModal(false);
    show(`Plan mis a jour : ${PLANS.find((plan) => plan.id === selectedPlan)?.name}`);
  }

  function saveCard() {
    setShowCardModal(false);
    show("Moyen de paiement mis a jour");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <SectionHeader title="Facturation" subtitle="Gerez votre abonnement et vos moyens de paiement" />
      <div className="p-6 rounded-xl bg-white/5 border border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-foreground">Plan Professionnel</p>
            <p className="text-sm text-muted-foreground">Facture mensuellement</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">CHF 99.00/mois</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Prochain paiement le 1er mai 2026</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowPlanModal(true)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors">
          Changer de plan
        </motion.button>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Moyen de paiement</h3>
        <div className="p-6 rounded-xl bg-white/5 border border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-foreground">**** **** **** 4242</p>
              <p className="text-sm text-muted-foreground">Expire 12/2027</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCardModal(true)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors">
            Modifier
          </motion.button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Historique de facturation</h3>
        <div className="space-y-2">
          {[
            { date: "1er Avr 2026", amount: "CHF 99.00" },
            { date: "1er Mar 2026", amount: "CHF 99.00" },
            { date: "1er Fev 2026", amount: "CHF 99.00" },
          ].map((invoice) => (
            <div key={invoice.date} className="p-4 rounded-lg bg-white/5 border border-glass-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{invoice.date}</p>
                <p className="text-xs text-muted-foreground">Payee</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-medium text-foreground">{invoice.amount}</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => downloadInvoice(invoice.date, invoice.amount)} className="flex items-center gap-1 text-sm text-accent-blue hover:text-accent-blue/80 transition-colors">
                  <Download className="w-4 h-4" /> Telecharger
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {showPlanModal && (
          <Overlay onClose={() => setShowPlanModal(false)} title="Changer de plan">
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => (
                <motion.div key={plan.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedPlan(plan.id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan === plan.id ? "border-accent-blue/50 bg-accent-blue/10" : "border-glass-border hover:border-glass-border/70"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">{plan.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-accent-blue font-medium">{plan.price}</p>
                      {selectedPlan === plan.id && <Check className="w-4 h-4 text-accent-blue" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.features.join(" - ")}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPlanModal(false)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={savePlan} className="px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors">
                Confirmer
              </motion.button>
            </div>
          </Overlay>
        )}
        {showCardModal && (
          <Overlay onClose={() => setShowCardModal(false)} title="Modifier le moyen de paiement" small>
            <div className="space-y-4 mb-6">
              <Field label="Numero de carte"><input type="text" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiration"><input type="text" value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} placeholder="MM/YY" maxLength={5} className={inputCls} /></Field>
                <Field label="CVC"><input type="text" value={cardCvc} onChange={(event) => setCardCvc(event.target.value)} placeholder="123" maxLength={3} className={inputCls} /></Field>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCardModal(false)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveCard} disabled={!cardNumber || !cardExpiry || !cardCvc} className="px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                Enregistrer
              </motion.button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}
