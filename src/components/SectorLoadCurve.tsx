import { motion } from "framer-motion";

interface Annotation {
  hour: number;
  label: string;
  type?: "peak" | "valley";
}

interface Props {
  /** 24 valeurs (kW) pour 0h-23h */
  curve: number[];
  annotations?: Annotation[];
}

export const SectorLoadCurve = ({ curve, annotations = [] }: Props) => {
  const max = Math.max(...curve);
  const W = 600;
  const H = 220;
  const pts = curve.map((v, i) => `${(i / 23) * W},${H - (v / max) * (H - 30) - 10}`).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;

  return (
    <div className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -inset-10 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Profil de charge typique</div>
            <div className="text-lg font-bold mt-1">Courbe horaire (kW)</div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">24h</div>
        </div>

        <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-56">
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line key={p} x1="0" x2={W} y1={H - p * (H - 30) - 10} y2={H - p * (H - 30) - 10}
              stroke="hsl(262 40% 25%)" strokeWidth="0.5" strokeDasharray="2 4" />
          ))}

          <motion.polygon
            points={area}
            fill="url(#loadGrad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          />
          <motion.polyline
            points={pts}
            fill="none"
            stroke="hsl(258 90% 76%)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />

          {annotations.map((a, i) => {
            const x = (a.hour / 23) * W;
            const y = H - (curve[a.hour] / max) * (H - 30) - 10;
            const color = a.type === "valley" ? "hsl(262 83% 58%)" : "hsl(43 96% 56%)";
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, y: -8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2 + i * 0.2 }}
              >
                <circle cx={x} cy={y} r="5" fill={color} />
                <circle cx={x} cy={y} r="9" fill={color} fillOpacity="0.25" />
                <text x={x} y={y - 14} textAnchor="middle"
                  fontSize="10" fontFamily="JetBrains Mono" fill={color}>
                  {a.label}
                </text>
              </motion.g>
            );
          })}

          {[0, 6, 12, 18, 23].map((h) => (
            <text key={h} x={(h / 23) * W} y={H + 16} textAnchor="middle"
              fontSize="9" fontFamily="JetBrains Mono" fill="hsl(252 30% 70%)">
              {String(h).padStart(2, "0")}h
            </text>
          ))}
        </svg>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Pic conso</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Heure creuse</span>
        </div>
      </div>
    </div>
  );
};
