import { motion } from "framer-motion";
import { useState } from "react";
import { Wrench, Coins, Lightbulb, Info, Mail, Phone, Clock, AlertCircle, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { demoClient } from "@/app/mock/client";

const CATEGORIES = [
  { id: "technical", icon: Wrench, label: "Problème technique", desc: "La batterie ne répond pas, alarme, dysfonctionnement" },
  { id: "billing", icon: Coins, label: "Question facturation", desc: "Économies, contrat, mensualité" },
  { id: "usage", icon: Lightbulb, label: "Question d'usage", desc: "Préférences, modes, paramètres" },
  { id: "other", icon: Info, label: "Autre demande", desc: "Tout le reste" },
] as const;

const MOCK_TICKETS = [
  { id: "TKT-2026-0042", subject: "Question sur le mode Vacances longue durée", status: "resolved", date: "12 avril 2026", category: "usage" },
  { id: "TKT-2026-0058", subject: "Demande de bilan détaillé pour le comptable", status: "open", date: "24 avril 2026", category: "billing" },
];

export default function Sav() {
  const [category, setCategory] = useState<typeof CATEGORIES[number]["id"] | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");

  const submit = () => {
    if (!subject || !description) {
      toast({ title: "Champs manquants", description: "Sujet et description sont requis.", variant: "destructive" });
      return;
    }
    toast({ title: "Ticket envoyé", description: "Notre équipe vous répond sous 2h ouvrées." });
    setSubject(""); setDescription(""); setCategory(null);
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Support</div>
        <h1 className="text-3xl md:text-4xl font-black">Comment pouvons-nous vous aider ?</h1>
        <p className="text-sm text-muted-foreground mt-1">Réponse sous 2h ouvrées · Intervention sous 24h pour les alertes critiques.</p>
      </motion.div>

      {/* Catégories */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((c, i) => (
          <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => { setCategory(c.id); setSubject(c.label); }}
            className={`glass rounded-2xl p-5 text-left transition-all ${category === c.id ? "border-gold/50 bg-gold/5" : "hover:border-primary/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
              <c.icon className="w-4 h-4 text-primary-light" />
            </div>
            <div className="font-bold text-sm mb-1">{c.label}</div>
            <div className="text-[11px] text-muted-foreground">{c.desc}</div>
          </motion.button>
        ))}
      </div>

      {/* Formulaire */}
      {category && (
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 md:p-7 space-y-4">
          <h2 className="text-xl font-black">Décrivez votre demande</h2>
          <div className="space-y-1.5">
            <Label>Sujet</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet du ticket" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre situation, le contexte, ce que vous avez déjà essayé…" rows={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Niveau d'urgence</Label>
            <div className="flex gap-2">
              {[
                { v: "low", l: "Faible", c: "border-emerald-500/30 hover:bg-emerald-500/10" },
                { v: "normal", l: "Normal", c: "border-primary/30 hover:bg-primary/10" },
                { v: "urgent", l: "Urgent", c: "border-destructive/30 hover:bg-destructive/10" },
              ].map((u) => (
                <button key={u.v} onClick={() => setUrgency(u.v)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono uppercase border transition-all ${urgency === u.v ? "bg-primary/20 border-primary text-foreground" : `bg-background/40 ${u.c}`}`}>
                  {u.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCategory(null)}>Annuler</Button>
            <Button onClick={submit} className="bg-gradient-to-r from-primary to-primary-dark">Envoyer le ticket</Button>
          </div>
        </motion.section>
      )}

      {/* Tickets en cours */}
      <section>
        <h2 className="text-xl font-black mb-3">Mes tickets</h2>
        <div className="space-y-2">
          {MOCK_TICKETS.map((t) => (
            <div key={t.id} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.status === "resolved" ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-gold/15 border border-gold/30"}`}>
                {t.status === "resolved" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{t.subject}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{t.id} · {t.date}</div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${t.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-gold/15 text-gold"}`}>
                {t.status === "resolved" ? "Résolu" : "En cours"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact direct */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-gold" />
            <h3 className="font-bold">Contact direct</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><a href="mailto:support@dynawatt.fr" className="hover:text-primary-light">support@dynawatt.fr</a></div>
            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground" /><a href="tel:+33180888080" className="hover:text-primary-light">+33 1 80 88 80 80</a></div>
            <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-muted-foreground" /><span>Lun-Ven 9h-18h</span></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            Pour les urgences techniques (alarme onduleur, batterie inactive), appelez-nous directement.
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary-light" />
            <h3 className="font-bold">Mon commercial</h3>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-sm font-bold">
              {demoClient.commercial.firstName[0]}{demoClient.commercial.lastName[0]}
            </div>
            <div>
              <div className="font-bold">{demoClient.commercial.firstName} {demoClient.commercial.lastName}</div>
              <div className="text-[11px] text-muted-foreground">Commercial Dynawatt référent</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><a href={`mailto:${demoClient.commercial.email}`} className="hover:text-primary-light">{demoClient.commercial.email}</a></div>
            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground" /><a href={`tel:${demoClient.commercial.phone.replace(/\s/g, "")}`} className="hover:text-primary-light">{demoClient.commercial.phone}</a></div>
          </div>
        </div>
      </section>
    </div>
  );
}
