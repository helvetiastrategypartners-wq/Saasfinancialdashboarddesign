import { AnimatePresence, motion } from "motion/react";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useToast, Overlay, Field, DeleteConfirm, inputCls } from "../../components/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SearchInput } from "../../components/ui/SearchInput";
import { ClientsList } from "./components/ClientsList";
import {
  buildCustomerPayload,
  CLIENT_STATUS_LABEL,
  EMPTY_CLIENT_FORM,
  toClientForm,
  useClientsData,
  type ClientFormState,
} from "./hooks/useClientsData";
import type { Customer } from "@shared/types";

type ModalMode = "add" | "edit" | "delete" | null;

export function Clients() {
  const { show, ToastEl } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const {
    customers,
    metrics,
    format,
    filteredCustomers,
    totalRevenue,
    averageRevenue,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useClientsData(searchTerm, statusFilter);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<ClientFormState>(EMPTY_CLIENT_FORM);
  const [saving, setSaving] = useState(false);

  function updateForm<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_CLIENT_FORM);
    setSelectedCustomer(null);
    setModal("add");
  }

  function openEdit(customer: Customer) {
    setForm(toClientForm(customer));
    setSelectedCustomer(customer);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = buildCustomerPayload(form);

    if (modal === "add") {
      await addCustomer(payload);
      show("Client ajoute");
    } else if (modal === "edit" && selectedCustomer) {
      await updateCustomer(selectedCustomer.id, payload);
      show("Client mis a jour");
    }

    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selectedCustomer) return;
    setSaving(true);
    await deleteCustomer(selectedCustomer.id);
    setSaving(false);
    setModal(null);
    show("Client supprime");
  }

  return (
    <div className="p-8 space-y-6">
      {ToastEl}
      <PageHeader
        title="Clients"
        subtitle="Gerez votre portefeuille client et vos relations"
        action={
          <motion.button whileHover={{ scale: 1.02, transition: { duration: 0.15 } }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors duration-150 shadow-lg">
            <Plus className="w-5 h-5" />
            Ajouter un client
          </motion.button>
        }
      />

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total clients" value={String(customers.length)} delay={0} />
        <StatCard label="Clients actifs" value={String(metrics.activeCustomers)} delay={0.06} highlight />
        <StatCard label="Revenu total" value={format(totalRevenue)} delay={0.12} />
        <StatCard label="Revenu moyen" value={format(averageRevenue)} delay={0.18} />
      </div>

      <div className="flex items-center gap-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par nom, canal ou segment..." className="flex-1" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-6 py-3 rounded-xl border border-glass-border text-foreground focus:outline-none focus:border-accent-blue/40 transition-[border-color] duration-150 backdrop-blur-xl" style={{ background: "var(--glass-bg)" }}>
          <option value="Tous">Tous les statuts</option>
          <option value={CLIENT_STATUS_LABEL.active}>Actif</option>
          <option value={CLIENT_STATUS_LABEL.churned}>Churne</option>
          <option value={CLIENT_STATUS_LABEL.paused}>En pause</option>
        </select>
      </div>

      <ClientsList
        clients={filteredCustomers}
        format={format}
        onEdit={openEdit}
        onDelete={(customer) => {
          setSelectedCustomer(customer);
          setModal("delete");
        }}
      />

      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouveau client" : "Modifier le client"}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom">
                  <input type="text" value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Nom ou raison sociale" className={inputCls} />
                </Field>
                <Field label="Segment">
                  <input type="text" value={form.segment} onChange={(event) => updateForm("segment", event.target.value)} placeholder="Ex: PME, Enterprise..." className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Canal d'acquisition">
                  <input type="text" value={form.acquisition_channel} onChange={(event) => updateForm("acquisition_channel", event.target.value)} placeholder="Ex: LinkedIn, Inbound..." className={inputCls} />
                </Field>
                <Field label="Date d'acquisition">
                  <input type="date" value={form.acquisition_date} onChange={(event) => updateForm("acquisition_date", event.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Statut">
                <select value={form.status} onChange={(event) => updateForm("status", event.target.value as Customer["status"])} className={inputCls}>
                  <option value="active">Actif</option>
                  <option value="churned">Churne</option>
                  <option value="paused">En pause</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="MRR (CHF)">
                  <input type="number" min="0" step="0.01" value={form.monthly_revenue} onChange={(event) => updateForm("monthly_revenue", event.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Revenu total (CHF)">
                  <input type="number" min="0" step="0.01" value={form.total_revenue} onChange={(event) => updateForm("total_revenue", event.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marge brute (%)">
                  <input type="number" min="0" max="100" step="0.1" value={form.gross_margin_percent} onChange={(event) => updateForm("gross_margin_percent", event.target.value)} placeholder="0.0" className={inputCls} />
                </Field>
                <Field label="Couts directs (CHF)">
                  <input type="number" min="0" step="0.01" value={form.direct_costs} onChange={(event) => updateForm("direct_costs", event.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors duration-150">
                Annuler
              </button>
              <motion.button whileHover={{ scale: 1.02, transition: { duration: 0.15 } }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || !form.name.trim()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors duration-150 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}

        {modal === "delete" && selectedCustomer && (
          <DeleteConfirm
            label="Supprimer le client ?"
            detail={`"${selectedCustomer.name}" sera definitivement supprime de votre portefeuille.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
