import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSwitchgridStore } from "@/lib/switchgrid/store";
import { switchgridToHourlyKwh } from "@/lib/switchgrid/transformer";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, RotateCcw } from "lucide-react";

function fmtPrm(s: string) {
  const d = s.replace(/\D/g, "");
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 14)].filter(Boolean).join(" ");
}
function fmtDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
const MONTHS = ["Janv.","Févr.","Mars","Avril","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];

export default function SwitchgridResults() {
  const navigate = useNavigate();
  const { loadCurve, prm, clear } = useSwitchgridStore();

  const result = useMemo(() => loadCurve ? switchgridToHourlyKwh(loadCurve) : null, [loadCurve]);

  if (!loadCurve || !prm || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-600">Aucune donnée. Lance une nouvelle récupération.</p>
        <button onClick={() => navigate("/switchgrid")} className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700">
          Démarrer
        </button>
      </div>
    );
  }

  // Daily aggregation (UTC days)
  const daily = useMemo(() => {
    const out: { date: string; kwh: number }[] = [];
    const startMs = new Date(result.windowStart).getTime();
    for (let d = 0; d < 365; d++) {
      let sum = 0;
      for (let h = 0; h < 24; h++) sum += result.hourlyKwh[d * 24 + h] ?? 0;
      const ts = new Date(startMs + d * 24 * 3600 * 1000);
      out.push({ date: ts.toISOString().slice(0, 10), kwh: +sum.toFixed(2) });
    }
    return out;
  }, [result]);

  // Monthly recap
  const monthly = useMemo(() => {
    const buckets = new Map<string, { total: number; peak: number; peakIso: string }>();
    const startMs = new Date(result.windowStart).getTime();
    for (let i = 0; i < result.hourlyKwh.length; i++) {
      const ts = new Date(startMs + i * 3600 * 1000);
      const key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth()+1).padStart(2,"0")}`;
      const v = result.hourlyKwh[i];
      const cur = buckets.get(key) ?? { total: 0, peak: 0, peakIso: ts.toISOString() };
      cur.total += v;
      if (v > cur.peak) { cur.peak = v; cur.peakIso = ts.toISOString(); }
      buckets.set(key, cur);
    }
    return Array.from(buckets.entries()).map(([k, v]) => {
      const [y, m] = k.split("-");
      return {
        label: `${MONTHS[+m - 1]} ${y}`,
        total: v.total,
        peak: v.peak,
        peakAt: new Date(v.peakIso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      };
    });
  }, [result]);

  function downloadJSON() {
    const payload = {
      prm,
      fetchedAt: new Date().toISOString(),
      windowStart: result.windowStart,
      windowEnd: result.windowEnd,
      hourlyKwh: result.hourlyKwh,
      qualityScore: result.qualityScore,
      totalKwh: result.totalKwh,
      warnings: result.warnings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "switchgrid-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Courbe Linky récupérée</h1>
          <p className="text-slate-600 mt-1">Données prêtes à être réutilisées.</p>
        </header>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 grid grid-cols-2 md:grid-cols-5 gap-6">
          <Stat label="PRM" value={<span className="font-mono text-sm">{fmtPrm(prm)}</span>} />
          <Stat label="Période" value={<span className="text-sm">{fmtDateFR(result.windowStart)} → {fmtDateFR(result.windowEnd)}</span>} />
          <Stat label="Heures" value={<span className="text-2xl font-semibold">{result.hourlyKwh.length}</span>} />
          <Stat label="Qualité" value={<span className="text-2xl font-semibold">{Math.round(result.qualityScore * 100)} %</span>} />
          <Stat label="Total annuel" value={<span className="text-2xl font-semibold">{Math.round(result.totalKwh).toLocaleString("fr-FR")} kWh</span>} />
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Consommation quotidienne</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis tick={{ fontSize: 11 }} unit=" kWh" width={70} />
                <Tooltip />
                <Area type="monotone" dataKey="kwh" stroke="#10b981" fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Récap mensuel</h2>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase">
              <tr><th className="text-left py-2">Mois</th><th className="text-right">Total kWh</th><th className="text-right">Pic horaire kWh</th><th className="text-right">Heure du pic</th></tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.label} className="border-t border-slate-100">
                  <td className="py-2">{m.label}</td>
                  <td className="text-right font-medium">{Math.round(m.total).toLocaleString("fr-FR")}</td>
                  <td className="text-right">{m.peak.toFixed(2)}</td>
                  <td className="text-right text-slate-500">{m.peakAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.warnings.length > 0 && (
          <details className="rounded-2xl border border-slate-200 p-4 text-sm">
            <summary className="cursor-pointer font-medium">{result.warnings.length} avertissement(s)</summary>
            <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadJSON} className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-lg py-3 font-medium hover:bg-emerald-700">
            <Download className="w-4 h-4" /> Télécharger JSON
          </button>
          <button onClick={() => { clear(); navigate("/switchgrid"); }}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-900 rounded-lg py-3 font-medium hover:bg-slate-50">
            <RotateCcw className="w-4 h-4" /> Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-emerald-700/70">{label}</div>
      <div className="mt-1 text-emerald-900">{value}</div>
    </div>
  );
}
