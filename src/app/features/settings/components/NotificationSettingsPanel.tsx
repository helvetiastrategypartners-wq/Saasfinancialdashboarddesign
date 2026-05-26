import { useToast } from "../../../components/Modal";
import { SaveButton, SectionHeader, ToggleSetting } from "./settingsShared";

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
