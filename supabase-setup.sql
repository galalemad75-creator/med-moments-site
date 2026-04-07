-- ============================================
-- SUPABASE SETUP — HealTunes
-- Run once in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.chapters (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  songs JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "r_ch" ON public.chapters;
DROP POLICY IF EXISTS "w_ch" ON public.chapters;
DROP POLICY IF EXISTS "r_st" ON public.settings;
DROP POLICY IF EXISTS "w_st" ON public.settings;

CREATE POLICY "r_ch" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "w_ch" ON public.chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "r_st" ON public.settings FOR SELECT USING (true);
CREATE POLICY "w_st" ON public.settings FOR ALL USING (true) WITH CHECK (true);
