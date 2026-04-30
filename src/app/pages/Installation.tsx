import { motion } from "framer-motion";
import { useMemo } from "react";
import { demoInstallation, demoClient } from "@/app/mock/client";
import { Battery, Cpu, Plug, Thermometer, Calendar, Wrench, Activity, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { generateDailySavings } from "@/app/mock/savings";
import { Button } from "@/components/ui/button";

export default function Installation() {
  const savings = useMemo(() => generateDailySavings(120), []);

  // Cycles cumulés par mois
  const cyclesMonthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of savings) {
      const k = s.date.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + s.cyclesDone);
    }
    let cum = 0;
    return Array.from(map.entries()).map(([month, val]) => {
      cum += val;
      return { month, cycles: +val.toFixed(1), cumul: +cum.toFixed(0) };
    });
  }, [savings]);

  const dailyAvg = +(savings.reduce((a, b) => a + b.cyclesDone, 0) / savings.length).toFixed(2);
  const yearsToWarrantyEnd = Math.round((demoInstallation.cyclesMax - demoInstallation.cyclesConsumed) / (dailyAvg * 365) * 10) / 10;
  const installEnd = new Date(demoInstallation.installationDate);
  installEnd.setFullYear(installEnd.getFullYear() + yearsToWarrantyEnd);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Mon installation</div>
        <h1 className="text-3xl md:text-4xl font-black">{demoInstallation.configName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Hardware Tigo Energy · Installé le {new Date(demoInstallation.installationDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </motion.div>

      {/* Équipement visuel */}
      <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-5 md:p-8 grid lg:grid-cols-5 gap-6 items-center">
        {/* Schéma stylisé */}
        <div className="lg:col-span-2">
          <div className="aspect-square max-w-xs mx-auto relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-gold/5 border border-primary/20" />
            <div className="absolute inset-6 rounded-2xl bg-background/40 border border-border/40 p-4 flex flex-col gap-2">
              {/* Onduleur en haut */}
              <div className="rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 border border-primary/40 p-2.5 flex items-center justify-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary-light" />
                <span className="text-[10px] font-mono font-bold">TSI-15K3D</span>
              </div>
              {/* 8 modules batterie */}
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="rounded-md bg-gradient-to-br from-gold/30 to-gold/5 border border-gold/30 flex items-center justify-center text-[8px] font-mono font-bold text-gold">
                    3,6 kWh
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-3 text-[11px] font-mono text-muted-foreground">Rack mural 8 modules · 29 kWh total</div>
        </div>

        {/* Specs */}
        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
          {[
            { icon: Cpu, label: "Onduleur", value: demoInstallation.inverterModel, sub: `S/N ${demoInstallation.inverterSerial}` },
            { icon: Battery, label: "Capacité batterie", value: `${demoInstallation.batteryTotalKwh} kWh`, sub: `${demoInstallation.batteryModulesCount} modules LFP` },
            { icon: Thermometer, label: "GO Junction (PAC)", value: demoInstallation.hasGoJunction ? "Installé" : "Non", sub: "Pilotage pompe à chaleur" },
            { icon: Plug, label: "GO EV Charger", value: demoInstallation.hasEvCharger ? demoInstallation.evChargerModel : "Non", sub: "Borne véhicule électrique" },
          ].map((spec) => (
            <div key={spec.label} className="rounded-2xl p-4 bg-background/40 border border-border/40">
              <div className="flex items-center gap-2 mb-1.5">
                <spec.icon className="w-3.5 h-3.5 text-primary-light" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{spec.label}</span>
              </div>
              <div className="font-bold">{spec.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{spec.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* État de santé */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold">État de santé batterie (SOH)</h3>
            </div>
            <span className="text-3xl font-black text-emerald-400 font-mono">{demoInstallation.sohPct}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-border/40 overflow-hidden mb-3">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${demoInstallation.sohPct}%` }} viewport={{ once: true }} transition={{ duration: 1.2 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
          </div>
          <p className="text-xs text-muted-foreground">État optimal — dégradation normale ~1%/an. Mesure quotidienne par Tigo.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              <h3 className="font-bold">Cycles consommés</h3>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-black">{demoInstallation.cyclesConsumed}<span className="text-muted-foreground text-sm"> / {demoInstallation.cyclesMax}</span></div>
              <div className="text-[10px] text-muted-foreground">cycles complets</div>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-border/40 overflow-hidden mb-3">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${(demoInstallation.cyclesConsumed / demoInstallation.cyclesMax) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2 }}
              className="h-full bg-gradient-to-r from-primary to-gold" />
          </div>
          <p className="text-xs text-muted-foreground">Estimation fin garantie cycles : <span className="text-gold font-mono">{installEnd.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span> · {dailyAvg} cycles/jour en moyenne — sain.</p>
        </motion.div>
      </div>

      {/* Historique cycles */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Historique cycles</div>
        <h2 className="text-xl md:text-2xl font-black mb-5">Cycles mois par mois</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cyclesMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11}
                tickFormatter={(v) => new Date(v + "-01").toLocaleDateString("fr-FR", { month: "short" })} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(248 35% 16%)", border: "1px solid hsl(262 70% 70% / 0.3)", borderRadius: 12, fontSize: 12 }}
                labelFormatter={(v) => new Date(v + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
              <Bar dataKey="cycles" fill="hsl(262 83% 58%)" radius={[6, 6, 0, 0]} name="Cycles du mois" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <ArrowUpRight className="w-3 h-3 text-emerald-400" />Tendance saine — vous êtes à {dailyAvg} cycles/jour, en dessous du seuil constructeur de 1,5.
        </div>
      </motion.section>

      {/* Maintenance */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Maintenance</div>
            <h2 className="text-xl md:text-2xl font-black">Suivi des interventions</h2>
          </div>
          <Button variant="outline" className="gap-2"><Wrench className="w-4 h-4" />Replanifier ma visite</Button>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl p-4 border border-gold/30 bg-gold/5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-gold">À venir</div>
              <div className="font-bold">Visite annuelle préventive</div>
              <div className="text-xs text-muted-foreground">Programmée le 12 mars 2027 · Technicien Dynawatt</div>
            </div>
          </div>
          {[
            { date: "12 janvier 2026", title: "Mise en service", desc: "Installation, configuration onduleur, première charge" },
            { date: "1er janvier 2026", title: "Livraison hardware", desc: "Réception et déballage du rack 8 modules" },
          ].map((m) => (
            <div key={m.title} className="rounded-2xl p-4 border border-border/40 bg-background/40 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.date}</div>
                <div className="font-bold">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Terminé</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Garantie */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <div className="font-bold">Garantie active</div>
          <div className="text-xs text-muted-foreground">Couverture hardware et performance jusqu'au {new Date(demoInstallation.warrantyEndDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">PDL compteur</div>
          <div className="font-mono text-sm">{demoClient.pdl}</div>
        </div>
      </div>
    </div>
  );
}
