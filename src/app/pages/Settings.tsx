import { motion, AnimatePresence } from "motion/react";
import { User, Bell, Lock, CreditCard, Globe, Save, Upload, Check, Loader2, Download } from "lucide-react";
import { useState, useRef } from "react";
import { Overlay, Field, inputCls, useToast } from "../components/Modal";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile",       label: "Profil",         icon: User },
    { id: "notifications", label: "Notifications",  icon: Bell },
    { id: "security",      label: "Sécurité",       icon: Lock },
    { id: "billing",       label: "Facturation",    icon: CreditCard },
    { id: "preferences",   label: "Préférences",    icon: Globe },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-lg">Gérez vos préférences et configuration</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="col-span-1 rounded-2xl p-4 backdrop-blur-xl border border-glass-border space-y-2" style={{ background: "var(--glass-bg)" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-accent-red-muted text-accent-red border border-accent-red/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-glass-hover border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="col-span-3 rounded-2xl p-8 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          {activeTab === "profile"       && <ProfileSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "security"      && <SecuritySettings />}
          {activeTab === "billing"       && <BillingSettings />}
          {activeTab === "preferences"   && <PreferenceSettings />}
        </motion.div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { show, ToastEl } = useToast();
  const [avatar,    setAvatar]    = useState<string | null>(null);
  const [firstName, setFirstName] = useState("John");
  const [lastName,  setLastName]  = useState("Doe");
  const [email,     setEmail]     = useState("john.doe@company.ch");
  const [phone,     setPhone]     = useState("+41 22 345 67 89");
  const [company,   setCompany]   = useState("Cabinet Conseil SA");
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    show("Profil enregistré avec succès");
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Informations du Profil</h2>
        <p className="text-muted-foreground">Mettez à jour vos informations personnelles</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-semibold shadow-lg" style={{ background: avatar ? "transparent" : "linear-gradient(to bottom right, var(--accent-blue), var(--accent-red))" }}>
          {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : `${firstName.charAt(0)}${lastName.charAt(0)}`}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-blue/30 hover:bg-accent-blue/10 text-accent-blue transition-colors"
          >
            <Upload className="w-4 h-4" />
            Changer la photo
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Prénom">
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={`${inputCls} bg-transparent border border-glass-border`} style={{ background: "var(--glass-bg)" }} />
        </Field>
        <Field label="Nom">
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={`${inputCls} bg-transparent border border-glass-border`} style={{ background: "var(--glass-bg)" }} />
        </Field>
      </div>
      <Field label="Email">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputCls} bg-transparent border border-glass-border`} style={{ background: "var(--glass-bg)" }} />
      </Field>
      <Field label="Téléphone">
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputCls} bg-transparent border border-glass-border`} style={{ background: "var(--glass-bg)" }} />
      </Field>
      <Field label="Entreprise">
        <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={`${inputCls} bg-transparent border border-glass-border`} style={{ background: "var(--glass-bg)" }} />
      </Field>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
      >
        <Save className="w-5 h-5" />
        Enregistrer les modifications
      </motion.button>
    </div>
  );
}

function NotificationSettings() {
  const { show, ToastEl } = useToast();

  return (
    <div className="space-y-6">
      {ToastEl}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Préférences de Notification</h2>
        <p className="text-muted-foreground">Configurez comment vous souhaitez être notifié</p>
      </div>

      <div className="space-y-4">
        <ToggleSetting label="Notifications par email"   description="Recevoir des notifications par email" defaultChecked />
        <ToggleSetting label="Alertes de transactions"   description="Être notifié des nouvelles transactions" defaultChecked />
        <ToggleSetting label="Rapports hebdomadaires"    description="Recevoir un résumé hebdomadaire" defaultChecked />
        <ToggleSetting label="Alertes de facturation"    description="Notifications pour les factures échues" defaultChecked />
        <ToggleSetting label="Mises à jour marketing"    description="Recevoir des actualités et conseils" />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => show("Préférences de notification enregistrées")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background hover:bg-white/90 transition-colors shadow-lg"
      >
        <Save className="w-5 h-5" />
        Enregistrer les préférences
      </motion.button>
    </div>
  );
}

