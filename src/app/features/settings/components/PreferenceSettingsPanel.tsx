import { useState } from "react";
import { Field, inputCls, useToast } from "../../../components/Modal";
import { SaveButton, SectionHeader, ToggleSetting } from "./settingsShared";

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
