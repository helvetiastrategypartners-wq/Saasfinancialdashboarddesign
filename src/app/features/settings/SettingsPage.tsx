import { motion } from "motion/react";
import { useState } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  BillingSettingsPanel,
  NotificationSettingsPanel,
  PreferenceSettingsPanel,
  ProfileSettingsPanel,
  SecuritySettingsPanel,
  SETTINGS_TABS,
} from "./components";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Parametres" subtitle="Gerez vos preferences et votre configuration" />

      <div className="grid grid-cols-4 gap-6">
        <GlassCard className="col-span-1 space-y-2">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? "bg-accent-red-muted text-accent-red border border-accent-red/20" : "text-muted-foreground hover:text-foreground hover:bg-glass-hover border border-transparent"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </GlassCard>

        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="col-span-3 rounded-2xl p-8 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          {activeTab === "profile" && <ProfileSettingsPanel />}
          {activeTab === "notifications" && <NotificationSettingsPanel />}
          {activeTab === "security" && <SecuritySettingsPanel />}
          {activeTab === "billing" && <BillingSettingsPanel />}
          {activeTab === "preferences" && <PreferenceSettingsPanel />}
        </motion.div>
      </div>
    </div>
  );
}
