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

// Prix unitaires Tigo (lecture seule)
const PU = {
  onduleur6: 1238,
  onduleur10: 1339,
  wirebox: 259,
  bms: 479,
  module: 689,
};

const KWH_PAR_MODULE = 3.6;

// Garde-fous quantités
const LIMITS = {
  module: { min: 3, max: 26 },
  bms: { min: 1, max: 2 },
};

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

  // Quantités
  const qtyModulePetit = Number(params.qty_module_petit ?? 5);
  const qtyBmsPetit = Number(params.qty_bms_petit ?? 1);
  const qtyModuleMoyen = Number(params.qty_module_moyen ?? 8);
  const qtyBmsMoyen = Number(params.qty_bms_moyen ?? 1);

  // Coûts complémentaires
  const transportPetit = Number(params.transport_petit_conso_ht ?? 0);
  const installPetit = Number(params.install_petit_conso_ht ?? 0);
  const transportMoyen = Number(params.transport_moyen_conso_ht ?? 0);
  const installMoyen = Number(params.install_moyen_conso_ht ?? 0);

  const margeDynawatt = Number(params.marge_dynawatt_default ?? 0);

  const hardwarePetit = useMemo(
    () => [
      { nom: "TSI-6K3D Onduleur 6 kW Tri", qte: 1, pu: PU.onduleur6, key: "onduleur", locked: true },
      { nom: "TSS-3PS Wirebox tri + ATS", qte: 1, pu: PU.wirebox, key: "wirebox", locked: true },
      { nom: "BMS Kit", qte: qtyBmsPetit, pu: PU.bms, key: "qty_bms_petit", limits: LIMITS.bms },
      { nom: "GO Battery 3,6 kWh", qte: qtyModulePetit, pu: PU.module, key: "qty_module_petit", limits: LIMITS.module },
    ],
    [qtyBmsPetit, qtyModulePetit],
  );
  const hardwareMoyen = useMemo(
    () => [
      { nom: "TSI-10K3D Onduleur 10 kW Tri", qte: 1, pu: PU.onduleur10, key: "onduleur", locked: true },
      { nom: "TSS-3PS Wirebox tri + ATS", qte: 1, pu: PU.wirebox, key: "wirebox", locked: true },
      { nom: "BMS Kit", qte: qtyBmsMoyen, pu: PU.bms, key: "qty_bms_moyen", limits: LIMITS.bms },
      { nom: "GO Battery 3,6 kWh", qte: qtyModuleMoyen, pu: PU.module, key: "qty_module_moyen", limits: LIMITS.module },
    ],
    [qtyBmsMoyen, qtyModuleMoyen],
  );

  const hwPetitTotal = useMemo(
    () => hardwarePetit.reduce((s, l) => s + l.qte * l.pu, 0),
    [hardwarePetit],
  );
  const hwMoyenTotal = useMemo(
    () => hardwareMoyen.reduce((s, l) => s + l.qte * l.pu, 0),
    [hardwareMoyen],
  );

  const coutPetit = hwPetitTotal + margeDynawatt + transportPetit + installPetit;
  const coutMoyen = hwMoyenTotal + margeDynawatt + transportMoyen + installMoyen;

  async function save() {
    // Validation
    const errs: string[] = [];
    if (qtyModulePetit < LIMITS.module.min || qtyModulePetit > LIMITS.module.max)
      errs.push("Modules Petit hors limites");
    if (qtyBmsPetit < LIMITS.bms.min || qtyBmsPetit > LIMITS.bms.max)
      errs.push("BMS Petit hors limites");
    if (qtyModuleMoyen < LIMITS.module.min || qtyModuleMoyen > LIMITS.module.max)
      errs.push("Modules Moyen hors limites");
    if (qtyBmsMoyen < LIMITS.bms.min || qtyBmsMoyen > LIMITS.bms.max)
      errs.push("BMS Moyen hors limites");
    if (errs.length) {
      toast.error(errs.join(" — "));
      return;
    }

    setSaving(true);
    for (const [cle, valeur] of Object.entries(params)) {
      await supabase.from("parametres_globaux").update({ valeur }).eq("cle", cle);
    }
    await supabase
      .from("parametres_globaux")
      .update({ valeur: String(coutPetit) })
      .eq("cle", "cout_revient_petit_conso");
    await supabase
      .from("parametres_globaux")
      .update({ valeur: String(coutMoyen) })
      .eq("cle", "cout_revient_moyen_conso");
    setParams((p) => ({
      ...p,
      cout_revient_petit_conso: String(coutPetit),
      cout_revient_moyen_conso: String(coutMoyen),
    }));
    setSaving(false);
    setSavedOk(true);
    toast.success("✓ Paramètres sauvegardés");
  }

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
            <div className="mt-2 rounded-md bg-[#F5F3FF] border border-[#7C3AED]/30 px-3 py-2 text-xs">
              <span className="font-bold uppercase tracking-wide text-[#7C3AED]">Marge vente :</span>{" "}
              <span className="font-mono font-bold">
                {fmt(petitHT - coutPetit)} € HT
              </span>{" "}
              {petitHT > 0 && (
                <span className="text-muted-foreground">
                  ({((petitHT - coutPetit) / petitHT * 100).toFixed(1)} %)
                </span>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                = Prix client HT − Coût de revient ({fmt(coutPetit)} €)
              </div>
            </div>
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
            <div className="mt-2 rounded-md bg-[#F5F3FF] border border-[#7C3AED]/30 px-3 py-2 text-xs">
              <span className="font-bold uppercase tracking-wide text-[#7C3AED]">Marge vente :</span>{" "}
              <span className="font-mono font-bold">
                {fmt(moyenHT - coutMoyen)} € HT
              </span>{" "}
              {moyenHT > 0 && (
                <span className="text-muted-foreground">
                  ({((moyenHT - coutMoyen) / moyenHT * 100).toFixed(1)} %)
                </span>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                = Prix client HT − Coût de revient ({fmt(coutMoyen)} €)
              </div>
            </div>
          </div>
        </div>
      </Section>

      <CoutRevientTable
        title={`Petit Conso (${(qtyModulePetit * KWH_PAR_MODULE).toFixed(1)} kWh / 6 kW Tri / ${qtyModulePetit} modules)`}
        hardware={hardwarePetit}
        hardwareTotal={hwPetitTotal}
        margeDynawatt={params.marge_dynawatt_default ?? ""}
        onMargeDynawatt={(v) => set("marge_dynawatt_default", v)}
        onQty={(key, v) => set(key, v)}
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
        title={`Moyen Conso (${(qtyModuleMoyen * KWH_PAR_MODULE).toFixed(1)} kWh / 10 kW Tri / ${qtyModuleMoyen} modules)`}
        hardware={hardwareMoyen}
        hardwareTotal={hwMoyenTotal}
        margeDynawatt={params.marge_dynawatt_default ?? ""}
        onMargeDynawatt={(v) => set("marge_dynawatt_default", v)}
        onQty={(key, v) => set(key, v)}
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

type HwLine = {
  nom: string;
  qte: number;
  pu: number;
  key: string;
  locked?: boolean;
  limits?: { min: number; max: number };
};

function CoutRevientTable({
  title,
  hardware,
  hardwareTotal,
  margeDynawatt,
  onMargeDynawatt,
  onQty,
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
  hardware: HwLine[];
  hardwareTotal: number;
  margeDynawatt: string;
  onMargeDynawatt: (v: string) => void;
  onQty: (key: string, v: string) => void;
  transportLabel: string;
  installLabel: string;
  transport: string;
  install: string;
  onTransport: (v: string) => void;
  onInstall: (v: string) => void;
  total: number;
  totalLabel: string;
}) {
  const margeNum = Number(margeDynawatt || 0);
  const sousTotalComposants = hardwareTotal + margeNum;
  return (
    <Section title={`Coût de revient — ${title}`}>
      {/* Composants */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Composants
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
              {hardware.map((l) => {
                const outOfRange =
                  l.limits && (l.qte < l.limits.min || l.qte > l.limits.max);
                return (
                  <tr key={l.nom} className="bg-[#F3F4F6] border-t align-top">
                    <td className="px-3 py-2">{l.nom}</td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        value={l.qte}
                        disabled={l.locked}
                        min={l.limits?.min}
                        max={l.limits?.max}
                        onChange={(e) => onQty(l.key, e.target.value)}
                        className={`h-8 text-right font-mono w-20 ml-auto focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] ${
                          outOfRange ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {outOfRange && (
                        <div className="text-[10px] text-red-600 mt-1 text-right">
                          {l.limits!.min}–{l.limits!.max} max
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {fmt(l.pu)} €
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {fmt(l.qte * l.pu)} €
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t bg-muted/40 italic">
                <td className="px-3 py-2" colSpan={3}>
                  Sous-total Hardware Tigo HT
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {fmt(hardwareTotal)} €
                </td>
              </tr>
              <tr className="border-t bg-white">
                <td className="px-3 py-2 font-medium">Marge Dynawatt</td>
                <td className="px-3 py-2 text-right font-mono">1</td>
                <td className="px-3 py-2 text-right">
                  <Input
                    type="number"
                    value={margeDynawatt}
                    onChange={(e) => onMargeDynawatt(e.target.value)}
                    className="h-8 text-right font-mono w-32 ml-auto focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED]"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {fmt(margeNum)} €
                </td>
              </tr>
              <tr className="border-t bg-muted/40 font-bold">
                <td className="px-3 py-2" colSpan={3}>
                  Sous-total Composants HT
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {fmt(sousTotalComposants)} €
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
