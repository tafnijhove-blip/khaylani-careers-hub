-- Drop the existing view
DROP VIEW IF EXISTS public.vacature_stats;

-- Recreate the view with proper security context
-- By recreating it, we ensure it respects RLS on underlying tables (vacatures and kandidaten)
CREATE VIEW public.vacature_stats
WITH (security_invoker = true)
AS
SELECT 
  v.id,
  v.functietitel,
  v.status,
  v.prioriteit,
  v.aantal_posities,
  v.bedrijf_id,
  COUNT(DISTINCT k.id) FILTER (WHERE k.status = ANY (ARRAY['gestart'::text, 'afgerond'::text])) AS posities_vervuld,
  (v.aantal_posities - COUNT(DISTINCT k.id) FILTER (WHERE k.status = ANY (ARRAY['gestart'::text, 'afgerond'::text]))) AS posities_open
FROM vacatures v
LEFT JOIN kandidaten k ON k.vacature_id = v.id
GROUP BY v.id, v.functietitel, v.status, v.prioriteit, v.aantal_posities, v.bedrijf_id;