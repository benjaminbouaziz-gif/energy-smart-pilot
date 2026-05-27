import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Circle,
  AlertTriangle, PauseCircle, RefreshCw, PencilLine,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  useSimulateurSwitch, TOTAL_STEPS, SimulateurSwitchSwitchgrid, SwitchgridStatus,
} from "../SimulateurSwitchContext";
import { switchgridToHourlyKwh, LoadCurvePoint } from "@/lib/switchgrid/transformer";
import { extractContractDetailsFromC68 } from "../lib/c68-extract";

const ASK_TIMEOUT_MS = 5 * 60 * 1000;
const ORDER_TIMEOUT_MS = 15 * 60 * 1000;
const PAUSED_KEY = "simulateur-switch-paused-session";

type Contract = { id: string; prm: string; signerName: string; address: string; segment?: string };

const DEFAULT_SG: SimulateurSwitchSwitchgrid = {
  sessionId: null, prm: null, contractInfo: null, askId: null,
  consentId: null, orderId: null, loadcurveRequestId: null, status: "INIT",
};

function formatPrm(s: string) {
  const d = s.replace(/\D/g, "").slice(0, 14);
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 14)].filter(Boolean).join(" ");
}

export default function Step2Switchgrid() {
  const { data, updateData, prev, next } = useSimulateurSwitch();
  const identite = data.identite;
  const sg: SimulateurSwitchSwitchgrid = { ...DEFAULT_SG, ...(data.switchgrid ?? {}) };

  // Ref to always read latest sg inside async loops
  const sgRef = useRef(sg);
  useEffect(() => { sgRef.current = sg; });

  const setSg = (patch: Partial<SimulateurSwitchSwitchgrid>) => {
    updateData({ switchgrid: { ...sgRef.current, ...patch } });
  };

  // ── Phase A local UI state
  const [mode, setMode] = useState<"prm" | "search">("prm");
  const [prmInput, setPrmInput] = useState(sg.prm ? formatPrm(sg.prm) : "");
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ── Phase B local UI state (visual only)
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [signFastClicked, setSignFastClicked] = useState(false);
  const fastRef = useRef(false);
  const cancelRef = useRef(false);
  const askLoopRunning = useRef(false);
  const orderLoopRunning = useRef(false);
  const wakeRef = useRef(0);
  const [askTimeoutHit, setAskTimeoutHit] = useState(false);
  const [orderTimeoutHit, setOrderTimeoutHit] = useState(false);

  // ── Manual fallback state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualKwh, setManualKwh] = useState("");
  const [manualKva, setManualKva] = useState("");

  // ── Resume paused session detection
  const [pausedSession, setPausedSession] = useState<string | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(PAUSED_KEY);
      if (v) setPausedSession(v);
    } catch {}
  }, []);

  const prmDigits = prmInput.replace(/\D/g, "");
  const prmValid = /^\d{14}$/.test(prmDigits);

  // Interruptible sleep — wakes when wakeRef bumps or cancelled
  function sleepInterruptible(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now();
      const initialWake = wakeRef.current;
      const tick = () => {
        if (cancelRef.current) return resolve();
        if (wakeRef.current !== initialWake) return resolve();
        if (Date.now() - start >= ms) return resolve();
        setTimeout(tick, 200);
      };
      tick();
    });
  }

  // ─────────── Phase A handlers ───────────
  async function handleSearch(byPrm: boolean) {
    setSearchError(null); setContracts(null); setSelected(null); setSearchLoading(true);
    setSg({ status: "SEARCHING" });
    try {
      const body = byPrm
        ? { prm: prmDigits }
        : { firstName: identite?.prenom, lastName: identite?.nom, address: identite?.adresse };
      const { data: res, error } = await supabase.functions.invoke("switchgrid-search-contract", { body });
      if (error) throw error;
      const list = (res?.contracts ?? []) as Contract[];
      setContracts(list);
      if (list.length > 0) {
        setSelected(list[0]);
        setSg({ status: "CONTRACTS_FOUND" });
      } else {
        setSg({ status: "INIT" });
      }
    } catch (e: any) {
      setSearchError(e?.message ?? "Erreur lors de la recherche");
      setSg({ status: "FAILED" });
    } finally {
      setSearchLoading(false);
    }
  }

  // ─────────── Poll ask loop (resumable) ───────────
  async function runPollAsk(askId: string, sessionId: string, prm: string) {
    if (askLoopRunning.current) return;
    askLoopRunning.current = true;
    setPhaseError(null);
    setAskTimeoutHit(false);
    cancelRef.current = false;
    try {
      const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authHeaders = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
      const t0 = Date.now();
      let consentId: string | null = null;
      while (!cancelRef.current && Date.now() - t0 < ASK_TIMEOUT_MS) {
        const r = await fetch(
          `${SUPA_URL}/functions/v1/switchgrid-poll-ask?askId=${encodeURIComponent(askId)}`,
          { headers: authHeaders }
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "poll-ask failed");
        if (j.status === "ACCEPTED" && j.consentId) { consentId = j.consentId; break; }
        if (j.status && ["ADDRESS_CHECK_FAILED", "EXPIRED", "REVOKED"].includes(j.status)) {
          throw new Error(`Consentement ${j.status}`);
        }
        await sleepInterruptible(fastRef.current ? 500 : 2000);
      }
      if (cancelRef.current) return;
      if (!consentId) {
        setAskTimeoutHit(true);
        throw new Error("Délai dépassé pour la signature");
      }
      setSg({ consentId, status: "FETCHING_DATA" });

      const { data: orderData, error: orderErr } = await supabase.functions.invoke("switchgrid-create-order", {
        body: { sessionId, consentId, prm },
      });
      if (orderErr) throw orderErr;
      const orderId = orderData?.orderId;
      const lcReqId = orderData?.loadcurveRequestId;
      if (!orderId) throw new Error("orderId manquant");
      setSg({ orderId, loadcurveRequestId: lcReqId ?? null });

      askLoopRunning.current = false;
      await runPollOrder(orderId, sessionId, prm);
    } catch (e: any) {
      if (!cancelRef.current) {
        setPhaseError(e?.message ?? "Erreur");
        setSg({ status: "FAILED" });
      }
    } finally {
      askLoopRunning.current = false;
    }
  }

  // ─────────── Poll order loop (resumable) ───────────
  async function runPollOrder(orderId: string, sessionId: string, prm: string) {
    if (orderLoopRunning.current) return;
    orderLoopRunning.current = true;
    setPhaseError(null);
    setOrderTimeoutHit(false);
    cancelRef.current = false;
    try {
      const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authHeaders = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
      const t1 = Date.now();
      let loadCurveRaw: LoadCurvePoint[] | null = null;
      let contractDetailsRaw: any = null;
      while (!cancelRef.current && Date.now() - t1 < ORDER_TIMEOUT_MS) {
        const r = await fetch(
          `${SUPA_URL}/functions/v1/switchgrid-poll-order?orderId=${encodeURIComponent(orderId)}&sessionId=${encodeURIComponent(sessionId)}`,
          { headers: authHeaders }
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "poll-order failed");
        if (j.status === "READY") {
          loadCurveRaw = j.loadCurve as LoadCurvePoint[];
          contractDetailsRaw = j.contractDetails ?? null;
          break;
        }
        if (j.status === "FAILED") throw new Error(j.message || "Order failed");
        await sleepInterruptible(3000);
      }
      if (cancelRef.current) return;
      if (!loadCurveRaw) {
        setOrderTimeoutHit(true);
        throw new Error("Délai dépassé pour la récupération des données");
      }

      const result = switchgridToHourlyKwh(loadCurveRaw);
      const contractDetails = contractDetailsRaw
        ? extractContractDetailsFromC68(contractDetailsRaw)
        : undefined;
      updateData({
        switchgrid: { ...sgRef.current, status: "READY" },
        loadCurve: {
          hourlyKwh: result.hourlyKwh,
          windowStart: result.windowStart,
          windowEnd: result.windowEnd,
          qualityScore: result.qualityScore,
          totalKwh: result.totalKwh,
          warnings: result.warnings,
          source: "switchgrid",
        },
        ...(contractDetails ? { contractDetails } : {}),
      });
      setTimeout(() => { if (!cancelRef.current) next(); }, 1500);
    } catch (e: any) {
      if (!cancelRef.current) {
        setPhaseError(e?.message ?? "Erreur");
        setSg({ status: "FAILED" });
      }
    } finally {
      orderLoopRunning.current = false;
    }
  }

  // ─────────── Phase B kick-off ───────────
  async function handleContinueWithContract() {
    if (!selected || !identite) return;
    setPhaseError(null);
    setAskTimeoutHit(false);
    setOrderTimeoutHit(false);

    try {
      const sessionId = crypto.randomUUID();
      const { error: insErr } = await supabase.from("switchgrid_sessions").insert({
        id: sessionId,
        prm: selected.prm,
        signer_first_name: identite.prenom,
        signer_last_name: identite.nom,
        signer_genre: identite.civilite,
        address: identite.adresse,
        status: "INIT",
      });
      if (insErr) throw insErr;

      setSg({
        sessionId,
        prm: selected.prm,
        contractInfo: { signerName: selected.signerName, address: selected.address, segment: selected.segment },
        status: "AWAITING_SIGNATURE",
      });

      const { data: askRes, error: askErr } = await supabase.functions.invoke("switchgrid-create-ask", {
        body: {
          sessionId,
          contractId: selected.prm,
          signer: { firstName: identite.prenom, lastName: identite.nom, genre: identite.civilite },
          address: identite.adresse,
        },
      });
      if (askErr) throw askErr;
      const askId = askRes?.askId;
      const userUrl = askRes?.userUrl;
      if (!askId) throw new Error("askId manquant");
      setSg({ askId });
      if (userUrl) window.open(userUrl, "_blank", "noopener,noreferrer");

      await runPollAsk(askId, sessionId, selected.prm);
    } catch (e: any) {
      setPhaseError(e?.message ?? "Erreur");
      setSg({ status: "FAILED" });
    }
  }

  // ─────────── Resume polling on mount based on persisted status ───────────
  useEffect(() => {
    const cur = sgRef.current;
    if (cur.status === "AWAITING_SIGNATURE" && cur.askId && cur.sessionId && cur.prm) {
      runPollAsk(cur.askId, cur.sessionId, cur.prm);
    } else if (cur.status === "FETCHING_DATA" && cur.orderId && cur.sessionId && cur.prm) {
      runPollOrder(cur.orderId, cur.sessionId, cur.prm);
    }
    return () => { cancelRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────── Wake polling when tab becomes visible ───────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const cur = sgRef.current;
      // Force immediate next iteration
      wakeRef.current += 1;
      // If a loop died (e.g. after a hot reload), restart it
      if (cur.status === "AWAITING_SIGNATURE" && cur.askId && cur.sessionId && cur.prm && !askLoopRunning.current) {
        runPollAsk(cur.askId, cur.sessionId, cur.prm);
      } else if (cur.status === "FETCHING_DATA" && cur.orderId && cur.sessionId && cur.prm && !orderLoopRunning.current) {
        runPollOrder(cur.orderId, cur.sessionId, cur.prm);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────── Phase reset / pause ───────────
  function resetSwitchgrid() {
    cancelRef.current = true;
    setPhaseError(null);
    setContracts(null);
    setSelected(null);
    setAskTimeoutHit(false);
    setOrderTimeoutHit(false);
    setSg({ ...DEFAULT_SG });
  }

  function pauseAndKeep() {
    if (sg.sessionId) {
      try { localStorage.setItem(PAUSED_KEY, sg.sessionId); } catch {}
    }
    cancelRef.current = true;
    setSg({ status: "PAUSED" });
  }

  function clearPaused() {
    try { localStorage.removeItem(PAUSED_KEY); } catch {}
    setPausedSession(null);
  }

  // ─────────── Manual fallback ───────────
  function confirmManual() {
    const kwh = Number(manualKwh);
    const kva = Number(manualKva);
    if (!Number.isFinite(kwh) || kwh <= 0 || !Number.isFinite(kva) || kva < 3 || kva > 249) return;
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 24 * 3600 * 1000);
    updateData({
      switchgrid: { ...sgRef.current, status: "READY" },
      loadCurve: {
        hourlyKwh: [],
        totalKwh: kwh,
        windowStart: start.toISOString(),
        windowEnd: end.toISOString(),
        qualityScore: 0.5,
        warnings: ["MANUAL_INPUT"],
        source: "manual",
        kva,
      },
    });
    setManualOpen(false);
    setTimeout(() => next(), 600);
  }

  // ─────────── UI: phase derived ONLY from context status ───────────
  const status: SwitchgridStatus = sg.status;
  const inPhaseA = ["INIT", "SEARCHING", "CONTRACTS_FOUND"].includes(status);
  const inPhaseB = ["AWAITING_SIGNATURE", "FETCHING_DATA", "READY"].includes(status);
  const failed = status === "FAILED";
  const paused = status === "PAUSED";

  if (!identite) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 mt-10 max-w-3xl">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Identité manquante. Reviens à l'étape 1 pour la renseigner.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-start">
          <Button variant="outline" onClick={prev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 mt-10 max-w-3xl"
    >
      <div className="text-center mb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
          Étape 2 / {TOTAL_STEPS}
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Récupération de la courbe Linky</h1>
      </div>

      <Card className="rounded-3xl border-primary/20 shadow-[var(--shadow-glow)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">
                <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  Étape 2 — Switchgrid
                </span>
              </CardTitle>
              <CardDescription>
                On interroge Enedis via Switchgrid pour récupérer la courbe horaire des 12 derniers mois.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {pausedSession && status === "INIT" && (
            <Alert>
              <PauseCircle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span>Une session précédente est en pause.</span>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href="/switchgrid/attente" target="_blank" rel="noreferrer">Suivre l'avancement</a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearPaused}>Oublier</Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* ───── PHASE A ───── */}
          {inPhaseA && (
            <>
              <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setContracts(null); setSelected(null); setSearchError(null); }}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="prm">J'ai mon PDL/PRM</TabsTrigger>
                  <TabsTrigger value="search">Rechercher par adresse</TabsTrigger>
                </TabsList>

                <TabsContent value="prm" className="space-y-3 pt-4">
                  <Label htmlFor="prm">Numéro PDL/PRM (14 chiffres)</Label>
                  <Input
                    id="prm"
                    className="font-mono tracking-wider"
                    placeholder="XXXX XXXX XXXX XX"
                    value={prmInput}
                    onChange={(e) => setPrmInput(formatPrm(e.target.value))}
                    maxLength={17}
                  />
                  <Button
                    onClick={() => handleSearch(true)}
                    disabled={!prmValid || searchLoading}
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 font-semibold"
                  >
                    {searchLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Vérifier mon compteur
                  </Button>
                </TabsContent>

                <TabsContent value="search" className="space-y-3 pt-4">
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-1">
                    <div><span className="text-muted-foreground">Titulaire :</span> <span className="font-medium">{identite.civilite} {identite.prenom} {identite.nom}</span></div>
                    <div><span className="text-muted-foreground">Adresse :</span> <span className="font-medium">{identite.adresse}</span></div>
                  </div>
                  <Button
                    onClick={() => handleSearch(false)}
                    disabled={searchLoading}
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 font-semibold"
                  >
                    {searchLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Rechercher mon compteur
                  </Button>
                </TabsContent>
              </Tabs>

              {searchError && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {contracts && contracts.length === 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Aucun compteur trouvé. Vérifie le PDL ou utilise la recherche par adresse.
                  </AlertDescription>
                </Alert>
              )}

              {contracts && contracts.length > 0 && selected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold">{selected.signerName}</div>
                      <div className="text-sm text-muted-foreground">{selected.address}</div>
                      <div className="flex items-center gap-2 text-xs font-mono mt-2">
                        <span className="text-muted-foreground">PRM</span>
                        <span>{formatPrm(selected.prm)}</span>
                        {selected.segment && <Badge variant="secondary">{selected.segment}</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleContinueWithContract}
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 font-semibold"
                  >
                    Continuer avec ce compteur
                  </Button>
                </motion.div>
              )}

              {/* Manual fallback */}
              <div className="pt-2 border-t">
                <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <PencilLine className="w-4 h-4" />
                      Pas de Switchgrid ? Saisir la conso à la main
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Saisie manuelle</DialogTitle>
                      <DialogDescription>
                        La précision sera dégradée. Une simulation détaillée nécessite la courbe Switchgrid.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="m-kwh">Conso annuelle (kWh)</Label>
                        <Input id="m-kwh" type="number" min={1} value={manualKwh} onChange={(e) => setManualKwh(e.target.value)} placeholder="6500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="m-kva">Puissance souscrite (kVA)</Label>
                        <Input id="m-kva" type="number" min={3} max={249} value={manualKva} onChange={(e) => setManualKva(e.target.value)} placeholder="36" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setManualOpen(false)}>Annuler</Button>
                      <Button onClick={confirmManual} className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
                        Confirmer la saisie manuelle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}

          {/* ───── PHASE B ───── */}
          {inPhaseB && (
            <PhaseStepper
              status={status}
              onSignedClick={() => { fastRef.current = true; setSignFastClicked(true); wakeRef.current += 1; }}
              signFastClicked={signFastClicked}
              contract={sg.contractInfo}
            />
          )}

          {/* ───── Errors / timeouts (Phase D) ───── */}
          {failed && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{phaseError ?? "Une erreur est survenue."}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={resetSwitchgrid} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Recommencer
              </Button>
            </div>
          )}

          {askTimeoutHit && !failed && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Délai de signature dépassé.
                <Button variant="link" onClick={resetSwitchgrid} className="px-2">Recommencer</Button>
              </AlertDescription>
            </Alert>
          )}

          {orderTimeoutHit && (
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  La récupération côté Enedis prend plus de temps que prévu. C'est normal pour un compteur Pro
                  avec activation initiale (peut prendre jusqu'à 24h).
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setManualOpen(true)} className="gap-2">
                  <PencilLine className="w-4 h-4" /> Continuer en saisie manuelle
                </Button>
                <Button variant="outline" onClick={pauseAndKeep} className="gap-2">
                  <PauseCircle className="w-4 h-4" /> Mettre en pause et reprendre plus tard
                </Button>
              </div>
            </div>
          )}

          {paused && (
            <Alert>
              <PauseCircle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span>Session mise en pause. Tu pourras suivre l'avancement plus tard.</span>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href="/switchgrid/attente" target="_blank" rel="noreferrer">Voir l'attente</a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetSwitchgrid}>Recommencer</Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === "READY" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div className="text-sm">
                <div className="font-semibold">Courbe récupérée</div>
                <div className="text-muted-foreground">
                  {Math.round(data.loadCurve?.totalKwh ?? 0).toLocaleString("fr-FR")} kWh sur 12 mois
                  {data.loadCurve?.source === "manual" && " (saisie manuelle)"}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={prev} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button
            onClick={next}
            disabled={status !== "READY"}
            className="gap-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)] font-semibold"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  );
}

// ── Sub-component: vertical stepper for Phase B
function PhaseStepper({
  status, onSignedClick, signFastClicked, contract,
}: {
  status: SwitchgridStatus;
  onSignedClick: () => void;
  signFastClicked: boolean;
  contract: SimulateurSwitchSwitchgrid["contractInfo"];
}) {
  const steps: { key: string; label: string; activeWhen: SwitchgridStatus[]; doneWhen: SwitchgridStatus[] }[] = [
    { key: "id", label: "Compteur identifié",
      activeWhen: [], doneWhen: ["AWAITING_SIGNATURE", "FETCHING_DATA", "READY"] },
    { key: "sign", label: "Signature en cours dans l'autre onglet",
      activeWhen: ["AWAITING_SIGNATURE"], doneWhen: ["FETCHING_DATA", "READY"] },
    { key: "ask", label: "Demande des données à Enedis",
      activeWhen: ["FETCHING_DATA"], doneWhen: ["READY"] },
    { key: "dl", label: "Téléchargement de la courbe horaire",
      activeWhen: ["FETCHING_DATA"], doneWhen: ["READY"] },
    { key: "ready", label: "Prêt",
      activeWhen: [], doneWhen: ["READY"] },
  ];

  return (
    <div className="space-y-4">
      {contract && (
        <div className="rounded-xl border bg-muted/40 p-3 text-xs">
          <span className="text-muted-foreground">Compteur sélectionné :</span>{" "}
          <span className="font-medium">{contract.signerName}</span>
          {contract.segment && <Badge variant="secondary" className="ml-2">{contract.segment}</Badge>}
        </div>
      )}
      <div className="space-y-3">
        {steps.map((s) => {
          const done = s.doneWhen.includes(status);
          const active = !done && s.activeWhen.includes(status);
          return (
            <div key={s.key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : active ? (
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40" />
              )}
              <span className={`text-sm ${done ? "text-foreground" : active ? "font-semibold" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {s.key === "sign" && active && !signFastClicked && (
                <Button size="sm" variant="outline" onClick={onSignedClick} className="ml-auto">
                  J'ai signé
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
