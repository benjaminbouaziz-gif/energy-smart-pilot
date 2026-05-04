import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Play, Save, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { STATUT_LABEL, ProspectStatut, ProspectConfig } from "../lib/types";

type Prospect = {
  id: string;
  nom_entreprise: string;
  email: string | null;
  telephone: string | null;
  pdl: string | null;
  adresse_pdl: string | null;
  statut: ProspectStatut;
  config_choisie: ProspectConfig | null;
  prix_client_custom_ht: number | null;
  prix_client_custom_ttc: number | null;
  marge_dynawatt_eur: number;
  distributeur_id: string | null;
  marge_distributeur_eur: number | null;
  notes_commerciales: string | null;
  facture_actuelle_data: any;
  resultats_simulation: any;
  created_at: string;
  updated_at: string;
};

type Distri = {
  id: string;
  nom: string;
  marge_petit_conso_eur: number;
  marge_moyen_conso_eur: number;
};

type DocRow = {
  id: string;
  type: "facture_pdf" | "json_sobry";
  nom_fichier: string;
  mois_concerne: string | null;
  storage_path: string | null;
  data: any;
  created_at: string;
};

type Params = Record<string, string>;

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [distris, setDistris] = useState<Distri[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [params, setParams] = useState<Params>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [p, d, doc, par] = await Promise.all([
      supabase.from("prospects").select("*").eq("id", id).single(),
      supabase.from("distributeurs").select("id, nom, marge_petit_conso_eur, marge_moyen_conso_eur").eq("actif", true),
      supabase.from("documents").select("*").eq("prospect_id", id).order("created_at"),
      supabase.from("parametres_globaux").select("cle, valeur"),
    ]);
    if (p.error) {
      toast.error("Prospect introuvable");
      navigate("/backoffdan");
      return;
    }
    setProspect(p.data as Prospect);
    setDistris((d.data ?? []) as Distri[]);
    setDocs((doc.data ?? []) as DocRow[]);
    const map: Params = {};
    (par.data ?? []).forEach((r: any) => (map[r.cle] = r.valeur));
    setParams(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const prixStandardHT = useMemo(() => {
    if (prospect?.config_choisie === "PETIT") return Number(params.prix_petit_conso_ht_standard ?? 10825);
    if (prospect?.config_choisie === "MOYEN") return Number(params.prix_moyen_conso_ht_standard ?? 14500);
    return 0;
  }, [prospect?.config_choisie, params]);

  const prixHT = prospect?.prix_client_custom_ht ?? prixStandardHT;
  const prixTTC = prixHT ? prixHT * 1.2 : 0;

  const coutRevient = useMemo(() => {
    if (prospect?.config_choisie === "PETIT") return Number(params.cout_revient_petit_conso ?? 6522);
    if (prospect?.config_choisie === "MOYEN") return Number(params.cout_revient_moyen_conso ?? 9319);
    return 0;
  }, [prospect?.config_choisie, params]);

  const margeDistri = useMemo(() => {
    if (!prospect?.distributeur_id || !prixHT || !coutRevient) return null;
    return Math.round(prixHT - coutRevient - (prospect?.marge_dynawatt_eur ?? 0));
  }, [prospect, prixHT, coutRevient]);

  function patch<K extends keyof Prospect>(key: K, value: Prospect[K]) {
    setProspect((p) => (p ? { ...p, [key]: value } : p));
  }

  async function handleSave() {
    if (!prospect) return;
    setSaving(true);
    const payload = {
      nom_entreprise: prospect.nom_entreprise,
      email: prospect.email,
      telephone: prospect.telephone,
      pdl: prospect.pdl,
      adresse_pdl: prospect.adresse_pdl,
      statut: prospect.statut,
      config_choisie: prospect.config_choisie,
      prix_client_custom_ht: prospect.prix_client_custom_ht,
      prix_client_custom_ttc: prospect.prix_client_custom_ht ? prospect.prix_client_custom_ht * 1.2 : null,
      marge_dynawatt_eur: prospect.marge_dynawatt_eur,
      distributeur_id: prospect.distributeur_id,
      marge_distributeur_eur: margeDistri,
      notes_commerciales: prospect.notes_commerciales,
    };
    const { error } = await supabase.from("prospects").update(payload).eq("id", prospect.id);
    setSaving(false);
    if (error) toast.error("Erreur sauvegarde : " + error.message);
    else toast.success("Modifications enregistrées");
  }

  async function handleDelete() {
    if (!prospect) return;
    const { error } = await supabase.from("prospects").delete().eq("id", prospect.id);
    if (error) toast.error("Erreur");
    else {
      toast.success("Prospect supprimé");
      navigate("/backoffdan");
    }
  }

  async function uploadFacture(file: File) {
    if (!prospect) return;
    const path = `prospects/${prospect.id}/facture_${Date.now()}.pdf`;
    const up = await supabase.storage.from("factures").upload(path, file);
    if (up.error) {
      toast.error("Upload échoué : " + up.error.message);
      return;
    }
    // Supprimer l'ancienne facture en DB (et fichier)
    const old = docs.find((d) => d.type === "facture_pdf");
    if (old) {
      if (old.storage_path) await supabase.storage.from("factures").remove([old.storage_path]);
      await supabase.from("documents").delete().eq("id", old.id);
    }
    const { error } = await supabase.from("documents").insert({
      prospect_id: prospect.id,
      type: "facture_pdf",
      nom_fichier: file.name,
      storage_path: path,
    });
    if (error) toast.error(error.message);
    else toast.success("Facture uploadée");
    load();
  }

  async function uploadJsons(files: FileList) {
    if (!prospect) return;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const mois = data?.mois ?? data?.month ?? file.name.replace(/\.json$/i, "");
        await supabase.from("documents").insert({
          prospect_id: prospect.id,
          type: "json_sobry",
          nom_fichier: file.name,
          mois_concerne: mois,
          data,
        });
      } catch {
        toast.error(`JSON invalide : ${file.name}`);
      }
    }
    toast.success("JSON ajoutés");
    load();
  }

  async function deleteDoc(d: DocRow) {
    if (d.storage_path) await supabase.storage.from("factures").remove([d.storage_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    load();
  }

  async function downloadFacture(d: DocRow) {
    if (!d.storage_path) return;
    const { data, error } = await supabase.storage.from("factures").createSignedUrl(d.storage_path, 60);
    if (error || !data) {
      toast.error("Téléchargement impossible");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  if (loading || !prospect) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const facture = docs.find((d) => d.type === "facture_pdf");
  const jsons = docs.filter((d) => d.type === "json_sobry");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{prospect.nom_entreprise}</h2>
          <p className="text-sm text-muted-foreground">
            Créé le {new Date(prospect.created_at).toLocaleDateString("fr-FR")} · MAJ{" "}
            {new Date(prospect.updated_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/simulationdan/${prospect.id}`)} className="bg-primary hover:bg-primary/90">
            <Play className="w-4 h-4" /> Lancer simulation
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="default">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Infos client */}
        <Card title="Informations client">
          <Field label="Nom entreprise">
            <Input value={prospect.nom_entreprise} onChange={(e) => patch("nom_entreprise", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={prospect.email ?? ""} onChange={(e) => patch("email", e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <Input value={prospect.telephone ?? ""} onChange={(e) => patch("telephone", e.target.value)} />
          </Field>
          <Field label="PDL (14 chiffres)">
            <Input
              maxLength={14}
              value={prospect.pdl ?? ""}
              onChange={(e) => patch("pdl", e.target.value)}
            />
          </Field>
          <Field label="Adresse PDL">
            <Input value={prospect.adresse_pdl ?? ""} onChange={(e) => patch("adresse_pdl", e.target.value)} />
          </Field>
          <Field label="Statut">
            <Select value={prospect.statut} onValueChange={(v) => patch("statut", v as ProspectStatut)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUT_LABEL) as ProspectStatut[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUT_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes commerciales">
            <Textarea
              rows={4}
              value={prospect.notes_commerciales ?? ""}
              onChange={(e) => patch("notes_commerciales", e.target.value)}
            />
          </Field>
        </Card>

        {/* Documents */}
        <Card title="Documents">
          <div>
            <h4 className="font-semibold text-sm mb-2">Facture actuelle</h4>
            {facture ? (
              <div className="bg-muted/40 rounded p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{facture.nom_fichier}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => downloadFacture(facture)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteDoc(facture)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {prospect.facture_actuelle_data && (
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(prospect.facture_actuelle_data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune facture</p>
            )}
            <label className="mt-2 block">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFacture(e.target.files[0])}
              />
              <Button asChild variant="outline" size="sm" className="mt-2">
                <span><Upload className="w-4 h-4" /> {facture ? "Remplacer" : "Uploader la facture"}</span>
              </Button>
            </label>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-sm mb-2">JSON Sobry ({jsons.length})</h4>
            <div className="space-y-1 max-h-48 overflow-auto">
              {jsons.length === 0 && <p className="text-sm text-muted-foreground">Aucun JSON</p>}
              {jsons.map((j) => (
                <div key={j.id} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1 text-sm">
                  <span className="truncate">{j.mois_concerne ?? j.nom_fichier}</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteDoc(j)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <label className="mt-2 block">
              <input
                type="file"
                accept="application/json"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && uploadJsons(e.target.files)}
              />
              <Button asChild variant="outline" size="sm" className="mt-2">
                <span><Upload className="w-4 h-4" /> Uploader des JSON</span>
              </Button>
            </label>
          </div>
        </Card>

        {/* Config & Pricing */}
        <Card title="Configuration & Pricing">
          <Field label="Configuration">
            <Select
              value={prospect.config_choisie ?? "none"}
              onValueChange={(v) => patch("config_choisie", v === "none" ? null : (v as ProspectConfig))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non choisie</SelectItem>
                <SelectItem value="PETIT">Petit Conso</SelectItem>
                <SelectItem value="MOYEN">Moyen Conso</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="bg-muted/40 rounded p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Prix standard HT :</span>
              <span className="font-mono">{prixStandardHT.toLocaleString("fr-FR")} €</span>
            </div>
            <Field label="Prix custom HT (override)">
              <Input
                type="number"
                placeholder={String(prixStandardHT)}
                value={prospect.prix_client_custom_ht ?? ""}
                onChange={(e) =>
                  patch(
                    "prix_client_custom_ht",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </Field>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Prix HT appliqué :</span>
              <span className="font-mono">{prixHT.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="flex justify-between">
              <span>Prix TTC :</span>
              <span className="font-mono">{prixTTC.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</span>
            </div>
          </div>

          <Field label="Marge Dynawatt (€)">
            <Input
              type="number"
              value={prospect.marge_dynawatt_eur}
              onChange={(e) => patch("marge_dynawatt_eur", Number(e.target.value))}
            />
          </Field>
          <Field label="Distributeur affecté">
            <Select
              value={prospect.distributeur_id ?? "none"}
              onValueChange={(v) => patch("distributeur_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non affecté</SelectItem>
                {distris.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="bg-muted/40 rounded p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Coût revient :</span>
              <span className="font-mono">{coutRevient.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Marge distributeur calculée :</span>
              <span className="font-mono">
                {margeDistri !== null ? `${margeDistri.toLocaleString("fr-FR")} €` : "—"}
              </span>
            </div>
          </div>

          {prospect.resultats_simulation && (
            <div className="bg-primary/5 rounded p-3 space-y-1 text-sm">
              <h4 className="font-semibold text-sm">Résultats simulation</h4>
              {prospect.resultats_simulation.economie_annuelle && (
                <div className="flex justify-between">
                  <span>Économie annuelle :</span>
                  <span className="font-mono">
                    {Number(prospect.resultats_simulation.economie_annuelle).toLocaleString("fr-FR")} €
                  </span>
                </div>
              )}
              {prospect.resultats_simulation.payback_annees && (
                <div className="flex justify-between">
                  <span>Payback :</span>
                  <span className="font-mono">{prospect.resultats_simulation.payback_annees} ans</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce prospect ?</DialogTitle>
            <DialogDescription>Tous ses documents seront aussi supprimés. Action irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-5 space-y-4">
      <h3 className="font-display font-bold text-lg">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
