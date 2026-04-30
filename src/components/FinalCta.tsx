import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export const FinalCta = () => (
  <section id="simulation" className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-gold/20" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/40 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            Découvrez vos économies en <span className="text-gradient-gold">3 minutes</span>.
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Simulation gratuite et sans engagement. Réponse personnalisée sous 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-bold h-14 px-8 text-base glow-gold">
              <a href="/pro">Simulation pro<ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass border-primary/40 hover:bg-primary/10 h-14 px-8 text-base font-semibold">
              <a href="/particulier">Simulation particulier</a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
