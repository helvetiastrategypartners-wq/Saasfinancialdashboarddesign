import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, CreditCard, Download, Globe, Loader2, Lock, Save, Upload, User } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Field, Overlay, inputCls, useToast } from "../../../components/Modal";

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ToggleSetting({
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

function SaveButton({
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

const PLANS = [
  { id: "starter", name: "Starter", price: "CHF 29/mois", features: ["5 utilisateurs", "Rapports de base", "Export CSV"] },
  { id: "pro", name: "Professionnel", price: "CHF 99/mois", features: ["Illimite", "Rapports avances", "AI Extraction", "Export PDF"] },
  { id: "enterprise", name: "Enterprise", price: "Sur devis", features: ["Tout le Pro", "SSO / SAML", "SLA 99.9%", "Support dedie"] },
];

export function ProfileSettingsPanel() {
  const { show, ToastEl } = useToast();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@company.ch");
  const [phone, setPhone] = useState("+41 22 345 67 89");
  const [company, setCompany] = useState("Cabinet Conseil SA");
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <SectionHeader title="Informations du profil" subtitle="Mettez a jour vos informations personnelles" />
      <div className="flex items-center gap-6">
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-semibold shadow-lg"
          style={{ background: avatar ? "transparent" : "linear-gradient(to bottom right, var(--accent-blue), var(--accent-red))" }}
        >
          {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : `${firstName.charAt(0)}${lastName.charAt(0)}`}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-blue/30 hover:bg-accent-blue/10 text-accent-blue transition-colors">
            <Upload className="w-4 h-4" /> Changer la photo
          </motion.button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Field label="Prenom"><input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputCls} style={{ background: "var(--glass-bg)" }} /></Field>
        <Field label="Nom"><input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputCls} style={{ background: "var(--glass-bg)" }} /></Field>
      </div>
      <Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputCls} style={{ background: "var(--glass-bg)" }} /></Field>
      <Field label="Telephone"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputCls} style={{ background: "var(--glass-bg)" }} /></Field>
      <Field label="Entreprise"><input type="text" value={company} onChange={(event) => setCompany(event.target.value)} className={inputCls} style={{ background: "var(--glass-bg)" }} /></Field>
      <SaveButton onClick={() => show("Profil enregistre avec succes")} />
    </div>
  );
}

export function NotificationSettingsPanel() {
  const { show, ToastEl } = useToast();

  return (
    <div className="space-y-6">
      {ToastEl}
      <SectionHeader title="Preferences de notification" subtitle="Configurez comment vous souhaitez etre notifie" />
      <div className="space-y-4">
        <ToggleSetting label="Notifications par email" description="Recevoir des notifications par email" defaultChecked />
        <ToggleSetting label="Alertes de transactions" description="Etre notifie des nouvelles transactions" defaultChecked />
        <ToggleSetting label="Rapports hebdomadaires" description="Recevoir un resume hebdomadaire" defaultChecked />
        <ToggleSetting label="Alertes de facturation" description="Notifications pour les factures echues" defaultChecked />
        <ToggleSetting label="Mises a jour marketing" description="Recevoir des actualites et conseils" />
      </div>
      <SaveButton white onClick={() => show("Preferences de notification enregistrees")} label="Enregistrer les preferences" />
    </div>
  );
}

export function SecuritySettingsPanel() {
  const { show, ToastEl } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!currentPassword || !nextPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (nextPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    show("Mot de passe mis a jour avec succes");
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <SectionHeader title="Securite" subtitle="Gerez votre mot de passe et vos options de securite" />
      <Field label="Mot de passe actuel"><input type="password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }} className={inputCls} /></Field>
      <Field label="Nouveau mot de passe"><input type="password" value={nextPassword} onChange={(event) => { setNextPassword(event.target.value); setError(""); }} className={inputCls} /></Field>
      <Field label="Confirmer le mot de passe"><input type="password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} className={inputCls} /></Field>
      {error && <p className="text-sm text-accent-red">{error}</p>}
      <div className="space-y-4 pt-4 border-t border-glass-border">
        <ToggleSetting label="Authentification a deux facteurs" description="Ajouter une couche de securite supplementaire" />
        <ToggleSetting label="Alertes de connexion" description="Recevoir des alertes lors de nouvelles connexions" defaultChecked />
      </div>
      <SaveButton white onClick={handleUpdate} loading={loading} label="Mettre a jour le mot de passe" />
    </div>
  );
}

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
                  <p className="text-xs text-muted-foreground">{plan.features.join(" · ")}</p>
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

export function PreferenceSettingsPanel() {
  const { show, ToastEl } = useToast();
  const [language, setLanguage] = useState("Francais");
  const [currency, setCurrency] = useState("CHF (Franc Suisse)");
  const [timezone, setTimezone] = useState("Europe/Zurich (GMT+1)");

  return (
    <div className="space-y-6">
      {ToastEl}
      <SectionHeader title="Preferences" subtitle="Personnalisez votre experience" />
      <Field label="Langue">
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className={inputCls}>
          <option>Francais</option>
          <option>English</option>
          <option>Deutsch</option>
          <option>Italiano</option>
        </select>
      </Field>
      <Field label="Devise">
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={inputCls}>
          <option>CHF (Franc Suisse)</option>
          <option>EUR (Euro)</option>
          <option>USD (Dollar Americain)</option>
        </select>
      </Field>
      <Field label="Fuseau horaire">
        <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={inputCls}>
          <option>Europe/Zurich (GMT+1)</option>
          <option>Europe/Paris (GMT+1)</option>
          <option>Europe/London (GMT+0)</option>
        </select>
      </Field>
      <div className="space-y-4 pt-4 border-t border-glass-border">
        <ToggleSetting label="Mode sombre" description="Activer le theme sombre (deja actif)" defaultChecked />
        <ToggleSetting label="Animations" description="Activer les animations de l'interface" defaultChecked />
        <ToggleSetting label="Sons de notification" description="Jouer un son lors des notifications" />
      </div>
      <SaveButton white onClick={() => show("Preferences enregistrees avec succes")} label="Enregistrer les preferences" />
    </div>
  );
}

export const SETTINGS_TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Securite", icon: Lock },
  { id: "billing", label: "Facturation", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Globe },
];
