import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell,
  PieChart, Pie,
} from "recharts";
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, Circle, Sparkles,
  TrendingDown, Battery, AlertTriangle, RefreshCw, Zap,
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
import { convertSobryFactureToMonthlyJsons } from "../lib/sobry-to-monthly-jsons";
import { buildFactureActuelle } from "../lib/facture-actuelle";
import { executerSimulation, CONFIGS, CONSTANTES } from "@/lib/dynawatt-engine-bis";

const VIOLET = "#7C3AED";
const MUTED = "#94A3B8";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtEur1 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(n);

const monthLabel = (m: string) => {
  const [, mo] = m.split("-");
  const names = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"];
  return names[Number(mo) - 1] ?? m;
};

type Phase = "form" | "loading" | "ready" | "error";

export default function Step5Comparaison() {
  const { data, updateData, prev, next } = useSimulateurSwitch();

  // Initial profil guess from Switchgrid (RES → Particulier, sinon Pro)
  const segmentSwitchgrid = (data.switchgrid?.contractInfo?.segment ?? "RES") as string;
  const profilAuto: "Particulier" | "Pro" = segmentSwitchgrid === "RES" ? "Particulier" : "Pro";

  // Override manuel par le commercial si Switchgrid se trompe
  const [profilOverride, setProfilOverride] = useState<"Particulier" | "Pro" | null>(
    data.sobryParams?.segment_client && data.sobryParams.segment_client !== profilAuto
      ? data.sobryParams.segment_client
      : null
  );
  const segment_client: "Particulier" | "Pro" = profilOverride ?? profilAuto;
  // FORCE: produit MOYEN imposé pour le Simulateur Switch (décision commerciale)
  const configBatterie: "PETIT" | "MOYEN" = "MOYEN";

  // Form state — kVA saisi par le commercial
  const [kva, setKva] = useState<number | "">(data.sobryParams?.kva ?? "");

  // Segment Enedis déduit du kVA (plus fiable que Switchgrid)
  const segment: "C5" | "C4" | null =
    typeof kva === "number" && kva > 0 ? (kva <= 36 ? "C5" : "C4") : null;

  const variantOptions = segment === "C4" ? (["CU", "LU"] as const) : (["CU4", "MU4"] as const);
  const [variante, setVariante] = useState<string>(data.sobryParams?.variante ?? variantOptions[0]);

  // Reset variante au défaut quand le segment bascule (C5 ↔ C4)
  useEffect(() => {
    if (!segment) return;
    const allowed = segment === "C4" ? ["CU", "LU"] : ["CU4", "MU4"];
    if (!allowed.includes(variante)) {
      setVariante(allowed[0]);
    }
  }, [segment]);

  const initialPhase: Phase = data.factureSobry && data.simulationResult ? "ready" : "form";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  useEffect(() => {
    if (data.factureSobry && data.simulationResult && phase !== "ready") setPhase("ready");
  }, [data.factureSobry, data.simulationResult]);

  const canSubmit = typeof kva === "number" && kva >= 3 && kva <= 249 && !!variante && !!segment;

  async function lancerSimulation() {
    setError(null);
    setPhase("loading");
    setLoadingStep(0);

    const lc = data.loadCurve;
    const sg = data.switchgrid;
    const tc = data.tarifConcurrent;
    if (!lc || !sg?.prm || !tc) {
      setError("Données manquantes (courbe de charge, PRM ou tarif). Reviens aux étapes précédentes.");
      setPhase("error");
      return;
    }

    const params = {
      kva: Number(kva),
      variante: variante as any,
      offre: "SoFlex" as const,
      segment_client,
      segment: segment as "C5" | "C4",
      configBatterie,
    };
    updateData({ sobryParams: params });

    try {
      // 1) Edge function (technical: sobry-calc-cost)
      setLoadingStep(1);
      console.log("[Step5] invoking sobry-calc-cost", {
        segment: params.segment,
        kva: params.kva,
        variante: params.variante,
        segment_client: params.segment_client,
        profilOverride,
        hourlyKwh_length: lc.hourlyKwh.length,
      });
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

      // 2) Build FactureActuelle
      const facture = buildFactureActuelle(tc, data.factureConcurrent);
      setLoadingStep(3);

      // 3) Convert and run simulation
      const monthlyJsons = convertSobryFactureToMonthlyJsons(factureSobry, sg.prm, { kva: params.kva });
      // FORCE: produit MOYEN imposé pour le Simulateur Switch (décision commerciale)
      const simulationResult = executerSimulation(monthlyJsons, "MOYEN", facture);
      setLoadingStep(4);

      updateData({ factureSobry, simulationResult });
      setPhase("ready");
    } catch (e: any) {
      console.error("[Step5] simulation error", e);
      setError(String(e?.message ?? e));
      setPhase("error");
    }
  }

  function reset() {
    updateData({ factureSobry: undefined, simulationResult: undefined });
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
            Tarif Dynamique + Batterie
          </span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Comparaison de la facture actuelle avec notre solution
        </p>
      </div>

      {phase === "form" && (
        <PhaseForm
          kva={kva} setKva={setKva}
          variante={variante} setVariante={setVariante}
          variantOptions={variantOptions as any}
          segment={segment}
          segmentClient={segment_client}
          profilOverride={profilOverride}
          setProfilOverride={setProfilOverride}
          configBatterie={configBatterie}
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

      {phase === "ready" && data.factureSobry && data.simulationResult && (
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
  segment: "C5" | "C4" | null;
  segmentClient: "Particulier" | "Pro";
  profilOverride: "Particulier" | "Pro" | null;
  setProfilOverride: (v: "Particulier" | "Pro" | null) => void;
  configBatterie: "PETIT" | "MOYEN";
  canSubmit: boolean;
  onPrev: () => void;
  onSubmit: () => void;
}) {
  const {
    kva, setKva, variante, setVariante, variantOptions,
    segment, segmentClient, profilOverride, setProfilOverride,
    configBatterie, canSubmit, onPrev, onSubmit,
  } = props;
  const [showProfilToggle, setShowProfilToggle] = useState(false);
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
        <CardDescription>Quelques infos sur la facture du prospect pour finaliser le calcul.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/15 text-primary border-primary/30">
              Profil : {segmentClient}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary"
              onClick={() => setShowProfilToggle((s) => !s)}
            >
              Pas le bon profil ?
            </Button>
            {segment ? (
              <Badge className="bg-gold/15 text-gold border-gold/30">
                Segment Enedis : {segment}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                Segment Enedis : à déterminer après saisie kVA
              </Badge>
            )}
            <Badge variant="outline" className="border-primary/40">
              Pack Batterie : {configBatterie}
            </Badge>
          </div>
          {showProfilToggle && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Forcer :</span>
              <Button
                type="button"
                size="sm"
                variant={segmentClient === "Particulier" ? "default" : "outline"}
                onClick={() => setProfilOverride("Particulier")}
                className="h-7"
              >
                Particulier
              </Button>
              <Button
                type="button"
                size="sm"
                variant={segmentClient === "Pro" ? "default" : "outline"}
                onClick={() => setProfilOverride("Pro")}
                className="h-7"
              >
                Pro
              </Button>
              {profilOverride !== null && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={() => setProfilOverride(null)}
                >
                  Réinit. auto
                </Button>
              )}
            </div>
          )}
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
            Visible sur la facture du prospect, généralement 3 à 36 kVA pour un Particulier ou un petit Pro,
            jusqu'à 249 kVA pour les Pro plus importants.
          </p>
        </div>

        {segment ? (
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
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Saisis le kVA pour afficher les variantes tarifaires disponibles.
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            <Sparkles className="w-4 h-4" /> Lancer la simulation
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
    "Lecture des prix horaires",
    "Application du Tarif Dynamique",
    "Optimisation de l'arbitrage Batterie",
    "Préparation de la comparaison",
  ];
  return (
    <Card className="rounded-3xl border-primary/20">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <h2 className="text-xl font-bold">Calcul de votre simulation en cours…</h2>
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
// PHASE C — Comparison
// ============================================================
function PhaseReady({ onPrev, onNext, onReset }: { onPrev: () => void; onNext: () => void; onReset: () => void }) {
  const { data } = useSimulateurSwitch();
  const sim = data.simulationResult!;
  const fc = data.factureConcurrent;
  const fs = data.factureSobry!;
  const sp = data.sobryParams!;
  const config = CONFIGS[sp.configBatterie];

  // ===== Headline numbers =====
  const actuelTtc: number = fc?.annual?.total_ttc ?? sim.factureInitiale.ttc;
  const dynawattTtc: number = sim.dynawatt.ttc;
  const sobryTtc: number = sim.sobry.ttc;
  const economieTotaleTtc = actuelTtc - dynawattTtc;
  const economiePct = actuelTtc > 0 ? (economieTotaleTtc / actuelTtc) * 100 : 0;

  const ecoTarifDynamique = actuelTtc - sobryTtc;
  const ecoBatterie = sobryTtc - dynawattTtc;

  const fournisseur = data.tarifConcurrent?.fournisseur || "votre fournisseur actuel";
  const structureLabel = data.tarifConcurrent?.structure === "BASE" ? "Base"
    : data.tarifConcurrent?.structure === "HC_HP" ? "HC-HP"
    : "Super-creuses";

  // ===== Monthly chart (2 series) =====
  const concurrentByMonth = new Map((fc?.monthly ?? []).map((m) => [m.month, m.total_ttc]));
  // monthlyData uses 1..12 month index. Build keys YYYY-MM by using current year fallback from fs.
  const monthsRef = (fs.monthly ?? []).map((m: any) => m.month).sort();
  const yearByMonthIdx = new Map<number, string>();
  for (const mk of monthsRef) {
    const [y, mo] = mk.split("-");
    yearByMonthIdx.set(Number(mo), y);
  }
  const chartData = (sim.monthlyData ?? []).map((md: any) => {
    const y = yearByMonthIdx.get(md.month) ?? new Date().getFullYear().toString();
    const monthKey = `${y}-${String(md.month).padStart(2, "0")}`;
    return {
      month: md.monthName.slice(0, 4),
      "Aujourd'hui": Math.round(concurrentByMonth.get(monthKey) ?? md.coutAncienTtc ?? 0),
      "Notre solution": Math.round(md.coutDynawattTtc ?? 0),
    };
  });

  // ===== Spread moyen (cycles) =====
  const spreadMoyenCentimesParKwh = 100 * (CONSTANTES.SPREAD_MIN + 0.04); // approx, on garde une valeur simple

  return (
    <div className="space-y-6">
      {/* ===== Double comparison ===== */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Card LEFT */}
        <Card className="rounded-3xl border-muted-foreground/30 bg-muted/10">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wide text-[10px] font-mono">Aujourd'hui</CardDescription>
            <CardTitle className="text-base">Chez {fournisseur}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-muted-foreground">{fmtEur(actuelTtc)}</div>
            <div className="text-xs text-muted-foreground mt-1">€ TTC / an</div>
            <div className="text-sm text-muted-foreground mt-3">
              Soit {fmtEur(actuelTtc / 12)} / mois en moyenne
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              Tarif {structureLabel} chez {fournisseur}.
            </p>
          </CardContent>
        </Card>

        {/* Card RIGHT */}
        <AnimatePresence>
          <motion.div
            key="solution"
            initial={{ opacity: 0, scale: 0.95, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.45, type: "spring", stiffness: 120 }}
          >
            <Card className="rounded-3xl border-2 border-primary shadow-[var(--shadow-glow)] relative h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gold text-accent-foreground border-gold">Notre solution</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase tracking-wide text-[10px] font-mono text-primary">
                  Tarif Dynamique + Batterie
                </CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <Battery className="w-4 h-4 text-primary" /> Pack {sp.configBatterie} inclus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-primary">{fmtEur(dynawattTtc)}</div>
                <div className="text-xs text-muted-foreground mt-1">€ TTC / an</div>
                {economieTotaleTtc > 0 ? (
                  <div className="mt-3 flex items-baseline gap-2 text-emerald-600 font-extrabold">
                    <TrendingDown className="w-6 h-6" />
                    <span className="text-2xl">−{fmtEur(economieTotaleTtc)} / an</span>
                    <span className="text-sm font-semibold">soit −{economiePct.toFixed(0)} % vs aujourd'hui</span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground">
                    +{fmtEur(Math.abs(economieTotaleTtc))} vs aujourd'hui
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-4 italic">
                  Pack Batterie {sp.configBatterie === "PETIT" ? "PETIT 18 kWh / 6 kW" : "MOYEN 28,8 kWh / 10 kW"} inclus.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== D'où vient l'économie ===== */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /> D'où vient l'économie ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20">
            <Zap className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Passage au Tarif Dynamique</div>
              <p className="text-xs text-muted-foreground">
                En quittant votre tarif actuel pour le tarif horaire indexé sur le marché.
              </p>
            </div>
            <div className={`font-bold whitespace-nowrap ${ecoTarifDynamique >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {ecoTarifDynamique >= 0 ? "+" : "−"}{fmtEur(Math.abs(ecoTarifDynamique))} / an
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20">
            <Battery className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Optimisation par la Batterie ({sp.configBatterie})</div>
              <p className="text-xs text-muted-foreground">
                Charge automatique aux heures basses, décharge aux heures de pointe.
                Spread moyen ≈ {spreadMoyenCentimesParKwh.toFixed(1)} c€/kWh.
              </p>
            </div>
            <div className="font-bold text-emerald-600 whitespace-nowrap">
              +{fmtEur(Math.max(0, ecoBatterie))} / an
            </div>
          </div>

          <div className="border-t pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Économie totale annuelle
            </div>
            <div className="text-emerald-600 font-extrabold text-lg">
              +{fmtEur(Math.max(0, economieTotaleTtc))} TTC / an
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Pack Batterie ===== */}
      <Card className="rounded-3xl border-gold/40 bg-gold/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Battery className="w-5 h-5 text-gold" /> Le pack Batterie</CardTitle>
          <CardDescription>
            {sp.configBatterie === "PETIT"
              ? "Pack PETIT — 18 kWh / 6 kW"
              : "Pack MOYEN — 28,8 kWh / 10 kW"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Metric label="Investissement Batterie" value={fmtEur(config.prix_ttc)} sub="€ TTC" />
            <Metric label="Économies annuelles brutes" value={fmtEur(sim.roi.gainTtcAn)} sub="€ TTC / an" />
            <Metric label="Économies nettes annuelles" value={fmtEur(sim.roi.gainNetAn)} sub="€ / an, après pertes & amortissement (8 ans)" />
            <Metric label="Retour sur investissement" value={`${sim.roi.paybackAns.toFixed(1)} ans`} />
            <Metric label="ROI sur 7 ans" value={fmtEur(sim.roi.roi7Ans)} />
            <Metric label="Cycles utilisés / jour" value={`${sim.stats.avgCyclesParJour.toFixed(2)} / ${CONSTANTES.PLAFOND_CYCLES_MOYEN}`} />
          </div>
        </CardContent>
      </Card>

      {/* ===== Mois par mois ===== */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Mois par mois</CardTitle>
          <CardDescription>Comparaison entre votre facture actuelle et notre solution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v)} €`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                  formatter={(v: number) => `${fmtEur(v)}`}
                />
                <Legend />
                <Bar dataKey="Aujourd'hui" fill={MUTED} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Notre solution" fill={VIOLET} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ===== Détails (Accordion) ===== */}
      <Accordion type="single" collapsible>
        <AccordionItem value="actuel">
          <AccordionTrigger>Détail facture actuelle</AccordionTrigger>
          <AccordionContent>
            <FactureActuelleDetail />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="batterie">
          <AccordionTrigger>Détail simulation Batterie</AccordionTrigger>
          <AccordionContent>
            <BatterieDetail sim={sim} configKey={sp.configBatterie} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ===== Navigation ===== */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button variant="ghost" onClick={onReset} className="gap-2 text-xs">
            <RefreshCw className="w-3 h-3" /> Recalculer
          </Button>
        </div>
        <Button
          onClick={onNext}
          className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
        >
          Voir l'animation <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-background/60 border p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-black">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function FactureActuelleDetail() {
  const { data } = useSimulateurSwitch();
  const fc = data.factureConcurrent;
  const tc = data.tarifConcurrent;
  if (!fc || !tc) return <p className="text-sm text-muted-foreground">Données indisponibles.</p>;

  const tva = (tc.tvaPct ?? 20) / 100;
  const aboAnHt = (tc.abonnementMensuelHt ?? 0) * 12;
  const variableHt = fc.annual.cost_variable_ht;
  const totalHt = fc.annual.total_ht;
  const tvaEur = totalHt * tva;
  const totalTtc = fc.annual.total_ttc;

  const repart = fc.repartition_horaire;
  const pieData = [
    { name: "HP", value: repart.heures_hp_kwh },
    { name: "HC", value: repart.heures_hc_kwh },
    ...(repart.heures_hsc_kwh ? [{ name: "HSC", value: repart.heures_hsc_kwh }] : []),
  ];
  const COLORS = ["#7C3AED", "#FBBF24", "#34D399"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Abonnement annuel HT</span><span>{fmtEur(aboAnHt)}</span></div>
        <div className="flex justify-between"><span>Conso variable HT</span><span>{fmtEur(variableHt)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold"><span>Total HT</span><span>{fmtEur(totalHt)}</span></div>
        <div className="flex justify-between"><span>TVA ({(tva * 100).toFixed(0)} %)</span><span>{fmtEur(tvaEur)}</span></div>
        <div className="flex justify-between border-t pt-2 font-bold"><span>Total TTC</span><span>{fmtEur(totalTtc)}</span></div>
      </div>
      {pieData.length > 1 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={60} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${Math.round(v)} kWh`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function BatterieDetail({ sim, configKey }: { sim: any; configKey: "PETIT" | "MOYEN" }) {
  const config = CONFIGS[configKey];
  const days1 = (sim.planJours ?? []).filter((d: any) => d.cycleCount === 1).length;
  const days2 = (sim.planJours ?? []).filter((d: any) => d.cycleCount === 2).length;
  const days0 = (sim.planJours ?? []).filter((d: any) => d.cycleCount === 0).length;
  const spreads: number[] = [];
  for (const d of sim.planJours ?? []) {
    if (d.cycle1) spreads.push(d.cycle1.spread);
    if (d.cycle2) spreads.push(d.cycle2.spread);
  }
  const avgSpread = spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <strong>Configuration retenue :</strong>{" "}
        {configKey === "PETIT" ? "PETIT 18 kWh / 6 kW" : "MOYEN 28,8 kWh / 10 kW"} —
        prix {fmtEur(config.prix_ttc)} TTC
      </div>
      <div>
        <strong>Cycles totaux annuels :</strong> {sim.stats.totalCyclesAn.toFixed(0)} (plafond annuel : {Math.round(CONSTANTES.PLAFOND_CYCLES_MOYEN * 365)})
      </div>
      <div>
        <strong>Cycles par jour moyen :</strong> {sim.stats.avgCyclesParJour.toFixed(2)} (plafond {CONSTANTES.PLAFOND_CYCLES_MOYEN})
      </div>
      <div>
        <strong>Spread moyen réalisé :</strong> {(avgSpread * 100).toFixed(2)} c€/kWh
      </div>
      <div>
        <strong>Plan annuel synthétique :</strong>
        <ul className="list-disc list-inside ml-2 mt-1 text-muted-foreground">
          <li>{days0} jours sans cycle</li>
          <li>{days1} jours à 1 cycle</li>
          <li>{days2} jours à 2 cycles</li>
        </ul>
      </div>
    </div>
  );
}
