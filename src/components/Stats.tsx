import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 33, suffix: "%", label: "d'économies moyennes vs TRV" },
  { value: 1.8, suffix: " ans", label: "ROI moyen", decimals: 1 },
  { value: 331, prefix: "+", suffix: " €/mois", label: "cash flow positif dès M1" },
  { value: 100, suffix: "%", label: "sans panneaux PV requis" },
];

const Counter = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const dur = 1500;
    const t0 = performance.now();
    const raf = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setN(start + (value - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref}>{n.toFixed(decimals)}</span>;
};

export const Stats = () => (
  <section className="py-20 relative">
    <div className="container mx-auto px-4">
      <div className="glass rounded-3xl p-8 md:p-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="font-display font-black text-4xl md:text-5xl text-gradient-gold mb-2">
              {s.prefix}<Counter value={s.value} decimals={s.decimals || 0} />{s.suffix}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
