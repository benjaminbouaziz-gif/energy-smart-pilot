import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type Contract = { id: string; prm: string; signerName: string; address: string; segment?: string };

function formatPrm(s: string) {
  const d = s.replace(/\D/g, "").slice(0, 14);
  const parts = [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 14)].filter(Boolean);
  return parts.join(" ");
}

export default function SwitchgridForm() {
  const navigate = useNavigate();
  const [genre, setGenre] = useState<"M" | "Mme">("M");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");

  const [mode, setMode] = useState<"prm" | "search">("prm");
  const [prmInput, setPrmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [continuing, setContinuing] = useState(false);

  const prmDigits = prmInput.replace(/\D/g, "");
  const prmValid = /^\d{14}$/.test(prmDigits);

  async function verifyByPrm() {
    setError(null); setContracts(null); setSelected(null); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("switchgrid-search-contract", { body: { prm: prmDigits } });
      if (error) throw error;
      const list = (data?.contracts ?? []) as Contract[];
      setContracts(list);
      if (list.length === 1) setSelected(list[0]);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally { setLoading(false); }
  }

  async function searchByName() {
    setError(null); setContracts(null); setSelected(null);
    if (!firstName || !lastName || !address) { setError("Remplissez identité et adresse."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("switchgrid-search-contract", {
        body: { firstName, lastName, address },
      });
      if (error) throw error;
      const list = (data?.contracts ?? []) as Contract[];
      setContracts(list);
      if (list.length === 1) setSelected(list[0]);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally { setLoading(false); }
  }

  async function handleContinue() {
    if (!selected) return;
    if (!firstName || !lastName || !address) { setError("Identité et adresse requises pour le consentement."); return; }
    setContinuing(true); setError(null);
    try {
      const sessionId = crypto.randomUUID();
      const { error: insErr } = await supabase.from("switchgrid_sessions").insert({
        id: sessionId, prm: selected.prm,
        signer_first_name: firstName, signer_last_name: lastName, signer_genre: genre, address,
      });
      if (insErr) throw insErr;

      const { data, error } = await supabase.functions.invoke("switchgrid-create-ask", {
        body: { sessionId, contractId: selected.prm, signer: { firstName, lastName, genre }, address },
      });
      if (error) throw error;
      const userUrl = data?.userUrl;
      if (userUrl) window.open(userUrl, "_blank", "noopener,noreferrer");
      navigate(`/switchgrid/callback?sessionId=${sessionId}`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
      setContinuing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[600px]">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Connexion Linky</h1>
          <p className="text-slate-600 mt-2">
            Récupère ta courbe de charge horaire des 12 derniers mois via Switchgrid (mandataire Enedis agréé).
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6 space-y-6">
          {/* Identité */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Identité</h2>
            <div className="flex gap-2">
              {(["M", "Mme"] as const).map((g) => (
                <button key={g} type="button"
                  onClick={() => setGenre(g)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    genre === g ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}>{g}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="12 rue de la Paix, 75002 Paris" value={address} onChange={(e) => setAddress(e.target.value)} />
          </section>

          {/* Compteur */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Compteur</h2>
            <div className="inline-flex bg-slate-100 rounded-lg p-1">
              {([
                ["prm", "J'ai mon PDL"],
                ["search", "Rechercher mon compteur"],
              ] as const).map(([k, lbl]) => (
                <button key={k} type="button" onClick={() => { setMode(k); setContracts(null); setSelected(null); setError(null); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    mode === k ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`}>{lbl}</button>
              ))}
            </div>

            {mode === "prm" ? (
              <div className="space-y-2">
                <input className="w-full font-mono tracking-wider rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="XXXX XXXX XXXX XX" value={prmInput}
                  onChange={(e) => setPrmInput(formatPrm(e.target.value))} maxLength={17} />
                <button disabled={!prmValid || loading} onClick={verifyByPrm}
                  className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Vérifier mon compteur
                </button>
              </div>
            ) : (
              <button disabled={loading} onClick={searchByName}
                className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Rechercher
              </button>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            {contracts && contracts.length === 0 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-800 p-3 text-sm">
                {mode === "prm"
                  ? "PDL introuvable. Vérifie le numéro ou utilise la recherche par adresse."
                  : "Aucun compteur trouvé pour cette identité et cette adresse."}
              </div>
            )}

            {contracts && contracts.length > 0 && (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <label key={c.prm} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selected?.prm === c.prm ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    {contracts.length > 1 && (
                      <input type="radio" className="mt-1 accent-emerald-600" name="contract"
                        checked={selected?.prm === c.prm} onChange={() => setSelected(c)} />
                    )}
                    {contracts.length === 1 && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />}
                    <div className="text-sm">
                      <div className="font-medium">{c.signerName}</div>
                      <div className="text-slate-600">{c.address}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">PRM {formatPrm(c.prm)} {c.segment && `· ${c.segment}`}</div>
                    </div>
                  </label>
                ))}
                <button disabled={!selected || continuing} onClick={handleContinue}
                  className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {continuing && <Loader2 className="w-4 h-4 animate-spin" />} Continuer avec ce compteur
                </button>
              </div>
            )}
          </section>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Vous serez redirigé vers Switchgrid pour signer le mandat Enedis.
        </p>
      </div>
    </div>
  );
}
