-- Stap 2: Voeg company_id toe aan profiles en maak permissions tabel
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.bedrijven(id) ON DELETE CASCADE;

-- Maak permissions tabel voor rechtenbeheer
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL UNIQUE,
  can_view_vacancies BOOLEAN DEFAULT true,
  can_edit_vacancies BOOLEAN DEFAULT false,
  can_delete_vacancies BOOLEAN DEFAULT false,
  can_view_users BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_view_companies BOOLEAN DEFAULT false,
  can_manage_companies BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS op permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Insert default permissions per rol
INSERT INTO public.permissions (role, can_view_vacancies, can_edit_vacancies, can_delete_vacancies, can_view_users, can_manage_users, can_view_companies, can_manage_companies)
VALUES 
  ('superadmin', true, true, true, true, true, true, true),
  ('ceo', true, true, true, true, true, false, false),
  ('accountmanager', true, true, true, false, false, false, false),
  ('recruiter', true, true, false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- Update RLS policies voor multi-tenant isolatie

-- Drop oude policies op bedrijven
DROP POLICY IF EXISTS "Authenticated users can view bedrijven" ON public.bedrijven;
DROP POLICY IF EXISTS "Authenticated users can insert bedrijven" ON public.bedrijven;
DROP POLICY IF EXISTS "Authenticated users can update bedrijven" ON public.bedrijven;
DROP POLICY IF EXISTS "Authenticated users can delete bedrijven" ON public.bedrijven;

-- Nieuwe policies voor bedrijven met multi-tenant isolatie
CREATE POLICY "Superadmin can view all bedrijven"
ON public.bedrijven FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view own company"
ON public.bedrijven FOR SELECT
USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Superadmin can insert bedrijven"
ON public.bedrijven FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin and CEO can update own company"
ON public.bedrijven FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND 
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'superadmin')))
);

CREATE POLICY "Superadmin can delete bedrijven"
ON public.bedrijven FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Drop oude policies op vacatures
DROP POLICY IF EXISTS "Authenticated users can view vacatures" ON public.vacatures;
DROP POLICY IF EXISTS "Authenticated users can insert vacatures" ON public.vacatures;
DROP POLICY IF EXISTS "Recruiters can update vacature status" ON public.vacatures;
DROP POLICY IF EXISTS "Authenticated users can delete vacatures" ON public.vacatures;

-- Nieuwe policies voor vacatures met multi-tenant isolatie
CREATE POLICY "Superadmin can view all vacatures"
ON public.vacatures FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view vacatures from own company"
ON public.vacatures FOR SELECT
USING (
  bedrijf_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Superadmin, CEO, and Accountmanager can insert vacatures"
ON public.vacatures FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager')))
);

CREATE POLICY "Superadmin, CEO, Accountmanager, and Recruiter can update vacatures"
ON public.vacatures FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager') OR has_role(auth.uid(), 'recruiter')))
);

CREATE POLICY "Superadmin, CEO, and Accountmanager can delete vacatures"
ON public.vacatures FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (bedrijf_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
   (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'accountmanager')))
);

-- Drop oude policies op kandidaten
DROP POLICY IF EXISTS "Authenticated users can view kandidaten" ON public.kandidaten;
DROP POLICY IF EXISTS "Authenticated users can insert kandidaten" ON public.kandidaten;
DROP POLICY IF EXISTS "Authenticated users can update kandidaten" ON public.kandidaten;
DROP POLICY IF EXISTS "Authenticated users can delete kandidaten" ON public.kandidaten;

-- Nieuwe policies voor kandidaten met multi-tenant isolatie
CREATE POLICY "Superadmin can view all kandidaten"
ON public.kandidaten FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view kandidaten from own company vacatures"
ON public.kandidaten FOR SELECT
USING (
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "Users can insert kandidaten for own company vacatures"
ON public.kandidaten FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin') OR
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "Users can update kandidaten from own company"
ON public.kandidaten FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin') OR
  vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  )
);

CREATE POLICY "Superadmin and CEO can delete kandidaten"
ON public.kandidaten FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (vacature_id IN (
    SELECT v.id FROM public.vacatures v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.bedrijf_id = p.company_id
  ) AND has_role(auth.uid(), 'ceo'))
);

-- Permissions policies
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

CREATE POLICY "Only superadmin can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'superadmin'));

-- Update profiles policies voor multi-tenant
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Superadmin can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view profiles from own company"
ON public.profiles FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) OR id = auth.uid()
);