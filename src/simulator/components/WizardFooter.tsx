import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSimulator } from "../SimulatorContext";

interface Props {
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  hidePrev?: boolean;
}

export function WizardFooter({ onNext, nextLabel = "Suivant", nextDisabled, hidePrev }: Props) {
  const { prev, next, step } = useSimulator();
  const handleNext = async () => {
    if (onNext) await onNext();
    else next();
  };
  return (
    <div className="container mx-auto px-4 mt-12 mb-8 flex items-center justify-between">
      {!hidePrev && step > 1 ? (
        <Button variant="ghost" onClick={prev} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Button>
      ) : (
        <span />
      )}
      {step < 6 && (
        <Button
          onClick={handleNext}
          disabled={nextDisabled}
          className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 gap-2 px-6 h-11 font-semibold shadow-[var(--shadow-glow)]"
        >
          {nextLabel} <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
