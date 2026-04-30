import { Utensils, Dumbbell, Shirt, Croissant, Hotel, Tent, Building2, type LucideIcon } from "lucide-react";

export interface SectorData {
  slug: string;
  name: string;
  icon: LucideIcon;
  hero: { title: React.ReactNode; subtitle: string };
  seo: { title: string; description: string };
  profile: {
    annualKwh: string;
    power: string;
    schedule: string;
    mainLoads: string;
    extra?: string;
  };
  loadCurve: number[];
  annotations: { hour: number; label: string; type?: "peak" | "valley" }[];
  levers: { title: string; desc: string }[];
  caseStudy: {
    realClient: boolean;
    name: string;
    description: string;
    metrics: { label: string; value: string; unit?: string; highlight?: boolean }[];
    summary: string;
  };
  config: { name: string; details: string; price: string };
  faq: { q: string; a: string }[];
  extraSection?: { title: string; bullets: string[] };
}
