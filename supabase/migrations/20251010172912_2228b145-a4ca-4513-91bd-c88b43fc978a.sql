-- Allow all authenticated users to insert bedrijven
DROP POLICY IF EXISTS "Accountmanagers and management can insert bedrijven" ON public.bedrijven;
CREATE POLICY "Authenticated users can insert bedrijven" 
ON public.bedrijven 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to insert vacatures
DROP POLICY IF EXISTS "Accountmanagers and management can insert vacatures" ON public.vacatures;
CREATE POLICY "Authenticated users can insert vacatures" 
ON public.vacatures 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update bedrijven
DROP POLICY IF EXISTS "Accountmanagers and management can update bedrijven" ON public.bedrijven;
CREATE POLICY "Authenticated users can update bedrijven" 
ON public.bedrijven 
FOR UPDATE 
TO authenticated
USING (true);

-- Allow all authenticated users to delete bedrijven (or keep management-only if preferred)
DROP POLICY IF EXISTS "Only management can delete bedrijven" ON public.bedrijven;
CREATE POLICY "Authenticated users can delete bedrijven" 
ON public.bedrijven 
FOR DELETE 
TO authenticated
USING (true);

-- Allow all authenticated users to delete vacatures
DROP POLICY IF EXISTS "Only management can delete vacatures" ON public.vacatures;
CREATE POLICY "Authenticated users can delete vacatures" 
ON public.vacatures 
FOR DELETE 
TO authenticated
USING (true);