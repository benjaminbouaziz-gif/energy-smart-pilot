import { motion } from "framer-motion";

export interface ComparativeRow {
  label: string;
  alternative: string;
  dynawatt: string;
  highlight?: boolean;
}

interface Props {
  alternativeLabel?: string;
  dynawattLabel?: string;
  rows: ComparativeRow[];
  title?: string;
  subtitle?: string;
}

export const ComparativeTable = ({
  alternativeLabel = "Solaire + batterie complet",
  dynawattLabel = "Dynawatt",
  rows,
  title,
  subtitle,
}: Props) => (
  <div className="max-w-5xl mx-auto">
    {(title || subtitle) && (
      <div className="text-center mb-10">
        {title && <h2 className="text-3xl md:text-4xl font-black mb-3">{title}</h2>}
        {subtitle && <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    )}

    <div className="glass rounded-3xl overflow-hidden">
      <div className="grid grid-cols-3 px-4 md:px-6 py-4 border-b border-border/50 text-xs font-mono uppercase tracking-wider">
        <div className="text-muted-foreground">Critère</div>
        <div className="text-center text-muted-foreground">{alternativeLabel}</div>
        <div className="text-center text-gold">{dynawattLabel}</div>
      </div>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.04 }}
          className={`grid grid-cols-3 px-4 md:px-6 py-4 items-center border-b border-border/30 last:border-0 text-sm md:text-base ${
            r.highlight ? "bg-gradient-to-r from-primary/10 via-gold/5 to-transparent" : ""
          }`}
        >
          <div className="font-semibold pr-2">{r.label}</div>
          <div className="text-center text-muted-foreground">{r.alternative}</div>
          <div className="text-center font-bold text-gold">{r.dynawatt}</div>
        </motion.div>
      ))}
    </div>
  </div>
);
