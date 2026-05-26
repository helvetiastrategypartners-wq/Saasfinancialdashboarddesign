import { useState } from "react";
import { Field, inputCls, useToast } from "../../../components/Modal";
import { SaveButton, SectionHeader, ToggleSetting } from "./settingsShared";

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
