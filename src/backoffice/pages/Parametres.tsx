import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Params = Record<string, string>;

export default function Parametres() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [params, setParams] = useState<Params>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("parametres_globaux").select("cle, valeur");
    if (error) toast.error("Erreur");
    else {
      const map: Params = {};
      (data ?? []).forEach((r: any) => (map[r.cle] = r.valeur));
      setParams(map);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(cle: string, valeur: string) {
    setParams((p) => ({ ...p, [cle]: valeur }));
  }

  async function save() {
    setSaving(true);
    // Upsert key by key
    for (const [cle, valeur] of Object.entries(params)) {
      await supabase.from("parametres_globaux").update({ valeur }).eq("cle", cle);
    }
    setSaving(false);
    toast.success("Paramètres sauvegardés");
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const petitHT = Number(params.prix_petit_conso_ht_standard ?? 0);
  const moyenHT = Number(params.prix_moyen_conso_ht_standard ?? 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="font-display text-2xl font-bold">Paramètres globaux</h2>

      <Section title="Prix client par défaut">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Petit Conso HT (€)</Label>
            <Input
              type="number"
              value={params.prix_petit_conso_ht_standard ?? ""}
              onChange={(e) => set("prix_petit_conso_ht_standard", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              TTC : {(petitHT * 1.2).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
            </p>
          </div>
          <div>
            <Label>Moyen Conso HT (€)</Label>
            <Input
              type="number"
              value={params.prix_moyen_conso_ht_standard ?? ""}
              onChange={(e) => set("prix_moyen_conso_ht_standard", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              TTC : {(moyenHT * 1.2).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
            </p>
          </div>
        </div>
      </Section>

      <Section title="Marge Dynawatt par défaut">
        <Label>Marge (€)</Label>
        <Input
          type="number"
          value={params.marge_dynawatt_default ?? ""}
          onChange={(e) => set("marge_dynawatt_default", e.target.value)}
        />
      </Section>

      <Section title="Coûts de revient (lecture seule)">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted/40 rounded p-3">
            <div className="text-muted-foreground">Petit Conso</div>
            <div className="font-mono text-lg">{Number(params.cout_revient_petit_conso ?? 0).toLocaleString("fr-FR")} € HT</div>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <div className="text-muted-foreground">Moyen Conso</div>
            <div className="font-mono text-lg">{Number(params.cout_revient_moyen_conso ?? 0).toLocaleString("fr-FR")} € HT</div>
          </div>
        </div>
      </Section>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Sauvegarder les paramètres
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-5 space-y-3">
      <h3 className="font-display font-bold">{title}</h3>
      {children}
    </div>
  );
}
