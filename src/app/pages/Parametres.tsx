import { motion } from "framer-motion";
import { useState } from "react";
import { demoClient } from "@/app/mock/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, Shield, Building2, Download, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Parametres() {
  const [notif, setNotif] = useState({ email: true, push: true, sms: false, savings: true, alerts: true });

  const exportData = () => {
    const data = JSON.stringify({ client: demoClient, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dynawatt-mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export généré", description: "Toutes vos données ont été téléchargées." });
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Paramètres</div>
        <h1 className="text-3xl md:text-4xl font-black">Mon compte</h1>
      </motion.div>

      {/* Infos perso */}
      <Section icon={User} title="Informations personnelles">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Prénom" defaultValue={demoClient.firstName} />
          <Field label="Nom" defaultValue={demoClient.lastName} />
          <Field label="Email" type="email" defaultValue={demoClient.email} />
          <Field label="Téléphone" defaultValue={demoClient.phone} />
          <Field label="Raison sociale" defaultValue={demoClient.companyName} className="md:col-span-2" />
          <Field label="Adresse" defaultValue={demoClient.address} className="md:col-span-2" />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => toast({ title: "Profil mis à jour" })} className="bg-gradient-to-r from-primary to-primary-dark">Enregistrer</Button>
        </div>
      </Section>

      {/* Mot de passe */}
      <Section icon={Lock} title="Mot de passe">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Actuel" type="password" />
          <Field label="Nouveau" type="password" />
          <Field label="Confirmer" type="password" />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => toast({ title: "Mot de passe modifié" })}>Modifier</Button>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {[
            { k: "email", l: "Notifications par email", d: "Récapitulatif quotidien et alertes" },
            { k: "push", l: "Notifications push", d: "Sur votre navigateur" },
            { k: "sms", l: "Notifications SMS", d: "Pour les alertes critiques uniquement" },
            { k: "savings", l: "Bilan d'économies hebdomadaire", d: "Tous les lundis à 8h" },
            { k: "alerts", l: "Alertes équipement", d: "Anomalies, baisse de SOH, alarmes" },
          ].map((n) => (
            <div key={n.k} className="flex items-center justify-between gap-4 py-2 border-b border-border/30 last:border-0">
              <div className="flex-1">
                <div className="font-bold text-sm">{n.l}</div>
                <div className="text-[11px] text-muted-foreground">{n.d}</div>
              </div>
              <Switch checked={notif[n.k as keyof typeof notif]} onCheckedChange={(v) => setNotif({ ...notif, [n.k]: v })} />
            </div>
          ))}
        </div>
      </Section>

      {/* Distributeur */}
      <Section icon={Building2} title="Distributeur & commercial">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Distributeur</div>
            <div className="font-bold">Dynawatt SAS</div>
            <div className="text-xs text-muted-foreground">distrib. directe</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Commercial assigné</div>
            <div className="font-bold">{demoClient.commercial.firstName} {demoClient.commercial.lastName}</div>
            <div className="text-xs text-muted-foreground">{demoClient.commercial.email}</div>
          </div>
        </div>
      </Section>

      {/* RGPD */}
      <Section icon={Shield} title="RGPD & confidentialité">
        <div className="space-y-3">
          <Button onClick={exportData} variant="outline" className="w-full justify-start gap-2">
            <Download className="w-4 h-4" />Télécharger toutes mes données (JSON)
          </Button>
          <Button onClick={() => toast({ title: "Action sensible", description: "Confirmez par email pour supprimer votre compte.", variant: "destructive" })}
            variant="outline" className="w-full justify-start gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
            <AlertTriangle className="w-4 h-4" />Supprimer mon compte
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="glass rounded-3xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-light" />
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function Field({ label, defaultValue, type = "text", className = "" }: { label: string; defaultValue?: string; type?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} defaultValue={defaultValue} />
    </div>
  );
}
