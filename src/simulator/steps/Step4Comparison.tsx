import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, Receipt } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

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
  const data = [
    { name: fournisseur, ttc: result.factureInitiale.ttc, color: "hsl(var(--muted-foreground))" },
    { name: "Sobry + Dynawatt", ttc: result.dynawatt.ttc, color: "hsl(var(--gold))" },
  ];

  const economieDynawatt = result.factureInitiale.ttc - result.dynawatt.ttc;
  const pctDyn = (economieDynawatt / result.factureInitiale.ttc) * 100;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-5xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 4 / 6</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Comparaison des 3 scénarios</h1>
          <p className="text-sm text-muted-foreground">
            Conso annuelle&nbsp;:{" "}
            <span className="text-primary-light font-bold">
              {result.stats.consoAnnuelleKwh.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kWh
            </span>{" "}
            · Config&nbsp;:{" "}
            <span className="text-foreground font-bold">{result.config.nom}</span>
          </p>
        </div>

        {/* Cards 2 niveaux */}
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

        {/* Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-3xl p-5 md:p-7"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
            Coût annuel TTC
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-4">Visualisation comparative</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(248 35% 16%)",
                    border: "1px solid hsl(262 70% 70% / 0.3)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [fmt(v), "Coût TTC"]}
                />
                <Bar dataKey="ttc" radius={[12, 12, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Récap big number */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
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
            Soit {pctDyn.toFixed(1)}% de votre facture actuelle ·{" "}
            ROI&nbsp;: <span className="text-primary-light font-bold">{result.roi.paybackAns.toFixed(1)} ans</span>
          </div>
        </motion.div>
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
      <div className="text-3xl font-black">{value}</div>
      <div className={`text-xs mt-1 font-mono ${toneClass}`}>{sub}</div>
    </div>
  );
}
