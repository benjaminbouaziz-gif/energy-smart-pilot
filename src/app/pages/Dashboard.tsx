import { motion } from "framer-motion";
import { Battery, Zap, Coins, Cpu, ArrowDownRight, ArrowUpRight, Plug, Sparkles, TrendingUp, Calendar, Activity, AlertCircle, Plane, PartyPopper } from "lucide-react";
import { useMemo, useState } from "react";
import { useLiveTelemetry } from "@/app/hooks/useLiveTelemetry";
import { useCountUp } from "@/app/hooks/useCountUp";
import { generateDailySavings, buildCumulativeSeries } from "@/app/mock/savings";
import { generateForecast } from "@/app/mock/forecast";
import { demoClient } from "@/app/mock/client";
import { usePilotage, getActiveMode } from "@/app/hooks/usePilotage";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const fmtEur = (n: number, d = 0) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;

export default function Dashboard() {
  const live = useLiveTelemetry(5000);
  const { state: pilotageState } = usePilotage();
  const activeMode = getActiveMode(pilotageState);
  const liveWithMode = { ...live, pilotageLabel: activeMode.label, pilotageMode: activeMode.type === "vacation" ? "vacation" as const : activeMode.type === "event" ? "event" as const : activeMode.type === "manual" ? "manual" as const : "auto" as const };
  const savings = useMemo(() => generateDailySavings(120), []);
  const cumulative = useMemo(() => buildCumulativeSeries(savings), [savings]);
  const forecast = useMemo(() => generateForecast(), []);
  const [period, setPeriod] = useState<"month" | "year" | "all">("all");

  const cumulativeData = useMemo(() => {
    if (period === "month") return cumulative.slice(-30);
    if (period === "year") return cumulative.slice(-365);
    return cumulative;
  }, [cumulative, period]);

  // Recalibre le cumul sur la fenêtre choisie pour partir de zéro
  const cumulativeWindowed = useMemo(() => {
    if (cumulativeData.length === 0) return [];
    const offsetTrv = cumulativeData[0].cumulativeTrv;
    const offsetActual = cumulativeData[0].cumulativeActual;
    return cumulativeData.map((d) => ({
      date: d.date,
      eco: +(d.cumulativeTrv - offsetTrv - (d.cumulativeActual - offsetActual)).toFixed(2),
      trv: +(d.cumulativeTrv - offsetTrv).toFixed(2),
    }));
  }, [cumulativeData]);

  const totals = useMemo(() => {
    const last30 = savings.slice(-30);
    return {
      actual: last30.reduce((a, b) => a + b.costActualEur, 0),
      trv: last30.reduce((a, b) => a + b.costTrvEur, 0),
      tempo: last30.reduce((a, b) => a + b.costTempoEur, 0),
      jaune: last30.reduce((a, b) => a + b.costTarifJauneEur, 0),
    };
  }, [savings]);

  const totalSavings = useMemo(() => savings.reduce((a, b) => a + b.savingsVsTrvEur, 0), [savings]);

  const todaySavings = useCountUp(live.todaySavingsEur, 1500, 2);
  const todayConso = useCountUp(live.todayConsumptionKwh, 1500, 0);
  const cumSavings = useCountUp(cumulativeWindowed.length ? cumulativeWindowed[cumulativeWindowed.length - 1].eco : 0, 2000, 0);

  const sparkline = savings.slice(-14).map((s) => ({ d: s.date, v: s.savingsVsTrvEur }));
  const consoSparkline = savings.slice(-14).map((s) => ({ d: s.date, v: s.consumptionKwh }));

  const consoDelta = ((live.todayConsumptionKwh - live.yesterdayConsumptionKwh) / live.yesterdayConsumptionKwh) * 100;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-gold mb-1">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="text-3xl md:text-4xl font-black">Bonjour <span className="text-gradient-violet">{demoClient.firstName}</span></h1>
          <p className="text-sm text-muted-foreground mt-1">{demoClient.companyName} · {demoClient.activity}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Synchronisation il y a {live.lastSyncSecondsAgo}s
        </div>
      </motion.div>

      {/* Status bar live */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x md:divide-border/40">
        {/* Batterie */}
        <div className="flex items-center gap-3 md:px-4">
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
              <circle cx="18" cy="18" r="15" stroke="url(#g1)" strokeWidth="3" fill="none"
                strokeDasharray={`${(live.socPct / 100) * 94.2} 94.2`} strokeLinecap="round" />
              <defs><linearGradient id="g1"><stop offset="0%" stopColor="hsl(258 90% 76%)" /><stop offset="100%" stopColor="hsl(43 96% 56%)" /></linearGradient></defs>
            </svg>
            <Battery className="absolute inset-0 m-auto w-4 h-4 text-primary-light" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Batterie</div>
            <div className="font-black text-lg leading-tight">{live.socPct}%</div>
            <div className="text-[11px] text-muted-foreground capitalize">
              {live.mode === "charging" ? "Charge en cours" : live.mode === "discharging" ? "Décharge active" : "Veille"}
            </div>
          </div>
        </div>
        {/* Puissance */}
        <div className="flex items-center gap-3 md:px-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-light" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Puissance</div>
            <div className="font-black text-lg leading-tight font-mono">{live.consumptionKw.toFixed(1)} kW</div>
            <div className="text-[11px] flex items-center gap-1 text-muted-foreground">
              {live.batteryPowerKw < -0.2 ? (<><ArrowDownRight className="w-3 h-3 text-emerald-400" />batterie {Math.abs(live.batteryPowerKw).toFixed(1)} kW</>) :
               live.batteryPowerKw > 0.2 ? (<><ArrowUpRight className="w-3 h-3 text-gold" />batterie +{live.batteryPowerKw.toFixed(1)} kW</>) :
               <>réseau {live.gridPowerKw.toFixed(1)} kW</>}
            </div>
          </div>
        </div>
        {/* Prix */}
        <div className="flex items-center gap-3 md:px-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Prix actuel</div>
            <div className="font-black text-lg leading-tight font-mono">{(live.currentPriceEurPerKwh * 1000).toFixed(0)} <span className="text-xs">€/MWh</span></div>
            <div className="text-[11px] text-muted-foreground">{live.priceLabel}</div>
          </div>
        </div>
        {/* Mode */}
        <div className="flex items-center gap-3 md:px-4">
        {/* Mode */}
        <div className="flex items-center gap-3 md:px-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeMode.type === "vacation" ? "bg-sky-500/10 border border-sky-500/30" : activeMode.type === "event" ? "bg-gold/15 border border-gold/30" : "bg-emerald-500/10 border border-emerald-500/30"}`}>
            {activeMode.type === "vacation" ? <Plane className="w-5 h-5 text-sky-400" /> :
             activeMode.type === "event" ? <PartyPopper className="w-5 h-5 text-gold" /> :
             <Cpu className="w-5 h-5 text-emerald-400" />}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Mode actif</div>
            <div className="font-black text-sm leading-tight">{liveWithMode.pilotageLabel}</div>
            <div className={`text-[11px] ${activeMode.type === "vacation" ? "text-sky-400" : activeMode.type === "event" ? "text-gold" : "text-emerald-400"}`}>Algorithme J-1 actif</div>
          </div>
        </div>
      </motion.div>

      {/* 3 cartes Aujourd'hui */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5 hover:border-gold/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Économies aujourd'hui</div>
            <Coins className="w-4 h-4 text-gold" />
          </div>
          <div className="font-black text-4xl md:text-5xl text-gradient-gold mb-1 font-mono">+{todaySavings.toFixed(2)} €</div>
          <div className="text-xs text-muted-foreground mb-3">vs Tarif réglementé</div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs><linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(43 96% 56%)" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(43 96% 56%)" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke="hsl(43 96% 56%)" strokeWidth={2} fill="url(#sg1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Consommation</div>
            <Plug className="w-4 h-4 text-primary-light" />
          </div>
          <div className="font-black text-4xl md:text-5xl mb-1 font-mono">{todayConso} <span className="text-lg text-muted-foreground">kWh</span></div>
          <div className={`text-xs mb-3 flex items-center gap-1 ${consoDelta < 0 ? "text-emerald-400" : "text-gold"}`}>
            {consoDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {consoDelta.toFixed(1)}% vs hier
          </div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consoSparkline}>
                <defs><linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(258 90% 76%)" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(258 90% 76%)" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke="hsl(258 90% 76%)" strokeWidth={2} fill="url(#sg2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cycles batterie</div>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-black text-4xl md:text-5xl mb-1 font-mono">{live.todayCycles.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mb-3">{live.plannedCycles} cycles planifiés</div>
          <div className="relative h-12 flex items-center">
            <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(live.todayCycles / live.plannedCycles) * 100}%` }} transition={{ duration: 1.2 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Économies cumulées */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Économies cumulées</div>
            <h2 className="text-2xl md:text-3xl font-black">+{cumSavings.toLocaleString("fr-FR")} € <span className="text-base font-normal text-muted-foreground">depuis l'installation</span></h2>
            <p className="text-xs text-muted-foreground mt-1">Soit {fmtEur(totalSavings / 4, 0)}/mois en moyenne sur 4 mois</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-background/40 border border-border/40 self-start">
            {(["month", "year", "all"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p === "month" ? "30j" : p === "year" ? "1 an" : "Tout"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeWindowed} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ecoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(43 96% 56%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v} €`} />
              <Tooltip
                contentStyle={{ background: "hsl(248 35% 16%)", border: "1px solid hsl(262 70% 70% / 0.3)", borderRadius: 12, fontSize: 12 }}
                labelFormatter={(v) => new Date(v as string).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                formatter={(v: number, n) => [fmtEur(v, 2), n === "eco" ? "Économies cumulées" : "Coût TRV"]}
              />
              <Area type="monotone" dataKey="trv" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" fill="none" />
              <Area type="monotone" dataKey="eco" stroke="hsl(43 96% 56%)" strokeWidth={2.5} fill="url(#ecoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Comparateur */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold">Comparateur</div>
            <h2 className="text-xl md:text-2xl font-black">Si vous étiez chez un autre fournisseur…</h2>
          </div>
          <div className="text-[11px] text-muted-foreground">30 derniers jours</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "TRV", value: totals.trv, color: "text-muted-foreground", border: "border-border" },
            { label: "EDF Tempo", value: totals.tempo, color: "text-primary-light", border: "border-primary/30" },
            { label: "Tarif Jaune", value: totals.jaune, color: "text-primary-light", border: "border-primary/30" },
            { label: "Dynawatt", value: totals.actual, color: "text-gradient-gold", border: "border-gold/40", highlight: true },
          ].map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={`glass rounded-2xl p-4 ${t.border} ${t.highlight ? "glow-gold" : ""}`}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{t.label}</div>
              <div className={`font-black text-2xl md:text-3xl font-mono ${t.color}`}>{fmtEur(t.value, 0)}</div>
              {t.highlight && (
                <div className="text-[11px] text-gold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />Choix optimal
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Prévisions demain */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 -z-10 opacity-30 blur-3xl rounded-full"
          style={{ background: "radial-gradient(circle, hsl(258 90% 76%), transparent 70%)" }} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />Prévisions J+1
            </div>
            <h2 className="text-2xl md:text-3xl font-black">Demain — votre journée optimisée</h2>
            <p className="text-xs text-muted-foreground mt-1">EPEX Spot publié à 13h, calcul terminé à 13h00:04</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Gain estimé</div>
            <div className="font-black text-3xl text-gradient-gold font-mono">+{forecast.totalEstimatedGainEur.toFixed(2)} €</div>
          </div>
        </div>

        <div className="h-48 md:h-56 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.slots} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="time" interval={11} stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v * 1000).toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: "hsl(248 35% 16%)", border: "1px solid hsl(262 70% 70% / 0.3)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${(v * 1000).toFixed(1)} €/MWh`, "Prix EPEX"]}
              />
              {/* Bandes charge/décharge */}
              {forecast.windows.map((w, i) => (
                <ReferenceLine key={i} segment={[{ x: w.startTime, y: 0 }, { x: w.endTime, y: 0 }]} stroke="transparent" />
              ))}
              {forecast.windows.map((w, i) => {
                const startTime = forecast.slots[w.startIdx]?.time;
                const endTime = forecast.slots[w.endIdx]?.time;
                return (
                  <ReferenceLine key={`bg-${i}`}
                    segment={[{ x: startTime, y: 0.3 }, { x: endTime, y: 0.3 }]}
                    stroke={w.type === "charge" ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)"}
                    strokeWidth={6} strokeOpacity={0.18} />
                );
              })}
              <Line type="monotone" dataKey="priceEurPerKwh" stroke="hsl(258 90% 76%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {forecast.cycles.map((c) => (
            <div key={c.id} className="rounded-2xl p-4 bg-background/40 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono uppercase tracking-wider text-gold">Cycle {c.id}</div>
                <div className="font-black text-lg text-gradient-gold font-mono">+{c.gainEur.toFixed(2)} €</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono">Charge {c.charge.startTime}–{c.charge.endTime}</span>
                <span className="text-muted-foreground">→</span>
                <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-mono">Décharge {c.discharge.startTime}–{c.discharge.endTime}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-full glass border-gold/30 text-gold flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />Journée {forecast.volatility}
          </div>
          <span className="text-muted-foreground">Spread {forecast.spreadEurPerKwh * 1000} €/MWh entre min et max — idéal pour 2 cycles.</span>
        </div>
      </motion.section>

      {/* Footer dashboard */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Données pilotées par l'algorithme Dynawatt J-1 · Hardware Tigo Energy
        </div>
      </div>
    </div>
  );
}
