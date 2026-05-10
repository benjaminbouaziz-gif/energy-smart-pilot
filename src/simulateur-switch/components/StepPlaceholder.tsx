import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSimulateurSwitch, TOTAL_STEPS } from "../SimulateurSwitchContext";

interface Props {
  step: number;
  title: string;
  subStep: number;
}

export function StepPlaceholder({ step, title, subStep }: Props) {
  const { prev, next, step: current } = useSimulateurSwitch();
  const isFirst = current === 1;
  const isLast = current === TOTAL_STEPS;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-3xl"
    >
      <div className="text-center mb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
          Étape {step} / {TOTAL_STEPS}
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">{title}</h1>
      </div>

      <Card className="rounded-3xl border-primary/20 shadow-[var(--shadow-glow)]">
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Étape {step} — {title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder — sera implémenté à la sous-étape {subStep}.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={prev} disabled={isFirst} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            onClick={next}
            disabled={isLast}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  );
}
