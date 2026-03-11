-- ============================================================
-- Asset Intelligence Platform — Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ─── PROFILES (extends auth.users) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin','asset_manager','engineer','viewer')),
  title         TEXT NOT NULL DEFAULT '',
  organization  TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, title, organization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE(NEW.raw_user_meta_data->>'title', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', 'PPL Electric Utilities')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ASSETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id                TEXT PRIMARY KEY,
  type              TEXT NOT NULL CHECK (type IN (
                      'Power Transformer','Circuit Breaker','Dist Transformer',
                      'Disconnect Switch','Capacitor Bank','Voltage Regulator',
                      'Recloser','Underground Cable')),
  manufacturer      TEXT NOT NULL,
  voltage           TEXT NOT NULL,
  capacity          TEXT NOT NULL,
  location          TEXT NOT NULL,
  commission_date   TEXT NOT NULL,
  age               INTEGER NOT NULL,
  health_score      NUMERIC(5,2) NOT NULL,
  risk_score        NUMERIC(5,2) NOT NULL,
  risk_level        TEXT NOT NULL CHECK (risk_level IN ('critical','high','medium','low')),
  estimated_cost    NUMERIC(12,2) NOT NULL,
  last_assessment   TEXT NOT NULL,
  customers_affected INTEGER,
  voltage_class     TEXT NOT NULL CHECK (voltage_class IN ('Transmission','Sub-Transmission','Distribution')),
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_risk_level ON public.assets(risk_level);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_voltage_class ON public.assets(voltage_class);

-- ─── INSPECTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            TEXT NOT NULL REFERENCES public.assets(id),
  asset_type          TEXT NOT NULL,
  location            TEXT NOT NULL,
  inspector           TEXT NOT NULL,
  inspection_date     TEXT NOT NULL,
  inspection_type     TEXT NOT NULL CHECK (inspection_type IN (
                        'Visual','Thermal Imaging','Ultrasonic',
                        'Oil Analysis','Partial Discharge','Vibration Analysis')),
  overall_condition   TEXT NOT NULL CHECK (overall_condition IN ('Good','Fair','Poor','Critical')),
  findings            TEXT NOT NULL,
  recommendations     TEXT NOT NULL,
  next_inspection_due TEXT NOT NULL,
  priority            TEXT NOT NULL CHECK (priority IN ('Routine','Priority','Urgent','Emergency')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_asset_id ON public.inspections(asset_id);

-- ─── DGA TESTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dga_tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          TEXT NOT NULL REFERENCES public.assets(id),
  asset_type        TEXT NOT NULL CHECK (asset_type IN ('Power Transformer','Dist Transformer')),
  location          TEXT NOT NULL,
  sample_date       TEXT NOT NULL,
  lab               TEXT NOT NULL,
  hydrogen          NUMERIC(8,2) NOT NULL,
  methane           NUMERIC(8,2) NOT NULL,
  ethane            NUMERIC(8,2) NOT NULL,
  ethylene          NUMERIC(8,2) NOT NULL,
  acetylene         NUMERIC(8,2) NOT NULL,
  co                NUMERIC(8,2) NOT NULL,
  co2               NUMERIC(8,2) NOT NULL,
  tdcg              NUMERIC(10,2) NOT NULL,
  oil_temperature   NUMERIC(5,1) NOT NULL,
  moisture_content  NUMERIC(6,2) NOT NULL,
  diagnosis         TEXT NOT NULL CHECK (diagnosis IN ('Normal','Caution','Warning','Critical')),
  fault_type        TEXT NOT NULL CHECK (fault_type IN (
                      'Normal','Thermal Fault','Electrical Fault',
                      'Arcing','Partial Discharge','Cellulose Degradation')),
  trend             TEXT NOT NULL CHECK (trend IN ('Stable','Improving','Deteriorating')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dga_tests_asset_id ON public.dga_tests(asset_id);

-- ─── MAINTENANCE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        TEXT NOT NULL REFERENCES public.assets(id),
  asset_type      TEXT NOT NULL,
  voltage_class   TEXT NOT NULL,
  location        TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Preventive','Repair - Planned','Repair - Unplanned')),
  work_order_type TEXT NOT NULL,
  description     TEXT NOT NULL,
  assigned_crew   TEXT NOT NULL,
  scheduled_date  TEXT NOT NULL,
  completed_date  TEXT,
  status          TEXT NOT NULL CHECK (status IN ('Completed','In Progress','Scheduled','Cancelled')),
  duration        NUMERIC(6,1) NOT NULL,
  cost            NUMERIC(10,2) NOT NULL,
  parts_used      TEXT NOT NULL DEFAULT '',
  outage_required BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON public.maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);

-- ─── HEALTH MODELS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_models (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL,
  algorithm           TEXT NOT NULL,
  accuracy            NUMERIC(5,2) NOT NULL,
  last_run            TEXT,
  assets_scored       INTEGER NOT NULL DEFAULT 0,
  icon                TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','training','draft','retired')),
  version             TEXT NOT NULL DEFAULT '0.1.0',
  created_by          TEXT NOT NULL,
  created_date        TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  business_context    TEXT NOT NULL DEFAULT '',
  input_features      TEXT[] NOT NULL DEFAULT '{}',
  output_metric       TEXT NOT NULL DEFAULT '',
  training_data_size  INTEGER NOT NULL DEFAULT 0,
  refresh_frequency   TEXT NOT NULL DEFAULT 'Daily',
  asset_types         TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ACTIVITY ALERTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_alerts (
  id        TEXT PRIMARY KEY,
  asset_id  TEXT NOT NULL REFERENCES public.assets(id),
  type      TEXT NOT NULL CHECK (type IN ('dga_test','thermal','load_alert','inspection','failure','maintenance')),
  message   TEXT NOT NULL,
  severity  TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON public.activity_alerts(timestamp DESC);

-- ─── WORK QUEUE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_queue (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id  TEXT NOT NULL REFERENCES public.assets(id),
  notes     TEXT NOT NULL DEFAULT '',
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by  UUID REFERENCES public.profiles(id)
);

-- ─── DOCUMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     TEXT NOT NULL,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  file_size     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  storage_path  TEXT NOT NULL DEFAULT '',
  uploaded_by   UUID REFERENCES public.profiles(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── GENERATED REPORTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  format        TEXT NOT NULL DEFAULT 'PDF',
  file_size     TEXT NOT NULL DEFAULT '',
  storage_path  TEXT,
  generated_by  UUID REFERENCES public.profiles(id),
  status        TEXT NOT NULL DEFAULT 'completed',
  pages         INTEGER NOT NULL DEFAULT 0,
  scope         TEXT NOT NULL DEFAULT ''
);


-- ═════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dga_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: read all, update own
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Read-only tables for all authenticated users
CREATE POLICY "Auth read assets" ON public.assets
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read inspections" ON public.inspections
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read dga_tests" ON public.dga_tests
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read maintenance" ON public.maintenance
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read health_models" ON public.health_models
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read alerts" ON public.activity_alerts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read reports" ON public.generated_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Write access for managers+ on data tables
CREATE POLICY "Managers write assets" ON public.assets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager'))
  );
CREATE POLICY "Managers update assets" ON public.assets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager'))
  );
CREATE POLICY "Managers write inspections" ON public.inspections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager','engineer'))
  );
CREATE POLICY "Managers write maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager','engineer'))
  );

-- Work queue: users manage own items
CREATE POLICY "Auth read work_queue" ON public.work_queue
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert work_queue" ON public.work_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users delete own queue items" ON public.work_queue
  FOR DELETE USING (
    added_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Documents: auth read, managers+ upload, owner/admin delete
CREATE POLICY "Managers upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager','engineer'))
  );
CREATE POLICY "Owner or admin delete documents" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Generated reports: auth read, managers+ create
CREATE POLICY "Managers create reports" ON public.generated_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','asset_manager','engineer'))
  );
