-- Table principale des simulations
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_nom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  client_pdl TEXT NOT NULL,
  client_adresse TEXT NOT NULL,
  facture_actuelle JSONB,
  config_choisie TEXT,
  resultats_simulation JSONB,
  statut TEXT NOT NULL DEFAULT 'draft',
  current_step INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert simulations"
ON public.simulations FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read simulations"
ON public.simulations FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public can update simulations"
ON public.simulations FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER simulations_updated_at
BEFORE UPDATE ON public.simulations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Table des documents (factures PDF + JSON Sobry)
CREATE TABLE public.simulator_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  mois TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_simulator_documents_simulation ON public.simulator_documents(simulation_id);

ALTER TABLE public.simulator_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert documents"
ON public.simulator_documents FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read documents"
ON public.simulator_documents FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public can update documents"
ON public.simulator_documents FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);