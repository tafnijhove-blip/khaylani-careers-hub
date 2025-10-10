-- Drop alle oude policies (gebruik DO block voor fout tolerantie)
DO $$ 
BEGIN
  -- Bedrijven policies
  DROP POLICY IF EXISTS "Authenticated users can view bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Authenticated users can insert bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Authenticated users can update bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Authenticated users can delete bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Superadmin can view all bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Users can view own company" ON public.bedrijven;
  DROP POLICY IF EXISTS "Superadmin can insert bedrijven" ON public.bedrijven;
  DROP POLICY IF EXISTS "Superadmin and CEO can update own company" ON public.bedrijven;
  DROP POLICY IF EXISTS "Superadmin can delete bedrijven" ON public.bedrijven;
  
  -- Vacatures policies
  DROP POLICY IF EXISTS "Authenticated users can view vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Authenticated users can insert vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Recruiters can update vacature status" ON public.vacatures;
  DROP POLICY IF EXISTS "Authenticated users can delete vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Superadmin can view all vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Users can view vacatures from own company" ON public.vacatures;
  DROP POLICY IF EXISTS "Superadmin, CEO, and Accountmanager can insert vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Superadmin, CEO, Accountmanager, and Recruiter can update vacatures" ON public.vacatures;
  DROP POLICY IF EXISTS "Superadmin, CEO, and Accountmanager can delete vacatures" ON public.vacatures;
  
  -- Kandidaten policies
  DROP POLICY IF EXISTS "Authenticated users can view kandidaten" ON public.kandidaten;
  DROP POLICY IF EXISTS "Authenticated users can insert kandidaten" ON public.kandidaten;
  DROP POLICY IF EXISTS "Authenticated users can update kandidaten" ON public.kandidaten;
  DROP POLICY IF EXISTS "Authenticated users can delete kandidaten" ON public.kandidaten;
  DROP POLICY IF EXISTS "Superadmin can view all kandidaten" ON public.kandidaten;
  DROP POLICY IF EXISTS "Users can view kandidaten from own company vacatures" ON public.kandidaten;
  DROP POLICY IF EXISTS "Users can insert kandidaten for own company vacatures" ON public.kandidaten;
  DROP POLICY IF EXISTS "Users can update kandidaten from own company" ON public.kandidaten;
  DROP POLICY IF EXISTS "Superadmin and CEO can delete kandidaten" ON public.kandidaten;
  
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view profiles from own company" ON public.profiles;
EXCEPTION WHEN OTHERS THEN
  -- Negeer fouten bij droppen
  NULL;
END $$;

-- Maak nieuwe policies voor bedrijven
CREATE POLICY "superadmin_view_all_bedrijven"
ON public.bedrijven FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_view_own_company"
ON public.bedrijven FOR SELECT
USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "superadmin_insert_bedrijven"
ON public.bedrijven FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "superadmin_ceo_update_company"
ON public.bedrijven FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND 
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'superadmin')))
);

CREATE POLICY "superadmin_delete_bedrijven"
ON public.bedrijven FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Maak nieuwe policies voor vacatures
CREATE POLICY "superadmin_view_all_vacatures"
ON public.vacatures FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_view_own_company_vacatures"
ON public.vacatures FOR SELECT
USING (
  bedrijf_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "superadmin_ceo_am_insert_vacatures"
ON public.vacatures FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager')))
);

CREATE POLICY "users_update_own_company_vacatures"
ON public.vacatures FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager') OR has_role(auth.uid(), 'recruiter')))
);

CREATE POLICY "superadmin_ceo_am_delete_vacatures"
ON public.vacatures FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager')))
);

-- Maak nieuwe policies voor kandidaten
CREATE POLICY "superadmin_view_all_kandidaten"
ON public.kandidaten FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_view_own_company_kandidaten"
ON public.kandidaten FOR SELECT
USING (
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "users_insert_own_company_kandidaten"
ON public.kandidaten FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin') OR
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "users_update_own_company_kandidaten"
ON public.kandidaten FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "superadmin_ceo_delete_kandidaten"
ON public.kandidaten FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  ) AND has_role(auth.uid(), 'ceo'))
);

-- Maak nieuwe policies voor profiles
CREATE POLICY "superadmin_view_all_profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_view_own_company_profiles"
ON public.profiles FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) OR id = auth.uid()
);