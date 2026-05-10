import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Activity, Calendar, Gauge, Sparkles } from "lucide-react";
import {
  Bar, BarChart, Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSimulateurSwitch } from "../SimulateurSwitchContext";
import {
  computeDailyProfile, computeMonthly, computeHeatmap, computeStats,
  formatPrm, formatDateFr,
} from "../lib/conso-analysis";

const VIOLET = "#7C3AED";
const GOLD = "#FBBF24";
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function fmtKwh(v: number) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}
function fmtKwh1(v: number) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export default function Step3AnalyseConso() {
  const { data, prev, next } = useSimulateurSwitch();
  const lc = data.loadCurve;

  if (!lc || lc.hourlyKwh.length === 0) {
    return (
      <div className="container mx-auto px-4 mt-10 max-w-3xl">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Analyse impossible</CardTitle>
            <CardDescription>Aucune courbe de charge disponible. Reviens à l'étape 2.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={prev} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isManual = lc.source === "manual";

  const daily = useMemo(() => isManual ? [] : computeDailyProfile(lc.hourlyKwh, lc.windowStart), [lc, isManual]);
  const monthly = useMemo(() => isManual ? [] : computeMonthly(lc.hourlyKwh, lc.windowStart), [lc, isManual]);
  const heatmap = useMemo(() => isManual ? [] : computeHeatmap(lc.hourlyKwh, lc.windowStart), [lc, isManual]);
  const stats = useMemo(() => computeStats(lc.hourlyKwh, lc.windowStart), [lc]);

  const heatMax = useMemo(() => {
    let m = 0;
    heatmap.forEach((r) => r.forEach((v) => { if (v > m) m = v; }));
    return m;
  }, [heatmap]);

  const prm = data.switchgrid?.prm ?? "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-5xl space-y-6"
    >
      <div className="text-center mb-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 3 / 8</div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Analyse de la consommation</h1>
        <p className="text-sm text-muted-foreground">Profil de consommation à présenter au client</p>
      </div>

      {/* SECTION 1 - Stats clés */}
      <Card className="rounded-3xl border-primary/20 shadow-[var(--shadow-glow)]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="PRM" value={<span className="font-mono text-base">{formatPrm(prm)}</span>} />
            <StatTile label="Période" value={
              <span className="text-sm">{formatDateFr(lc.windowStart)} → {formatDateFr(lc.windowEnd)}</span>
            } />
            <StatTile label="Conso totale" value={<span>{fmtKwh(stats.totalKwh)} <span className="text-sm text-muted-foreground">kWh</span></span>} />
            <StatTile label="Moyenne / jour" value={<span>{fmtKwh1(stats.dailyAvgKwh)} <span className="text-sm text-muted-foreground">kWh</span></span>} />
          </div>
        </CardContent>
      </Card>

      {isManual && (
        <Alert className="border-gold/40">
          <AlertDescription>Mode saisie manuelle — analyse limitée aux totaux annuels.</AlertDescription>
        </Alert>
      )}

      {!isManual && (
        <>
          {/* SECTION 2 - Profil journalier */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Profil journalier moyen</CardTitle>
              <CardDescription>Conso horaire moyenne (kWh) — semaine vs weekend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}h`} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                      formatter={(v: number) => `${v.toFixed(2)} kWh`}
                      labelFormatter={(h) => `${h}h`}
                    />
                    <Legend />
                    <Bar dataKey="semaine" name="Semaine" fill={VIOLET} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="weekend" name="Weekend" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3 - Mensuel */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Consommation mensuelle</CardTitle>
              <CardDescription>Heure de Paris</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIOLET} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                      formatter={(v: number) => `${fmtKwh(v)} kWh`}
                    />
                    <Area type="monotone" dataKey="conso" name="Conso (kWh)" stroke={VIOLET} strokeWidth={2} fill="url(#violetGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4 - Heatmap */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gauge className="w-5 h-5 text-primary" /> Carte de chaleur (jour × heure)</CardTitle>
              <CardDescription>Conso moyenne par créneau (kWh)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid" style={{ gridTemplateColumns: "40px repeat(24, minmax(0, 1fr))", gap: 2 }}>
                    <div />
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="text-[10px] text-muted-foreground text-center">
                        {[0, 4, 8, 12, 16, 20].includes(h) ? `${h}h` : ""}
                      </div>
                    ))}
                    {heatmap.map((row, w) => (
                      <>
                        <div key={`d${w}`} className="text-xs text-muted-foreground flex items-center justify-end pr-2">{DAYS[w]}</div>
                        {row.map((v, h) => {
                          const opacity = heatMax > 0 ? Math.max(0.05, v / heatMax) : 0;
                          return (
                            <div
                              key={`${w}-${h}`}
                              className="rounded-sm h-7"
                              style={{ background: `hsl(262 83% 58% / ${opacity})` }}
                              title={`${DAYS[w]} ${h}h — ${v.toFixed(2)} kWh`}
                            />
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SECTION 5 - Récap */}
      <Card className="rounded-3xl border-gold/40 bg-gold/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /> Ce qu'il faut retenir</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• <strong>{fmtKwh(stats.totalKwh)} kWh / an</strong>, soit {fmtKwh1(stats.dailyAvgKwh)} kWh / jour en moyenne.</li>
            {!isManual && (
              <>
                <li>• Pic typique de consommation : autour de <strong>{stats.peakHour}h</strong> ({stats.peakLabel}).</li>
                <li>• Le weekend représente <strong>{stats.weekendRatioPct.toFixed(0)} %</strong> de la conso totale.</li>
                <li>• La nuit (23h-7h) représente <strong>{stats.nightRatioPct.toFixed(0)} %</strong> de la conso totale.</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={prev} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Button>
        <Button onClick={next} className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold">
          Suivant <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.section>
  );
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">{label}</div>
      <div className="text-2xl font-black text-foreground">{value}</div>
    </div>
  );
}
