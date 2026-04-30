import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { simulateSavings, fmtEur, type SimulationInputs } from "@/lib/simulation";

const schema = z.object({
  activity: z.string().min(1, "Sélectionnez votre activité"),
  annualBudget: z.coerce.number().min(2000, "Minimum 2 000 €").max(500000),
  currentTariff: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  companyName: z.string().trim().min(1).max(150),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8, "Numéro invalide").max(25),
  postalCode: z.string().trim().min(4).max(10),
  hearAbout: z.string().optional(),
  hearAboutDistributor: z.string().max(120).optional(),
});

type FormData = z.infer<typeof schema>;

const ACTIVITIES = [
  { value: "restaurant", label: "Restaurant / Pizzeria" },
  { value: "hotel", label: "Hôtel / Restaurant hôtelier" },
  { value: "camping", label: "Camping" },
  { value: "bakery", label: "Boulangerie" },
  { value: "artisan", label: "Artisan / Atelier" },
  { value: "other", label: "Autre activité pro" },
];

export const ProForm = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateSavings> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { annualBudget: 15000, currentTariff: "TRV" } as Partial<FormData> as FormData,
  });

  const next = async () => {
    const fields: (keyof FormData)[][] = [
      ["activity"],
      ["annualBudget", "currentTariff"],
      ["firstName", "lastName", "companyName", "email", "phone", "postalCode"],
    ];
    const ok = await form.trigger(fields[step]);
    if (ok) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const inputs: SimulationInputs = { type: "pro", activity: data.activity, annualBudget: data.annualBudget };
    const sim = simulateSavings(inputs);
    try {
      const sourceLabel = data.hearAbout
        ? data.hearAbout === "distributeur" && data.hearAboutDistributor
          ? `pro_form|via:distributeur:${data.hearAboutDistributor}`
          : `pro_form|via:${data.hearAbout}`
        : "pro_form";
      const { error } = await supabase.from("leads").insert({
        type: "pro",
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        email: data.email,
        phone: data.phone,
        postal_code: data.postalCode,
        activity: data.activity,
        current_tariff: data.currentTariff,
        annual_budget_eur: data.annualBudget,
        estimated_savings_eur: Math.round(sim.annualSavings),
        recommended_config: sim.recommendedConfig.code,
        estimated_roi_years: sim.estimatedRoiYears,
        source: sourceLabel,
      });
      if (error) throw error;
      setResult(sim);
      setStep(3);
      toast.success("Simulation envoyée — nous vous contactons sous 24h");
    } catch (e) {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 md:p-10 max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i <= step ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < step || (i === 3 && result) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Quelle est votre activité ?</h3>
              <Select value={form.watch("activity")} onValueChange={(v) => form.setValue("activity", v, { shouldValidate: true })}>
                <SelectTrigger className="h-14 bg-input/50 border-primary/20"><SelectValue placeholder="Sélectionnez votre activité" /></SelectTrigger>
                <SelectContent>{ACTIVITIES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-2xl font-bold">Votre facture actuelle</h3>
              <div>
                <Label htmlFor="budget">Budget électrique annuel (€ TTC)</Label>
                <Input id="budget" type="number" {...form.register("annualBudget")} className="mt-2 h-12 bg-input/50 border-primary/20" />
                {form.formState.errors.annualBudget && <p className="text-destructive text-xs mt-1">{form.formState.errors.annualBudget.message}</p>}
              </div>
              <div>
                <Label>Tarif actuel</Label>
                <Select value={form.watch("currentTariff")} onValueChange={(v) => form.setValue("currentTariff", v, { shouldValidate: true })}>
                  <SelectTrigger className="mt-2 h-12 bg-input/50 border-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRV">Tarif Bleu (TRV)</SelectItem>
                    <SelectItem value="TJ">Tarif Jaune EDF</SelectItem>
                    <SelectItem value="MARCHE">Marché Pro</SelectItem>
                    <SelectItem value="AUTRE">Autre / je ne sais pas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Vos coordonnées</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom</Label><Input {...form.register("firstName")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
                <div><Label>Nom</Label><Input {...form.register("lastName")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              </div>
              <div><Label>Raison sociale</Label><Input {...form.register("companyName")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              <div><Label>Email pro</Label><Input type="email" {...form.register("email")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Téléphone</Label><Input {...form.register("phone")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
                <div><Label>Code postal</Label><Input {...form.register("postalCode")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              </div>
              <div>
                <Label>Comment avez-vous entendu parler de nous&nbsp;? <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                <Select value={form.watch("hearAbout") || ""} onValueChange={(v) => form.setValue("hearAbout", v)}>
                  <SelectTrigger className="mt-1.5 h-11 bg-input/50 border-primary/20"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internet">Recherche internet</SelectItem>
                    <SelectItem value="recommandation">Recommandation</SelectItem>
                    <SelectItem value="distributeur">Distributeur agréé</SelectItem>
                    <SelectItem value="salon">Salon professionnel</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.watch("hearAbout") === "distributeur" && (
                <div>
                  <Label>Nom du distributeur</Label>
                  <Input {...form.register("hearAboutDistributor")} placeholder="Nom de l'entreprise / contact" className="mt-1.5 h-11 bg-input/50 border-primary/20" />
                </div>
              )}
              {Object.values(form.formState.errors)[0] && (
                <p className="text-destructive text-xs">{Object.values(form.formState.errors)[0]?.message as string}</p>
              )}
            </div>
          )}

          {step === 3 && result && (
            <div className="text-center py-6">
              <div className="inline-flex w-16 h-16 rounded-full bg-gold/20 border border-gold/40 items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Voici votre estimation</h3>
              <p className="text-muted-foreground text-sm mb-6">Un conseiller vous recontacte sous 24h avec un audit détaillé.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Économies annuelles</div>
                  <div className="font-mono text-2xl font-black text-gradient-gold mt-1">{fmtEur(result.annualSavings)}</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Économies mensuelles</div>
                  <div className="font-mono text-2xl font-black text-gradient-gold mt-1">{fmtEur(result.monthlySavings)}</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Réduction</div>
                  <div className="font-mono text-2xl font-black text-primary-light mt-1">-{result.savingsPct.toFixed(0)}%</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Config recommandée</div>
                  <div className="font-mono text-base font-bold mt-1">{result.recommendedConfig.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{result.recommendedConfig.size}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Estimation basée sur vos déclarations. Audit personnalisé à venir.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <div className="mt-8 space-y-3">
          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />Retour
            </Button>
            {step < 2 ? (
              <Button onClick={next} className="bg-primary hover:bg-primary-dark">
                Suivant<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting} className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-bold">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : <>Calculer mes économies<ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            )}
          </div>
          {step === 2 && (
            <p className="text-xs text-muted-foreground text-center">
              Vous serez recontacté sous 48h par Dynawatt ou l'un de nos distributeurs agréés près de chez vous.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
