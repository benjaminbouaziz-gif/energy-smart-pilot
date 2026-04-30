import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePilotage, getActiveMode } from "@/app/hooks/usePilotage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plane, PartyPopper, Thermometer, Battery, CalendarClock, X, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function PilotagePage() {
  const { state, setVacation, setEvent, setComfort, setAutoMode, toggleCriticalSlot, clearCriticalSlots } = usePilotage();
  const activeMode = getActiveMode(state);

  const [vacOpen, setVacOpen] = useState(false);
  const [evOpen, setEvOpen] = useState(false);
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evType, setEvType] = useState<"mariage" | "seminaire" | "pic" | "autre">("seminaire");
  const [evLabel, setEvLabel] = useState("");

  const activateVacation = () => {
    if (!vacStart || !vacEnd) return;
    setVacation({ active: true, startDate: vacStart, endDate: vacEnd });
    setVacOpen(false);
    toast({ title: "Mode Vacances activé", description: `Du ${new Date(vacStart).toLocaleDateString("fr-FR")} au ${new Date(vacEnd).toLocaleDateString("fr-FR")}` });
  };

  const activateEvent = () => {
    if (!evDate) return;
    setEvent({ active: true, date: evDate, type: evType, label: evLabel || evType });
    setEvOpen(false);
    toast({ title: "Événement programmé", description: `${evLabel || evType} le ${new Date(evDate).toLocaleDateString("fr-FR")}` });
  };

  const criticalCount = state.critical.grid.flat().filter(Boolean).length;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Pilotage & modes</div>
        <h1 className="text-3xl md:text-4xl font-black">Personnalisez votre pilotage</h1>
        <p className="text-sm text-muted-foreground mt-1">L'algorithme s'adapte à vos préférences en temps réel.</p>
      </motion.div>

      {/* Mode actuel */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Mode actif</div>
          <div className="font-black text-2xl">{activeMode.label}</div>
          {activeMode.type === "vacation" && (
            <button onClick={() => setVacation({ active: false })} className="text-xs text-destructive mt-2 hover:underline">Désactiver le mode Vacances</button>
          )}
          {activeMode.type === "event" && (
            <button onClick={() => setEvent({ active: false })} className="text-xs text-destructive mt-2 hover:underline">Annuler l'événement</button>
          )}
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/40 border border-border/40">
          <span className={`text-xs font-mono ${state.autoMode ? "text-emerald-400" : "text-muted-foreground"}`}>AUTO</span>
          <Switch checked={state.autoMode} onCheckedChange={setAutoMode} />
          <span className={`text-xs font-mono ${!state.autoMode ? "text-gold" : "text-muted-foreground"}`}>MANUEL</span>
        </div>
      </motion.section>

      {/* Modes spéciaux */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Vacances */}
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass rounded-3xl p-6 hover:border-primary/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-light" />
            </div>
            {state.vacation.active && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIF</span>}
          </div>
          <h3 className="font-black text-xl mb-2">Mode Vacances 🏖️</h3>
          <p className="text-sm text-muted-foreground mb-4">Réduit l'activité de la batterie pendant votre absence — préserve les cycles et privilégie la sécurité.</p>
          {state.vacation.active && state.vacation.startDate && state.vacation.endDate ? (
            <div className="text-xs font-mono text-muted-foreground mb-3">
              Du {new Date(state.vacation.startDate).toLocaleDateString("fr-FR")} au {new Date(state.vacation.endDate).toLocaleDateString("fr-FR")}
            </div>
          ) : null}
          <Dialog open={vacOpen} onOpenChange={setVacOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant={state.vacation.active ? "outline" : "default"}>
                {state.vacation.active ? "Modifier" : "Activer le mode Vacances"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer mes vacances</DialogTitle>
                <DialogDescription>Indiquez vos dates d'absence pour adapter le pilotage.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Date de début</Label>
                  <Input type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de fin</Label>
                  <Input type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={activateVacation} disabled={!vacStart || !vacEnd} className="bg-gradient-to-r from-primary to-primary-dark">Activer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Événement */}
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 hover:border-gold/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center">
              <PartyPopper className="w-5 h-5 text-gold" />
            </div>
            {state.event.active && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">PROGRAMMÉ</span>}
          </div>
          <h3 className="font-black text-xl mb-2">Mode Événement 🎉</h3>
          <p className="text-sm text-muted-foreground mb-4">Charge la batterie au maximum avant un événement à fort enjeu (mariage, séminaire, pic d'activité).</p>
          {state.event.active && state.event.date ? (
            <div className="text-xs font-mono text-muted-foreground mb-3">
              {state.event.label || state.event.type} · {new Date(state.event.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          ) : null}
          <Dialog open={evOpen} onOpenChange={setEvOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-gold to-gold-warm text-background font-bold hover:opacity-90">
                {state.event.active ? "Modifier l'événement" : "Programmer un événement"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer un événement</DialogTitle>
                <DialogDescription>L'algorithme garantira une batterie pleine à l'heure du début.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Type d'événement</Label>
                  <select value={evType} onChange={(e) => setEvType(e.target.value as typeof evType)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                    <option value="mariage">Mariage</option>
                    <option value="seminaire">Séminaire</option>
                    <option value="pic">Pic d'activité</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date et heure</Label>
                  <Input type="datetime-local" value={evDate} onChange={(e) => setEvDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (facultatif)</Label>
                  <Input placeholder="Ex : Mariage 80 personnes" value={evLabel} onChange={(e) => setEvLabel(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={activateEvent} disabled={!evDate} className="bg-gradient-to-r from-gold to-gold-warm text-background">Programmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* Préférences de confort */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Préférences de confort</div>
        <h2 className="text-xl md:text-2xl font-black mb-6">Vos limites, votre confort</h2>

        <div className="space-y-7 max-w-2xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2 text-sm font-bold"><Thermometer className="w-4 h-4 text-primary-light" />Température minimum acceptée</Label>
              <span className="font-mono text-2xl text-gold font-black">{state.comfort.tempMin}°C</span>
            </div>
            <Slider value={[state.comfort.tempMin]} min={15} max={22} step={1}
              onValueChange={(v) => setComfort({ tempMin: v[0] })} />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5"><span>15°C</span><span>22°C</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2 text-sm font-bold"><Thermometer className="w-4 h-4 text-gold" />Température maximum acceptée</Label>
              <span className="font-mono text-2xl text-gold font-black">{state.comfort.tempMax}°C</span>
            </div>
            <Slider value={[state.comfort.tempMax]} min={22} max={28} step={1}
              onValueChange={(v) => setComfort({ tempMax: v[0] })} />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5"><span>22°C</span><span>28°C</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2 text-sm font-bold"><Battery className="w-4 h-4 text-emerald-400" />Réserve batterie minimum</Label>
              <span className="font-mono text-2xl text-gold font-black">{state.comfort.batteryReservePct}%</span>
            </div>
            <Slider value={[state.comfort.batteryReservePct]} min={0} max={50} step={5}
              onValueChange={(v) => setComfort({ batteryReservePct: v[0] })} />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5"><span>0%</span><span>50%</span></div>
            <p className="text-xs text-muted-foreground mt-2">En cas de coupure réseau, votre batterie maintiendra cette réserve pour vos circuits prioritaires.</p>
          </div>
        </div>
      </motion.section>

      {/* Plages critiques */}
      <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass rounded-3xl p-5 md:p-7">
        <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">Plages critiques (pros)</div>
            <h2 className="text-xl md:text-2xl font-black">Service intouchable</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">Cliquez sur les créneaux où la batterie ne doit jamais être en sollicitation maximale (rush du midi, plein d'activité, événement récurrent).</p>
          </div>
          {criticalCount > 0 && (
            <button onClick={clearCriticalSlots} className="text-xs flex items-center gap-1.5 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 className="w-3 h-3" />Effacer ({criticalCount})
            </button>
          )}
        </div>

        <div className="overflow-x-auto -mx-5 md:-mx-7 px-5 md:px-7">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-1 ml-9">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] font-mono text-muted-foreground">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <div className="w-8 text-[10px] font-mono uppercase text-muted-foreground">{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const on = state.critical.grid[di][h];
                  return (
                    <button key={h}
                      onClick={() => toggleCriticalSlot(di, h)}
                      className={`flex-1 h-7 rounded-sm transition-all ${on ? "bg-destructive border border-destructive shadow-[0_0_10px_hsl(0_84%_60%/0.4)]" : "bg-background/60 border border-border/40 hover:border-gold/50 hover:bg-gold/10"}`}
                      aria-label={`${day} ${h}h`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-destructive" />Créneau intouchable</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-background/60 border border-border" />Créneau libre</div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="flex justify-end">
        <Button onClick={() => toast({ title: "Préférences enregistrées", description: "L'algorithme intègre vos changements pour le plan de demain." })}
          size="lg" className="bg-gradient-to-r from-primary to-primary-dark gap-2">
          <Save className="w-4 h-4" />Enregistrer mes préférences
        </Button>
      </div>
    </div>
  );
}
