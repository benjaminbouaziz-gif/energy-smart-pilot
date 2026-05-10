import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSwitchgridStore } from "@/lib/switchgrid/store";
import { CheckCircle2, Loader2, Circle, AlertTriangle } from "lucide-react";

type Phase = "init" | "sign" | "order" | "fetch" | "done" | "error";
const PHASES: { key: Phase; label: string }[] = [
  { key: "init", label: "Initialisation" },
  { key: "sign", label: "Signature dans l'autre onglet" },
  { key: "order", label: "Demande des données à Enedis" },
  { key: "fetch", label: "Téléchargement de ta courbe" },
];

const ASK_TIMEOUT_MS = 5 * 60 * 1000;
const ORDER_TIMEOUT_MS = 15 * 60 * 1000;

export default function SwitchgridCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("sessionId");
  const setResult = useSwitchgridStore((s) => s.setResult);

  const [phase, setPhase] = useState<Phase>("init");
  const [error, setError] = useState<string | null>(null);
  const [signClickedFast, setSignClickedFast] = useState(false);
  const fastRef = useRef(false);

  useEffect(() => {
    if (!sessionId) { setError("sessionId manquant"); setPhase("error"); return; }
    let cancelled = false;
    const t0 = Date.now();

    async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
      let lastErr: any;
      for (let i = 0; i < retries; i++) {
        try { return await fn(); } catch (e) { lastErr = e; await sleep(800 * (i + 1)); }
      }
      throw lastErr;
    }
    function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
    function elapsed() { return Date.now() - t0; }

    (async () => {
      try {
        // Phase 1
        setPhase("init");
        const { data: sess, error: sErr } = await supabase.from("switchgrid_sessions")
          .select("ask_id, prm").eq("id", sessionId).maybeSingle();
        if (sErr || !sess?.ask_id) throw new Error("Session introuvable ou ask_id manquant");
        const askId = sess.ask_id;
        const prm = sess.prm!;

        // Phase 2 - poll ask
        setPhase("sign");
        const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const authHeaders = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
        let consentId: string | null = null;
        while (!cancelled && elapsed() < ASK_TIMEOUT_MS) {
          const data = await withRetry(async () => {
            const r = await fetch(
              `${SUPA_URL}/functions/v1/switchgrid-poll-ask?askId=${encodeURIComponent(askId)}`,
              { headers: authHeaders }
            );
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "poll-ask failed");
            return j;
          });
          if (data?.status === "ACCEPTED" && data.consentId) { consentId = data.consentId; break; }
          if (["ADDRESS_CHECK_FAILED", "EXPIRED", "REVOKED"].includes(data?.status)) {
            throw new Error(`Consentement ${data.status}`);
          }
          await sleep(fastRef.current ? 500 : 2000);
        }
        if (!consentId) throw new Error("Délai dépassé pour la signature");

        // Phase 3 - create order
        setPhase("order");
        const { data: orderData, error: oErr } = await withRetry(() => supabase.functions.invoke("switchgrid-create-order", {
          body: { sessionId, consentId, prm },
        }));
        if (oErr) throw oErr;
        const orderId = orderData?.orderId;
        if (!orderId) throw new Error("orderId manquant");

        // Phase 4 - poll order
        setPhase("fetch");
        const t1 = Date.now();
        while (!cancelled && Date.now() - t1 < ORDER_TIMEOUT_MS) {
          const url = `${SUPA_URL}/functions/v1/switchgrid-poll-order?orderId=${encodeURIComponent(orderId)}&sessionId=${encodeURIComponent(sessionId)}`;
          const r = await fetch(url, { headers: authHeaders });
          const j = await r.json();
          if (!r.ok) throw new Error(j?.error || "poll-order failed");
          if (j.status === "READY") {
            setResult(prm, j.loadCurve);
            setPhase("done");
            navigate("/switchgrid/results");
            return;
          }
          if (j.status === "FAILED") throw new Error(j.message || "Order failed");
          await sleep(3000);
        }
        if (!cancelled) {
          toast.info("La récupération continue côté Enedis, suis l'avancement dans tes sessions en attente");
          navigate("/switchgrid/attente");
        }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message ?? "Erreur"); setPhase("error"); }
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId, navigate, setResult]);

  const phaseIdx = phase === "error" ? -1 : PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[600px]">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Récupération en cours</h1>
        <p className="text-slate-600 mb-8">Patiente quelques instants pendant qu'on collecte ta courbe Linky.</p>

        <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6 space-y-3">
          {PHASES.map((p, i) => {
            const done = phase !== "error" && i < phaseIdx;
            const active = phase !== "error" && i === phaseIdx;
            return (
              <div key={p.key} className="flex items-center gap-3">
                {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                 active ? <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" /> :
                 <Circle className="w-5 h-5 text-slate-300" />}
                <span className={`text-sm ${done ? "text-slate-700" : active ? "text-slate-900 font-medium" : "text-slate-400"}`}>
                  {p.label}
                </span>
              </div>
            );
          })}

          {phase === "sign" && !signClickedFast && (
            <button onClick={() => { fastRef.current = true; setSignClickedFast(true); }}
              className="mt-4 w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700">
              J'ai signé
            </button>
          )}

          {phase === "error" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
              <button onClick={() => navigate("/switchgrid")}
                className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800">
                Recommencer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
