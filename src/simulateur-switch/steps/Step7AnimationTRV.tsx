import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { useSimulateurSwitch } from "../SimulateurSwitchContext";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Legend as RLegend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, Battery, Euro, Zap, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { CONSTANTES } from "@/lib/dynawatt-engine-bis";
import {
  prixTRV_TTC, tarifApplicable, libelleTarifTRV,
  findWorstCaseTRV, findBestCaseTRV, TarifTRVType,
  TRV_BLEU_BASE, TRV_BLEU_HPHC, TRV_JAUNE_CU, GrilleTRVPeriode,
} from "@/lib/tarifs-trv";

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

export default function Step7AnimationTRV() {
  const { data, prev, next } = useSimulateurSwitch();
  const result = data.simulationResult;

  const kvaClient = data.sobryParams?.kva ?? data.loadCurve?.kva ?? 36;
  const isC4 = kvaClient > 36;

  const [dayIdx, setDayIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  const days = result?.planJours ?? [];

  // Worst case calculé à l'init pour éviter tout flash visuel.
  const [selectedTRV, setSelectedTRV] = useState<TarifTRVType>(() => {
    if (!days.length) return isC4 ? "JAUNE_CU" : "BLEU_BASE";
    return findWorstCaseTRV(days, CONSTANTES.TVA);
  });

  const worstCaseTarif = useMemo<TarifTRVType>(
    () => (days.length ? findWorstCaseTRV(days, CONSTANTES.TVA) : "BLEU_BASE"),
    [days]
  );
  const bestCaseTarif = useMemo<TarifTRVType>(
    () => (days.length ? findBestCaseTRV(days, CONSTANTES.TVA) : "BLEU_BASE"),
    [days]
  );

  useEffect(() => {
    if (!auto || days.length === 0) return;
    const id = setInterval(() => setDayIdx((i) => (i + 1) % days.length), 800);
    return () => clearInterval(id);
  }, [auto, days.length]);

  const tva = 1 + CONSTANTES.TVA;

  const dayEconomies = useMemo(() => {
    return days.map((d: any) => {
      let coutTRVTtc = 0;
      let coutSobryTtc = 0;
      for (let h = 0; h < 24; h++) {
        const prixH = prixTRV_TTC(d.date, h, selectedTRV, CONSTANTES.TVA);
        if (prixH === null) continue;
        coutTRVTtc += prixH * d.conso24h[h];
        coutSobryTtc += d.prix24h[h] * d.conso24h[h] * tva;
      }
      const economieSobry = coutTRVTtc - coutSobryTtc;
      const economiePilotage = d.gainJour;
      return {
        sobry: economieSobry,
        pilotage: economiePilotage,
        total: economieSobry + economiePilotage,
      };
    });
  }, [days, selectedTRV, tva]);

  const {
    economieAnnuelle, economieMensuelle,
    ecoContratAnnuelle, ecoContratMensuelle,
    ecoBatterieAnnuelle, ecoBatterieMensuelle,
  } = useMemo(() => {
    const totalP = dayEconomies.reduce((s, e) => s + e.total, 0);
    const sobryP = dayEconomies.reduce((s, e) => s + e.sobry, 0);
    const pilotP = dayEconomies.reduce((s, e) => s + e.pilotage, 0);
    const n = dayEconomies.length || 1;
    const annT = (totalP / n) * 365;
    const annS = (sobryP / n) * 365;
    const annP = (pilotP / n) * 365;
    return {
      economieAnnuelle: annT, economieMensuelle: annT / 12,
      ecoContratAnnuelle: annS, ecoContratMensuelle: annS / 12,
      ecoBatterieAnnuelle: annP, ecoBatterieMensuelle: annP / 12,
    };
  }, [dayEconomies]);

  const day = days[dayIdx];

  const hourly = useMemo(() => {
    if (!day) return [];
    const c1 = day.cycle1;
    const c2 = day.cycle2;
    return Array.from({ length: 24 }, (_, h) => {
      let action: "charge" | "decharge" | null = null;
      if (c1 && h >= c1.chargeStart && h <= c1.chargeEnd) action = "charge";
      else if (c1 && h >= c1.dechargeStart && h <= c1.dechargeEnd) action = "decharge";
      else if (c2 && h >= c2.chargeStart && h <= c2.chargeEnd) action = "charge";
      else if (c2 && h >= c2.dechargeStart && h <= c2.dechargeEnd) action = "decharge";
      const sobryTtc = day.prix24h[h] * tva;
      const prixTRVh = prixTRV_TTC(day.date, h, selectedTRV, CONSTANTES.TVA) ?? 0;
      return {
        hour: `${h.toString().padStart(2, "0")}h`,
        prix: day.prix24h[h] * 1000,
        sobry: +sobryTtc.toFixed(4),
        ancien: +prixTRVh.toFixed(4),
        ecart: +(prixTRVh - sobryTtc).toFixed(4),
        conso: day.conso24h[h],
        action,
      };
    });
  }, [day, selectedTRV, tva]);

  const soc = useMemo(() => {
    if (!day || !result) return [];
    const cap = result.config.capacite;
    const arr: number[] = [];
    let s = 0;
    for (let h = 0; h < 24; h++) {
      const a = hourly[h]?.action;
      if (a === "charge") s = Math.min(cap, s + cap / Math.max((day.cycle1?.duree || 2), 1));
      else if (a === "decharge") s = Math.max(0, s - cap / Math.max((day.cycle1?.duree || 2), 1));
      arr.push(s);
    }
    return arr.map((v, h) => ({ hour: `${h}h`, soc: v }));
  }, [hourly, day, result]);

  const heatmap = useMemo(() => {
    const moyenne = dayEconomies.reduce((s, e) => s + e.total, 0) / Math.max(dayEconomies.length, 1);
    return days.map((d: any, i: number) => ({
      date: d.date,
      gain: dayEconomies[i].total,
      color: getColorForDay(dayEconomies[i].total, moyenne),
    }));
  }, [days, dayEconomies]);

  const dayMap = useMemo(
    () => new Map<string, any>(days.map((d: any) => [d.date, d])),
    [days]
  );

  const factureSobry = data.factureSobry;
  const canExport = !!factureSobry?.details_horaires?.length && !!result;

  const handleExport = () => {
    if (!canExport) return;
    const tvaMul = 1 + CONSTANTES.TVA;
    const capacite = result.config.capacite as number;
    const details = factureSobry!.details_horaires as any[];

    type CycleGain = { perHour: Map<number, number> };
    const cycleGainsByDate = new Map<string, CycleGain[]>();
    for (const d of days) {
      const cycles: CycleGain[] = [];
      for (const c of [d.cycle1, d.cycle2]) {
        if (!c) continue;
        const dechHours: number[] = [];
        for (let h = c.dechargeStart; h <= c.dechargeEnd; h++) dechHours.push(h);
        const consoSur = dechHours.reduce((s, h) => s + (d.conso24h[h] || 0), 0);
        const energieRestituable = Math.min(capacite, consoSur);
        const spreadNet = c.spread * CONSTANTES.RTE_BATTERIE * CONSTANTES.DEGRADATION;
        const gainCycle = Math.max(0, spreadNet * energieRestituable * tvaMul);
        const perHour = new Map<number, number>();
        if (consoSur > 0) {
          for (const h of dechHours) {
            perHour.set(h, gainCycle * ((d.conso24h[h] || 0) / consoSur));
          }
        }
        cycles.push({ perHour });
      }
      cycleGainsByDate.set(d.date, cycles);
    }

    const plageTRV = (date: string, hour: number, type: TarifTRVType): string => {
      if (type === "BLEU_BASE") return "BASE";
      if (type === "BLEU_HPHC") return (hour >= 22 || hour < 6) ? "HC" : "HP";
      const month = parseInt(date.split("-")[1], 10);
      const isHiver = month >= 11 || month <= 3;
      const dow = new Date(date + "T00:00:00").getDay();
      const isHC = dow === 0 || hour >= 22 || hour < 7;
      return isHiver ? (isHC ? "HCH" : "HPH") : (isHC ? "HCE" : "HPE");
    };

    const grilleFor = (type: TarifTRVType): GrilleTRVPeriode[] =>
      type === "BLEU_BASE" ? TRV_BLEU_BASE : type === "BLEU_HPHC" ? TRV_BLEU_HPHC : TRV_JAUNE_CU;

    const fmtFr = (iso: string) => {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };
    const periodeBareme = (date: string, type: TarifTRVType) => {
      const p = grilleFor(type).find(
        (g) => g.dateDebut <= date && (g.dateFin === null || date <= g.dateFin)
      );
      if (!p) return { periode: null as GrilleTRVPeriode | null, label: "" };
      return { periode: p, label: `${fmtFr(p.dateDebut)}→${p.dateFin ? fmtFr(p.dateFin) : "∞"}` };
    };

    const actionBatterie = (dayPlan: any, hour: number): "" | "charge" | "decharge" => {
      if (!dayPlan) return "";
      const c1 = dayPlan.cycle1, c2 = dayPlan.cycle2;
      if (c1 && hour >= c1.chargeStart && hour <= c1.chargeEnd) return "charge";
      if (c1 && hour >= c1.dechargeStart && hour <= c1.dechargeEnd) return "decharge";
      if (c2 && hour >= c2.chargeStart && hour <= c2.chargeEnd) return "charge";
      if (c2 && hour >= c2.dechargeStart && hour <= c2.dechargeEnd) return "decharge";
      return "";
    };

    const gainBatterieHeure = (date: string, hour: number): number => {
      const cycles = cycleGainsByDate.get(date);
      if (!cycles) return 0;
      let g = 0;
      for (const c of cycles) g += c.perHour.get(hour) || 0;
      return g;
    };

    const headers = [
      "Timestamp CET", "Date", "Heure", "Jour semaine", "Conso",
      "Plage Sobry", "EPEX spot", "TURPE variable", "Accise", "Autres (marge+prime+CEE+capa)",
      "Prix Sobry HT", "Prix Sobry TTC", "Coût Sobry TTC",
      "Plage TRV", "Période barème TRV", "Prix TRV HTVA", "Prix TRV TTC", "Coût TRV TTC",
      "Delta TTC", "Économie Sobry h",
      "Action batterie", "Énergie pendant action", "Gain batterie h",
      "Économie totale h",
    ];
    const units = [
      "", "YYYY-MM-DD", "0-23", "0=dim..6=sam", "kWh",
      "HPH/HCH/HPB/HCB", "€/kWh", "€/kWh", "€/kWh", "€/kWh",
      "€/kWh", "€/kWh", "€",
      "", "", "€/kWh", "€/kWh", "€",
      "€/kWh", "€",
      "", "kWh", "€",
      "€",
    ];

    const rows: any[][] = [headers, units];
    let sConso = 0, sCoutSobry = 0, sCoutTrv = 0, sEcoSobry = 0, sGainBat = 0, sEcoTotal = 0;

    for (const h of details) {
      const date: string = String(h.timestamp).slice(0, 10);
      let hour = 0;
      if (h.timestamp_cet) {
        const m = String(h.timestamp_cet).match(/T(\d{2})/) || String(h.timestamp_cet).match(/\s(\d{2}):/);
        if (m) hour = parseInt(m[1], 10);
      } else {
        hour = new Date(h.timestamp).getUTCHours();
      }
      const dow = new Date(date + "T00:00:00").getDay();
      const conso = Number(h.conso_kwh) || 0;
      const spot = Number(h.spot_eur_kwh) || 0;
      const turpe = Number(h.turpe_var_eur_kwh) || 0;
      const accise = Number(h.accise_eur_kwh) || 0;
      const costTot = Number(h.cost_total_eur) || 0;

      const prixSobryHt = conso > 0 ? costTot / conso : 0;
      const autres = conso > 0 ? prixSobryHt - spot - turpe - accise : 0;
      const prixSobryTtc = prixSobryHt * tvaMul;
      const coutSobryTtc = prixSobryTtc * conso;

      const plageT = plageTRV(date, hour, selectedTRV);
      const { periode, label: barLabel } = periodeBareme(date, selectedTRV);
      const prixTrvHtva = periode ? (periode.composantes[plageT] ?? null) : null;
      const prixTrvTtc = prixTrvHtva !== null ? prixTrvHtva * tvaMul : null;
      const coutTrvTtc = prixTrvTtc !== null ? prixTrvTtc * conso : null;
      const deltaTtc = prixTrvTtc !== null ? prixTrvTtc - prixSobryTtc : null;
      const ecoSobry = coutTrvTtc !== null ? coutTrvTtc - coutSobryTtc : null;

      const dayPlan = dayMap.get(date);
      const action = actionBatterie(dayPlan, hour);
      const energieAction = action ? (dayPlan?.conso24h?.[hour] || 0) : 0;
      const gainBat = gainBatterieHeure(date, hour);
      const ecoTotal = (ecoSobry || 0) + gainBat;

      sConso += conso;
      sCoutSobry += coutSobryTtc;
      if (coutTrvTtc !== null) sCoutTrv += coutTrvTtc;
      if (ecoSobry !== null) sEcoSobry += ecoSobry;
      sGainBat += gainBat;
      sEcoTotal += ecoTotal;

      rows.push([
        h.timestamp_cet || h.timestamp,
        date,
        hour,
        dow,
        conso,
        h.periode || "",
        spot, turpe, accise, autres,
        prixSobryHt, prixSobryTtc, coutSobryTtc,
        plageT, barLabel,
        prixTrvHtva ?? "",
        prixTrvTtc ?? "",
        coutTrvTtc ?? "",
        deltaTtc ?? "",
        ecoSobry ?? "",
        action,
        energieAction,
        gainBat,
        ecoTotal,
      ]);
    }

    rows.push([
      "TOTAL", "", "", "", sConso,
      "", "", "", "", "",
      "", "", sCoutSobry,
      "", "", "", "", sCoutTrv,
      "", sEcoSobry,
      "", "", sGainBat,
      sEcoTotal,
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Calcul détaillé");
    XLSX.writeFile(
      wb,
      `simulateur-switch-calcul-exhaustif-${selectedTRV}-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };



  if (!result || !days.length) {
    return (
      <div className="container mx-auto px-4 mt-10 max-w-3xl text-center text-muted-foreground">
        Aucun planning. Reviens à l'étape précédente.
      </div>
    );
  }

  const econoDuJour = dayEconomies[dayIdx];
  const nomFournisseur = "EDF " + libelleTarifTRV(selectedTRV);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-6xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 7 / 8</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Économies Dynawatt face aux Tarifs EDF</h1>
          <p className="text-sm text-muted-foreground">
            Comparez Dynawatt aux Tarifs Réglementés EDF. Énergie + taxes uniquement, hors abonnement.
          </p>
        </div>

        {/* Filtre TRV + indicateur kVA */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Comparer Dynawatt face à
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Contrat client : <span className="font-mono font-bold">{kvaClient} kVA</span> →{" "}
                {isC4 ? "C4 (> 36 kVA)" : "C5 (≤ 36 kVA)"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div
                className={`px-3 py-2 rounded-xl text-xs font-mono border-2 ${
                  economieMensuelle >= 0
                    ? "bg-green-50 border-green-300 text-green-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                <div className="text-[9px] uppercase tracking-widest opacity-70">Économie / mois</div>
                <div className="text-base font-bold">
                  {economieMensuelle >= 0 ? "+" : ""}{fmt(economieMensuelle, 0)} €
                </div>
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-xs font-mono border-2 ${
                  economieAnnuelle >= 0
                    ? "bg-green-50 border-green-300 text-green-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                <div className="text-[9px] uppercase tracking-widest opacity-70">Économie / an</div>
                <div className="text-base font-bold">
                  {economieAnnuelle >= 0 ? "+" : ""}{fmt(economieAnnuelle, 0)} €
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["BLEU_BASE", "BLEU_HPHC", "JAUNE_CU"] as TarifTRVType[]).map((t) => {
              const applicable = tarifApplicable(t, kvaClient);
              const isWorst = t === worstCaseTarif;
              const isBest = t === bestCaseTarif;
              const isSelected = selectedTRV === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTRV(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition-all border-2 flex items-center gap-2 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  } ${!applicable ? "opacity-60" : ""}`}
                >
                  {libelleTarifTRV(t)}
                  {!applicable && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-200 text-yellow-900 uppercase tracking-widest">
                      non appli.
                    </span>
                  )}
                  {isWorst && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-200 text-red-900 uppercase tracking-widest">
                      worst
                    </span>
                  )}
                  {isBest && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-200 text-green-900 uppercase tracking-widest">
                      best
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Journée simulée
              </div>
              <div className="font-black text-xl">
                {new Date(day.date).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "2-digit", month: "long", year: "numeric",
                })}
              </div>
            </div>
            <button
              onClick={() => setAuto((a) => !a)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all ${
                auto
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {auto ? "⏸ Pause" : "▶ Lecture auto"}
            </button>
          </div>
          <Slider
            value={[dayIdx]}
            min={0}
            max={days.length - 1}
            step={1}
            onValueChange={(v) => { setAuto(false); setDayIdx(v[0]); }}
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
            <span>{days[0].date}</span>
            <span>{days[days.length - 1].date}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Panel icon={<Euro className="w-4 h-4" />} title="Tarif horaire (€/kWh TTC)" tone="primary">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 0.4]} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${Number(v).toFixed(4)} €/kWh`, name]}
                  labelFormatter={(l) => `Heure ${l}`} />
                <RLegend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <Line type="stepAfter" dataKey="ancien" name={nomFournisseur} stroke="#F97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sobry" name="Sobry" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
              Écart moyen : {(hourly.reduce((s, h) => s + h.ecart, 0) / 24).toFixed(4)} €/kWh
            </div>
          </Panel>

          <Panel icon={<Zap className="w-4 h-4" />} title="Actions batterie" tone="gold">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(_v: number, _n, p: any) => [
                    p.payload.action === "charge" ? "🔋 Charge" : p.payload.action === "decharge" ? "⚡ Décharge" : "—",
                    "Action",
                  ]} />
                <Bar dataKey="prix" radius={[4, 4, 0, 0]}>
                  {hourly.map((h, i) => (
                    <Cell key={i}
                      fill={
                        h.action === "charge" ? "hsl(var(--primary))"
                        : h.action === "decharge" ? "hsl(var(--accent))"
                        : "hsl(var(--muted-foreground) / 0.2)"
                      } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Legend />
          </Panel>

          <Panel icon={<Battery className="w-4 h-4" />} title="État de charge batterie (kWh)" tone="primary">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={soc}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} kWh`, "SoC"]} />
                <Area type="monotone" dataKey="soc" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.25)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel icon={<Activity className="w-4 h-4" />} title="Consommation site (kWh)" tone="muted">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Conso"]} />
                <Line type="monotone" dataKey="conso" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <motion.div
          key={day.date + selectedTRV}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-6 text-center mb-8"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Économies Dynawatt vs {nomFournisseur}
          </div>
          <div className="font-black text-4xl font-mono mt-1" style={{ color: econoDuJour.total >= 0 ? "#10B981" : "#EF4444" }}>
            {econoDuJour.total >= 0 ? "+" : ""}{fmt(econoDuJour.total, 2)} €
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">
            {day.cycleCount} cycle{day.cycleCount > 1 ? "s" : ""} effectué{day.cycleCount > 1 ? "s" : ""}
          </div>
        </motion.div>

        <div className="glass rounded-3xl p-5 md:p-7">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Vue annuelle</div>
          <h2 className="text-xl md:text-2xl font-black mb-4">Heatmap des gains journaliers</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-1">
            {heatmap.map((h, i) => (
              <button
                key={h.date}
                onClick={() => { setAuto(false); setDayIdx(i); }}
                title={`${h.date} : ${h.gain >= 0 ? "+" : ""}${h.gain.toFixed(2)} €`}
                className="aspect-square rounded-sm transition-all hover:scale-125 hover:ring-2 hover:ring-gold"
                style={{
                  background: h.color,
                  outline: i === dayIdx ? "2px solid hsl(var(--accent))" : "none",
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-muted-foreground mt-3 flex-wrap">
            {[
              { c: "#15803D", l: "Forte économie" },
              { c: "#22C55E", l: "Économie moyenne" },
              { c: "#86EFAC", l: "Faible économie" },
              { c: "#D1D5DB", l: "Neutre" },
              { c: "#FDBA74", l: "Petit surcoût" },
              { c: "#EF4444", l: "Gros surcoût" },
            ].map((s) => (
              <span key={s.c} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: s.c }} />
                {s.l}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="container mx-auto px-4 mt-6 mb-10 max-w-6xl flex justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={prev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!canExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Exporter calcul exhaustif heure par heure
          </Button>
        </div>
        <Button
          onClick={next}
          className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
        >
          Voir le financement <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}

function getColorForDay(economieJour: number, moyenneAnnuelle: number): string {
  const moyAbs = Math.abs(moyenneAnnuelle) || 0.01;
  const seuilNeutre = moyAbs * 0.05;
  if (economieJour > moyenneAnnuelle * 1.5) return "#15803D";
  if (economieJour > moyenneAnnuelle * 0.5) return "#22C55E";
  if (economieJour > seuilNeutre) return "#86EFAC";
  if (economieJour >= -seuilNeutre) return "#D1D5DB";
  if (economieJour > -moyAbs * 0.5) return "#FDBA74";
  return "#EF4444";
}

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid hsl(262 83% 58%)",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(248 35% 17%)",
  boxShadow: "0 8px 24px -8px hsl(248 35% 17% / 0.15)",
};

function Panel({
  icon, title, tone, children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "primary" | "gold" | "muted";
  children: React.ReactNode;
}) {
  const color = tone === "gold" ? "text-gold" : tone === "primary" ? "text-primary-light" : "text-muted-foreground";
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} /> Charge
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--accent))" }} /> Décharge
      </span>
    </div>
  );
}
