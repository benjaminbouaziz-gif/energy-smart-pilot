import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Distri = {
  id: string;
  nom: string;
  email_contact: string | null;
  telephone_contact: string | null;
  marge_petit_conso_eur: number;
  marge_moyen_conso_eur: number;
  actif: boolean;
};

const empty = {
  nom: "",
  email_contact: "",
  telephone_contact: "",
  marge_petit_conso_eur: 3803,
  marge_moyen_conso_eur: 4681,
  actif: true,
};

export default function Distributeurs() {
  const [list, setList] = useState<Distri[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Distri | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("distributeurs").select("*").order("nom");
    if (error) toast.error("Erreur");
    else setList((data ?? []) as Distri[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(d: Distri) {
    setEditing(d);
    setForm({
      nom: d.nom,
      email_contact: d.email_contact ?? "",
      telephone_contact: d.telephone_contact ?? "",
      marge_petit_conso_eur: d.marge_petit_conso_eur,
      marge_moyen_conso_eur: d.marge_moyen_conso_eur,
      actif: d.actif,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) { toast.error("Nom requis"); return; }
    const { error } = editing
      ? await supabase.from("distributeurs").update(form).eq("id", editing.id)
      : await supabase.from("distributeurs").insert(form);
    if (error) toast.error(error.message);
    else { toast.success("Sauvegardé"); setOpen(false); load(); }
  }

  async function toggleActif(d: Distri) {
    await supabase.from("distributeurs").update({ actif: !d.actif }).eq("id", d.id);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("distributeurs").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Supprimé");
    setDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Distributeurs</h2>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Ajouter un distributeur
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Aucun distributeur</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Téléphone</th>
                <th className="text-right p-3">Marge Petit</th>
                <th className="text-right p-3">Marge Moyen</th>
                <th className="text-center p-3">Actif</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 font-medium">{d.nom}</td>
                  <td className="p-3 text-muted-foreground">{d.email_contact ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{d.telephone_contact ?? "—"}</td>
                  <td className="p-3 text-right font-mono">{d.marge_petit_conso_eur} €</td>
                  <td className="p-3 text-right font-mono">{d.marge_moyen_conso_eur} €</td>
                  <td className="p-3 text-center">
                    <Switch checked={d.actif} onCheckedChange={() => toggleActif(d)} />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(d.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier" : "Nouveau"} distributeur</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email_contact} onChange={(e) => setForm({ ...form, email_contact: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={form.telephone_contact} onChange={(e) => setForm({ ...form, telephone_contact: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marge Petit Conso (€)</Label><Input type="number" value={form.marge_petit_conso_eur} onChange={(e) => setForm({ ...form, marge_petit_conso_eur: Number(e.target.value) })} /></div>
              <div><Label>Marge Moyen Conso (€)</Label><Input type="number" value={form.marge_moyen_conso_eur} onChange={(e) => setForm({ ...form, marge_moyen_conso_eur: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.actif} onCheckedChange={(v) => setForm({ ...form, actif: v })} />
              <Label>Actif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce distributeur ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Les prospects qui y sont affectés ne le seront plus (le champ sera vidé).
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
