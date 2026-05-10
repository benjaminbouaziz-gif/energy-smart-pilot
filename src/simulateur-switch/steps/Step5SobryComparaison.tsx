import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, Circle, Sparkles,
  TrendingDown, Battery, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useSimulateurSwitch } from "../SimulateurSwitchContext";
import { supabase } from "@/integrations/supabase/client";
import { convertSobryFactureToParsed } from "../lib/sobry-to-parsed";
import { simulateBattery } from "../lib/battery-simulation";

const VIOLET = "#7C3AED";
const GOLD = "#FBBF24";
const MUTED = "#94A3B8";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const monthLabel = (m: string) => {
  const [, mo] = m.split("-");
  const names = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"];
  return names[Number(mo) - 1] ?? m;
};

type Phase = "form" | "loading" | "ready" | "error";

export default function Step5SobryComparaison() {
  const { data, updateData, prev, next } = useSimulateurSwitch();

  const segmentEnedis: "C5" | "C4" = useMemo(() => {
    const seg = data.switchgrid?.contractInfo?.segment ?? "";
    return seg === "C4" ? "C4" : "C5";
  }, [data.switchgrid]);

  const segmentClient: "Particulier" | "Pro" = data.identite?.estPro ? "Pro" : "Particulier";

  // Form state
  const [kva, setKva] = useState<number | "">(data.sobryParams?.kva ?? "");
  const variantOptions = segmentEnedis === "C5" ? (["CU4", "MU4"] as const) : (["CU", "LU"] as const);
  const [variante, setVariante] = useState<string>(data.sobryParams?.variante ?? variantOptions[0]);

  // Phase: derive from existing state
  const initialPhase: Phase = data.factureSobry && data.factureSobryAvecBatterie ? "ready" : "form";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Reset phase if user clears state externally
  useEffect(() => {
    if (data.factureSobry && data.factureSobryAvecBatterie && phase !== "ready") setPhase("ready");
  }, [data.factureSobry, data.factureSobryAvecBatterie]);

  const canSubmit = typeof kva === "number" && kva >= 3 && kva <= 249 && !!variante;

  async function lancerSimulation() {
    setError(null);
    setPhase("loading");
    setLoadingStep(0);

    const lc = data.loadCurve;
    const sg = data.switchgrid;
    if (!lc || !sg?.prm) {
      setError("Données de courbe de charge ou PRM manquantes. Reviens à l'étape 2.");
      setPhase("error");
      return;
    }

    const params = {
      kva: Number(kva),
      variante: variante as any,
      offre: "SoFlex" as const,
      segment_client: segmentClient,
      segment: segmentEnedis,
    };
    updateData({ sobryParams: params });

    try {
      // 1) Edge function
      setLoadingStep(1);
      const { data: result, error: fnErr } = await supabase.functions.invoke("sobry-calc-cost", {
        body: {
          prm: sg.prm,
          segment: params.segment,
          kva: params.kva,
          variante: params.variante,
          offre: params.offre,
          segment_client: params.segment_client,
          windowStart: lc.windowStart,
          windowEnd: lc.windowEnd,
          hourlyKwh: lc.hourlyKwh,
        },
      });
      if (fnErr) throw new Error(fnErr.message || "Erreur Edge Function");
      if (!result || (result as any).error) throw new Error((result as any)?.message || "Réponse invalide");

      const factureSobry = result as any;
      setLoadingStep(2);

      // 2) Battery simulation
      const parsed = convertSobryFactureToParsed(factureSobry, sg.prm);
      setLoadingStep(3);

      const monthlyTtc = (factureSobry.monthly ?? []).map((m: any) => ({
        month: m.month, total_ttc: Number(m.total_ttc ?? 0),
      }));
      const battery = simulateBattery(parsed, Number(factureSobry.annual.total_ttc), monthlyTtc);
      setLoadingStep(4);

      updateData({
        factureSobry,
        factureSobryAvecBatterie: {
          configKey: battery.configKey,
          annual: battery.annual,
          monthly: battery.monthly,
          simulationResult: battery.simulationResult,
        },
      });

      setPhase("ready");
    } catch (e: any) {
      console.error("[Step5] simulation error", e);
      setError(String(e?.message ?? e));
      setPhase("error");
    }
  }

  function reset() {
    updateData({ factureSobry: undefined, factureSobryAvecBatterie: undefined });
    setPhase("form");
    setError(null);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-6xl"
    >
      <div className="text-center mb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
          Étape 5 / 7
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Comparaison Sobry
          </span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Confronte le tarif actuel à Sobry SoFlex et à Sobry + batterie
        </p>
      </div>

      {phase === "form" && (
        <PhaseForm
          kva={kva} setKva={setKva}
          variante={variante} setVariante={setVariante}
          variantOptions={variantOptions}
          segmentEnedis={segmentEnedis}
          segmentClient={segmentClient}
          canSubmit={canSubmit}
          onPrev={prev}
          onSubmit={lancerSimulation}
        />
      )}

      {phase === "loading" && <PhaseLoading currentStep={loadingStep} />}

      {phase === "error" && (
        <Card className="rounded-3xl border-destructive/40">
          <CardContent className="p-6 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Erreur lors du calcul</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <Button variant="outline" onClick={prev}><ChevronLeft className="w-4 h-4 mr-2" /> Précédent</Button>
              <Button onClick={() => setPhase("form")} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "ready" && data.factureSobry && data.factureSobryAvecBatterie && (
        <PhaseReady onPrev={prev} onNext={next} onReset={reset} />
      )}
    </motion.section>
  );
}

// ============================================================
// PHASE A — Form
// ============================================================
function PhaseForm(props: {
  kva: number | "";
  setKva: (v: number | "") => void;
  variante: string;
  setVariante: (v: string) => void;
  variantOptions: readonly string[];
  segmentEnedis: "C5" | "C4";
  segmentClient: "Particulier" | "Pro";
  canSubmit: boolean;
  onPrev: () => void;
  onSubmit: () => void;
}) {
  const { kva, setKva, variante, setVariante, variantOptions, segmentEnedis, segmentClient, canSubmit, onPrev, onSubmit } = props;
  const variantLabels: Record<string, { label: string; sub?: string }> = {
    CU4: { label: "Courte Utilisation 4 postes (CU4)" },
    MU4: { label: "Moyenne Utilisation 4 postes (MU4)" },
    CU: { label: "Courte Utilisation (CU) — moins de 2200h équivalentes / an", sub: "Commerce, restaurant, bureaux, hôtel" },
    LU: { label: "Longue Utilisation (LU) — plus de 2200h équivalentes / an", sub: "Industrie 24/7, datacenter" },
  };

  return (
    <Card className="rounded-3xl border-primary/20 shadow-[var(--shadow-glow)]">
      <CardHeader>
        <CardTitle>Détail du contrat actuel</CardTitle>
        <CardDescription>Quelques infos sur la facture du prospect pour finaliser le calcul Sobry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/30">Segment Enedis : {segmentEnedis}</Badge>
          <Badge className="bg-gold/15 text-gold border-gold/30">Profil : {segmentClient}</Badge>
          <Badge variant="outline">Offre Sobry : SoFlex</Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kva">Puissance souscrite (kVA)</Label>
          <Input
            id="kva" type="number" min={3} max={249} placeholder="ex : 9"
            value={kva}
            onChange={(e) => {
              const v = e.target.value;
              setKva(v === "" ? "" : Number(v));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Visible sur la facture du prospect. Généralement 3 à 36 kVA pour un Particulier ou un petit Pro,
            jusqu'à 249 kVA pour les Pro plus importants.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Variante tarifaire</Label>
          <RadioGroup value={variante} onValueChange={setVariante}>
            {variantOptions.map((v) => (
              <div key={v} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition">
                <RadioGroupItem value={v} id={`variant-${v}`} className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor={`variant-${v}`} className="font-medium cursor-pointer">{variantLabels[v]?.label ?? v}</Label>
                  {variantLabels[v]?.sub && (
                    <p className="text-xs text-muted-foreground">{variantLabels[v].sub}</p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Visible sur la facture, mention « Courte Utilisation » ou « Longue Utilisation ».
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            <Sparkles className="w-4 h-4" /> Lancer la simulation Sobry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PHASE B — Loading
// ============================================================
function PhaseLoading({ currentStep }: { currentStep: number }) {
  const steps = [
    "Lecture des prix EPEX horaires",
    "Application de la grille Sobry (TURPE, taxes, marge, plafonds)",
    "Simulation de la batterie pour optimiser",
    "Préparation de la comparaison",
  ];
  return (
    <Card className="rounded-3xl border-primary/20">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <h2 className="text-xl font-bold">Calcul de la facture Sobry en cours…</h2>
        </div>
        <ul className="space-y-3">
          {steps.map((s, i) => {
            const done = currentStep > i;
            const active = currentStep === i + 1 || (currentStep === 0 && i === 0);
            return (
              <li key={s} className={`flex items-start gap-3 text-sm ${done ? "text-primary" : active ? "text-foreground" : "text-muted-foreground"}`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : active ? (
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{s}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PHASE C — Triple comparison
// ============================================================
function PhaseReady({ onPrev, onNext, onReset }: { onPrev: () => void; onNext: () => void; onReset: () => void }) {
  const { data } = useSimulateurSwitch();
  const fc = data.factureConcurrent;
  const fs = data.factureSobry!;
  const fb = data.factureSobryAvecBatterie!;

  const concurrentTtc = fc?.annual?.total_ttc ?? 0;
  const sobryTtc = fs.annual.total_ttc;
  const battTtc = fb.annual.total_ttc_apres_batterie;

  const ecoSobry = concurrentTtc - sobryTtc;
  const ecoBatt = concurrentTtc - battTtc;

  // Build merged monthly chart data
  const months = fs.monthly.map((m) => m.month);
  const concurrentByMonth = new Map((fc?.monthly ?? []).map((m) => [m.month, m.total_ttc]));
  const battByMonth = new Map(fb.monthly.map((m) => [m.month, m.total_ttc_apres_batterie]));
  const chartData = months.map((m) => ({
    month: monthLabel(m),
    Actuel: Math.round(concurrentByMonth.get(m) ?? 0),
    Sobry: Math.round(fs.monthly.find((x) => x.month === m)?.total_ttc ?? 0),
    "Sobry+Batterie": Math.round(battByMonth.get(m) ?? 0),
  }));

  const fournisseur = data.tarifConcurrent?.fournisseur || "votre fournisseur actuel";

  return (
    <div className="space-y-6">
      {/* Triple comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <Card className="rounded-3xl border-muted-foreground/30 bg-muted/10">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wide text-[10px] font-mono">Aujourd'hui</CardDescription>
            <CardTitle className="text-base">Chez {fournisseur}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-muted-foreground">{fmtEur(concurrentTtc)}</div>
            <div className="text-xs text-muted-foreground mt-1">€ TTC / an</div>
            <div className="text-xs text-muted-foreground mt-2">
              Soit {fmtEur(concurrentTtc / 12)} / mois en moyenne
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              Tarif {data.tarifConcurrent?.structure ?? "—"} chez {fournisseur}.
            </p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="rounded-3xl border-2 border-primary shadow-[var(--shadow-glow)] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gold text-accent-foreground border-gold">Recommandé</Badge>
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wide text-[10px] font-mono text-primary">Avec Sobry</CardDescription>
            <CardTitle className="text-base">SoFlex</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{fmtEur(sobryTtc)}</div>
            <div className="text-xs text-muted-foreground mt-1">€ TTC / an</div>
            {ecoSobry > 0 ? (
              <div className="mt-3 flex items-center gap-1 text-emerald-600 font-bold">
                <TrendingDown className="w-4 h-4" /> −{fmtEur(ecoSobry)} / an
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">
                +{fmtEur(Math.abs(ecoSobry))} vs actuel
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              Tarif Spot Day-Ahead avec plafond SoFlex.
            </p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="rounded-3xl border-2 border-gold bg-gold/5">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wide text-[10px] font-mono text-gold">Sobry + Batterie</CardDescription>
            <CardTitle className="text-base flex items-center gap-2">
              <Battery className="w-4 h-4" /> Optimisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gold">{fmtEur(battTtc)}</div>
            <div className="text-xs text-muted-foreground mt-1">€ TTC / an</div>
            {ecoBatt > 0 && (
              <div className="mt-3 flex items-center gap-1 text-emerald-600 font-extrabold text-lg">
                <TrendingDown className="w-5 h-5" /> −{fmtEur(ecoBatt)} / an
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              ROI batterie : {Number.isFinite(fb.annual.retour_sur_investissement_ans)
                ? `${fb.annual.retour_sur_investissement_ans.toFixed(1)} ans`
                : "n/a"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle>Évolution mois par mois</CardTitle>
          <CardDescription>Comparaison des 3 scénarios (€ TTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  formatter={(v: number) => fmtEur(v)}
                />
                <Legend />
                <Bar dataKey="Actuel" fill={MUTED} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sobry" fill={VIOLET} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sobry+Batterie" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Details accordion */}
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle>Détails des calculs</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="concurrent">
              <AccordionTrigger>Détail facture actuelle</AccordionTrigger>
              <AccordionContent>
                {fc ? (
                  <div className="text-sm space-y-1">
                    <Row k="Conso annuelle" v={`${Math.round(fc.annual.conso_kwh).toLocaleString("fr-FR")} kWh`} />
                    <Row k="Coût variable HT" v={fmtEur(fc.annual.cost_variable_ht)} />
                    <Row k="Coût fixe HT (abonnement)" v={fmtEur(fc.annual.cost_fixe_ht)} />
                    <Row k="Total HT" v={fmtEur(fc.annual.total_ht)} />
                    <Row k="Total TTC" v={fmtEur(fc.annual.total_ttc)} highlight />
                    <Row k="Prix moyen TTC" v={`${fc.annual.prix_moyen_eur_kwh_ttc.toFixed(4)} €/kWh`} />
                  </div>
                ) : <div className="text-sm text-muted-foreground">Aucune facture concurrent saisie.</div>}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sobry">
              <AccordionTrigger>Détail facture Sobry SoFlex</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-1">
                  <Row k="Conso annuelle" v={`${Math.round(fs.annual.conso_kwh).toLocaleString("fr-FR")} kWh`} />
                  <Row k="Coût variable HT" v={fmtEur(fs.annual.cost_variable_ht)} />
                  <Row k="Coût fixe HT (abo + acheminement + CTA)" v={fmtEur(fs.annual.cost_fixe_ht)} />
                  <Row k="Total HT" v={fmtEur(fs.annual.total_ht)} />
                  <Row k="Total TTC" v={fmtEur(fs.annual.total_ttc)} highlight />
                  <Row k="Prix moyen TTC" v={`${fs.annual.prix_moyen_eur_kwh_ttc.toFixed(4)} €/kWh`} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="batterie">
              <AccordionTrigger>Détail simulation batterie</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-1">
                  <Row k="Configuration retenue" v={fb.configKey === "PETIT" ? "PETIT (18 kWh / 6 kW)" : "MOYEN (28,8 kWh / 10 kW)"} />
                  <Row k="Investissement TTC" v={fmtEur(fb.annual.prix_batterie_ttc)} />
                  <Row k="Économies annuelles TTC" v={fmtEur(fb.annual.economies_annuelles_ttc)} highlight />
                  <Row k="ROI" v={Number.isFinite(fb.annual.retour_sur_investissement_ans)
                    ? `${fb.annual.retour_sur_investissement_ans.toFixed(1)} ans`
                    : "n/a"} />
                  {fb.annual.cycles_par_jour_moyen != null && (
                    <Row k="Cycles moyens / jour" v={fb.annual.cycles_par_jour_moyen.toFixed(2)} />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onReset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Recalculer
          </Button>
          <Button
            onClick={onNext}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            Voir l'animation <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 ${highlight ? "font-bold text-primary" : ""}`}>
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
