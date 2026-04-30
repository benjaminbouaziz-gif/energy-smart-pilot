import { motion } from "framer-motion";
import { useMemo } from "react";
import { generateForecast } from "@/app/mock/forecast";
import { generateDailySavings } from "@/app/mock/savings";
import { Sparkles, ArrowDown, ArrowUp, Battery, Brain, Cloud, Radio, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea, Line, ComposedChart } from "recharts";

const fmtEur = (n: number, d = 2) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;

export default function Previsions() {
  const forecast = useMemo(() => generateForecast(), []);
  const savings = useMemo(() => generateDailySavings(3), []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLabel = tomorrow.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const minPrice = Math.min(...forecast.slots.map((s) => s.priceEurPerKwh));
  const maxPrice = Math.max(...forecast.slots.map((s) => s.priceEurPerKwh));

  // Pour ReferenceArea : on a besoin de noms de slots
  const data = forecast.slots.map((s) => ({
    time: s.time,
    price: s.priceEurPerKwh,
    priceMwh: +(s.priceEurPerKwh * 1000).toFixed(1),
    action: s.action,
  }));

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />Pilotage J-1
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          Demain, <span className="text-gradient-violet">{tomorrowLabel}</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Plan de charge optimisé par l'algorithme Dynawatt à partir des prix EPEX Spot J-1, de votre profil de consommation et de l'état de la batterie.
        </p>
      </motion.section>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gain estimé", value: `+${forecast.totalEstimatedGainEur.toFixed(2)} €`, color: "text-gradient-gold", sub: "vs scénario sans pilotage" },
          { label: "Spread du jour", value: `${(forecast.spreadEurPerKwh * 1000).toFixed(0)} €/MWh`, color: "text-primary-light", sub: `${forecast.volatility.toLowerCase()}` },
          { label: "Cycles planifiés", value: `${forecast.cycles.length}`, color: "text-foreground", sub: "complets" },
          { label: "Énergie cyclée", value: `${forecast.cycles.reduce((a, c) => a + c.charge.energyKwh, 0).toFixed(0)} kWh`, color: "text-foreground", sub: "sur la batterie 29 kWh" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="glass rounded-2xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
            <div className={`font-black text-2xl md:text-3xl font-mono ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Graphique principal */}
      <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">EPEX Spot — 96 quarts d'heure</div>
            <h2 className="text-xl md:text-2xl font-black">Courbe des prix & plan de pilotage</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500" />Charge</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-destructive/40 border border-destructive" />Décharge</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary-light" />Prix spot</div>
          </div>
        </div>

        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(258 90% 76%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(258 90% 76%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="time" interval={7} stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v * 1000).toFixed(0)}`}
                domain={[minPrice * 0.9, maxPrice * 1.05]} label={{ value: "€/MWh", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(248 35% 16%)", border: "1px solid hsl(262 70% 70% / 0.3)", borderRadius: 12, fontSize: 12 }}
                labelFormatter={(v) => `${v}`}
                formatter={(value: number, _n, item) => {
                  const action = (item?.payload as { action?: string })?.action;
                  const tag = action === "charge" ? " · 🟢 Charge" : action === "discharge" ? " · 🔴 Décharge" : "";
                  return [`${(value * 1000).toFixed(1)} €/MWh${tag}`, "Prix EPEX"];
                }}
              />
              {forecast.windows.map((w, i) => (
                <ReferenceArea key={i}
                  x1={data[w.startIdx].time} x2={data[w.endIdx].time}
                  y1={minPrice * 0.9} y2={maxPrice * 1.05}
                  fill={w.type === "charge" ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)"}
                  fillOpacity={0.18} stroke="none" />
              ))}
              <Area type="monotone" dataKey="price" stroke="hsl(258 90% 76%)" strokeWidth={2} fill="url(#priceGrad)" />
              <Line type="monotone" dataKey="price" stroke="hsl(258 90% 76%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Cartes stratégie */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Stratégie cycle par cycle</div>
        <div className="grid md:grid-cols-2 gap-4">
          {forecast.cycles.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 hover:border-gold/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cycle</div>
                  <h3 className="font-black text-2xl">N°{c.id}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Gain estimé</div>
                  <div className="font-black text-2xl text-gradient-gold font-mono">+{c.gainEur.toFixed(2)} €</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ArrowDown className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">Charge {c.charge.startTime} → {c.charge.endTime}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {c.charge.energyKwh} kWh · {(c.charge.avgPriceEurPerKwh * 1000).toFixed(1)} €/MWh
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                    <ArrowUp className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">Décharge {c.discharge.startTime} → {c.discharge.endTime}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {c.discharge.energyKwh} kWh · {(c.discharge.avgPriceEurPerKwh * 1000).toFixed(1)} €/MWh
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparaison hier / aujourd'hui / demain */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Hier · Aujourd'hui · Demain</div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Avant-hier", value: savings[0]?.savingsVsTrvEur ?? 0, sub: "réalisé" },
            { label: "Hier", value: savings[1]?.savingsVsTrvEur ?? 0, sub: "réalisé" },
            { label: "Demain", value: forecast.totalEstimatedGainEur, sub: "prévu", highlight: true },
          ].map((d, i) => (
            <motion.div key={d.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-5 ${d.highlight ? "border-gold/40 glow-gold" : ""}`}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{d.label} · {d.sub}</div>
              <div className={`font-black text-3xl font-mono ${d.highlight ? "text-gradient-gold" : ""}`}>+{fmtEur(d.value)}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pédagogique */}
      <section className="glass rounded-3xl p-5 md:p-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Comment ça marche</div>
        <h2 className="text-2xl md:text-3xl font-black mb-6">4 étapes, <span className="text-gradient-violet">4 secondes</span>.</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Cloud, title: "13h00", desc: "EPEX publie les 96 prix de demain." },
            { icon: Brain, title: "13h00:04", desc: "Notre algorithme MILP calcule le plan optimal." },
            { icon: Radio, title: "13h00:08", desc: "Consignes poussées vers votre onduleur Tigo." },
            { icon: Battery, title: "Toute la nuit", desc: "Votre batterie économise sans intervention." },
          ].map((s, i) => (
            <div key={s.title} className="relative">
              <div className="font-mono text-3xl font-black text-gradient-violet mb-2">0{i + 1}</div>
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                <s.icon className="w-4 h-4 text-primary-light" />
              </div>
              <h3 className="font-bold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center pt-2 text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-2">
        <Zap className="w-3 h-3 text-gold" />
        Plan recalculé chaque jour à 13h après publication EPEX Spot J-1
      </div>
    </div>
  );
}
