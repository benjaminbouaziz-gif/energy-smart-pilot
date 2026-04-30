import { motion } from "framer-motion";
import { Battery, TrendingDown, TrendingUp } from "lucide-react";

export const EnergyChart = () => {
  // Simulated 24h price curve + battery action
  const prices = [42, 38, 35, 32, 30, 35, 55, 80, 95, 88, 75, 70, 68, 72, 78, 92, 110, 125, 115, 95, 80, 65, 55, 48];
  const max = Math.max(...prices);
  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-gradient-to-br from-primary/30 via-transparent to-gold/20 blur-3xl rounded-full" />
      <div className="relative glass rounded-3xl p-6 md:p-8 glow-violet">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Prix EPEX J+1</div>
            <div className="text-2xl font-bold mt-1">Pilotage en temps réel</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40">
            <Battery className="w-4 h-4 text-primary-light" />
            <span className="text-xs font-mono">SOC 78%</span>
          </div>
        </div>

        <div className="relative h-48 flex items-end gap-1">
          {prices.map((p, i) => {
            const h = (p / max) * 100;
            const isLow = p < 50;
            const isHigh = p > 100;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: "easeOut" }}
                className={`flex-1 rounded-t-sm relative ${
                  isLow ? "bg-gradient-to-t from-primary to-primary-light" :
                  isHigh ? "bg-gradient-to-t from-gold-warm to-gold" :
                  "bg-muted"
                }`}
              >
                {isLow && i === 4 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary-light whitespace-nowrap">
                    ⚡ CHARGE
                  </div>
                )}
                {isHigh && i === 17 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gold whitespace-nowrap">
                    💰 DÉCHARGE
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 border-primary/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="w-3 h-3 text-primary-light" />Achat optimisé</div>
            <div className="font-mono text-lg font-bold text-primary-light mt-1">0,032 €/kWh</div>
          </div>
          <div className="glass rounded-xl p-3 border-gold/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="w-3 h-3 text-gold" />Économie jour</div>
            <div className="font-mono text-lg font-bold text-gold mt-1">+ 18,40 €</div>
          </div>
        </div>
      </div>
    </div>
  );
};