function SecuritySettings() {
  const { show, ToastEl } = useToast();
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleUpdate() {
    if (!current || !next) { setError("Veuillez remplir tous les champs."); return; }
    if (next !== confirm)  { setError("Les mots de passe ne correspondent pas."); return; }
    if (next.length < 8)   { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setCurrent(""); setNext(""); setConfirm("");
    show("Mot de passe mis à jour avec succès");
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Sécurité</h2>
        <p className="text-muted-foreground">Gérez votre mot de passe et options de sécurité</p>
      </div>

      <Field label="Mot de passe actuel">
        <input type="password" value={current} onChange={e => { setCurrent(e.target.value); setError(""); }} className={inputCls} />
      </Field>
      <Field label="Nouveau mot de passe">
        <input type="password" value={next} onChange={e => { setNext(e.target.value); setError(""); }} className={inputCls} />
      </Field>
      <Field label="Confirmer le mot de passe">
        <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} className={inputCls} />
      </Field>
      {error && <p className="text-sm text-accent-red">{error}</p>}

      <div className="space-y-4 pt-4 border-t border-glass-border">
        <ToggleSetting label="Authentification à deux facteurs" description="Ajouter une couche de sécurité supplémentaire" />
        <ToggleSetting label="Alertes de connexion"             description="Recevoir des alertes lors de nouvelles connexions" defaultChecked />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleUpdate}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background hover:bg-white/90 transition-colors shadow-lg disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Mettre à jour le mot de passe
      </motion.button>
    </div>
  );
}

const PLANS = [
  { id: "starter",  name: "Starter",        price: "CHF 29/mois",  features: ["5 utilisateurs", "Rapports de base", "Export CSV"] },
  { id: "pro",      name: "Professionnel",   price: "CHF 99/mois",  features: ["Illimité", "Rapports avancés", "AI Extraction", "Export PDF"] },
  { id: "enterprise",name: "Enterprise",    price: "Sur devis",    features: ["Tout le Pro", "SSO / SAML", "SLA 99.9%", "Support dédié"] },
];

