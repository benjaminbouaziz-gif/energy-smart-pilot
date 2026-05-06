import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { Sparkles, Receipt } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtKwh = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

export default function Step4Comparison() {
  const { result, facture, next } = useSimulator();

  if (!result || !facture) {
    return (
      <div className="container mx-auto px-4 mt-10 max-w-3xl text-center text-muted-foreground">
        Aucune simulation disponible. Reviens à l'étape précédente.
      </div>
    );
  }

  const fournisseur = facture.fournisseur || "Fournisseur actuel";
  const economieDynawatt = result.factureInitiale.ttc - result.dynawatt.ttc;
  const pctDyn = (economieDynawatt / result.factureInitiale.ttc) * 100;

  const monthly = result.monthlyData ?? [];
  const totals = monthly.reduce(
    (acc, m) => ({
      conso: acc.conso + m.consoMois,
      ancien: acc.ancien + m.coutAncienTtc,
      dyn: acc.dyn + m.coutDynawattTtc,
      eco: acc.eco + m.economieTotaleTtc,
    }),
    { conso: 0, ancien: 0, dyn: 0, eco: 0 }
  );

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-5xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 4 / 6</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Comparaison annuelle & mensuelle</h1>
          <p className="text-sm text-muted-foreground">
            Conso annuelle&nbsp;:{" "}
            <span className="text-primary-light font-bold">
              {fmtKwh(result.stats.consoAnnuelleKwh)} kWh
            </span>{" "}
            · Config&nbsp;:{" "}
            <span className="text-foreground font-bold">{result.config.nom}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card
            icon={<Receipt className="w-5 h-5" />}
            label={fournisseur}
            sub="Facture actuelle"
            value={fmt(result.factureInitiale.ttc)}
            tone="muted"
          />
          <Card
            icon={<Sparkles className="w-5 h-5" />}
            label="Sobry + Dynawatt"
            sub={`-${fmt(economieDynawatt)} (${pctDyn.toFixed(1)}%)`}
            value={fmt(result.dynawatt.ttc)}
            tone="gold"
            highlight
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8 text-center mb-8 relative overflow-hidden"
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 -z-10 opacity-25 blur-3xl rounded-full"
            style={{ background: "radial-gradient(circle, hsl(43 96% 56%), transparent 70%)" }}
          />
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Économie annuelle totale TTC
          </div>
          <div className="font-black text-5xl md:text-7xl text-gradient-gold font-mono mb-1">
            +{fmt(economieDynawatt)}
          </div>
          <div className="text-sm text-muted-foreground">
            Soit {pctDyn.toFixed(1)}% de votre facture · ROI&nbsp;:{" "}
            <span className="text-primary-light font-bold">{result.roi.paybackAns.toFixed(1)} ans</span>
          </div>
        </motion.div>

        {/* Tableau mensuel */}
        {monthly.length > 0 && (
          <div className="glass rounded-3xl p-5 md:p-7 mb-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
              Détail mensuel
            </div>
            <h2 className="text-xl md:text-2xl font-black mb-4">
              Mois par mois — {result.annualTotals.moisFavorables} mois favorables ·{" "}
              {result.annualTotals.moisDefavorables} défavorables
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: "Manrope, sans-serif" }}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-2 px-3">Mois</th>
                    <th className="text-right py-2 px-3">Conso (kWh)</th>
                    <th className="text-right py-2 px-3">{fournisseur}</th>
                    <th className="text-right py-2 px-3">Sobry+Dynawatt</th>
                    <th className="text-right py-2 px-3">Économie</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m) => (
                    <tr
                      key={m.month}
                      style={{
                        background: m.estMoisDefavorable ? "#FEE2E2" : "#FFFFFF",
                      }}
                      className="border-b border-border/40"
                    >
                      <td className="py-2 px-3 font-semibold">{m.monthName}</td>
                      <td className="text-right py-2 px-3 tabular-nums">{fmtKwh(m.consoMois)}</td>
                      <td className="text-right py-2 px-3 tabular-nums">{fmt(m.coutAncienTtc)}</td>
                      <td className="text-right py-2 px-3 tabular-nums">{fmt(m.coutDynawattTtc)}</td>
                      <td
                        className="text-right py-2 px-3 tabular-nums font-bold"
                        style={{ color: m.estMoisDefavorable ? "#EF4444" : "#22C55E" }}
                      >
                        {m.economieTotaleTtc >= 0 ? "+" : ""}
                        {fmt(m.economieTotaleTtc)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#F5F3FF" }} className="font-black text-base">
                    <td className="py-3 px-3">TOTAL</td>
                    <td className="text-right py-3 px-3 tabular-nums">{fmtKwh(totals.conso)}</td>
                    <td className="text-right py-3 px-3 tabular-nums">{fmt(totals.ancien)}</td>
                    <td className="text-right py-3 px-3 tabular-nums">{fmt(totals.dyn)}</td>
                    <td
                      className="text-right py-3 px-3 tabular-nums"
                      style={{ color: totals.eco >= 0 ? "#22C55E" : "#EF4444" }}
                    >
                      {totals.eco >= 0 ? "+" : ""}
                      {fmt(totals.eco)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.section>

      <WizardFooter onNext={next} nextLabel="Voir les animations" />
    </>
  );
}

function Card({
  icon,
  label,
  sub,
  value,
  tone,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: string;
  tone: "muted" | "primary" | "gold";
  highlight?: boolean;
}) {
  const toneClass =
    tone === "gold"
      ? "text-gold"
      : tone === "primary"
      ? "text-primary-light"
      : "text-muted-foreground";
  return (
    <div
      className={`rounded-3xl p-5 border-2 transition-all ${
        highlight
          ? "border-gold/60 bg-gold/5 shadow-[var(--shadow-gold)]"
          : "border-border bg-card/40"
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 ${toneClass}`}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-3xl font-black ${highlight ? "text-gradient-gold" : "text-foreground"}`}>{value}</div>
      <div className={`text-xs mt-1 font-mono ${toneClass}`}>{sub}</div>
    </div>
  );
}
