import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { switchgridToHourlyKwh } from "@/lib/switchgrid/transformer";
import { extractContractDetailsFromC68 } from "@/simulateur-switch/lib/c68-extract";
import {
  Loader2, Plus, Download, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Play,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Session = {
  id: string;
  prm: string | null;
  status: string;
  ask_id: string | null;
  consent_id: string | null;
  order_id: string | null;
  loadcurve_request_id: string | null;
  error_message: string | null;
  signer_first_name: string | null;
  signer_last_name: string | null;
  signer_genre: string | null;
  address: string | null;
  created_at: string;
};

const PENDING_STATUSES = ["INIT", "PENDING_CONSENT", "CONSENT_ACCEPTED", "FETCHING"];

function fmtPrm(s: string | null) {
  if (!s) return "—";
  const d = s.replace(/\D/g, "");
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 14)].filter(Boolean).join(" ");
}
function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `il y a ${Math.floor(diff)}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}
function fullDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  INIT: { label: "Initialisée", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  PENDING_CONSENT: { label: "En attente signature", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONSENT_ACCEPTED: { label: "Signée, en demande", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  FETCHING: { label: "Récupération Enedis", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  READY: { label: "Prête", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "Échec", cls: "bg-red-50 text-red-700 border-red-200" },
};

type Filter = "all" | "pending" | "ready" | "failed";

export default function SwitchgridAttente() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<Record<string, string | null>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("switchgrid_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Impossible de charger les sessions"); return; }
    setSessions((data ?? []) as Session[]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const counts = useMemo(() => ({
    pending: sessions.filter((s) => PENDING_STATUSES.includes(s.status)).length,
    ready: sessions.filter((s) => s.status === "READY").length,
    failed: sessions.filter((s) => s.status === "FAILED").length,
  }), [sessions]);

  const filtered = useMemo(() => {
    if (filter === "pending") return sessions.filter((s) => PENDING_STATUSES.includes(s.status));
    if (filter === "ready") return sessions.filter((s) => s.status === "READY");
    if (filter === "failed") return sessions.filter((s) => s.status === "FAILED");
    return sessions;
  }, [sessions, filter]);

  const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const authHeaders = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

  function setRowBusy(id: string, label: string | null) {
    setBusy((b) => ({ ...b, [id]: label }));
  }

  async function checkSignature(s: Session) {
    if (!s.ask_id) return;
    setRowBusy(s.id, "check-ask");
    try {
      const r = await fetch(`${SUPA_URL}/functions/v1/switchgrid-poll-ask?askId=${encodeURIComponent(s.ask_id)}`, { headers: authHeaders });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "poll-ask a échoué");
      if (j.status === "ACCEPTED" && j.consentId) {
        await supabase.from("switchgrid_sessions").update({ status: "CONSENT_ACCEPTED", consent_id: j.consentId }).eq("id", s.id);
        const { data: orderData, error: oErr } = await supabase.functions.invoke("switchgrid-create-order", {
          body: { sessionId: s.id, consentId: j.consentId, prm: s.prm },
        });
        if (oErr) throw oErr;
        toast.success("Signature validée, demande Enedis lancée");
        if (orderData?.orderId) {
          await supabase.from("switchgrid_sessions").update({ status: "FETCHING", order_id: orderData.orderId }).eq("id", s.id);
        }
      } else if (["ADDRESS_CHECK_FAILED", "EXPIRED", "REVOKED"].includes(j.status)) {
        await supabase.from("switchgrid_sessions").update({ status: "FAILED", error_message: `Consentement ${j.status}` }).eq("id", s.id);
        toast.error(`Consentement ${j.status}`);
      } else {
        toast.info("Toujours en attente de signature");
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally { setRowBusy(s.id, null); }
  }

  async function checkData(s: Session) {
    if (!s.order_id) return;
    setRowBusy(s.id, "check-order");
    try {
      const r = await fetch(`${SUPA_URL}/functions/v1/switchgrid-poll-order?orderId=${encodeURIComponent(s.order_id)}&sessionId=${encodeURIComponent(s.id)}`, { headers: authHeaders });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "poll-order a échoué");
      if (j.status === "READY") toast.success("Données disponibles !");
      else if (j.status === "FAILED") toast.error(j.message || "Échec");
      else toast.info("Récupération toujours en cours côté Enedis");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally { setRowBusy(s.id, null); }
  }

  async function downloadJson(s: Session) {
    if (!s.order_id || !s.prm) return;
    setRowBusy(s.id, "download");
    try {
      const r = await fetch(`${SUPA_URL}/functions/v1/switchgrid-poll-order?orderId=${encodeURIComponent(s.order_id)}&sessionId=${encodeURIComponent(s.id)}`, { headers: authHeaders });
      const j = await r.json();
      if (!r.ok || j.status !== "READY" || !j.loadCurve) throw new Error(j?.error || "Données indisponibles");
      const result = switchgridToHourlyKwh(j.loadCurve);
      const payload = {
        prm: s.prm,
        fetchedAt: new Date().toISOString(),
        windowStart: result.windowStart,
        windowEnd: result.windowEnd,
        hourlyKwh: result.hourlyKwh,
        qualityScore: result.qualityScore,
        totalKwh: result.totalKwh,
        warnings: result.warnings,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      a.download = `switchgrid-export-${s.prm}-${date}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Export téléchargé");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally { setRowBusy(s.id, null); }
  }

  async function openInSimulateurSwitch(s: Session) {
    if (!s.order_id || !s.prm) return;

    const existingState = localStorage.getItem('simulateur-switch-state');
    if (existingState) {
      const ok = window.confirm(
        "Une simulation Switch est déjà en cours dans ton navigateur. " +
        "L'ouvrir avec cette courbe remplacera la simulation actuelle. " +
        "Continuer ?"
      );
      if (!ok) return;
    }

    setRowBusy(s.id, "openinsimulator");
    try {
      const r = await fetch(
        `${SUPA_URL}/functions/v1/switchgrid-poll-order?orderId=${encodeURIComponent(s.order_id)}&sessionId=${encodeURIComponent(s.id)}`,
        { headers: authHeaders }
      );
      const j = await r.json();
      if (!r.ok || j.status !== "READY" || !j.loadCurve) {
        throw new Error(j?.error || "Données indisponibles");
      }
      const result = switchgridToHourlyKwh(j.loadCurve);

      const switchgridState = {
        step: 3,
        data: {
          identite: {
            nom: s.signer_last_name || "",
            prenom: s.signer_first_name || "",
            civilite: s.signer_genre || "M",
            adresse: s.address || "",
            email: "",
            telephone: "",
            estPro: false,
          },
          switchgrid: {
            status: "READY",
            prm: s.prm,
            sessionId: s.id,
            askId: s.ask_id,
            consentId: s.consent_id,
            orderId: s.order_id,
            loadcurveRequestId: s.loadcurve_request_id,
            contractInfo: {
              signerName: `${s.signer_first_name ?? ""} ${s.signer_last_name ?? ""}`.trim(),
              address: s.address,
              segment: null,
            },
            error: null,
          },
          loadCurve: {
            source: "switchgrid",
            prm: s.prm,
            windowStart: result.windowStart,
            windowEnd: result.windowEnd,
            hourlyKwh: result.hourlyKwh,
            totalKwh: result.totalKwh,
            qualityScore: result.qualityScore,
          },
        },
      };

      localStorage.setItem(
        'simulateur-switch-state',
        JSON.stringify(switchgridState)
      );

      toast.success("Courbe chargée, redirection vers le Simulateur Switch");

      navigate('/simulateur-switch');
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors du chargement");
    } finally {
      setRowBusy(s.id, null);
    }
  }

  async function deleteSession(s: Session) {
    if (!confirm("Supprimer définitivement cette session ?")) return;
    setRowBusy(s.id, "delete");
    try {
      const { error } = await supabase.from("switchgrid_sessions").delete().eq("id", s.id);
      if (error) throw error;
      toast.success("Session supprimée");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Suppression impossible (RLS ?)");
    } finally { setRowBusy(s.id, null); }
  }

  const refreshAgo = Math.max(0, Math.floor((Date.now() - lastRefresh.getTime()) / 1000));
  void tick;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-white text-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Suivi des sessions Switchgrid</h1>
              <p className="text-slate-600 mt-1">Toutes tes demandes de courbe Linky en cours et passées.</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nouvelle session
            </Link>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CounterCard label="En attente" value={counts.pending} cls="text-violet-700 bg-violet-50 border-violet-200" />
            <CounterCard label="Prêtes" value={counts.ready} cls="text-emerald-700 bg-emerald-50 border-emerald-200" />
            <CounterCard label="Échouées" value={counts.failed} cls="text-red-700 bg-red-50 border-red-200" />
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200">
            {([
              { k: "all", label: `Toutes (${sessions.length})` },
              { k: "pending", label: `En attente (${counts.pending})` },
              { k: "ready", label: `Prêtes (${counts.ready})` },
              { k: "failed", label: `Échouées (${counts.failed})` },
            ] as const).map((t) => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                  filter === t.k
                    ? "border-emerald-600 text-emerald-700 font-medium"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
              Aucune session dans cette catégorie.
            </div>
          ) : filtered.length > 5 ? (
            <SessionTable
              rows={filtered}
              busy={busy}
              onCheckSig={checkSignature}
              onCheckData={checkData}
              onDownload={downloadJson}
              onOpenSim={openInSimulateurSwitch}
              onDelete={deleteSession}
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map((s) => (
                <SessionCard
                  key={s.id}
                  s={s}
                  busy={busy[s.id]}
                  onCheckSig={() => checkSignature(s)}
                  onCheckData={() => checkData(s)}
                  onDownload={() => downloadJson(s)}
                  onOpenSim={() => openInSimulateurSwitch(s)}
                  onDelete={() => deleteSession(s)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mis à jour il y a {refreshAgo}s</span>
            <button onClick={load} className="inline-flex items-center gap-1 hover:text-slate-700">
              <RefreshCw className="w-3 h-3" /> Rafraîchir
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function CounterCard({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ s }: { s: Session }) {
  const meta = STATUS_META[s.status] ?? { label: s.status, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  const badge = (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border ${meta.cls}`}>
      {s.status === "READY" && <CheckCircle2 className="w-3 h-3" />}
      {s.status === "FAILED" && <AlertTriangle className="w-3 h-3" />}
      {meta.label}
    </span>
  );
  if (s.status === "FAILED" && s.error_message) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">{s.error_message}</TooltipContent>
      </Tooltip>
    );
  }
  return badge;
}

function ActionButton({
  s, busy, onCheckSig, onCheckData, onDownload, onOpenSim, onDelete,
}: {
  s: Session; busy: string | null | undefined;
  onCheckSig: () => void; onCheckData: () => void;
  onDownload: () => void; onOpenSim: () => void; onDelete: () => void;
}) {
  const isBusy = !!busy;
  const base = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";
  if (s.status === "PENDING_CONSENT") {
    return <button disabled={isBusy} onClick={onCheckSig} className={`${base} bg-blue-600 text-white hover:bg-blue-700`}>
      {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Vérifier signature
    </button>;
  }
  if (s.status === "FETCHING" || s.status === "CONSENT_ACCEPTED") {
    return <button disabled={isBusy || !s.order_id} onClick={onCheckData} className={`${base} bg-violet-600 text-white hover:bg-violet-700`}>
      {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Vérifier données
    </button>;
  }
  if (s.status === "READY") {
    return (
      <div className="flex items-center gap-2">
        <button disabled={isBusy} onClick={onDownload} className={`${base} bg-emerald-600 text-white hover:bg-emerald-700`}>
          {busy === "download" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Télécharger JSON
        </button>
        <button disabled={isBusy} onClick={onOpenSim} className={`${base} bg-violet-600 text-white hover:bg-violet-700`}>
          {busy === "openinsimulator" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Ouvrir dans Simulateur Switch
        </button>
      </div>
    );
  }
  if (s.status === "FAILED") {
    return <button disabled={isBusy} onClick={onDelete} className={`${base} bg-white border border-red-300 text-red-700 hover:bg-red-50`}>
      {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Supprimer
    </button>;
  }
  return null;
}

function SignerName({ s }: { s: Session }) {
  const name = [s.signer_first_name, s.signer_last_name].filter(Boolean).join(" ");
  return <span>{name || <span className="text-slate-400">—</span>}</span>;
}

function CreatedAt({ iso }: { iso: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="text-slate-500">{relTime(iso)}</span></TooltipTrigger>
      <TooltipContent>{fullDate(iso)}</TooltipContent>
    </Tooltip>
  );
}

function SessionCard({ s, busy, onCheckSig, onCheckData, onDownload, onOpenSim, onDelete }: {
  s: Session; busy: string | null | undefined;
  onCheckSig: () => void; onCheckData: () => void; onDownload: () => void; onOpenSim: () => void; onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm">{fmtPrm(s.prm)}</span>
          <StatusBadge s={s} />
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-3 flex-wrap">
          <SignerName s={s} />
          <span className="text-slate-300">·</span>
          <CreatedAt iso={s.created_at} />
        </div>
      </div>
      <ActionButton s={s} busy={busy} onCheckSig={onCheckSig} onCheckData={onCheckData} onDownload={onDownload} onOpenSim={onOpenSim} onDelete={onDelete} />
    </div>
  );
}

function SessionTable({ rows, busy, onCheckSig, onCheckData, onDownload, onOpenSim, onDelete }: {
  rows: Session[]; busy: Record<string, string | null>;
  onCheckSig: (s: Session) => void; onCheckData: (s: Session) => void;
  onDownload: (s: Session) => void; onOpenSim: (s: Session) => void; onDelete: (s: Session) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3">PRM</th>
            <th className="text-left px-4 py-3">Signataire</th>
            <th className="text-left px-4 py-3">Créée</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="text-right px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-mono">{fmtPrm(s.prm)}</td>
              <td className="px-4 py-3"><SignerName s={s} /></td>
              <td className="px-4 py-3"><CreatedAt iso={s.created_at} /></td>
              <td className="px-4 py-3"><StatusBadge s={s} /></td>
              <td className="px-4 py-3 text-right">
                <ActionButton
                  s={s}
                  busy={busy[s.id]}
                  onCheckSig={() => onCheckSig(s)}
                  onCheckData={() => onCheckData(s)}
                  onDownload={() => onDownload(s)}
                  onOpenSim={() => onOpenSim(s)}
                  onDelete={() => onDelete(s)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
