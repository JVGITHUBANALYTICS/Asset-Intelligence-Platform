-- ═════════════════════════════════════════════════════════════════
-- FIX: Drop and recreate all RLS policies
-- Run this in Supabase SQL Editor to fix "already exists" errors
-- ═════════════════════════════════════════════════════════════════

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Auth read assets" ON public.assets;
DROP POLICY IF EXISTS "Auth read inspections" ON public.inspections;
DROP POLICY IF EXISTS "Auth read dga_tests" ON public.dga_tests;
DROP POLICY IF EXISTS "Auth read maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Auth read health_models" ON public.health_models;
DROP POLICY IF EXISTS "Auth read alerts" ON public.activity_alerts;
DROP POLICY IF EXISTS "Auth read documents" ON public.documents;
DROP POLICY IF EXISTS "Auth read reports" ON public.generated_reports;
DROP POLICY IF EXISTS "Managers write assets" ON public.assets;
DROP POLICY IF EXISTS "Managers update assets" ON public.assets;
DROP POLICY IF EXISTS "Managers write inspections" ON public.inspections;
DROP POLICY IF EXISTS "Managers write maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Auth read work_queue" ON public.work_queue;
DROP POLICY IF EXISTS "Auth insert work_queue" ON public.work_queue;
DROP POLICY IF EXISTS "Users delete own queue items" ON public.work_queue;
DROP POLICY IF EXISTS "Managers upload documents" ON public.documents;
DROP POLICY IF EXISTS "Owner or admin delete documents" ON public.documents;
DROP POLICY IF EXISTS "Managers create reports" ON public.generated_reports;

-- Enable RLS on all tables
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
