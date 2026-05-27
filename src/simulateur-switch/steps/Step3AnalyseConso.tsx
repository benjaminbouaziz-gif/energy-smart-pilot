import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Activity, Calendar, Gauge, Sparkles, Play, Pause, CalendarDays, Building2 } from "lucide-react";
import {
  Bar, BarChart, Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  ComposedChart, Line,
} from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSimulateurSwitch } from "../SimulateurSwitchContext";
import {
  computeDailyProfile, computeMonthly, computeHeatmap, computeStats,
  formatPrm, formatDateFr,
} from "../lib/conso-analysis";
import { loadEpexPricesForRange, type EpexPricesMap } from "../lib/epex-prices-loader";

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

  const safeHourly = lc?.hourlyKwh ?? [];
  const safeStart = lc?.windowStart ?? new Date().toISOString();
  const isManual = lc?.source === "manual";

  const daily = useMemo(() => (!lc || isManual) ? [] : computeDailyProfile(safeHourly, safeStart), [lc, isManual, safeHourly, safeStart]);
  const monthly = useMemo(() => (!lc || isManual) ? [] : computeMonthly(safeHourly, safeStart), [lc, isManual, safeHourly, safeStart]);
  const heatmap = useMemo(() => (!lc || isManual) ? [] : computeHeatmap(safeHourly, safeStart), [lc, isManual, safeHourly, safeStart]);
  const stats = useMemo(() => computeStats(safeHourly, safeStart), [safeHourly, safeStart]);

  const heatMax = useMemo(() => {
    let m = 0;
    heatmap.forEach((r) => r.forEach((v) => { if (v > m) m = v; }));
    return m;
  }, [heatmap]);

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

  const prm = data.switchgrid?.prm ?? "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-5xl space-y-6"
    >
      <div className="text-center mb-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 3 / 7</div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Analyse de la consommation</h1>
        <p className="text-sm text-muted-foreground">Profil de consommation à présenter au client</p>
      </div>
      <ContractDetailsCard contract={data.contractDetails} />


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
                      <Fragment key={`row-${w}`}>
                        <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">{DAYS[w]}</div>
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
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5 - Visualisation jour par jour */}
          <DailyView hourlyKwh={safeHourly} windowStart={safeStart} windowEnd={lc.windowEnd} />
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

// ============================================================
// Carte récap C68 — Caractéristiques du contrat Enedis
// ============================================================
import type { SimulateurSwitchContractDetails } from "../SimulateurSwitchContext";

const OPTION_TARIFAIRE_LABELS: Record<string, string> = {
  BASE: "Base",
  HPHC: "Heures Pleines / Heures Creuses",
  HP_HC: "Heures Pleines / Heures Creuses",
  "HP/HC": "Heures Pleines / Heures Creuses",
  "TJ-CU": "Tarif Jaune CU",
  "TLU-LU": "Tarif Longue Utilisation",
  CU4: "Courte Utilisation 4 postes",
  MU4: "Moyenne Utilisation 4 postes",
  CU: "Courte Utilisation",
  LU: "Longue Utilisation",
};

function labelOptionTarifaire(o?: string) {
  if (!o) return undefined;
  const up = o.toUpperCase().replace(/\s+/g, "");
  return OPTION_TARIFAIRE_LABELS[up] ?? o;
}

function labelSegmentTension(segment?: string, tension?: string) {
  if (!segment && !tension) return undefined;
  const segTxt = segment === "C5" ? "C5 (≤ 36 kVA)" : segment === "C4" ? "C4 (36–250 kVA)" : segment;
  if (segTxt && tension) return `${segTxt} — ${tension}`;
  return segTxt ?? tension;
}

function formatDateFrLong(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-semibold text-base text-foreground">{value}</div>
    </div>
  );
}

