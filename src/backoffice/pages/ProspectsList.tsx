import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { STATUT_COLOR, STATUT_LABEL, ProspectStatut } from "../lib/types";

type Prospect = {
  id: string;
  created_at: string;
  nom_entreprise: string;
  email: string | null;
  pdl: string | null;
  statut: ProspectStatut;
  config_choisie: "PETIT" | "MOYEN" | null;
  marge_dynawatt_eur: number;
  distributeur_id: string | null;
};

type Distri = { id: string; nom: string };

export default function ProspectsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [distris, setDistris] = useState<Distri[]>([]);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [distriFilter, setDistriFilter] = useState<string>("all");

  // Modale création
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nom_entreprise: "",
    email: "",
    telephone: "",
    pdl: "",
    adresse_pdl: "",
  });

  // Modale suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [p, d] = await Promise.all([
      supabase.from("prospects").select("*").order("created_at", { ascending: false }),
      supabase.from("distributeurs").select("id, nom"),
    ]);
    if (p.error) toast.error("Erreur chargement prospects");
    else setProspects((p.data ?? []) as Prospect[]);
    if (!d.error) setDistris((d.data ?? []) as Distri[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const distriById = useMemo(() => Object.fromEntries(distris.map((d) => [d.id, d.nom])), [distris]);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (statutFilter !== "all" && p.statut !== statutFilter) return false;
      if (distriFilter !== "all") {
        if (distriFilter === "none" && p.distributeur_id) return false;
        if (distriFilter !== "none" && p.distributeur_id !== distriFilter) return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !p.nom_entreprise?.toLowerCase().includes(s) &&
          !p.email?.toLowerCase().includes(s) &&
          !p.pdl?.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [prospects, search, statutFilter, distriFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom_entreprise.trim()) {
      toast.error("Nom entreprise requis");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("prospects")
      .insert({ ...form, statut: "brouillon" })
      .select("id")
      .single();
    setCreating(false);
    if (error) {
      toast.error("Erreur création : " + error.message);
      return;
    }
    setOpenCreate(false);
    setForm({ nom_entreprise: "", email: "", telephone: "", pdl: "", adresse_pdl: "" });
    navigate(`/backoffdan/prospect/${data.id}`);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("prospects").delete().eq("id", deleteId);
    if (error) toast.error("Erreur suppression");
    else {
      toast.success("Prospect supprimé");
      setProspects((prev) => prev.filter((p) => p.id !== deleteId));
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold">Prospects</h2>
        <Button onClick={() => setOpenCreate(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouveau prospect
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border p-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Recherche nom / email / PDL"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {(Object.keys(STATUT_LABEL) as ProspectStatut[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUT_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={distriFilter} onValueChange={setDistriFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Distributeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous distributeurs</SelectItem>
            <SelectItem value="none">Non affecté</SelectItem>
            {distris.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} prospect{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Aucun prospect</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Entreprise</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">PDL</th>
                <th className="text-left p-3">Création</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Config</th>
                <th className="text-left p-3">Marge €</th>
                <th className="text-left p-3">Distributeur</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 font-medium">
                    <Link to={`/backoffdan/prospect/${p.id}`} className="text-primary hover:underline">
                      {p.nom_entreprise}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.email ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{p.pdl ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLOR[p.statut]}`}>
                      {STATUT_LABEL[p.statut]}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.config_choisie === "PETIT"
                      ? "Petit"
                      : p.config_choisie === "MOYEN"
                      ? "Moyen"
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">{p.marge_dynawatt_eur} €</td>
                  <td className="p-3 text-muted-foreground">
                    {p.distributeur_id ? distriById[p.distributeur_id] ?? "—" : "Non affecté"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Voir fiche"
                        onClick={() => navigate(`/backoffdan/prospect/${p.id}`)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Lancer simulation"
                        onClick={() => navigate(`/simulationdan/${p.id}`)}
                      >
                        <Play className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Supprimer"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau prospect</DialogTitle>
            <DialogDescription>Crée la fiche, tu pourras compléter ensuite.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label>Nom entreprise *</Label>
              <Input
                value={form.nom_entreprise}
                onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>PDL (14 chiffres)</Label>
              <Input
                maxLength={14}
                value={form.pdl}
                onChange={(e) => setForm({ ...form, pdl: e.target.value })}
              />
            </div>
            <div>
              <Label>Adresse PDL</Label>
              <Input
                value={form.adresse_pdl}
                onChange={(e) => setForm({ ...form, adresse_pdl: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce prospect ?</DialogTitle>
            <DialogDescription>
              Tous ses documents seront aussi supprimés. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
