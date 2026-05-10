-- ============================================================
-- TABLE 1 : pricing_hourly
-- ============================================================
CREATE TABLE public.pricing_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  epex_spot numeric(10, 5) NOT NULL,
  periode_4_postes text NOT NULL CHECK (periode_4_postes IN ('HCB','HPB','HCH','HPH')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, hour)
);
CREATE INDEX idx_pricing_hourly_date ON public.pricing_hourly(date);
CREATE INDEX idx_pricing_hourly_periode ON public.pricing_hourly(periode_4_postes);
ALTER TABLE public.pricing_hourly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read pricing_hourly" ON public.pricing_hourly FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone modify pricing_hourly" ON public.pricing_hourly FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABLE 2 : pricing_constants
-- ============================================================
CREATE TABLE public.pricing_constants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_debut date NOT NULL,
  date_fin date,
  marge_sobry_eur_kwh numeric(10, 5) NOT NULL,
  prime_socap_eur_kwh numeric(10, 5) NOT NULL,
  prime_soflex_eur_kwh numeric(10, 5) NOT NULL,
  cee_eur_kwh numeric(10, 5) NOT NULL,
  capacite_eur_kwh numeric(10, 5) NOT NULL,
  accise_eur_kwh numeric(10, 5) NOT NULL,
  turpe_var_c5_hph numeric(10, 5) NOT NULL,
  turpe_var_c5_hch numeric(10, 5) NOT NULL,
  turpe_var_c5_hpb numeric(10, 5) NOT NULL,
  turpe_var_c5_hcb numeric(10, 5) NOT NULL,
  turpe_var_c4_hph numeric(10, 5) NOT NULL,
  turpe_var_c4_hch numeric(10, 5) NOT NULL,
  turpe_var_c4_hpb numeric(10, 5) NOT NULL,
  turpe_var_c4_hcb numeric(10, 5) NOT NULL,
  cta_ratio numeric(10, 5) NOT NULL,
  tva_ratio numeric(10, 5) NOT NULL DEFAULT 0.20,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_constants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read pricing_constants" ON public.pricing_constants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone modify pricing_constants" ON public.pricing_constants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pricing_constants_updated_at
  BEFORE UPDATE ON public.pricing_constants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.pricing_constants (
  date_debut, date_fin,
  marge_sobry_eur_kwh, prime_socap_eur_kwh, prime_soflex_eur_kwh,
  cee_eur_kwh, capacite_eur_kwh, accise_eur_kwh,
  turpe_var_c5_hph, turpe_var_c5_hch, turpe_var_c5_hpb, turpe_var_c5_hcb,
  turpe_var_c4_hph, turpe_var_c4_hch, turpe_var_c4_hpb, turpe_var_c4_hcb,
  cta_ratio, tva_ratio, notes
) VALUES (
  '2026-04-14', NULL,
  0.008, 0.007, 0.002,
  0.007, 0.003, 0.03085,
  0.0749, 0.0397, 0.0166, 0.0116,
  0.0691, 0.0421, 0.0213, 0.0152,
  0.15, 0.20,
  'Grille tarifaire Sobry au 14 avril 2026. CTA distribution baissée à 15% depuis le 1er février 2026.'
);

-- ============================================================
-- TABLE 3 : pricing_subscriptions
-- ============================================================
CREATE TABLE public.pricing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL CHECK (segment IN ('C5','C4')),
  kva integer NOT NULL CHECK (kva BETWEEN 3 AND 249),
  variante text NOT NULL CHECK (variante IN ('CU4','MU4','CU','LU')),
  acheminement_eur_mois numeric(10, 4) NOT NULL,
  abo_sobry_eur_mois numeric(10, 4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(segment, kva, variante)
);
CREATE INDEX idx_pricing_subscriptions_segment_kva ON public.pricing_subscriptions(segment, kva);
ALTER TABLE public.pricing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read pricing_subscriptions" ON public.pricing_subscriptions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone modify pricing_subscriptions" ON public.pricing_subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pricing_subscriptions_updated_at
  BEFORE UPDATE ON public.pricing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE 4 : pricing_caps
-- ============================================================
CREATE TABLE public.pricing_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offre text NOT NULL CHECK (offre IN ('SoCap','SoFlex')),
  segment_client text NOT NULL CHECK (segment_client IN ('Particulier','Pro')),
  saison text NOT NULL CHECK (saison IN ('ete','hiver','all')),
  plafond_eur_kwh numeric(10, 5) NOT NULL,
  applies_to text NOT NULL CHECK (applies_to IN ('spot_only','spot_turpe_taxes')),
  date_debut date NOT NULL,
  date_fin date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offre, segment_client, saison, date_debut)
);
ALTER TABLE public.pricing_caps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read pricing_caps" ON public.pricing_caps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone modify pricing_caps" ON public.pricing_caps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.pricing_caps (offre, segment_client, saison, plafond_eur_kwh, applies_to, date_debut) VALUES
  ('SoCap',  'Particulier', 'ete',   0.1125, 'spot_turpe_taxes', '2026-04-14'),
  ('SoCap',  'Particulier', 'hiver', 0.2167, 'spot_turpe_taxes', '2026-04-14'),
  ('SoCap',  'Pro',         'ete',   0.0800, 'spot_only',        '2026-04-14'),
  ('SoCap',  'Pro',         'hiver', 0.1300, 'spot_only',        '2026-04-14'),
  ('SoFlex', 'Particulier', 'all',   0.3333, 'spot_turpe_taxes', '2026-04-14'),
  ('SoFlex', 'Pro',         'all',   0.2000, 'spot_only',        '2026-04-14');