import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { generateDailySavings, aggregateMonthly, type DailySaving } from "@/app/mock/savings";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, FileText, Coins, Calendar, ChevronDown } from "lucide-react";
import { useCountUp } from "@/app/hooks/useCountUp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { demoClient } from "@/app/mock/client";

const fmt = (n: number, d = 0) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;

type Period = "7d" | "30d" | "90d" | "all";
type Reference = "trv" | "tempo" | "jaune" | "all";

export default function Economies() {
  const allSavings = useMemo(() => generateDailySavings(120), []);
  const [period, setPeriod] = useState<Period>("30d");
  const [reference, setReference] = useState<Reference>("trv");

  const filtered = useMemo(() => {
    if (period === "7d") return allSavings.slice(-7);
    if (period === "30d") return allSavings.slice(-30);
    if (period === "90d") return allSavings.slice(-90);
    return allSavings;
  }, [allSavings, period]);

  const monthly = useMemo(() => aggregateMonthly(filtered), [filtered]);

  const totals = useMemo(() => {
    const trv = filtered.reduce((a, b) => a + b.costTrvEur, 0);
    const tempo = filtered.reduce((a, b) => a + b.costTempoEur, 0);
    const jaune = filtered.reduce((a, b) => a + b.costTarifJauneEur, 0);
    const actual = filtered.reduce((a, b) => a + b.costActualEur, 0);
    const refMap = { trv, tempo, jaune, all: trv };
    const refTotal = refMap[reference];
    return { trv, tempo, jaune, actual, savings: refTotal - actual };
  }, [filtered, reference]);

  const animatedSavings = useCountUp(totals.savings, 1500, 0);
  const avgPerMonth = totals.savings / Math.max(1, monthly.length);

  const downloadCsv = () => {
    const header = ["Date", "Conso kWh", "Coût Dynawatt €", "Coût TRV €", "Coût Tempo €", "Coût Tarif Jaune €", "Économies €", "Cycles", "Spread max €/kWh"];
    const rows = filtered.map((s) => [s.date, s.consumptionKwh, s.costActualEur, s.costTrvEur, s.costTempoEur, s.costTarifJauneEur, s.savingsVsTrvEur, s.cyclesDone, s.spreadMaxEurPerKwh]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dynawatt-economies-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const purple = [124, 58, 237] as const;
    doc.setFillColor(10, 8, 20);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("DYNAWATT — Rapport d'économies", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.text(`${demoClient.companyName} · ${demoClient.activity}`, 14, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Période : ${period === "all" ? "Depuis installation" : period}`, 14, 40);
    doc.text(`Référence : ${reference.toUpperCase()}`, 14, 46);

    doc.setFontSize(28);
    doc.setTextColor(...purple);
    doc.text(`+${fmt(totals.savings, 0)}`, 14, 60);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Économies cumulées sur la période", 14, 66);

    autoTable(doc, {
      startY: 75,
      head: [["Date", "Conso (kWh)", "Dynawatt (€)", "TRV (€)", "Économies (€)", "Cycles"]],
      body: filtered.slice(-30).map((s) => [s.date, s.consumptionKwh, s.costActualEur.toFixed(2), s.costTrvEur.toFixed(2), s.savingsVsTrvEur.toFixed(2), s.cyclesDone.toFixed(2)]),
      headStyles: { fillColor: [...purple], textColor: 255 },
      styles: { fontSize: 8 },
    });

    doc.save(`dynawatt-rapport-${period}.pdf`);
  };

  const referenceTotals = { trv: totals.trv, tempo: totals.tempo, jaune: totals.jaune, all: totals.trv };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Économies</div>
        <h1 className="text-3xl md:text-4xl font-black">Suivi détaillé</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyse de vos économies, exports CSV/PDF, bilans mensuels.</p>
      </motion.div>

      {/* Filtres */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-background/40 border border-border/40">
          {(["7d", "30d", "90d", "all"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p === "all" ? "Tout" : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-background/40 border border-border/40">
          {(["trv", "tempo", "jaune"] as Reference[]).map((r) => (
            <button key={r} onClick={() => setReference(r)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${reference === r ? "bg-gold text-background" : "text-muted-foreground hover:text-foreground"}`}>
              vs {r === "trv" ? "TRV" : r === "tempo" ? "Tempo" : "Tarif Jaune"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={downloadCsv} variant="outline" size="sm" className="gap-2"><Download className="w-3 h-3" />CSV</Button>
        <Button onClick={downloadPdf} size="sm" className="gap-2 bg-gradient-to-r from-gold to-gold-warm text-background font-bold"><FileText className="w-3 h-3" />PDF</Button>
      </div>

      {/* Carte principale */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-6 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 -z-10 opacity-25 blur-3xl rounded-full"
          style={{ background: "radial-gradient(circle, hsl(43 96% 56%), transparent 70%)" }} />
        <Coins className="w-7 h-7 text-gold mx-auto mb-3" />
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Économies cumulées vs {reference.toUpperCase()}</div>
        <div className="font-black text-5xl md:text-7xl text-gradient-gold font-mono mb-2">+{animatedSavings.toLocaleString("fr-FR")} €</div>
        <div className="text-sm text-muted-foreground">Soit {fmt(avgPerMonth, 0)} / mois en moyenne sur {monthly.length} mois</div>
      </motion.div>

      {/* Graphique mensuel */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold">Économies par mois</div>
            <h2 className="text-xl md:text-2xl font-black">Évolution mensuelle</h2>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11}
                tickFormatter={(v) => new Date(v + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v} €`} />
              <Tooltip contentStyle={{ background: "hsl(248 35% 16%)", border: "1px solid hsl(262 70% 70% / 0.3)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [fmt(v, 0), "Économies"]}
                labelFormatter={(v) => new Date(v + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
              <Bar dataKey="savings" radius={[8, 8, 0, 0]}>
                {monthly.map((_, i) => (
                  <Cell key={i} fill={i === monthly.length - 1 ? "hsl(43 96% 56%)" : "hsl(262 83% 58%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Tableau */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold">Détail journalier</div>
            <h2 className="text-xl md:text-2xl font-black">30 derniers jours</h2>
          </div>
        </div>
        <div className="overflow-x-auto -mx-5 md:-mx-7 px-5 md:px-7">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/40">
              <tr>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-right py-2 px-3">Conso (kWh)</th>
                <th className="text-right py-2 px-3">Dynawatt (€)</th>
                <th className="text-right py-2 px-3">TRV (€)</th>
                <th className="text-right py-2 px-3">Éco (€)</th>
                <th className="text-right py-2 px-3 hidden md:table-cell">Cycles</th>
                <th className="text-right py-2 pl-3 hidden md:table-cell">Spread</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(-30).reverse().map((s: DailySaving) => (
                <tr key={s.date} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                  <td className="py-2.5 pr-3 font-mono text-xs">{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</td>
                  <td className="text-right px-3 font-mono">{s.consumptionKwh}</td>
                  <td className="text-right px-3 font-mono">{s.costActualEur.toFixed(2)}</td>
                  <td className="text-right px-3 font-mono text-muted-foreground">{s.costTrvEur.toFixed(2)}</td>
                  <td className="text-right px-3 font-mono text-gold font-bold">+{s.savingsVsTrvEur.toFixed(2)}</td>
                  <td className="text-right px-3 font-mono hidden md:table-cell">{s.cyclesDone.toFixed(2)}</td>
                  <td className="text-right pl-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{(s.spreadMaxEurPerKwh * 1000).toFixed(0)} €/MWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Bilans mensuels */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gold" />
          <h2 className="text-xl font-black">Bilans mensuels PDF</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {monthly.slice(-4).reverse().map((m, i) => (
            <button key={m.month} onClick={downloadPdf}
              className="glass rounded-2xl p-4 text-left hover:border-gold/40 transition-all group">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                {new Date(m.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </div>
              <div className="font-black text-2xl text-gradient-gold font-mono mb-2">+{fmt(m.savings, 0)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Download className="w-3 h-3" />Télécharger {i === 0 ? "(le plus récent)" : ""}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
