import { useState } from "react";
import { useSimulateurSwitch } from "../SimulateurSwitchContext";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STEPS = [
  { n: 1, label: "Identité" },
  { n: 2, label: "Switchgrid" },
  { n: 3, label: "Analyse conso" },
  { n: 4, label: "Tarif concurrent" },
  { n: 5, label: "Comparaison" },
  { n: 6, label: "Animation" },
  { n: 7, label: "TRV EDF" },
  { n: 8, label: "Leasing" },
];

export function WizardHeader() {
  const { step, goToStep, data, resetSimulation } = useSimulateurSwitch();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasData =
    step > 1 ||
    !!data?.identite ||
    !!(data?.switchgrid && (data.switchgrid.prm || data.switchgrid.sessionId));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_12px_hsl(var(--accent))]" />
          <span className="font-extrabold tracking-wide text-lg">DYNAWATT</span>
          <span className="hidden md:inline text-xs font-mono uppercase tracking-widest text-muted-foreground ml-2">
            Simulator
          </span>
          {data?.identite?.prenom && (
            <span className="hidden md:inline text-xs text-muted-foreground ml-3">
              {data.identite.prenom} {data.identite.nom}
            </span>
          )}
        </div>

        {hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle simulation</span>
          </Button>
        )}
      </div>

      <div className="container mx-auto px-4 pb-3">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = step === s.n;
            const done = step > s.n;
            return (
              <div key={s.n} className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => done && goToStep(s.n)}
                  disabled={!done && !active}
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                    active ? "text-gold" : done ? "text-primary-light hover:text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border ${
                      active
                        ? "bg-gold text-accent-foreground border-gold"
                        : done
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span className="hidden lg:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-border/60 relative overflow-hidden rounded-full">
                    {done && (
                      <motion.div
                        layoutId={`fill-switch-${s.n}`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Démarrer une nouvelle simulation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les données saisies seront perdues. Continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetSimulation();
                setConfirmOpen(false);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
