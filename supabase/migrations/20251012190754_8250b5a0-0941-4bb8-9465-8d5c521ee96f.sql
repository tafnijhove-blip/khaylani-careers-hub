-- Allow public read access to bedrijven for landing page map
CREATE POLICY "public_view_bedrijven_with_coords"
ON public.bedrijven
FOR SELECT
TO anon
USING (lat IS NOT NULL AND lng IS NOT NULL);

-- Allow public read access to open vacatures for landing page map
CREATE POLICY "public_view_open_vacatures"
ON public.vacatures
FOR SELECT
TO anon
USING (status = 'open'::vacature_status);