import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Briefcase, Home } from "lucide-react";
import { EnergyChart } from "./EnergyChart";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono"
            >
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse-glow" />
              Pilotage J-1 sur prix EPEX
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-6"
            >
              Le pilotage qui{" "}
              <span className="text-gradient-violet">dynamite</span> votre facture.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed"
            >
              Batterie pilotée par algorithme + contrat énergie dynamique. Jusqu'à{" "}
              <span className="text-gold font-semibold">33% d'économies</span> sur votre facture. Sans changer vos habitudes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button asChild size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold h-14 px-7 text-base glow-violet">
                <a href="/pro"><Briefcase className="mr-2 h-5 w-5" />Je suis professionnel<ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-7 text-base font-semibold glass border-primary/30 hover:bg-primary/10">
                <a href="/particulier"><Home className="mr-2 h-5 w-5" />Je suis particulier<ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
            >
              <div><span className="font-mono text-gold text-lg font-bold">+331€</span> /mois cash flow</div>
              <div className="w-px h-8 bg-border" />
              <div><span className="font-mono text-gold text-lg font-bold">1,8 an</span> ROI moyen</div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div className="hidden sm:block"><span className="font-mono text-gold text-lg font-bold">11 ans</span> garantie</div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <EnergyChart />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
