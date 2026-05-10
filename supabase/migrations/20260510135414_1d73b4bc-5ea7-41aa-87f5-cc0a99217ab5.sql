
CREATE TABLE public.switchgrid_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text,
  ask_id text,
  consent_id text,
  order_id text,
  loadcurve_request_id text,
  status text NOT NULL DEFAULT 'INIT',
  error_message text,
  signer_first_name text,
  signer_last_name text,
  signer_genre text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_switchgrid_sessions_ask_id ON public.switchgrid_sessions(ask_id);
CREATE INDEX idx_switchgrid_sessions_order_id ON public.switchgrid_sessions(order_id);

ALTER TABLE public.switchgrid_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read switchgrid_sessions" ON public.switchgrid_sessions FOR SELECT USING (true);
CREATE POLICY "public insert switchgrid_sessions" ON public.switchgrid_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update switchgrid_sessions" ON public.switchgrid_sessions FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER switchgrid_sessions_set_updated_at
BEFORE UPDATE ON public.switchgrid_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
