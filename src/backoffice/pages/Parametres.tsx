import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Check } from "lucide-react";
import { toast } from "sonner";

type Params = Record<string, string>;

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// Hardware Tigo (lecture seule)
const HARDWARE_PETIT = [
  { nom: "TSI-6K3D Onduleur 6 kW Tri", qte: 1, pu: 1238 },
  { nom: "TSS-3PS Wirebox tri + ATS", qte: 1, pu: 259 },
  { nom: "BMS Kit", qte: 1, pu: 479 },
  { nom: "GO Battery 3,6 kWh", qte: 5, pu: 689 },
];
const HARDWARE_MOYEN = [
  { nom: "TSI-10K3D Onduleur 10 kW Tri", qte: 1, pu: 1339 },
  { nom: "TSS-3PS Wirebox tri + ATS", qte: 1, pu: 259 },
  { nom: "BMS Kit (×2 pour 8 modules)", qte: 2, pu: 479 },
  { nom: "GO Battery 3,6 kWh", qte: 8, pu: 689 },
];

const HW_PETIT_TOTAL = HARDWARE_PETIT.reduce((s, l) => s + l.qte * l.pu, 0);
const HW_MOYEN_TOTAL = HARDWARE_MOYEN.reduce((s, l) => s + l.qte * l.pu, 0);

export default function Parametres() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [params, setParams] = useState<Params>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("parametres_globaux")
      .select("cle, valeur");
    if (error) toast.error("Erreur");
    else {
      const map: Params = {};
      (data ?? []).forEach((r: any) => (map[r.cle] = r.valeur));
      setParams(map);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function set(cle: string, valeur: string) {
    setSavedOk(false);
    setParams((p) => ({ ...p, [cle]: valeur }));
  }

  async function save() {
    setSaving(true);
    for (const [cle, valeur] of Object.entries(params)) {
      await supabase.from("parametres_globaux").update({ valeur }).eq("cle", cle);
    }
    // Recompute and persist coûts de revient (incluant marge Dynawatt)
    const margeDw = Number(params.marge_dynawatt_default ?? 0);
    const newCoutPetit = HW_PETIT_TOTAL + margeDw + transportPetit + installPetit;
    const newCoutMoyen = HW_MOYEN_TOTAL + margeDw + transportMoyen + installMoyen;
    await supabase
      .from("parametres_globaux")
      .update({ valeur: String(newCoutPetit) })
      .eq("cle", "cout_revient_petit_conso");
    await supabase
      .from("parametres_globaux")
      .update({ valeur: String(newCoutMoyen) })
      .eq("cle", "cout_revient_moyen_conso");
    setParams((p) => ({
      ...p,
      cout_revient_petit_conso: String(newCoutPetit),
      cout_revient_moyen_conso: String(newCoutMoyen),
    }));
    setSaving(false);
    setSavedOk(true);
    toast.success("Paramètres sauvegardés");
  }

  const transportPetit = Number(params.transport_petit_conso_ht ?? 0);
  const installPetit = Number(params.install_petit_conso_ht ?? 0);
  const transportMoyen = Number(params.transport_moyen_conso_ht ?? 0);
  const installMoyen = Number(params.install_moyen_conso_ht ?? 0);

  const margeDynawatt = Number(params.marge_dynawatt_default ?? 0);

  const coutPetit = useMemo(
    () => HW_PETIT_TOTAL + margeDynawatt + transportPetit + installPetit,
    [margeDynawatt, transportPetit, installPetit],
  );
  const coutMoyen = useMemo(
    () => HW_MOYEN_TOTAL + margeDynawatt + transportMoyen + installMoyen,
    [margeDynawatt, transportMoyen, installMoyen],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const petitHT = Number(params.prix_petit_conso_ht_standard ?? 0);
  const moyenHT = Number(params.prix_moyen_conso_ht_standard ?? 0);

  return (
    <div className="space-y-6 max-w-5xl">
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
              TTC : {fmt(petitHT * 1.2)} €
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
              TTC : {fmt(moyenHT * 1.2)} €
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

      <CoutRevientTable
        title="Petit Conso (18 kWh / 6 kW Tri / 5 modules)"
        hardware={HARDWARE_PETIT}
        hardwareTotal={HW_PETIT_TOTAL}
        transportLabel="Transport (1 palette ~120 kg)"
        installLabel="Installation (1 jour électricien tri)"
        transport={params.transport_petit_conso_ht ?? ""}
        install={params.install_petit_conso_ht ?? ""}
        onTransport={(v) => set("transport_petit_conso_ht", v)}
        onInstall={(v) => set("install_petit_conso_ht", v)}
        total={coutPetit}
        totalLabel="COÛT REVIENT DYNAWATT PETIT CONSO"
      />

      <CoutRevientTable
        title="Moyen Conso (28,8 kWh / 10 kW Tri / 8 modules)"
        hardware={HARDWARE_MOYEN}
        hardwareTotal={HW_MOYEN_TOTAL}
        transportLabel="Transport (2 palettes ~190 kg)"
        installLabel="Installation (1 jour électricien tri)"
        transport={params.transport_moyen_conso_ht ?? ""}
        install={params.install_moyen_conso_ht ?? ""}
        onTransport={(v) => set("transport_moyen_conso_ht", v)}
        onInstall={(v) => set("install_moyen_conso_ht", v)}
        total={coutMoyen}
        totalLabel="COÛT REVIENT DYNAWATT MOYEN CONSO"
      />

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          💾 Sauvegarder les paramètres
        </Button>
        {savedOk && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
            <Check className="w-4 h-4" /> Sauvegardé
          </span>
        )}
      </div>
    </div>
  );
}

