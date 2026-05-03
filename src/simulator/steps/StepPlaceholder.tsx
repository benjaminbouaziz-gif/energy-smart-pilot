import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { WizardFooter } from "../components/WizardFooter";

export default function StepPlaceholder({ step, title }: { step: number; title: string }) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-2xl"
      >
        <div className="glass rounded-3xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-5">
            <Construction className="w-6 h-6 text-gold" />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
            Étape {step} / 6 — Bientôt
          </div>
          <h1 className="text-3xl font-black mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Cette étape est en cours de développement. Les étapes 1 à 3 sont opérationnelles.
          </p>
        </div>
      </motion.section>
      <WizardFooter />
    </>
  );
}
