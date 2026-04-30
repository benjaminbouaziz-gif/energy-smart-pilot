// Mock data for Hotel America Opera — démo Tigo
// Toutes les valeurs sont calibrées pour être visuellement parlantes et réalistes.

export const demoClient = {
  id: "demo-hao",
  type: "pro" as const,
  firstName: "Marc",
  lastName: "Lefebvre",
  companyName: "Hotel America Opera",
  activity: "Hôtel 3★ — 42 chambres",
  address: "16 rue de Caumartin, 75009 Paris",
  email: "marc.lefebvre@hotel-america-opera.fr",
  phone: "+33 1 47 70 56 90",
  pdl: "14 250 003 681 042",
  powerSubscribedKva: 36,
  currentTariff: "Dynawatt + Tarif Jaune indexé spot",
  installationDate: "2026-01-01",
  commercial: {
    firstName: "Léo",
    lastName: "Marchand",
    email: "leo.marchand@dynawatt.fr",
    phone: "+33 6 24 18 09 47",
  },
};

export const demoInstallation = {
  configName: "Config 5 — Tri 15kW + 29 kWh",
  inverterModel: "Tigo TSI-15K3D",
  inverterSerial: "TSI15-26A0042817",
  batteryTotalKwh: 29,
  batteryModulesCount: 8,
  hasGoJunction: true,
  hasEvCharger: true,
  evChargerModel: "Tigo GO EV Charger 22 kW Tri",
  installationDate: "2026-01-01",
  warrantyEndDate: "2037-01-01",
  cyclesMax: 6000,
  cyclesConsumed: 247,
  sohPct: 98,
};
