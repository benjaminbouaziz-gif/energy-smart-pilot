import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface PragmaticAdvantageItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Props {
  items: PragmaticAdvantageItem[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  outro?: string;
}

export const PragmaticAdvantage = ({ items, eyebrow, title, intro, outro }: Props) => (
  <section className="py-20">
    <div className="container mx-auto px-4 max-w-6xl">
      {(eyebrow || title || intro) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          {eyebrow && (
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">
              {eyebrow}
            </div>
          )}
          {title && <h2 className="text-3xl md:text-5xl font-black mb-4">{title}</h2>}
          {intro && <p className="text-muted-foreground text-base md:text-lg">{intro}</p>}
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 hover:border-gold/40 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {outro && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10 italic text-muted-foreground max-w-2xl mx-auto"
        >
          {outro}
        </motion.p>
      )}
    </div>
  </section>
);
