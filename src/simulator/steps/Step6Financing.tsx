import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { CONSTANTES } from "@/lib/dynawatt-engine";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, Wallet, TrendingUp, CheckCircle2, FileDown, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RapportPDF from "@/pages/RapportPDF";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type Mode = "comptant" | "leasing";

export default function Step6Financing() {
  const { result, facture, simulationId, client, internalMode, prospectId, customPriceHT } = useSimulator();
  const HT = internalMode;
  const div = HT ? 1.2 : 1;
  const fmtMode = (n: number) => fmt(n / div);
  const suffix = HT ? "HT" : "TTC";
  const reportContainerRef = useRef<HTMLDivElement | null>(null);
  const [reportPayload, setReportPayload] = useState<any | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadReport = async () => {
    if (!result) {
      toast.error("Aucune simulation à exporter");
      return;
    }
    if (generatingPdf) return;
    setGeneratingPdf(true);
    const payload = {
      client,
      facture,
      result,
      date: new Date().toISOString(),
    };
    setReportPayload(payload);
    try {
      // Attendre que React rende l'overlay et que recharts dessine ses SVG
      await new Promise((r) => setTimeout(r, 1500));

      const container = reportContainerRef.current;
      if (!container) throw new Error("Conteneur du rapport introuvable");

      const pages = Array.from(container.querySelectorAll<HTMLElement>(".page"));
      if (pages.length === 0) throw new Error("Aucune page de rapport rendue");

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        const ratio = canvas.height / canvas.width;
        const imgHeight = pdfWidth * ratio;
        const finalH = Math.min(imgHeight, pdfHeight);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, finalH);
      }

      const safeName = (client?.nom || "client").replace(/[^\w\-]+/g, "_");
      pdf.save(`Rapport_Dynawatt_${safeName}.pdf`);
      toast.success("Rapport PDF téléchargé");
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur génération PDF : " + (e?.message ?? "inconnue"));
    } finally {
      setGeneratingPdf(false);
      setReportPayload(null);
    }
  };
  const [mode, setMode] = useState<Mode>("leasing");
  const [duree, setDuree] = useState<60 | 84>(60); // mois
  const [saved, setSaved] = useState(false);

  if (!result) {
    return (
      <div className="container mx-auto px-4 mt-10 max-w-3xl text-center text-muted-foreground">
        Aucune simulation. Reviens à l'étape précédente.
      </div>
    );
  }

  const config = result.config;
  const fournisseur = facture?.fournisseur || "ancien fournisseur";

  // Prix effectif : en mode interne, on respecte customPriceHT (custom prospect ou standard params).
  // En mode public, on utilise TOUJOURS les prix standards de CONFIGS (ignore tout custom).
  const prixHtEff = internalMode && customPriceHT != null ? customPriceHT : config.prix_ht;
  const prixTtcEff = prixHtEff * (1 + CONSTANTES.TVA);

  // Les 2 économies cumulées (TTC)
  const economieSobryTtc = result.factureInitiale.ttc - result.sobry.ttc;
  const economieBatterieTtc = result.roi.gainTtcAn;
  const economieTotaleTtc = economieSobryTtc + economieBatterieTtc; // = result.economieAnnuelleTtc

  const gainAnnuelTtc = economieTotaleTtc;
  const gainMensuelTtc = gainAnnuelTtc / 12;

  // Loyer mensuel HT = prix HT × coef × ajustement durée
  const coef = duree === 60 ? CONSTANTES.LEASING_COEF_MENSUEL : CONSTANTES.LEASING_COEF_MENSUEL * 0.78;
  const loyerHt = prixHtEff * coef;
  const loyerTtc = loyerHt * (1 + CONSTANTES.TVA);

  const cashflowMensuel = gainMensuelTtc - (mode === "leasing" ? loyerTtc : 0);

  // Cumul mois par mois sur 8 ans (96 mois)
  const horizon = 96;
  const cashflow = useMemo(() => {
    const arr: { mois: number; cumul: number; flux: number }[] = [];
    let cumul = mode === "comptant" ? -prixTtcEff : 0;
    for (let m = 1; m <= horizon; m++) {
      const flux =
        gainMensuelTtc - (mode === "leasing" && m <= duree ? loyerTtc : 0);
      cumul += flux;
      arr.push({ mois: m, cumul, flux });
    }
    return arr;
  }, [mode, duree, loyerTtc, gainMensuelTtc, prixTtcEff]);

  // Mois où on devient rentable (cumul ≥ 0)
  const breakevenMois = cashflow.find((c) => c.cumul >= 0)?.mois ?? null;

  // Résumé barres : gain / loyer / net (mensuel)
  const barData = [
    { name: "Gain mensuel", value: gainMensuelTtc, color: "hsl(var(--accent))" },
    { name: mode === "leasing" ? "Loyer mensuel" : "Pas de loyer", value: mode === "leasing" ? -loyerTtc : 0, color: "hsl(var(--muted-foreground))" },
    { name: "Cashflow net", value: cashflowMensuel, color: cashflowMensuel >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 60%)" },
  ];

  const handleSave = async () => {
    const financementPayload = {
      mode,
      duree_mois: duree,
      loyer_mensuel_ttc: loyerTtc,
      cashflow_mensuel_ttc: cashflowMensuel,
      breakeven_mois: breakevenMois,
    };

    // Sauvegarde dans simulations (parcours public)
    if (simulationId) {
      const { error } = await supabase
        .from("simulations")
        .update({
          statut: "finalisee",
          current_step: 6,
          facture_actuelle: { ...(result as any), financement: financementPayload } as any,
        })
        .eq("id", simulationId);
      if (error) {
        toast.error("Erreur de sauvegarde : " + error.message);
        return;
      }
    }

    // Sauvegarde dans le prospect (mode interne)
    if (internalMode && prospectId) {
      const { error } = await supabase
        .from("prospects")
        .update({
          resultats_simulation: {
            economie_annuelle: economieTotaleTtc,
            economie_annuelle_ht: economieTotaleTtc / 1.2,
            payback_annees: breakevenMois ? +(breakevenMois / 12).toFixed(1) : null,
            gain_8ans: cashflow[cashflow.length - 1].cumul,
            financement: financementPayload,
            full: result,
          } as any,
        })
        .eq("id", prospectId);
      if (error) {
        toast.error("Erreur sauvegarde prospect : " + error.message);
        return;
      }
    }

    setSaved(true);
    toast.success("Simulation enregistrée !");
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-5xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 6 / 6</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Financement & cashflow</h1>
          <p className="text-sm text-muted-foreground">
            Comparez achat comptant et leasing. Visualisez le cashflow net mois par mois.
          </p>
        </div>

        {/* Décomposition des 2 économies */}
        <div className="glass rounded-3xl p-5 md:p-7 mb-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-3">
            Vos économies annuelles ({suffix})
          </div>
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            <div className="rounded-2xl p-4 border border-border bg-card/40">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">
                Économie Sobry vs {fournisseur}
              </div>
              <div className="text-2xl font-black text-primary-light">{fmtMode(economieSobryTtc)}</div>
              <div className="text-xs text-muted-foreground mt-1">Dès le passage à Sobry</div>
            </div>
            <div className="rounded-2xl p-4 border border-border bg-card/40">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">
                Pilotage batterie Dynawatt
              </div>
              <div className="text-2xl font-black text-primary-light">{fmtMode(economieBatterieTtc)}</div>
              <div className="text-xs text-muted-foreground mt-1">Arbitrage horaire sur prix Sobry</div>
            </div>
            <div className="rounded-2xl p-4 border-2 border-gold/60 bg-gold/5 shadow-[var(--shadow-gold)]">
              <div className="text-xs font-mono uppercase tracking-widest mb-2 text-gold">
                Économie totale annuelle
              </div>
              <div className="text-3xl font-black text-gradient-gold">{fmtMode(economieTotaleTtc)}</div>
              <div className="text-xs text-muted-foreground mt-1">Base du cashflow ci-dessous</div>
            </div>
          </div>
        </div>

        {/* Switch mode */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Toggle active={mode === "comptant"} onClick={() => setMode("comptant")}>
            <Wallet className="w-4 h-4" /> Comptant — {fmtMode(config.prix_ttc)}
          </Toggle>
          <Toggle active={mode === "leasing"} onClick={() => setMode("leasing")}>
            <Banknote className="w-4 h-4" /> Leasing
          </Toggle>
        </div>

        {mode === "leasing" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mr-2">
              Durée
            </span>
            {([60, 84] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuree(d)}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                  duree === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {d} mois ({d / 12} ans)
              </button>
            ))}
          </div>
        )}

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Kpi
            label={`Gain mensuel ${suffix}`}
            value={fmtMode(gainMensuelTtc)}
            sub="économies pilotage Dynawatt"
            tone="gold"
          />
          {mode === "leasing" ? (
            <Kpi
              label={`Loyer mensuel ${suffix}`}
              value={fmtMode(loyerTtc)}
              sub={`sur ${duree} mois`}
              tone="muted"
            />
          ) : (
            <Kpi
              label="Investissement"
              value={fmtMode(config.prix_ttc)}
              sub="payé une seule fois"
              tone="muted"
            />
          )}
          <Kpi
            label="Cashflow net mensuel"
            value={fmtMode(cashflowMensuel)}
            sub={cashflowMensuel >= 0 ? "Positif dès le 1er mois 🎉" : "Effort mensuel"}
            tone={cashflowMensuel >= 0 ? "primary" : "muted"}
            highlight
          />
        </div>

        {/* Bar mensuel */}
        <div className="glass rounded-3xl p-5 md:p-7 mb-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
            Vue mensuelle
          </div>
          <h2 className="text-xl font-black mb-4">Décomposition cashflow</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v} €`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtMode(v), "Montant"]} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashflow cumulé */}
        <div className="glass rounded-3xl p-5 md:p-7 mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
            Cashflow cumulé sur 8 ans
          </div>
          <h2 className="text-xl font-black mb-1">Quand devenez-vous rentable ?</h2>
          {breakevenMois ? (
            <p className="text-sm text-muted-foreground mb-4">
              Point d'équilibre atteint au{" "}
              <span className="text-gold font-bold">mois {breakevenMois}</span> (
              {(breakevenMois / 12).toFixed(1)} ans).
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Cashflow positif dès le premier mois.
            </p>
          )}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
                <XAxis
                  dataKey="mois"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 12).toFixed(0)}a`}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [fmtMode(v), "Cumul"]}
                  labelFormatter={(m) => `Mois ${m} (${(Number(m) / 12).toFixed(1)} ans)`}
                />
                <ReferenceLine y={0} stroke="hsl(var(--accent))" strokeDasharray="4 4" />
                {breakevenMois && (
                  <ReferenceLine
                    x={breakevenMois}
                    stroke="hsl(var(--accent))"
                    strokeDasharray="4 4"
                    label={{ value: "Break-even", fill: "hsl(var(--accent))", fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="cumul"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Récap final */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 text-center relative overflow-hidden mb-8"
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 -z-10 opacity-25 blur-3xl rounded-full"
            style={{ background: "radial-gradient(circle, hsl(43 96% 56%), transparent 70%)" }}
          />
          <TrendingUp className="w-7 h-7 text-gold mx-auto mb-2" />
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Gain net cumulé sur 8 ans ({suffix})
          </div>
          <div className="font-black text-5xl md:text-6xl text-gradient-gold font-mono">
            {fmtMode(cashflow[cashflow.length - 1].cumul)}
          </div>
        </motion.div>

        {HT && (
          <p className="text-center text-xs text-muted-foreground -mt-4 mb-4">
            Tous les montants sont indiqués HT (récupération TVA pour pros)
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            disabled={generatingPdf}
            className="h-12 px-6 gap-2 border-2 border-primary/40 hover:border-primary"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Génération en cours…
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" /> Télécharger le rapport PDF
              </>
            )}
          </Button>
          <Button
            onClick={() => toast.info("Envoi par email — disponible prochainement")}
            variant="outline"
            className="h-12 px-6 gap-2 border-2 border-border"
          >
            <Mail className="w-5 h-5" /> Envoyer par email au client
          </Button>
          <Button
            onClick={handleSave}
            disabled={saved}
            className="bg-gradient-to-r from-gold to-accent-warm text-accent-foreground font-bold px-8 h-12 gap-2 shadow-[var(--shadow-gold)]"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Simulation enregistrée
              </>
            ) : (
              <>Finaliser & enregistrer la simulation</>
            )}
          </Button>
        </div>
      </motion.section>

      <WizardFooter />

      {/* Off-screen render du rapport pour capture html2canvas → PDF */}
      {reportPayload && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: "-100000px",
            top: 0,
            width: "210mm",
            background: "#ffffff",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <div ref={reportContainerRef}>
            <RapportPDF payloadProp={reportPayload} embed />
          </div>
        </div>
      )}
    </>
  );
}

const tooltipStyle = {
  background: "hsl(248 35% 16%)",
  border: "1px solid hsl(262 70% 70% / 0.3)",
  borderRadius: 12,
  fontSize: 12,
};

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-mono uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-glow)]"
          : "border-border text-muted-foreground hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "gold" | "primary" | "muted";
  highlight?: boolean;
}) {
  const color = tone === "gold" ? "text-gold" : tone === "primary" ? "text-primary-light" : "text-muted-foreground";
  return (
    <div
      className={`rounded-3xl p-5 border-2 transition-all ${
        highlight ? "border-gold/60 bg-gold/5 shadow-[var(--shadow-gold)]" : "border-border bg-card/40"
      }`}
    >
      <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${color}`}>
        {label}
      </div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
