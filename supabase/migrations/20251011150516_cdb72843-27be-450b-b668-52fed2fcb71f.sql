-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Check and recreate vacature_stats view without SECURITY DEFINER if it exists
DROP VIEW IF EXISTS public.vacature_stats CASCADE;

-- Recreate as a regular view (no SECURITY DEFINER)
CREATE VIEW public.vacature_stats AS
SELECT 
  v.id,
  v.functietitel,
  v.status,
  v.prioriteit,
  v.aantal_posities,
  v.bedrijf_id,
  COUNT(DISTINCT k.id) FILTER (WHERE k.status IN ('gestart', 'afgerond')) as posities_vervuld,
  v.aantal_posities - COUNT(DISTINCT k.id) FILTER (WHERE k.status IN ('gestart', 'afgerond')) as posities_open
FROM public.vacatures v
LEFT JOIN public.kandidaten k ON k.vacature_id = v.id
GROUP BY v.id, v.functietitel, v.status, v.prioriteit, v.aantal_posities, v.bedrijf_id;