function CoutRevientTable({
  title,
  hardware,
  hardwareTotal,
  transportLabel,
  installLabel,
  transport,
  install,
  onTransport,
  onInstall,
  total,
  totalLabel,
}: {
  title: string;
  hardware: { nom: string; qte: number; pu: number }[];
  hardwareTotal: number;
  transportLabel: string;
  installLabel: string;
  transport: string;
  install: string;
  onTransport: (v: string) => void;
  onInstall: (v: string) => void;
  total: number;
  totalLabel: string;
}) {
  return (
    <Section title={`Coût de revient — ${title}`}>
      {/* Hardware Tigo */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Hardware Tigo (lecture seule)
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Composant</th>
                <th className="px-3 py-2 font-medium text-right">Qté</th>
                <th className="px-3 py-2 font-medium text-right">PU HT</th>
                <th className="px-3 py-2 font-medium text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {hardware.map((l) => (
                <tr key={l.nom} className="bg-[#F3F4F6] border-t">
                  <td className="px-3 py-2">{l.nom}</td>
                  <td className="px-3 py-2 text-right font-mono">{l.qte}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {fmt(l.pu)} €
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {fmt(l.qte * l.pu)} €
                  </td>
                </tr>
              ))}
              <tr className="border-t bg-muted/40 font-bold">
                <td className="px-3 py-2" colSpan={3}>
                  Sous-total Hardware Tigo HT
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {fmt(hardwareTotal)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Coûts complémentaires */}
      <div className="space-y-2 mt-5">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Coûts complémentaires (modifiables)
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">{transportLabel}</Label>
            <div className="relative">
              <Input
                type="number"
                value={transport}
                onChange={(e) => onTransport(e.target.value)}
                className="pr-12 focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                € HT
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">{installLabel}</Label>
            <div className="relative">
              <Input
                type="number"
                value={install}
                onChange={(e) => onInstall(e.target.value)}
                className="pr-12 focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                € HT
              </span>
            </div>
          </div>
        </div>
        <div className="text-sm text-right text-muted-foreground">
          Total coûts complémentaires :{" "}
          <span className="font-mono font-bold text-foreground">
            {fmt(Number(transport || 0) + Number(install || 0))} €
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="mt-5 rounded-lg bg-[#F5F3FF] border border-[#7C3AED]/30 p-4 flex items-center justify-between">
        <div className="font-black text-sm md:text-base tracking-wide">
          {totalLabel}
        </div>
        <div className="font-mono font-black text-2xl text-[#7C3AED]">
          {fmt(total)} € HT
        </div>
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-5 space-y-3">
      <h3 className="font-display font-bold">{title}</h3>
      {children}
    </div>
  );
}
