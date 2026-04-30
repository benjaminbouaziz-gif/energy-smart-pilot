import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { FAQ_ARTICLES, FAQ_CATEGORIES, type FaqCategory } from "@/app/mock/faq";
import { Search, ChevronDown, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Faq() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FAQ_ARTICLES.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q);
    });
  }, [search, category]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Base de connaissance</div>
        <h1 className="text-3xl md:text-4xl font-black">Comment fonctionne votre installation ?</h1>
        <p className="text-sm text-muted-foreground mt-1">Tout ce qu'il faut savoir sur Tigo, le pilotage Dynawatt et la facturation.</p>
      </motion.div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans la FAQ…" className="pl-11 h-12 text-base" />
      </div>

      {/* Catégories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <button onClick={() => setCategory("all")}
          className={`glass rounded-2xl p-3 text-center transition-all ${category === "all" ? "border-gold/50 bg-gold/5" : "hover:border-primary/40"}`}>
          <div className="text-2xl mb-1">📚</div>
          <div className="text-xs font-bold">Toutes</div>
        </button>
        {FAQ_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`glass rounded-2xl p-3 text-center transition-all ${category === c.id ? "border-gold/50 bg-gold/5" : "hover:border-primary/40"}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xs font-bold leading-tight">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Liste articles */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          {filtered.length} article{filtered.length > 1 ? "s" : ""}
        </div>
        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            Aucun résultat pour "{search}". Essayez d'autres mots-clés.
          </div>
        )}
        {filtered.map((a) => {
          const cat = FAQ_CATEGORIES.find((c) => c.id === a.category)!;
          const isOpen = open === a.id;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : a.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-primary/5 transition-colors">
                <span className="text-xl shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base">{a.question}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{cat.label}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                      {a.answer}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                        <span className="text-[11px] text-muted-foreground mr-2">Cet article vous a-t-il aidé ?</span>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                          <ThumbsUp className="w-3 h-3" />Oui ({a.helpful})
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <ThumbsDown className="w-3 h-3" />Non
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
