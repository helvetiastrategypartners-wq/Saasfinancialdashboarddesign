import { Bell, CreditCard, Globe, Lock, User } from "lucide-react";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Securite", icon: Lock },
  { id: "billing", label: "Facturation", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Globe },
];
