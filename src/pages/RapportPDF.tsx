import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

// ====== TYPES ======
interface ReportPayload {
  client: {
    nom: string;
    email: string;
    telephone: string;
    pdl: string;
    adresse: string;
  };
  facture: {
    fournisseur: string;
    prix_kwh_ht: number;
    abonnement_mensuel_ht: number;
    structure_tarifaire?: string;
    puissance_souscrite_kva?: number;
  };
  result: any; // SimulationResult shape
  date: string;
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtKwh = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} kWh`;

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// ====== HELPERS ======
function generateProfileAnalysis(moyennesParHeure: number[]): {
  profil: string;
  pic: { heure: number; valeur: number };
  base: number;
  pctNuit: number;
  texte: string;
} {
  const slice = (a: number, b: number) =>
    moyennesParHeure.slice(a, b).reduce((x, y) => x + y, 0);
  const heuresMatin = slice(7, 12);
  const heuresMidi = slice(12, 15);
  const heuresSoir = slice(18, 23);
  const heuresNuit =
    moyennesParHeure.slice(0, 7).reduce((a, b) => a + b, 0) +
    moyennesParHeure[23];
  const total = moyennesParHeure.reduce((a, b) => a + b, 0) || 1;

  let profil = "activité commerciale standard";
  if (heuresSoir > heuresMidi * 1.5) profil = "restaurant ou commerce du soir";
  else if (heuresMidi > heuresSoir) profil = "commerce ouvert journée";
  else if (heuresMatin > heuresMidi)
    profil = "activité matinale (boulangerie, café)";
  else if (heuresNuit > heuresMidi * 0.5) profil = "activité 24/7 (hôtel, hôpital)";

  let picH = 0;
  let picV = 0;
  moyennesParHeure.forEach((v, h) => {
    if (v > picV) {
      picV = v;
      picH = h;
    }
  });
  const base = Math.min(...moyennesParHeure.filter((v) => v > 0));
  const pctNuit = (heuresNuit / total) * 100;

  const texte = `Votre consommation correspond à un profil ${profil}. Vos pics se concentrent sur les heures de service principal, ce qui correspond aux moments où le marché spot est généralement le plus cher. C'est précisément cette concentration qui rend l'arbitrage par batterie particulièrement rentable pour votre activité.`;

  return { profil, pic: { heure: picH, valeur: picV }, base, pctNuit, texte };
}

function aggregateByMonth(planJours: any[], facturePrixKwhHt: number, factureAboMensuelHt: number) {
  const TVA = 1.2;
  const map = new Map<string, { conso: number; coutSobryHt: number; nbJours: number }>();
  for (const day of planJours) {
    const ymd: string = day.date;
    const ym = ymd.slice(0, 7);
    const conso = (day.conso24h as number[]).reduce((a, b) => a + b, 0);
    let coutSobry = 0;
    for (let h = 0; h < 24; h++) {
      coutSobry += (day.conso24h[h] || 0) * (day.prix24h[h] || 0);
    }
    const acc = map.get(ym) || { conso: 0, coutSobryHt: 0, nbJours: 0 };
    acc.conso += conso;
    acc.coutSobryHt += coutSobry;
    acc.nbJours += 1;
    map.set(ym, acc);
  }
  const rows = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, v]) => {
      const [y, m] = ym.split("-").map(Number);
      const consoMois = v.conso;
      const coutAncienHt = consoMois * facturePrixKwhHt + factureAboMensuelHt;
      const coutSobryHt = v.coutSobryHt + factureAboMensuelHt;
      // approx Dynawatt = Sobry - quote-part gain pilotage (proportionnelle à la conso)
      // calculé plus haut globalement
      return {
        ym,
        label: `${MONTH_LABELS[m - 1]} ${y}`,
        conso: consoMois,
        coutAncienTtc: coutAncienHt * TVA,
        coutSobryTtc: coutSobryHt * TVA,
      };
    });
  return rows;
}

// ====== PAGE ======
export default function RapportPDF({
  payloadProp,
  embed = false,
}: {
  payloadProp?: ReportPayload;
  embed?: boolean;
} = {}) {
  const [payload, setPayload] = useState<ReportPayload | null>(payloadProp ?? null);

  useLayoutEffect(() => {
    if (embed) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlClass = html.className;
    const prevColorScheme = html.style.colorScheme;
    const prevBodyBg = body.style.background;
    const prevBodyBgColor = body.style.backgroundColor;
    const prevBodyBgImage = body.style.backgroundImage;
    const prevBodyColor = body.style.color;

    html.classList.remove("dark");
    html.classList.add("light");
    html.style.colorScheme = "light";
    body.classList.add("rapport-pdf-body");
    body.style.background = "#ffffff";
    body.style.backgroundColor = "#ffffff";
    body.style.backgroundImage = "none";
    body.style.color = "#1E1B3A";

    return () => {
      html.className = prevHtmlClass;
      html.style.colorScheme = prevColorScheme;
      body.classList.remove("rapport-pdf-body");
      body.style.background = prevBodyBg;
      body.style.backgroundColor = prevBodyBgColor;
      body.style.backgroundImage = prevBodyBgImage;
      body.style.color = prevBodyColor;
    };
  }, [embed]);

  useEffect(() => {
    if (payloadProp) {
      setPayload(payloadProp);
      return;
    }
    try {
      const raw = localStorage.getItem("dynawatt_report_payload") || sessionStorage.getItem("dynawatt_report_payload");
      if (raw) setPayload(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }, [payloadProp]);

  // Auto print (désactivé en mode embed)
  useEffect(() => {
    if (embed || !payload) return;
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, [payload, embed]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    []
  );

  if (!payload) {
    return (
      <>
        <style>{printStyles}</style>
        <div className="rapport-pdf-page rapport-empty-page" style={{ padding: 40, fontFamily: "Manrope, sans-serif" }}>
        <h1>Aucune simulation à imprimer</h1>
        <p>
          Cette page doit être ouverte depuis l'étape 6 du simulateur Dynawatt
          via le bouton "Télécharger le rapport PDF".
        </p>
        </div>
      </>
    );
  }

  const { client, facture, result } = payload;
  const config = result.config;
  const stats = result.stats;
  const roi = result.roi;
  const planJours = result.planJours || [];

  const economieSobryTtc = result.factureInitiale.ttc - result.sobry.ttc;
  const economieBatterieTtc = roi.gainTtcAn;
  const economieTotaleTtc = result.economieAnnuelleTtc;
  const economiePct = result.economiePctTtc;
  const prixMoyenAncien =
    facture.prix_kwh_ht * 1.2 + (facture.abonnement_mensuel_ht * 12 * 1.2) / Math.max(stats.consoAnnuelleKwh, 1);

  // Conso mensuelle pour bar chart
  const monthly = useMemo(
    () => aggregateByMonth(planJours, facture.prix_kwh_ht, facture.abonnement_mensuel_ht),
    [planJours, facture]
  );

  const monthlyForChart = monthly.map((r) => ({
    mois: r.label.split(" ")[0].slice(0, 3),
    kwh: Math.round(r.conso),
  }));

  const moyennesParHeure = useMemo(() => {
    const sums = new Array(24).fill(0);
    const counts = new Array(24).fill(0);
    for (const d of planJours) {
      for (let h = 0; h < 24; h++) {
        sums[h] += d.conso24h[h] || 0;
        counts[h] += 1;
      }
    }
    return sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
  }, [planJours]);

  const profileAnalysis = useMemo(
    () => generateProfileAnalysis(moyennesParHeure),
    [moyennesParHeure]
  );

  const dailyForChart = moyennesParHeure.map((v, h) => ({
    h: `${h.toString().padStart(2, "0")}h`,
    kwh: Number(v.toFixed(2)),
  }));

  // Sobry compatibility
  const consoTotal = moyennesParHeure.reduce((a, b) => a + b, 0) || 1;
  const consoCreuses =
    moyennesParHeure.slice(0, 7).reduce((a, b) => a + b, 0) +
    moyennesParHeure.slice(22, 24).reduce((a, b) => a + b, 0);
  const pctCreuses = (consoCreuses / consoTotal) * 100;
  const compatibleSobry = pctCreuses >= 30 || economieSobryTtc > 0;

  // Tableau mensuel — répartir gain pilotage proportionnellement à la conso
  const totalConso = monthly.reduce((a, m) => a + m.conso, 0) || 1;
  const monthlyDetailed = monthly.map((r) => {
    const partGainPilotage = (r.conso / totalConso) * economieBatterieTtc;
    const coutDynawattTtc = r.coutSobryTtc - partGainPilotage;
    const eco = r.coutAncienTtc - coutDynawattTtc;
    const ecoPct = (eco / Math.max(r.coutAncienTtc, 1)) * 100;
    return {
      ...r,
      coutDynawattTtc,
      eco,
      ecoPct,
    };
  });
  const totals = monthlyDetailed.reduce(
    (a, r) => ({
      conso: a.conso + r.conso,
      ancien: a.ancien + r.coutAncienTtc,
      dyn: a.dyn + r.coutDynawattTtc,
      eco: a.eco + r.eco,
    }),
    { conso: 0, ancien: 0, dyn: 0, eco: 0 }
  );

  // Leasing
  const TVA = 1.2;
  const COEF = 0.0155 * 0.78; // 84 mois (7 ans)
  const loyerMensuelHt = config.prix_ht * COEF;
  const loyerAnnuelHt = loyerMensuelHt * 12;
  const loyerMensuelTtc = loyerMensuelHt * TVA;
  const cashflowAnnuelTtc = economieTotaleTtc - loyerMensuelTtc * 12;

  // Cashflow leasing 7 ans cumul
  const cashflow7Ans = Array.from({ length: 7 }, (_, i) => ({
    annee: `An ${i + 1}`,
    cumul: Math.round(cashflowAnnuelTtc * (i + 1)),
  }));

  const pdlFmt = (client.pdl || "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();

  return (
    <>
      <style>{printStyles}</style>
      <div className="rapport-root rapport-pdf-page">
        {/* ============ PAGE 1 — COUVERTURE ============ */}
        <section className="page page-cover">
          <header className="cover-header">
            <Logo />
            <div className="cover-date">Édité le {today}</div>
          </header>

          <div className="cover-center">
            <div className="cover-eyebrow">Étude personnalisée</div>
            <h1 className="cover-title">{client.nom || "Client"}</h1>

            <div className="cover-card">
              <div className="cover-card-row">
                <span className="lbl">Adresse PDL</span>
                <span className="val">{client.adresse || "—"}</span>
              </div>
              <div className="cover-card-row">
                <span className="lbl">Numéro PDL</span>
                <span className="val mono">{pdlFmt || "—"}</span>
              </div>
              <div className="cover-card-row">
                <span className="lbl">Conso annuelle</span>
                <span className="val">{fmtKwh(stats.consoAnnuelleKwh)}</span>
              </div>
              <div className="cover-card-row">
                <span className="lbl">Fournisseur actuel</span>
                <span className="val">{facture.fournisseur || "—"}</span>
              </div>
            </div>
          </div>

          <footer className="cover-footer">
            <div className="cover-tagline">Le pilotage qui dynamite la facture</div>
          </footer>
        </section>

        {/* ============ PAGE 2 — SYNTHÈSE ============ */}
        <Page title="Synthèse exécutive" client={client} today={today} pageNum={2}>
          <div className="block">
            <h3 className="block-title">Votre situation actuelle</h3>
            <div className="kpi-grid">
              <Kpi label={`Coût annuel ${facture.fournisseur}`} value={fmtEur(result.factureInitiale.ttc)} sub="TTC / an" tone="orange" />
              <Kpi label="Conso annuelle" value={fmtKwh(stats.consoAnnuelleKwh)} sub="électricité" tone="dark" />
              <Kpi label="Prix moyen pondéré" value={`${prixMoyenAncien.toFixed(3)} €`} sub="€/kWh TTC" tone="dark" />
            </div>
          </div>

          <div className="block">
            <h3 className="block-title">Notre proposition</h3>
            <div className="kpi-grid">
              <Kpi label="Pack Dynawatt" value={config.nom} sub={`${fmtEur(config.prix_ttc)} TTC ou leasing 7 ans`} tone="violet" />
              <Kpi label="Capacité batterie" value={`${config.capacite} kWh`} sub="LFP — 12 ans / 6000 cycles" tone="dark" />
              <Kpi label="Puissance onduleur" value={`${config.puissance} kW`} sub="Tigo certifié" tone="dark" />
            </div>
          </div>

          <div className="block highlight-block">
            <h3 className="block-title gold">Vos économies</h3>
            <div className="big-saving">{fmtEur(economieTotaleTtc)}<span className="big-saving-suffix"> / an TTC</span></div>
            <div className="kpi-grid mt">
              <Kpi label="Économie sur 7 ans" value={fmtEur(economieTotaleTtc * 7)} sub="cumul des gains" tone="green" />
              <Kpi label="% de votre facture" value={`${economiePct.toFixed(1)} %`} sub="d'économie" tone="green" />
              <Kpi label="Soit par mois" value={fmtEur(economieTotaleTtc / 12)} sub="en moyenne" tone="green" />
            </div>
          </div>
        </Page>

        {/* ============ PAGE 3 — PROFIL CONSO ============ */}
        <Page title="Profil de votre consommation" client={client} today={today} pageNum={3}>
          <h3 className="block-title">Conso mensuelle</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyForChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mois" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Bar dataKey="kwh" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="block-title mt">Profil journalier moyen</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyForChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="h" stroke="#6B7280" fontSize={9} interval={2} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="kwh" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="analysis-box">
            <p>{profileAnalysis.texte}</p>
            <ul className="analysis-list">
              <li>Pic vers <strong>{profileAnalysis.pic.heure}h</strong> à {profileAnalysis.pic.valeur.toFixed(1)} kWh/h.</li>
              <li>Conso de base nuit : {profileAnalysis.base.toFixed(1)} kWh/h — idéale pour la recharge batterie.</li>
              <li>{pctCreuses.toFixed(0)}% de votre conso a lieu en heures creuses (00h-7h, 22h-24h).</li>
            </ul>
          </div>
        </Page>

        {/* ============ PAGE 4 — SOBRY-COMPATIBILITÉ ============ */}
        <Page title="Sobry-compatibilité" client={client} today={today} pageNum={4}>
          {compatibleSobry ? (
            <div className="status-block ok">
              <div className="status-badge">✓ Profil compatible Sobry</div>
              <p className="status-text">
                Votre consommation présente une variabilité horaire qui rend
                le tarif dynamique Sobry très avantageux.
              </p>
              <ul className="status-list">
                <li><strong>{pctCreuses.toFixed(0)}%</strong> de votre conso a lieu en heures creuses (prix Sobry très bas).</li>
                <li><strong>{(100 - pctCreuses).toFixed(0)}%</strong> en heures pleines, dont une partie sera décalée par la batterie.</li>
                <li>
                  Le passage chez Sobry vous fait économiser{" "}
                  <strong>{fmtEur(economieSobryTtc)}/an</strong> immédiatement,
                  avant même l'apport de la batterie.
                </li>
              </ul>
            </div>
          ) : (
            <div className="status-block warn">
              <div className="status-badge">⚠ Profil nécessitant la batterie</div>
              <p className="status-text">
                Votre consommation est étalée sur 24h/24, ce qui réduit l'intérêt
                du tarif dynamique seul. La batterie Dynawatt va capter les heures
                creuses la nuit pour les restituer en journée.
              </p>
              <ul className="status-list">
                <li>Sans batterie : économie Sobry seule ≈ <strong>{fmtEur(economieSobryTtc)}/an</strong>.</li>
                <li>Avec batterie : économie totale ≈ <strong>{fmtEur(economieTotaleTtc)}/an</strong>.</li>
              </ul>
            </div>
          )}

          <div className="block mt">
            <h3 className="block-title">Décomposition de l'économie annuelle</h3>
            <div className="kpi-grid">
              <Kpi label="Sobry vs ancien fournisseur" value={fmtEur(economieSobryTtc)} sub="dès le passage à Sobry" tone="violet" />
              <Kpi label="Pilotage batterie Dynawatt" value={fmtEur(economieBatterieTtc)} sub="arbitrage horaire" tone="violet" />
              <Kpi label="Total annuel TTC" value={fmtEur(economieTotaleTtc)} sub={`${economiePct.toFixed(1)} % d'économie`} tone="green" />
            </div>
          </div>
        </Page>

        {/* ============ PAGE 5 — BÉNÉFICES ============ */}
        <Page title="Ce que Dynawatt vous apporte" client={client} today={today} pageNum={5}>
          <Benefit
            num="1"
            title="Protection contre l'explosion des prix"
            text="Le 8 janvier 2025, le prix spot a touché 1,80 €/kWh sur le marché. Sans batterie, vous payez ce pic plein pot. Avec Dynawatt, votre batterie est chargée la veille à 0,03 €/kWh, et restitue pendant le pic. Vous évitez les hausses extrêmes."
          />
          <Benefit
            num="2"
            title="Autonomie de 3h en cas de coupure"
            text={`En cas de coupure réseau, votre batterie prend automatiquement le relais. Avec ${config.nom} (${config.capacite} kWh), vous bénéficiez d'environ 3h d'autonomie pour vos équipements essentiels. Plus de risque de perdre votre stock frigorifique, votre informatique ou votre activité pendant un blackout.`}
          />
          <Benefit
            num="3"
            title="Maximisation des spreads par notre algorithme"
            text={`Notre algorithme propriétaire identifie chaque jour les meilleures heures pour charger et décharger votre batterie. Il analyse les prix Sobry à J-1, prédit les pics du lendemain, et exécute automatiquement la stratégie optimale. Vous capturez en moyenne ${fmtEur(economieBatterieTtc)}/an de gains supplémentaires uniquement grâce au pilotage.`}
          />
        </Page>

        {/* ============ PAGE 6 — MARCHÉ 2026 ============ */}
        <Page title="Réalité du marché en 2026" client={client} today={today} pageNum={6}>
          <div className="text-block">
            <h3 className="block-title">Les courtiers post-Ukraine</h3>
            <p>
              Depuis 2022, beaucoup d'entreprises ont signé des contrats à des
              tarifs élevés via des courtiers en énergie qui ont profité de la
              panique des marchés de gros. Résultat : les pros paient en moyenne
              <strong> 0,26 €/kWh TTC</strong>, soit 35% de plus que le tarif
              réglementé des particuliers.
            </p>
          </div>
          <div className="text-block">
            <h3 className="block-title">La fin de l'ARENH</h3>
            <p>
              Au 1<sup>er</sup> janvier 2026, l'ARENH (Tarif d'Accès Régulé à
              l'Électricité Nucléaire historique) a disparu. Votre fournisseur
              n'a plus son amortisseur de prix face aux fluctuations du marché
              de gros. À la prochaine crise — climatique, géopolitique, ou un
              hiver tendu — les hausses ne seront plus amorties.
            </p>
          </div>
          <div className="text-block">
            <h3 className="block-title">La volatilité 2025-2026</h3>
            <p>
              Le marché spot a oscillé entre 13 €/MWh (septembre 2025) et 1 800
              €/MWh (pic janvier 2025), soit un facteur 138 de variation. Cette
              volatilité est appelée à perdurer.
            </p>
          </div>

          <div className="cta-box">
            Avec Sobry+Dynawatt, vous reprenez le contrôle. Plus d'intermédiaire
            qui marge sur votre dos, plus d'exposition aux pics, plus
            d'incertitude.
          </div>
        </Page>

        {/* ============ PAGE 7 — TABLEAU MENSUEL ============ */}
        <Page title="Votre simulation économique mois par mois" client={client} today={today} pageNum={7}>
          <table className="month-table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Conso kWh</th>
                <th>{facture.fournisseur || "Ancien"} TTC</th>
                <th>Sobry+Dynawatt TTC</th>
                <th>Économie €</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {monthlyDetailed.map((r) => (
                <tr key={r.ym}>
                  <td>{r.label}</td>
                  <td>{Math.round(r.conso).toLocaleString("fr-FR")}</td>
                  <td>{fmtEur(r.coutAncienTtc)}</td>
                  <td>{fmtEur(r.coutDynawattTtc)}</td>
                  <td className="green">+{fmtEur(r.eco)}</td>
                  <td className="green">{r.ecoPct.toFixed(0)}%</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL annuel</td>
                <td>{Math.round(totals.conso).toLocaleString("fr-FR")}</td>
                <td>{fmtEur(totals.ancien)}</td>
                <td>{fmtEur(totals.dyn)}</td>
                <td className="green">+{fmtEur(totals.eco)}</td>
                <td className="green">{((totals.eco / Math.max(totals.ancien, 1)) * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
          <div className="summary-line">
            Soit <strong>{fmtEur(economieTotaleTtc / 12)}/mois</strong> en
            moyenne d'économie.
          </div>
        </Page>

        {/* ============ PAGE 8 — ROI ============ */}
        <Page title="ROI & financement" client={client} today={today} pageNum={8}>
          <div className="block">
            <h3 className="block-title">Achat comptant</h3>
            <ul className="roi-list">
              <li><span>Prix d'achat HT</span><strong>{fmtEur(config.prix_ht)}</strong></li>
              <li><span>Prix d'achat TTC</span><strong>{fmtEur(config.prix_ttc)}</strong></li>
              <li><span>Économie totale annuelle (Sobry + pilotage)</span><strong className="green">{fmtEur(economieTotaleTtc)}/an</strong></li>
              <li><span>Payback</span><strong className="violet">{(config.prix_ttc / Math.max(economieTotaleTtc, 1)).toFixed(1)} ans</strong></li>
              <li><span>Économie cumulée 7 ans</span><strong className="green">{fmtEur(economieTotaleTtc * 7)}</strong></li>
              <li><span>Économie nette après amortissement</span><strong className="green">{fmtEur(economieTotaleTtc * 7 - config.prix_ttc)}</strong></li>
            </ul>
          </div>

          <div className="block mt">
            <h3 className="block-title">Leasing 7 ans</h3>
            <ul className="roi-list">
              <li><span>Loyer mensuel HT</span><strong>{fmtEur(loyerMensuelHt)}/mois</strong></li>
              <li><span>Loyer annuel HT</span><strong>{fmtEur(loyerAnnuelHt)}/an</strong></li>
              <li><span>Économie totale annuelle TTC</span><strong className="green">{fmtEur(economieTotaleTtc)}/an</strong></li>
              <li>
                <span>Cashflow net annuel</span>
                <strong className={cashflowAnnuelTtc >= 0 ? "green" : "orange"}>
                  {cashflowAnnuelTtc >= 0 ? "+" : ""}
                  {fmtEur(cashflowAnnuelTtc)}/an
                </strong>
              </li>
            </ul>
            <p className="leasing-note">
              {cashflowAnnuelTtc >= 0
                ? `Le leasing est autofinancé. Vous gagnez ${fmtEur(cashflowAnnuelTtc)}/an dès la première année, sans investir un euro.`
                : `Vous payez ${fmtEur(-cashflowAnnuelTtc / 12)} de différentiel par mois pour bénéficier de la batterie + de la protection long terme.`}
            </p>
          </div>

          <div className="chart-box mt">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={cashflow7Ans}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="annee" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ReferenceLine y={0} stroke="#9CA3AF" />
                <Tooltip formatter={(v: number) => fmtEur(v)} />
                <Line type="monotone" dataKey="cumul" stroke="#10B981" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Page>

        {/* ============ PAGE 9 — GARANTIES ============ */}
        <Page title="Garanties et assurances" client={client} today={today} pageNum={9}>
          <div className="block">
            <h3 className="block-title">Hardware Tigo</h3>
            <ul className="bullet-list">
              <li>Garantie onduleur : <strong>10 ans</strong></li>
              <li>Garantie batterie : <strong>152 mois (12 ans), 6000 cycles</strong></li>
              <li>Technologie LFP (lithium fer phosphate) : la plus sûre du marché</li>
            </ul>
          </div>
          <div className="block mt">
            <h3 className="block-title">Pose</h3>
            <ul className="bullet-list">
              <li>Installation par installateur certifié</li>
              <li>Conformité norme NF C 15-100</li>
              <li>Mise en service incluse</li>
            </ul>
          </div>
          <div className="block mt">
            <h3 className="block-title">Service</h3>
            <ul className="bullet-list">
              <li>SAV Dynawatt assuré 7j/7</li>
              <li>Pilotage automatique de la batterie 24h/24</li>
              <li>Reporting mensuel d'économies</li>
            </ul>
          </div>
        </Page>

        {/* ============ PAGE 10 — PROCHAINES ÉTAPES ============ */}
        <Page title="Prochaines étapes" client={client} today={today} pageNum={10}>
          <ol className="steps-list">
            <li><strong>Validation du devis</strong><span>sous 7 jours</span></li>
            <li><strong>Signature du contrat</strong> Sobry + Dynawatt + leasing si applicable<span>1 jour</span></li>
            <li><strong>Visite technique</strong> par l'installateur<span>sous 2 semaines</span></li>
            <li><strong>Installation</strong><span>1 à 2 jours</span></li>
            <li><strong>Activation pilotage Dynawatt</strong><span>sous 7 jours après installation</span></li>
          </ol>
          <div className="cta-box mt">
            Délai total estimé : <strong>4 à 6 semaines</strong> entre la signature et la mise en service.
          </div>

          <div className="signature-block">
            <div>
              <div className="lbl">Contact Dynawatt</div>
              <div>{client.email || "—"}</div>
              <div>{client.telephone || "—"}</div>
            </div>
            <div className="signature-line">
              <div className="lbl">Bon pour accord</div>
              <div className="signature-area"></div>
            </div>
          </div>
        </Page>

        {/* Floating no-print bar */}
        <div className="no-print floating-bar">
          <button onClick={() => window.print()}>🖨️ Imprimer / Enregistrer en PDF</button>
        </div>
      </div>
    </>
  );
}

// ====== SUB-COMPONENTS ======
function Logo() {
  return (
    <div className="logo">
      <div className="logo-circle" />
      <span>DYNAWATT</span>
    </div>
  );
}

function Page({
  title,
  children,
  client,
  today,
  pageNum,
}: {
  title: string;
  children: React.ReactNode;
  client: ReportPayload["client"];
  today: string;
  pageNum: number;
}) {
  return (
    <section className="page">
      <header className="page-header">
        <Logo />
        <h2 className="page-title">{title}</h2>
      </header>
      <div className="page-body">{children}</div>
      <footer className="page-footer">
        <span>{client.nom || "Client"} — {today}</span>
        <span>Document confidentiel — usage exclusif {client.nom || "client"}</span>
        <span>Page {pageNum} / 10</span>
      </footer>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "violet" | "gold" | "dark" | "green" | "orange";
}) {
  return (
    <div className={`kpi tone-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Benefit({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="benefit">
      <div className="benefit-num">{num}</div>
      <div>
        <h3 className="benefit-title">{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

// ====== STYLES ======
const printStyles = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

html,
body,
#root,
.rapport-pdf-page {
  background: #ffffff !important;
  background-color: #ffffff !important;
  background-image: none !important;
  color: #1E1B3A !important;
  color-scheme: light !important;
}

body.rapport-pdf-body,
body.rapport-pdf-body::before,
body.rapport-pdf-body::after {
  background: #ffffff !important;
  background-color: #ffffff !important;
  background-image: none !important;
  display: block !important;
  opacity: 1 !important;
  content: none !important;
}

.dark,
.dark *,
.rapport-pdf-page,
.rapport-pdf-page * {
  color-scheme: light !important;
}

.rapport-pdf-page,
.rapport-pdf-page .page,
.rapport-pdf-page .cover-card,
.rapport-pdf-page .kpi,
.rapport-pdf-page .chart-box,
.rapport-pdf-page .analysis-box,
.rapport-pdf-page .benefit,
.rapport-pdf-page .leasing-note,
.rapport-pdf-page .steps-list li,
.rapport-empty-page {
  background-color: #ffffff !important;
  background-image: none !important;
}

.rapport-empty-page,
.rapport-empty-page * {
  color: #1E1B3A !important;
}

.rapport-root, .rapport-root * {
  font-family: 'Manrope', system-ui, sans-serif;
  box-sizing: border-box;
}
.rapport-root {
  background: #F3F4F6 !important;
  color: #1E1B3A !important;
  min-height: 100vh;
  padding: 20px 0;
}
.page {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  margin: 0 auto 20px;
  padding: 18mm;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* Logo */
.logo { display: flex; align-items: center; gap: 8px; }
.logo-circle {
  width: 22px; height: 22px; border-radius: 50%;
  background: #FBBF24;
  box-shadow: 0 0 0 3px rgba(251,191,36,0.2);
}
.logo span { font-weight: 800; color: #1E1B3A; letter-spacing: 0.05em; font-size: 14px; }

/* Cover */
.page-cover { justify-content: space-between; }
.cover-header {
  display: flex; justify-content: space-between; align-items: center;
}
.cover-date { color: #6B7280; font-size: 11px; font-weight: 500; }
.cover-center { text-align: center; padding: 40px 0; }
.cover-eyebrow {
  color: #7C3AED; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; font-size: 12px; margin-bottom: 16px;
}
.cover-title {
  font-size: 56px; font-weight: 800; line-height: 1.1;
  color: #1E1B3A; margin: 0 0 36px;
}
.cover-card {
  max-width: 480px; margin: 0 auto;
  background: #F9FAFB; border-radius: 16px;
  padding: 24px; border: 1px solid #E5E7EB;
}
.cover-card-row {
  display: flex; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #E5E7EB;
  font-size: 13px;
}
.cover-card-row:last-child { border-bottom: none; }
.cover-card-row .lbl { color: #6B7280; font-weight: 500; }
.cover-card-row .val { color: #1E1B3A; font-weight: 700; text-align: right; }
.cover-card-row .mono { font-family: ui-monospace, monospace; }
.cover-footer { text-align: center; }
.cover-tagline {
  color: #FBBF24; font-weight: 700; font-size: 16px;
  text-transform: uppercase; letter-spacing: 0.15em;
}

/* Page header / footer */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 12px; border-bottom: 2px solid #7C3AED;
  margin-bottom: 18px;
}
.page-title {
  font-size: 22px; font-weight: 800; color: #7C3AED; margin: 0;
}
.page-body { flex: 1; }
.page-footer {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #9CA3AF; padding-top: 10px;
  border-top: 1px solid #E5E7EB; margin-top: 16px;
}

/* Blocks */
.block { margin-bottom: 18px; }
.block.mt, .mt { margin-top: 16px; }
.block-title {
  font-size: 14px; font-weight: 700; color: #1E1B3A;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin: 0 0 10px;
}
.block-title.gold { color: #FBBF24; }

/* KPIs */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.kpi {
  border-radius: 12px; padding: 12px;
  border: 1px solid #E5E7EB; background: #F9FAFB;
}
.kpi-label {
  font-size: 9px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: #6B7280; margin-bottom: 6px;
}
.kpi-value { font-size: 18px; font-weight: 800; color: #1E1B3A; line-height: 1.1; }
.kpi-sub { font-size: 10px; color: #6B7280; margin-top: 4px; }
.kpi.tone-violet { border-color: #7C3AED; background: rgba(124,58,237,0.05); }
.kpi.tone-violet .kpi-value { color: #7C3AED; }
.kpi.tone-gold { border-color: #FBBF24; background: rgba(251,191,36,0.08); }
.kpi.tone-green { border-color: #10B981; background: rgba(16,185,129,0.06); }
.kpi.tone-green .kpi-value { color: #10B981; }
.kpi.tone-orange { border-color: #F97316; background: rgba(249,115,22,0.06); }
.kpi.tone-orange .kpi-value { color: #F97316; }

.highlight-block {
  border: 2px solid #FBBF24; border-radius: 16px;
  padding: 16px; background: rgba(251,191,36,0.05);
}
.big-saving {
  font-size: 48px; font-weight: 800; color: #10B981;
  text-align: center; line-height: 1;
}
.big-saving-suffix { font-size: 16px; color: #6B7280; font-weight: 600; }

/* Charts */
.chart-box { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 8px; }

/* Analysis */
.analysis-box {
  margin-top: 16px; padding: 14px;
  background: #F9FAFB; border-left: 4px solid #7C3AED; border-radius: 8px;
  font-size: 12px; line-height: 1.5;
}
.analysis-box p { margin: 0 0 8px; }
.analysis-list { margin: 0; padding-left: 18px; }
.analysis-list li { margin-bottom: 4px; }

/* Status */
.status-block { padding: 18px; border-radius: 14px; }
.status-block.ok { background: rgba(16,185,129,0.08); border: 2px solid #10B981; }
.status-block.warn { background: rgba(249,115,22,0.08); border: 2px solid #F97316; }
.status-badge { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
.status-block.ok .status-badge { color: #10B981; }
.status-block.warn .status-badge { color: #F97316; }
.status-text { font-size: 13px; line-height: 1.5; margin: 0 0 10px; }
.status-list { padding-left: 18px; font-size: 12px; line-height: 1.6; margin: 0; }

/* Benefits */
.benefit {
  display: grid; grid-template-columns: 48px 1fr; gap: 14px;
  padding: 14px; margin-bottom: 12px;
  background: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB;
}
.benefit-num {
  width: 40px; height: 40px; border-radius: 50%;
  background: #7C3AED; color: #fff; font-weight: 800; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}
.benefit-title { font-size: 14px; font-weight: 700; margin: 0 0 6px; color: #1E1B3A; }
.benefit p { font-size: 12px; line-height: 1.55; margin: 0; color: #1E1B3A; }

/* Text blocks */
.text-block { margin-bottom: 14px; }
.text-block p { font-size: 12px; line-height: 1.6; margin: 0; color: #1E1B3A; }
.cta-box {
  background: #1E1B3A; color: #fff; padding: 14px 18px;
  border-radius: 12px; font-size: 13px; line-height: 1.5;
  margin-top: 14px;
}
.cta-box strong { color: #FBBF24; }

/* Table */
.month-table {
  width: 100%; border-collapse: collapse; font-size: 11px;
}
.month-table th, .month-table td {
  padding: 7px 8px; text-align: right; border-bottom: 1px solid #E5E7EB;
}
.month-table th:first-child, .month-table td:first-child { text-align: left; }
.month-table th {
  background: #7C3AED; color: #fff; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;
}
.month-table .total-row { background: #FBBF24; font-weight: 800; color: #1E1B3A; }
.month-table .total-row td { border-bottom: none; }
.month-table .green { color: #10B981; font-weight: 700; }
.summary-line {
  margin-top: 14px; text-align: center; font-size: 14px;
  color: #1E1B3A;
}
.summary-line strong { color: #10B981; font-size: 18px; }

/* ROI list */
.roi-list { list-style: none; padding: 0; margin: 0; }
.roi-list li {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid #E5E7EB;
  font-size: 12px;
}
.roi-list .green { color: #10B981; }
.roi-list .violet { color: #7C3AED; }
.roi-list .orange { color: #F97316; }
.leasing-note {
  margin-top: 10px; font-size: 12px; line-height: 1.5;
  background: #F9FAFB; padding: 10px; border-radius: 8px;
  border-left: 3px solid #7C3AED;
}

/* Bullet list */
.bullet-list { padding-left: 18px; font-size: 12px; line-height: 1.6; margin: 0; }
.bullet-list li { margin-bottom: 4px; }

/* Steps */
.steps-list {
  list-style: none; counter-reset: step; padding: 0; margin: 0;
}
.steps-list li {
  counter-increment: step;
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: #F9FAFB; border-radius: 10px;
  margin-bottom: 8px; font-size: 13px; position: relative;
  padding-left: 56px; border: 1px solid #E5E7EB;
}
.steps-list li::before {
  content: counter(step);
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px; border-radius: 50%;
  background: #7C3AED; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 12px;
}
.steps-list li span { color: #6B7280; font-size: 11px; }

.signature-block {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;
  font-size: 12px;
}
.signature-block .lbl {
  font-size: 10px; color: #6B7280; text-transform: uppercase;
  letter-spacing: 0.08em; margin-bottom: 6px;
}
.signature-area {
  height: 80px; border: 1px dashed #9CA3AF; border-radius: 8px;
}

/* Floating bar */
.floating-bar {
  position: fixed; bottom: 20px; right: 20px; z-index: 1000;
}
.floating-bar button {
  background: #7C3AED; color: #fff; border: none;
  padding: 12px 20px; border-radius: 10px;
  font-weight: 700; font-size: 14px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(124,58,237,0.4);
}

/* PRINT */
@media print {
  @page { size: A4 portrait; margin: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
  .no-print { display: none !important; }
  .rapport-root { background: #fff; padding: 0; }
  .page {
    margin: 0; box-shadow: none; page-break-after: always;
    width: 210mm; min-height: 297mm;
  }
  .page:last-child { page-break-after: auto; }
}
`;
