import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Clock, MoonStar, Calculator } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSimulateurSwitch, SimulateurSwitchTarifConcurrent } from "../SimulateurSwitchContext";
import { computeFactureConcurrent } from "../lib/facture-concurrent";

const VIOLET = "#7C3AED";
const GOLD = "#FBBF24";
const ORANGE = "#FB923C";

type Structure = "BASE" | "HC_HP" | "SUPER_CREUSES";

const DEFAULTS: SimulateurSwitchTarifConcurrent = {
  fournisseur: "",
  structure: "BASE",
  abonnementMensuelHt: 0,
  tvaPct: 20,
  plageHcDebut: 22,
  plageHcFin: 6,
  plageHscDebut: 1,
  plageHscFin: 5,
};

function fmtEur(v: number, frac = 2) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

export default function Step4TarifConcurrent() {
  const { data, updateData, prev, next } = useSimulateurSwitch();
  const [tarif, setTarif] = useState<SimulateurSwitchTarifConcurrent>(
    () => ({ ...DEFAULTS, ...(data.tarifConcurrent ?? {}) })
  );
  const [calculating, setCalculating] = useState(false);

  // Sync local on external reset
  useEffect(() => {
    if (data.tarifConcurrent) setTarif({ ...DEFAULTS, ...data.tarifConcurrent });
  }, [data.tarifConcurrent?.structure]);

  const update = (patch: Partial<SimulateurSwitchTarifConcurrent>) => {
    setTarif((t) => {
      const next = { ...t, ...patch };
      updateData({ tarifConcurrent: next, factureConcurrent: undefined });
      return next;
    });
  };

  const setStructure = (s: Structure) => update({ structure: s });

  const isValid = useMemo(() => {
    const num = (v: any) => typeof v === "number" && !Number.isNaN(v) && v >= 0;
    if (!num(tarif.abonnementMensuelHt) || !num(tarif.tvaPct)) return false;
    if (tarif.structure === "BASE") return num(tarif.prixKwhHt) && (tarif.prixKwhHt as number) > 0;
    if (tarif.structure === "HC_HP") {
      return num(tarif.prixHpHt) && num(tarif.prixHcHt) &&
        num(tarif.plageHcDebut) && num(tarif.plageHcFin);
    }
    return num(tarif.prixHpHt) && num(tarif.prixHcHt) && num(tarif.prixHscHt) &&
      num(tarif.plageHcDebut) && num(tarif.plageHcFin) &&
      num(tarif.plageHscDebut) && num(tarif.plageHscFin);
  }, [tarif]);

  const handleCalc = () => {
    if (!data.loadCurve) return;
    setCalculating(true);
    setTimeout(() => {
      const facture = computeFactureConcurrent(data.loadCurve!, tarif);
      updateData({ tarifConcurrent: tarif, factureConcurrent: facture });
      setCalculating(false);
    }, 50);
  };

  const facture = data.factureConcurrent;
  const isManual = data.loadCurve?.source === "manual";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-5xl space-y-6"
    >
      <div className="text-center mb-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 4 / 8</div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Tarif actuel du prospect</h1>
        <p className="text-sm text-muted-foreground">Saisis le contrat actuel pour calculer ce qu'il paie aujourd'hui.</p>
      </div>

      <Alert className="border-primary/30">
        <AlertDescription>
          Les infos sont sur la facture du prospect : prix kWh, abonnement, plages horaires.
        </AlertDescription>
      </Alert>

      {/* Sélecteur structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StructureCard
          icon={<Zap className="w-6 h-6" />}
          title="Base"
          desc="Un seul prix kWh 24h/24"
          sub="C5 résidentiel ou petit Pro"
          active={tarif.structure === "BASE"}
          onClick={() => setStructure("BASE")}
        />
        <StructureCard
          icon={<Clock className="w-6 h-6" />}
          title="Heures Pleines / Creuses"
          desc="Prix HP + HC + plages"
          sub="C5 option HC/HP"
          active={tarif.structure === "HC_HP"}
          onClick={() => setStructure("HC_HP")}
        />
        <StructureCard
          icon={<MoonStar className="w-6 h-6" />}
          title="Super Heures Creuses"
          desc="HP + HC + HSC + 2 plages"
          sub="Engie Pro Tempo, TotalEnergies..."
          active={tarif.structure === "SUPER_CREUSES"}
          onClick={() => setStructure("SUPER_CREUSES")}
        />
      </div>

      {/* Formulaire */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Détails du contrat</CardTitle>
          <CardDescription>Tous les prix sont en € HT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Fournisseur (optionnel)">
              <Input
                value={tarif.fournisseur ?? ""}
                onChange={(e) => update({ fournisseur: e.target.value })}
                placeholder="EDF, Engie, TotalEnergies..."
              />
            </Field>
            <Field label="Abonnement mensuel HT (€)">
              <Input
                type="number" step="0.01" min={0}
                value={tarif.abonnementMensuelHt || ""}
                onChange={(e) => update({ abonnementMensuelHt: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="TVA (%)">
              <Input
                type="number" step="0.1" min={0}
                value={tarif.tvaPct}
                onChange={(e) => update({ tvaPct: parseFloat(e.target.value) || 0 })}
              />
            </Field>
          </div>

          {tarif.structure === "BASE" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Prix kWh HT (€)">
                <Input type="number" step="0.0001" min={0}
                  value={tarif.prixKwhHt ?? ""}
                  onChange={(e) => update({ prixKwhHt: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>
          )}

          {(tarif.structure === "HC_HP" || tarif.structure === "SUPER_CREUSES") && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Prix HP HT (€/kWh)">
                  <Input type="number" step="0.0001" min={0}
                    value={tarif.prixHpHt ?? ""}
                    onChange={(e) => update({ prixHpHt: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Prix HC HT (€/kWh)">
                  <Input type="number" step="0.0001" min={0}
                    value={tarif.prixHcHt ?? ""}
                    onChange={(e) => update({ prixHcHt: parseFloat(e.target.value) || 0 })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Heure début HC (0-23)">
                  <Input type="number" min={0} max={23} step={1}
                    value={tarif.plageHcDebut ?? 22}
                    onChange={(e) => update({ plageHcDebut: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="Heure fin HC (0-23)">
                  <Input type="number" min={0} max={23} step={1}
                    value={tarif.plageHcFin ?? 6}
                    onChange={(e) => update({ plageHcFin: parseInt(e.target.value) || 0 })} />
                </Field>
              </div>
            </>
          )}

          {tarif.structure === "SUPER_CREUSES" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Prix HSC HT (€/kWh)">
                  <Input type="number" step="0.0001" min={0}
                    value={tarif.prixHscHt ?? ""}
                    onChange={(e) => update({ prixHscHt: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Heure début HSC (0-23)">
                  <Input type="number" min={0} max={23} step={1}
                    value={tarif.plageHscDebut ?? 1}
                    onChange={(e) => update({ plageHscDebut: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="Heure fin HSC (0-23)">
                  <Input type="number" min={0} max={23} step={1}
                    value={tarif.plageHscFin ?? 5}
                    onChange={(e) => update({ plageHscFin: parseInt(e.target.value) || 0 })} />
                </Field>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              onClick={handleCalc}
              disabled={!isValid || calculating || !data.loadCurve}
              className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
            >
              <Calculator className="w-4 h-4" />
              {calculating ? "Calcul..." : "Calculer la facture du fournisseur actuel"}
            </Button>
            {isManual && (
              <p className="text-xs text-muted-foreground mt-2">
                Mode manuel : précision dégradée (répartition standard 70/30 HP/HC).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Récap facture */}
      {facture && (
        <Card className="rounded-3xl border-gold/40 bg-gold/5 shadow-[var(--shadow-gold)]">
          <CardHeader>
            <CardTitle>Facture annuelle estimée</CardTitle>
            <CardDescription>Sur la base du contrat saisi et de la conso analysée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-4xl font-black text-foreground">
                  {fmtEur(facture.annual.total_ttc)} <span className="text-lg text-muted-foreground">€ TTC</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ({fmtEur(facture.annual.total_ht)} € HT)
                </div>
                <div className="mt-3 text-sm">
                  Soit <strong>{fmtEur(facture.annual.total_ttc / 12)} € / mois</strong> en moyenne.
                </div>
                <div className="text-sm mt-2">
                  Coût variable : <strong>{fmtEur(facture.annual.cost_variable_ht)} €</strong> &nbsp;|&nbsp;
                  Coût fixe : <strong>{fmtEur(facture.annual.cost_fixe_ht)} €</strong>
                </div>
                <div className="text-sm mt-1">
                  Prix moyen : <strong>{fmtEur(facture.annual.prix_moyen_eur_kwh_ttc, 4)} €/kWh TTC</strong>
                </div>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { slot: "HP", kwh: facture.repartition_horaire.heures_hp_kwh, fill: VIOLET },
                      { slot: "HC", kwh: facture.repartition_horaire.heures_hc_kwh, fill: GOLD },
                      ...(facture.repartition_horaire.heures_hsc_kwh !== undefined
                        ? [{ slot: "HSC", kwh: facture.repartition_horaire.heures_hsc_kwh, fill: ORANGE }]
                        : []),
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="slot" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kWh`} />
                    <Bar dataKey="kwh" radius={[8, 8, 0, 0]}>
                      {[VIOLET, GOLD, ORANGE].slice(0, facture.repartition_horaire.heures_hsc_kwh !== undefined ? 3 : 2).map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={prev} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Button>
        <Button
          onClick={next}
          disabled={!facture}
          className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
        >
          Suivant <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StructureCard({
  icon, title, desc, sub, active, onClick,
}: { icon: React.ReactNode; title: string; desc: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left rounded-3xl p-5 border-2 transition-all",
        active
          ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
          : "border-border bg-card hover:border-primary/40",
      ].join(" ")}
    >
      <div className={["inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
        {icon}
      </div>
      <div className="font-bold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>
    </button>
  );
}
