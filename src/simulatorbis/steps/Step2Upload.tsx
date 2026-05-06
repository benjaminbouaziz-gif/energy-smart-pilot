import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileJson, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { FactureActuelle } from "@/lib/dynawatt-engine-bis";

export default function Step2Upload() {
  const { facture, setFacture, sobryDocs, setSobryDocs, simulationId, next } = useSimulator();
  const [extracting, setExtracting] = useState(false);
  const [dragInvoice, setDragInvoice] = useState(false);
  const [dragJson, setDragJson] = useState(false);

  const updateFacture = (patch: Partial<FactureActuelle>) =>
    setFacture({
      fournisseur: "",
      prix_kwh_ht: 0,
      abonnement_mensuel_ht: 0,
      ...(facture || {}),
      ...patch,
    });

  // ===== Facture PDF =====
  const handleInvoiceDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragInvoice(false);
    const file = e.dataTransfer.files[0];
    if (file) await extractInvoice(file);
  };

  const extractInvoice = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Veuillez déposer un PDF");
      return;
    }
    setExtracting(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
      );
      const { data, error } = await supabase.functions.invoke("extract-invoice", {
        body: { pdfBase64: base64, filename: file.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFacture({
        fournisseur: data.fournisseur || "",
        prix_kwh_ht: Number(data.prix_kwh_ht) || 0,
        abonnement_mensuel_ht: Number(data.abonnement_mensuel_ht) || 0,
        structure_tarifaire: data.structure_tarifaire || "",
        puissance_souscrite_kva: Number(data.puissance_souscrite_kva) || 0,
      });
      toast.success("Facture extraite", {
        description: `Confiance : ${data.confiance || "moyenne"}`,
      });
    } catch (e: any) {
      toast.error("Extraction échouée", { description: e.message });
      setFacture({ fournisseur: "", prix_kwh_ht: 0, abonnement_mensuel_ht: 0 });
    } finally {
      setExtracting(false);
    }
  };

  // ===== JSON Sobry =====
  const handleJsonDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragJson(false);
    const files = Array.from(e.dataTransfer.files);
    await readJsons(files);
  };

  const readJsons = useCallback(
    async (files: File[]) => {
      const jsons: { mois: string; data: any }[] = [];
      let prmRef: string | null = null;
      for (const f of files) {
        if (!f.name.toLowerCase().endsWith(".json")) continue;
        try {
          const text = await f.text();
          const json = JSON.parse(text);
          if (!prmRef) prmRef = String(json.prm);
          if (String(json.prm) !== prmRef) {
            toast.error(`PRM incohérent dans ${f.name}`);
            continue;
          }
          jsons.push({ mois: String(json.month || f.name), data: json });
        } catch {
          toast.error(`Fichier invalide : ${f.name}`);
        }
      }
      const merged = [...sobryDocs];
      for (const j of jsons) {
        if (!merged.find((m) => m.mois === j.mois)) merged.push(j);
      }
      setSobryDocs(merged.slice(0, 12));
      // Persist
      if (simulationId && jsons.length) {
        await supabase.from("simulator_documents").insert(
          jsons.map((j) => ({
            simulation_id: simulationId,
            type: "json_sobry",
            mois: j.mois,
            data: j.data,
          }))
        );
      }
    },
    [sobryDocs, simulationId, setSobryDocs]
  );

  const removeJson = (mois: string) => {
    setSobryDocs(sobryDocs.filter((d) => d.mois !== mois));
  };

  const consoTotale = sobryDocs.reduce(
    (a, d) => a + Number(d.data?.variable_costs?.conso_totale_kwh || 0),
    0
  );

  const factureValid =
    facture &&
    facture.fournisseur &&
    facture.prix_kwh_ht > 0 &&
    facture.abonnement_mensuel_ht > 0;
  const canNext = !!factureValid && sobryDocs.length > 0;

  const handleNext = async () => {
    if (simulationId) {
      await supabase
        .from("simulations")
        .update({ facture_actuelle: facture as any, current_step: 3 })
        .eq("id", simulationId);
    }
    next();
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-6xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
            Étape 2 / 6
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Données client</h1>
          <p className="text-sm text-muted-foreground">
            Importez la facture actuelle et la simulation Sobry du client.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Zone facture */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-light" />
              Facture du fournisseur actuel
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragInvoice(true);
              }}
              onDragLeave={() => setDragInvoice(false)}
              onDrop={handleInvoiceDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                dragInvoice ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              {extracting ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-light" />
                  <p className="text-sm text-muted-foreground">Analyse de la facture...</p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-primary-light mx-auto mb-2" />
                  <p className="text-sm font-medium">Déposez le PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && extractInvoice(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <Label>Fournisseur</Label>
                <Input
                  value={facture?.fournisseur || ""}
                  onChange={(e) => updateFacture({ fournisseur: e.target.value })}
                  placeholder="EDF / TotalEnergies / Engie..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prix kWh HT (€)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={facture?.prix_kwh_ht || ""}
                    onChange={(e) =>
                      updateFacture({ prix_kwh_ht: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.21"
                  />
                </div>
                <div>
                  <Label>Abo mensuel HT (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={facture?.abonnement_mensuel_ht || ""}
                    onChange={(e) =>
                      updateFacture({
                        abonnement_mensuel_ht: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="35.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Structure tarifaire</Label>
                  <Input
                    value={facture?.structure_tarifaire || ""}
                    onChange={(e) =>
                      updateFacture({ structure_tarifaire: e.target.value })
                    }
                    placeholder="Tarif unique / HP-HC / Tempo"
                  />
                </div>
                <div>
                  <Label>Puissance kVA</Label>
                  <Input
                    type="number"
                    value={facture?.puissance_souscrite_kva || ""}
                    onChange={(e) =>
                      updateFacture({
                        puissance_souscrite_kva: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="36"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zone JSON Sobry */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-gold" />
              Données Sobry simulées (JSON)
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragJson(true);
              }}
              onDragLeave={() => setDragJson(false)}
              onDrop={handleJsonDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                dragJson ? "border-gold bg-gold/10" : "border-border"
              }`}
            >
              <label className="cursor-pointer block">
                <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-sm font-medium">Déposez 1 à 12 fichiers JSON</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tous doivent avoir le même PRM
                </p>
                <input
                  type="file"
                  accept="application/json"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && readJsons(Array.from(e.target.files))}
                />
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">
                  {sobryDocs.length}/12 fichiers
                </span>
                <span className="text-primary-light">
                  Conso totale&nbsp;: {consoTotale.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kWh
                </span>
              </div>
              {sobryDocs.length === 12 ? (
                <p className="text-[11px] text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2">
                  ✓ 12 mois de données complets — pas d'extrapolation
                </p>
              ) : sobryDocs.length >= 6 && sobryDocs.length < 12 ? (
                <p className="text-[11px] text-orange-800 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2">
                  ⚠ Simulation basée sur {sobryDocs.length} mois seulement. La projection annuelle peut être imprécise.
                </p>
              ) : sobryDocs.length > 0 ? (
                <p className="text-[11px] text-red-800 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                  ⚠ Pas assez de données : {sobryDocs.length} mois. Minimum 6 mois recommandés.
                </p>
              ) : null}
              <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {sobryDocs
                  .sort((a, b) => a.mois.localeCompare(b.mois))
                  .map((d) => (
                    <li
                      key={d.mois}
                      className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-light" />
                        <span className="font-mono">{d.mois}</span>
                        <span className="text-muted-foreground">
                          {Number(d.data?.variable_costs?.conso_totale_kwh || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kWh
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeJson(d.mois)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      <WizardFooter onNext={handleNext} nextDisabled={!canNext} />
    </>
  );
}
