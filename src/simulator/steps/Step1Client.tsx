import { useState } from "react";
import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(150),
  email: z.string().trim().email("Email invalide").max(200),
  telephone: z
    .string()
    .trim()
    .regex(/^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/, "Téléphone français invalide"),
  pdl: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{14}$/, "Le PDL doit faire exactement 14 chiffres")),
  adresse: z.string().trim().min(5, "Adresse trop courte").max(500),
});

export default function Step1Client() {
  const { client, setClient, saveStep1, next } = useSimulator();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    const parsed = schema.safeParse(client);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await saveStep1();
      next();
    } catch (e: any) {
      toast.error("Erreur lors de la sauvegarde", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof client) => ({
    value: client[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setClient({ ...client, [key]: e.target.value }),
  });

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
            Étape 1 / 6
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Enregistrement client</h1>
          <p className="text-sm text-muted-foreground">
            Le pilotage qui dynamite la facture.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-5">
          <div>
            <Label htmlFor="nom">Nom de l'entreprise *</Label>
            <Input id="nom" {...field("nom")} placeholder="A&Y Catering" />
            {errors.nom && <p className="text-xs text-destructive mt-1">{errors.nom}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...field("email")} placeholder="contact@entreprise.fr" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="tel">Téléphone *</Label>
              <Input id="tel" {...field("telephone")} placeholder="06 12 34 56 78" />
              {errors.telephone && <p className="text-xs text-destructive mt-1">{errors.telephone}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="pdl">Numéro PDL (14 chiffres) *</Label>
            <Input
              id="pdl"
              value={client.pdl}
              onChange={(e) =>
                setClient({ ...client, pdl: e.target.value.replace(/\D/g, "").slice(0, 14) })
              }
              maxLength={14}
              placeholder="21527206882046"
              inputMode="numeric"
            />
            {errors.pdl && <p className="text-xs text-destructive mt-1">{errors.pdl}</p>}
          </div>
          <div>
            <Label htmlFor="adresse">Adresse du PDL *</Label>
            <Textarea
              id="adresse"
              value={client.adresse}
              onChange={(e) => setClient({ ...client, adresse: e.target.value })}
              placeholder="47 Avenue Galliéni, 93800 Épinay-sur-Seine"
              rows={2}
            />
            {errors.adresse && <p className="text-xs text-destructive mt-1">{errors.adresse}</p>}
          </div>
        </div>
      </motion.section>

      <WizardFooter
        onNext={handleNext}
        nextLabel={submitting ? "Enregistrement..." : "Démarrer la simulation"}
        nextDisabled={submitting}
        hidePrev
      />
    </>
  );
}