function BillingSettings() {
  const { show, ToastEl } = useToast();
  const [showPlanModal, setShowPlanModal]   = useState(false);
  const [showCardModal, setShowCardModal]   = useState(false);
  const [selectedPlan,  setSelectedPlan]    = useState("pro");
  const [cardNumber,    setCardNumber]      = useState("");
  const [cardExpiry,    setCardExpiry]      = useState("");
  const [cardCvc,       setCardCvc]         = useState("");

  function downloadInvoice(date: string, amount: string) {
    const content = `FACTURE\n\nDate : ${date}\nMontant : ${amount}\nStatut : Payée\n\nCabinet Conseil SA\nPlan Professionnel\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `facture-${date.replace(/\s/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function savePlan() {
    setShowPlanModal(false);
    const plan = PLANS.find(p => p.id === selectedPlan);
    show(`Plan mis à jour : ${plan?.name}`);
  }

  function saveCard() {
    if (!cardNumber || !cardExpiry || !cardCvc) return;
    setShowCardModal(false);
    show("Moyen de paiement mis à jour");
    setCardNumber(""); setCardExpiry(""); setCardCvc("");
  }

  return (
    <div className="space-y-6">
      {ToastEl}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Facturation</h2>
        <p className="text-muted-foreground">Gérez votre abonnement et moyens de paiement</p>
      </div>

      {/* Current plan */}
      <div className="p-6 rounded-xl bg-white/5 border border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-foreground">Plan Professionnel</p>
            <p className="text-sm text-muted-foreground">Facturé mensuellement</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">CHF 99.00/mois</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Prochain paiement le 1er mai 2026</p>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowPlanModal(true)}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors"
        >
          Changer de plan
        </motion.button>
      </div>

      {/* Card */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Moyen de paiement</h3>
        <div className="p-6 rounded-xl bg-white/5 border border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
              <p className="text-sm text-muted-foreground">Expire 12/2027</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCardModal(true)}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors"
          >
            Modifier
          </motion.button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Historique de facturation</h3>
        <div className="space-y-2">
          {[
            { date: "1er Avr 2026", amount: "CHF 99.00" },
            { date: "1er Mar 2026", amount: "CHF 99.00" },
            { date: "1er Fév 2026", amount: "CHF 99.00" },
          ].map((inv, i) => (
            <div key={i} className="p-4 rounded-lg bg-white/5 border border-glass-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{inv.date}</p>
                <p className="text-xs text-muted-foreground">Payée</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-medium text-foreground">{inv.amount}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => downloadInvoice(inv.date, inv.amount)}
                  className="flex items-center gap-1 text-sm text-accent-blue hover:text-accent-blue/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan modal */}
      <AnimatePresence>
        {showPlanModal && (
          <Overlay onClose={() => setShowPlanModal(false)} title="Changer de plan">
            <div className="space-y-3 mb-6">
              {PLANS.map(plan => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan === plan.id ? "border-accent-blue/50 bg-accent-blue/10" : "border-glass-border hover:border-glass-border/70"}`}
                >
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
              <Field label="Numéro de carte">
                <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiration">
                  <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className={inputCls} />
                </Field>
                <Field label="CVC">
                  <input type="text" value={cardCvc} onChange={e => setCardCvc(e.target.value)} placeholder="123" maxLength={3} className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCardModal(false)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={saveCard}
                disabled={!cardNumber || !cardExpiry || !cardCvc}
                className="px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50"
              >
                Enregistrer
              </motion.button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreferenceSettings() {
  const { show, ToastEl } = useToast();
  const [lang,     setLang]    = useState("Français");
  const [currency, setCurrency] = useState("CHF (Franc Suisse)");
  const [tz,       setTz]      = useState("Europe/Zurich (GMT+1)");

  return (
    <div className="space-y-6">
      {ToastEl}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Préférences</h2>
        <p className="text-muted-foreground">Personnalisez votre expérience</p>
      </div>

      <Field label="Langue">
        <select value={lang} onChange={e => setLang(e.target.value)} className={inputCls}>
          <option>Français</option>
          <option>English</option>
          <option>Deutsch</option>
          <option>Italiano</option>
        </select>
      </Field>
      <Field label="Devise">
        <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
          <option>CHF (Franc Suisse)</option>
          <option>EUR (Euro)</option>
          <option>USD (Dollar Américain)</option>
        </select>
      </Field>
      <Field label="Fuseau horaire">
        <select value={tz} onChange={e => setTz(e.target.value)} className={inputCls}>
          <option>Europe/Zurich (GMT+1)</option>
          <option>Europe/Paris (GMT+1)</option>
          <option>Europe/London (GMT+0)</option>
        </select>
      </Field>

      <div className="space-y-4 pt-4 border-t border-glass-border">
        <ToggleSetting label="Mode sombre"          description="Activer le thème sombre (déjà actif)" defaultChecked />
        <ToggleSetting label="Animations"           description="Activer les animations de l'interface" defaultChecked />
        <ToggleSetting label="Sons de notification" description="Jouer un son lors des notifications" />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => show("Préférences enregistrées avec succès")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background hover:bg-white/90 transition-colors shadow-lg"
      >
        <Save className="w-5 h-5" />
        Enregistrer les préférences
      </motion.button>
    </div>
  );
}

function ToggleSetting({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glass-border">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-accent-blue" : "bg-white/20"}`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg"
        />
      </button>
    </div>
  );
}
