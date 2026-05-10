CREATE TABLE public.battery_arbitrage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  jour text NOT NULL,
  nb_cycles smallint NOT NULL CHECK (nb_cycles IN (0, 1, 2)),

  c1_charge_debut_h smallint CHECK (c1_charge_debut_h BETWEEN 0 AND 24),
  c1_charge_fin_h smallint CHECK (c1_charge_fin_h BETWEEN 0 AND 24),
  c1_decharge_debut_h smallint CHECK (c1_decharge_debut_h BETWEEN 0 AND 24),
  c1_decharge_fin_h smallint CHECK (c1_decharge_fin_h BETWEEN 0 AND 24),
  c1_duree_h smallint,
  c1_prix_charge_eur_kwh numeric(10, 5),
  c1_prix_decharge_eur_kwh numeric(10, 5),
  c1_spread_eur_kwh numeric(10, 5),

  c2_charge_debut_h smallint CHECK (c2_charge_debut_h BETWEEN 0 AND 24),
  c2_charge_fin_h smallint CHECK (c2_charge_fin_h BETWEEN 0 AND 24),
  c2_decharge_debut_h smallint CHECK (c2_decharge_debut_h BETWEEN 0 AND 24),
  c2_decharge_fin_h smallint CHECK (c2_decharge_fin_h BETWEEN 0 AND 24),
  c2_duree_h smallint,
  c2_prix_charge_eur_kwh numeric(10, 5),
  c2_prix_decharge_eur_kwh numeric(10, 5),
  c2_spread_eur_kwh numeric(10, 5),

  gain_jour_eur_par_kw numeric(10, 6) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_battery_arbitrage_daily_month_day
  ON public.battery_arbitrage_daily ((EXTRACT(MONTH FROM date)), (EXTRACT(DAY FROM date)));

ALTER TABLE public.battery_arbitrage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read battery_arbitrage_daily"
  ON public.battery_arbitrage_daily
  FOR SELECT
  TO anon, authenticated
  USING (true);
