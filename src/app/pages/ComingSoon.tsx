import { Construction } from "lucide-react";
import { motion } from "framer-motion";

export default function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="px-4 md:px-8 py-12 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-5">
          <Construction className="w-6 h-6 text-gold" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">Phase 2</div>
        <h1 className="text-3xl md:text-4xl font-black mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">{desc}</p>
      </motion.div>
    </div>
  );
}