function ContractDetailsCard({ contract }: { contract?: SimulateurSwitchContractDetails }) {
  if (!contract) return null;
  const segTxt = labelSegmentTension(contract.segment, contract.domaineTension);
  const optTxt = labelOptionTarifaire(contract.optionTarifaire);
  const dateTxt = formatDateFrLong(contract.dateMiseEnService);

  const tiles: { label: string; value: React.ReactNode }[] = [];
  if (contract.prm) tiles.push({ label: "PRM", value: <span className="font-mono">{formatPrm(contract.prm)}</span> });
  if (contract.titulaire) tiles.push({ label: "Titulaire", value: contract.titulaire });
  if (segTxt) tiles.push({ label: "Segment / Tension", value: segTxt });
  if (contract.puissanceSouscriteKva != null)
    tiles.push({ label: "Puissance souscrite", value: `${contract.puissanceSouscriteKva} kVA` });
  if (optTxt) tiles.push({ label: "Option tarifaire", value: optTxt });
  if (contract.typeCompteur) tiles.push({ label: "Type de compteur", value: contract.typeCompteur });
  if (dateTxt) tiles.push({ label: "Mise en service", value: dateTxt });

  if (tiles.length === 0) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Votre contrat Enedis
        </CardTitle>
        <CardDescription>Données récupérées automatiquement depuis votre compteur</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiles.map((t, i) => (
            <InfoTile key={i} label={t.label} value={t.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SECTION 5 — Visualisation jour par jour
// ============================================================
const FR_WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const FR_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function pad2(n: number) { return String(n).padStart(2, "0"); }

function formatDayFr(date: Date) {
  return `${FR_WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${FR_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function DailyView({
  hourlyKwh, windowStart, windowEnd,
}: {
  hourlyKwh: number[];
  windowStart: string;
  windowEnd: string;
}) {
  const totalDays = Math.max(1, Math.floor(hourlyKwh.length / 24));
  const [dayIdx, setDayIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [prices, setPrices] = useState<EpexPricesMap | null>(null);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const playRef = useRef<number | null>(null);

  // Load EPEX prices once on mount
  useEffect(() => {
    let cancelled = false;
    loadEpexPricesForRange(windowStart, windowEnd)
      .then((m) => { if (!cancelled) setPrices(m); })
      .catch((e) => { if (!cancelled) setPricesError(String(e?.message ?? e)); });
    return () => { cancelled = true; };
  }, [windowStart, windowEnd]);

  // Autoplay
  useEffect(() => {
    if (!playing) return;
    playRef.current = window.setInterval(() => {
      setDayIdx((d) => (d + 1) % totalDays);
    }, 800);
    return () => { if (playRef.current) window.clearInterval(playRef.current); };
  }, [playing, totalDays]);

  // Compute the date for current day
  const startMs = new Date(windowStart).getTime();
  const dayDate = new Date(startMs + dayIdx * 24 * 3600 * 1000);
  const dayKey = `${dayDate.getUTCFullYear()}-${pad2(dayDate.getUTCMonth() + 1)}-${pad2(dayDate.getUTCDate())}`;

  // Build chart data for selected day
  const chartData = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const conso = Number(hourlyKwh[dayIdx * 24 + h] ?? 0);
      const k = `${dayKey}-${pad2(h)}`;
      const prix = prices ? prices.get(k) : undefined;
      return {
        hour: `${pad2(h)}h`,
        conso: Number(conso.toFixed(3)),
        prix: prix !== undefined ? Number(prix.toFixed(4)) : null,
      };
    });
  }, [dayIdx, hourlyKwh, prices, dayKey]);

  // Day stats
  const totalDay = chartData.reduce((a, b) => a + b.conso, 0);
  let peakConso = 0, peakHour = 0;
  chartData.forEach((d, h) => { if (d.conso > peakConso) { peakConso = d.conso; peakHour = h; } });
  const prixDay = chartData.map((d) => d.prix).filter((v): v is number => v !== null);
  const prixMoyen = prixDay.length > 0 ? prixDay.reduce((a, b) => a + b, 0) / prixDay.length : null;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Visualisation jour par jour</CardTitle>
        <CardDescription>Parcours l'année jour par jour pour repérer les pics et les heures à prix bas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlaying((p) => !p)}
            className="gap-2 shrink-0"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <div className="flex-1">
            <Slider
              min={0}
              max={Math.max(0, totalDays - 1)}
              step={1}
              value={[dayIdx]}
              onValueChange={(v) => setDayIdx(v[0] ?? 0)}
            />
            <div className="text-xs text-muted-foreground text-right mt-1 font-mono">
              Jour {dayIdx + 1} / {totalDays}
            </div>
          </div>
          <div className="text-sm font-semibold whitespace-nowrap md:w-72 md:text-right">
            {formatDayFr(dayDate)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Conso totale" value={<span>{fmtKwh1(totalDay)} <span className="text-sm text-muted-foreground">kWh</span></span>} />
          <StatTile label="Pic horaire" value={<span>{peakConso.toFixed(2)} <span className="text-sm text-muted-foreground">kWh à {pad2(peakHour)}h</span></span>} />
          <StatTile
            label="Prix moyen EPEX"
            value={prixMoyen !== null
              ? <span>{prixMoyen.toFixed(3)} <span className="text-sm text-muted-foreground">€/kWh</span></span>
              : <span className="text-base text-muted-foreground">—</span>}
          />
        </div>

        {pricesError && (
          <Alert>
            <AlertDescription className="text-xs">Prix EPEX indisponibles : {pricesError}</AlertDescription>
          </Alert>
        )}

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
              <YAxis yAxisId="kwh" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} kWh`} />
              <YAxis yAxisId="prix" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${Number(v).toFixed(2)} €`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                formatter={(v: any, name: string) => {
                  if (v === null || v === undefined) return ["—", name];
                  if (name === "Conso") return [`${Number(v).toFixed(2)} kWh`, name];
                  return [`${Number(v).toFixed(3)} €/kWh`, name];
                }}
              />
              <Legend />
              <Bar yAxisId="kwh" dataKey="conso" name="Conso" fill={VIOLET} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Line yAxisId="prix" type="monotone" dataKey="prix" name="Prix EPEX" stroke={GOLD} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
