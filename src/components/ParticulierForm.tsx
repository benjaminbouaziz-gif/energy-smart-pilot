import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Waves, Snowflake, Flame, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { simulateSavings, fmtEur, type SimulationInputs } from "@/lib/simulation";

const schema = z.object({
  housingType: z.string().min(1),
  surface: z.coerce.number().min(20).max(2000),
  hasPool: z.boolean().default(false),
  hasAc: z.boolean().default(false),
  hasHeatPump: z.boolean().default(false),
  hasEv: z.boolean().default(false),
  region: z.string().min(1),
  monthlyBill: z.coerce.number().min(50).max(5000),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8).max(25),
  postalCode: z.string().trim().min(4).max(10),
});

type FormData = z.infer<typeof schema>;

const EQUIPMENTS = [
  { key: "hasPool" as const, label: "Piscine", icon: Waves },
  { key: "hasAc" as const, label: "Climatisation", icon: Snowflake },
  { key: "hasHeatPump" as const, label: "Pompe à chaleur", icon: Flame },
  { key: "hasEv" as const, label: "Véhicule électrique", icon: Car },
];

export const ParticulierForm = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateSavings> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { housingType: "maison", surface: 150, region: "sud", monthlyBill: 250, hasPool: false, hasAc: false, hasHeatPump: false, hasEv: false },
  });

  const next = async () => {
    const fields: (keyof FormData)[][] = [
      ["housingType", "surface", "region"],
      ["monthlyBill"],
      ["firstName", "lastName", "email", "phone", "postalCode"],
    ];
    const ok = await form.trigger(fields[step]);
    if (ok) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const inputs: SimulationInputs = {
      type: "particulier",
      annualBudget: data.monthlyBill * 12,
      hasPool: data.hasPool,
      hasAc: data.hasAc,
      hasHeatPump: data.hasHeatPump,
      hasEv: data.hasEv,
      surface: data.surface,
    };
    const sim = simulateSavings(inputs);
    try {
      const { error } = await supabase.from("leads").insert({
        type: "particulier",
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        postal_code: data.postalCode,
        housing_type: data.housingType,
        surface_m2: data.surface,
        has_pool: data.hasPool,
        has_ac: data.hasAc,
        has_heat_pump: data.hasHeatPump,
        has_ev: data.hasEv,
        region: data.region,
        annual_budget_eur: data.monthlyBill * 12,
        estimated_savings_eur: Math.round(sim.annualSavings),
        recommended_config: sim.recommendedConfig.code,
        estimated_roi_years: sim.estimatedRoiYears,
        source: "particulier_form",
      });
      if (error) throw error;
      setResult(sim);
      setStep(3);
      toast.success("Simulation envoyée — nous vous recontactons sous 24h");
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i <= step ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < step || (i === 3 && result) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <div className="space-y-5">
              <h3 className="text-2xl font-bold">Votre logement</h3>
              <div>
                <Label>Type de logement</Label>
                <Select value={form.watch("housingType")} onValueChange={(v) => form.setValue("housingType", v, { shouldValidate: true })}>
                  <SelectTrigger className="mt-2 h-12 bg-input/50 border-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maison">Maison individuelle</SelectItem>
                    <SelectItem value="villa">Villa avec piscine</SelectItem>
                    <SelectItem value="appartement">Appartement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Surface (m²)</Label>
                  <Input type="number" {...form.register("surface")} className="mt-2 h-12 bg-input/50 border-primary/20" />
                </div>
                <div>
                  <Label>Région</Label>
                  <Select value={form.watch("region")} onValueChange={(v) => form.setValue("region", v, { shouldValidate: true })}>
                    <SelectTrigger className="mt-2 h-12 bg-input/50 border-primary/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nord">Nord</SelectItem>
                      <SelectItem value="centre">Centre</SelectItem>
                      <SelectItem value="ouest">Ouest</SelectItem>
                      <SelectItem value="est">Est</SelectItem>
                      <SelectItem value="sud">Sud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-2xl font-bold">Vos équipements</h3>
              <p className="text-sm text-muted-foreground">Plus vous avez de charges flexibles, plus vous économisez.</p>
              <div className="grid grid-cols-2 gap-3">
                {EQUIPMENTS.map((e) => {
                  const checked = form.watch(e.key);
                  return (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => form.setValue(e.key, !checked as never)}
                      className={`glass rounded-xl p-4 text-left transition-all flex items-center gap-3 ${
                        checked ? "border-gold/60 bg-gold/10" : "hover:border-primary/40"
                      }`}
                    >
                      <e.icon className={`w-5 h-5 ${checked ? "text-gold" : "text-muted-foreground"}`} />
                      <span className="font-semibold flex-1">{e.label}</span>
                      <Checkbox checked={checked} className="pointer-events-none" />
                    </button>
                  );
                })}
              </div>
              <div>
                <Label>Facture mensuelle moyenne (€ TTC)</Label>
                <Input type="number" {...form.register("monthlyBill")} className="mt-2 h-12 bg-input/50 border-primary/20" />
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
              <div><Label>Email</Label><Input type="email" {...form.register("email")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Téléphone</Label><Input {...form.register("phone")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
                <div><Label>Code postal</Label><Input {...form.register("postalCode")} className="mt-1.5 h-11 bg-input/50 border-primary/20" /></div>
              </div>
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
              <h3 className="text-2xl font-bold mb-2">Votre estimation personnalisée</h3>
              <p className="text-muted-foreground text-sm mb-6">Un conseiller vous recontacte sous 24h.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Économies / an</div>
                  <div className="font-mono text-2xl font-black text-gradient-gold mt-1">{fmtEur(result.annualSavings)}</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Économies / mois</div>
                  <div className="font-mono text-2xl font-black text-gradient-gold mt-1">{fmtEur(result.monthlySavings)}</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Réduction</div>
                  <div className="font-mono text-2xl font-black text-primary-light mt-1">-{result.savingsPct.toFixed(0)}%</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Pack recommandé</div>
                  <div className="font-mono text-base font-bold mt-1">{result.recommendedConfig.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{result.recommendedConfig.size}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <div className="flex justify-between gap-3 mt-8">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />Retour
          </Button>
          {step < 2 ? (
            <Button onClick={next} className="bg-primary hover:bg-primary-dark">
              Suivant<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting} className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-bold">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : <>Réserver ma simulation<ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
