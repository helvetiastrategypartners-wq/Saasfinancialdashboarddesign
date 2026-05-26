import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Field, inputCls, useToast } from "../../../components/Modal";
import { SaveButton, SectionHeader } from "./settingsShared";

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
