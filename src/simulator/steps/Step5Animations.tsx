import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { Slider } from "@/components/ui/slider";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend as RLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Battery, Euro, Zap } from "lucide-react";
import { CONSTANTES } from "@/lib/dynawatt-engine";

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

export default function Step5Animations() {
  const { result, next } = useSimulator();

  if (!result || !result.planJours.length) {
    return (
      <div className="container mx-auto px-4 mt-10 max-w-3xl text-center text-muted-foreground">
        Aucun planning. Reviens à l'étape précédente.
      </div>
    );
  }

  const days = result.planJours;
  const [dayIdx, setDayIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  // Auto-play du slider
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setDayIdx((i) => (i + 1) % days.length);
    }, 800);
    return () => clearInterval(id);
  }, [auto, days.length]);

  const day = days[dayIdx];

  // Données graphiques heure par heure
  const hourly = useMemo(() => {
    const c1 = day.cycle1;
    const c2 = day.cycle2;
    return Array.from({ length: 24 }, (_, h) => {
      let action: "charge" | "decharge" | null = null;
      if (c1 && h >= c1.chargeStart && h <= c1.chargeEnd) action = "charge";
      else if (c1 && h >= c1.dechargeStart && h <= c1.dechargeEnd) action = "decharge";
      else if (c2 && h >= c2.chargeStart && h <= c2.chargeEnd) action = "charge";
      else if (c2 && h >= c2.dechargeStart && h <= c2.dechargeEnd) action = "decharge";
      return {
        hour: `${h}h`,
        prix: day.prix24h[h] * 1000, // €/MWh
        conso: day.conso24h[h],
        action,
      };
    });
  }, [day]);

  // SoC simulé
  const soc = useMemo(() => {
    const cap = result.config.capacite;
    const arr: number[] = [];
    let s = 0;
    for (let h = 0; h < 24; h++) {
      const a = hourly[h].action;
      if (a === "charge") s = Math.min(cap, s + cap / Math.max((day.cycle1?.duree || 2), 1));
      else if (a === "decharge") s = Math.max(0, s - cap / Math.max((day.cycle1?.duree || 2), 1));
      arr.push(s);
    }
    return arr.map((v, h) => ({ hour: `${h}h`, soc: v }));
  }, [hourly, day, result.config.capacite]);

  // Heatmap : jours × mois
  const heatmap = useMemo(() => {
    const max = Math.max(...days.map((d) => d.gainJour), 0.0001);
    return days.map((d) => ({
      date: d.date,
      gain: d.gainJour,
      intensity: d.gainJour / max,
    }));
  }, [days]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-6xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Étape 5 / 6</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">L'algorithme Dynawatt en action</h1>
          <p className="text-sm text-muted-foreground">
            Visualisez heure par heure comment la batterie achète bas et restitue cher.
          </p>
        </div>

        {/* Slider date */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Journée simulée
              </div>
              <div className="font-black text-xl">
                {new Date(day.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
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
            onValueChange={(v) => {
              setAuto(false);
              setDayIdx(v[0]);
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
            <span>{days[0].date}</span>
            <span>{days[days.length - 1].date}</span>
          </div>
        </div>

        {/* 4 panels */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Panel 1 : prix horaire */}
          <Panel icon={<Euro className="w-4 h-4" />} title="Prix horaire (€/MWh)" tone="primary">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(0)} €/MWh`, "Prix"]}
                />
                <Area
                  type="monotone"
                  dataKey="prix"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* Panel 2 : actions */}
          <Panel icon={<Zap className="w-4 h-4" />} title="Actions batterie" tone="gold">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _n, p: any) => [
                    p.payload.action === "charge"
                      ? "🔋 Charge"
                      : p.payload.action === "decharge"
                      ? "⚡ Décharge"
                      : "—",
                    "Action",
                  ]}
                />
                <Bar dataKey="prix" radius={[4, 4, 0, 0]}>
                  {hourly.map((h, i) => (
                    <Cell
                      key={i}
                      fill={
                        h.action === "charge"
                          ? "hsl(var(--primary))"
                          : h.action === "decharge"
                          ? "hsl(var(--accent))"
                          : "hsl(var(--muted-foreground) / 0.2)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Legend />
          </Panel>

          {/* Panel 3 : SoC batterie */}
          <Panel icon={<Battery className="w-4 h-4" />} title="État de charge batterie (kWh)" tone="primary">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={soc}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(1)} kWh`, "SoC"]}
                />
                <Area
                  type="monotone"
                  dataKey="soc"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent) / 0.25)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* Panel 4 : conso */}
          <Panel icon={<Activity className="w-4 h-4" />} title="Consommation site (kWh)" tone="muted">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Conso"]}
                />
                <Line
                  type="monotone"
                  dataKey="conso"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Gain du jour */}
        <motion.div
          key={day.date}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-6 text-center mb-8"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Gain pilotage ce jour
          </div>
          <div className="font-black text-4xl text-gradient-gold font-mono mt-1">
            +{fmt(day.gainJour, 2)} €
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {day.cycleCount} cycle{day.cycleCount > 1 ? "s" : ""} effectué{day.cycleCount > 1 ? "s" : ""}
          </div>
        </motion.div>

        {/* Heatmap annuelle */}
        <div className="glass rounded-3xl p-5 md:p-7">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
            Vue annuelle
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-4">
            Heatmap des gains journaliers
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-1">
            {heatmap.map((h, i) => (
              <button
                key={h.date}
                onClick={() => {
                  setAuto(false);
                  setDayIdx(i);
                }}
                title={`${h.date} : +${h.gain.toFixed(2)} €`}
                className="aspect-square rounded-sm transition-all hover:scale-125 hover:ring-2 hover:ring-gold"
                style={{
                  background: `hsl(43 96% 56% / ${0.15 + h.intensity * 0.85})`,
                  outline:
                    i === dayIdx ? "2px solid hsl(var(--accent))" : "none",
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-3">
            <span>Moins de gains</span>
            <div className="flex gap-1">
              {[0.15, 0.4, 0.65, 0.85, 1].map((o) => (
                <div
                  key={o}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: `hsl(43 96% 56% / ${o})` }}
                />
              ))}
            </div>
            <span>Plus de gains</span>
          </div>
        </div>
      </motion.section>

      <WizardFooter onNext={next} nextLabel="Voir le financement" />
    </>
  );
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
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "primary" | "gold" | "muted";
  children: React.ReactNode;
}) {
  const color =
    tone === "gold" ? "text-gold" : tone === "primary" ? "text-primary-light" : "text-muted-foreground";
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
