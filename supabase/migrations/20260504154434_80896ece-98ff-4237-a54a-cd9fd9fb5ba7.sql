
-- Enums
CREATE TYPE public.prospect_statut AS ENUM ('brouillon', 'en_cours', 'devis_envoye', 'vendu', 'perdu');
CREATE TYPE public.prospect_config AS ENUM ('PETIT', 'MOYEN');
CREATE TYPE public.document_type AS ENUM ('facture_pdf', 'json_sobry');

-- Distributeurs
CREATE TABLE public.distributeurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nom text NOT NULL,
  email_contact text,
  telephone_contact text,
  marge_petit_conso_eur numeric NOT NULL DEFAULT 3803,
  marge_moyen_conso_eur numeric NOT NULL DEFAULT 4681,
  actif boolean NOT NULL DEFAULT true
);

-- Prospects
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nom_entreprise text NOT NULL,
  email text,
  telephone text,
  pdl text,
  adresse_pdl text,
  statut public.prospect_statut NOT NULL DEFAULT 'brouillon',
  config_choisie public.prospect_config,
  prix_client_custom_ht numeric,
  prix_client_custom_ttc numeric,
  marge_dynawatt_eur numeric NOT NULL DEFAULT 500,
  distributeur_id uuid REFERENCES public.distributeurs(id) ON DELETE SET NULL,
  marge_distributeur_eur numeric,
  notes_commerciales text,
  facture_actuelle_data jsonb,
  resultats_simulation jsonb
);

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  type public.document_type NOT NULL,
  nom_fichier text NOT NULL,
  mois_concerne text,
  data jsonb,
  storage_path text
);

-- Paramètres globaux
CREATE TABLE public.parametres_globaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cle text NOT NULL UNIQUE,
  valeur text NOT NULL,
  description text
);

-- Triggers updated_at (réutilise la fonction set_updated_at existante)
CREATE TRIGGER trg_distributeurs_updated_at BEFORE UPDATE ON public.distributeurs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prospects_updated_at BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_parametres_updated_at BEFORE UPDATE ON public.parametres_globaux
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.distributeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_globaux ENABLE ROW LEVEL SECURITY;

-- Policies (MVP interne, accès public)
CREATE POLICY "public all distributeurs" ON public.distributeurs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all prospects" ON public.prospects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all parametres" ON public.parametres_globaux FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_prospects_statut ON public.prospects(statut);
CREATE INDEX idx_prospects_distributeur ON public.prospects(distributeur_id);
CREATE INDEX idx_documents_prospect ON public.documents(prospect_id);

-- Données initiales paramètres globaux
INSERT INTO public.parametres_globaux (cle, valeur, description) VALUES
  ('prix_petit_conso_ht_standard', '10825', 'Prix client standard Petit Conso HT (€)'),
  ('prix_moyen_conso_ht_standard', '14500', 'Prix client standard Moyen Conso HT (€)'),
  ('marge_dynawatt_default', '500', 'Marge Dynawatt par défaut (€)'),
  ('cout_revient_petit_conso', '6522', 'Coût de revient Petit Conso HT (€)'),
  ('cout_revient_moyen_conso', '9319', 'Coût de revient Moyen Conso HT (€)');

-- Bucket storage pour factures PDF (privé)
INSERT INTO storage.buckets (id, name, public) VALUES ('factures', 'factures', false);

CREATE POLICY "public read factures" ON storage.objects FOR SELECT USING (bucket_id = 'factures');
CREATE POLICY "public insert factures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'factures');
CREATE POLICY "public update factures" ON storage.objects FOR UPDATE USING (bucket_id = 'factures');
CREATE POLICY "public delete factures" ON storage.objects FOR DELETE USING (bucket_id = 'factures');
