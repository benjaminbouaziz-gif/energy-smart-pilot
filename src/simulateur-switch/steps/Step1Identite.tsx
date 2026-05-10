import { motion } from "framer-motion";
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useSimulateurSwitch, TOTAL_STEPS, SimulateurSwitchIdentite } from "../SimulateurSwitchContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT: SimulateurSwitchIdentite = {
  civilite: "M",
  prenom: "",
  nom: "",
  adresse: "",
  email: "",
  telephone: "",
  estPro: false,
  nomEntreprise: "",
};

export default function Step1Identite() {
  const { data, updateData, next } = useSimulateurSwitch();
  const identite: SimulateurSwitchIdentite = { ...DEFAULT, ...(data.identite ?? {}) };

  const set = (patch: Partial<SimulateurSwitchIdentite>) => {
    updateData({ identite: { ...identite, ...patch } });
  };

  const valid =
    identite.prenom.trim().length > 0 &&
    identite.nom.trim().length > 0 &&
    identite.adresse.trim().length > 0 &&
    EMAIL_RE.test(identite.email.trim()) &&
    identite.telephone.trim().length > 0 &&
    (!identite.estPro || (identite.nomEntreprise ?? "").trim().length > 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-3xl"
    >
      <div className="text-center mb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
          Étape 1 / {TOTAL_STEPS}
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Identité du prospect</h1>
      </div>

      <Card className="rounded-3xl border-primary/20 shadow-[var(--shadow-glow)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">
                <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  Étape 1 — Identité
                </span>
              </CardTitle>
              <CardDescription>Renseigne les informations du prospect</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Toggle Pro/Particulier */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/40">
            <div>
              <Label htmlFor="estPro" className="text-sm font-semibold cursor-pointer">
                C'est un Pro
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {identite.estPro ? "Professionnel — segment Pro" : "Particulier — segment résidentiel"}
              </p>
            </div>
            <Switch
              id="estPro"
              checked={identite.estPro}
              onCheckedChange={(v) => set({ estPro: v })}
            />
          </div>

          {identite.estPro && (
            <div className="space-y-2">
              <Label htmlFor="nomEntreprise">Nom de l'entreprise *</Label>
              <Input
                id="nomEntreprise"
                value={identite.nomEntreprise ?? ""}
                onChange={(e) => set({ nomEntreprise: e.target.value })}
                placeholder="SARL Exemple"
              />
            </div>
          )}

          {/* Civilité */}
          <div className="space-y-2">
            <Label>Civilité *</Label>
            <RadioGroup
              value={identite.civilite}
              onValueChange={(v) => set({ civilite: v as "M" | "Mme" })}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="civ-m" value="M" />
                <Label htmlFor="civ-m" className="cursor-pointer">M.</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="civ-mme" value="Mme" />
                <Label htmlFor="civ-mme" className="cursor-pointer">Mme</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Prénom / Nom */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={identite.prenom}
                onChange={(e) => set({ prenom: e.target.value })}
                placeholder="Jean"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={identite.nom}
                onChange={(e) => set({ nom: e.target.value })}
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse complète *</Label>
            <Input
              id="adresse"
              value={identite.adresse}
              onChange={(e) => set({ adresse: e.target.value })}
              placeholder="12 rue de la Paix, 75002 Paris"
            />
          </div>

          {/* Email / Tel */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={identite.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="jean@exemple.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone *</Label>
              <Input
                id="tel"
                type="tel"
                value={identite.telephone}
                onChange={(e) => set({ telephone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" disabled className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            onClick={next}
            disabled={!valid}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  );
}
