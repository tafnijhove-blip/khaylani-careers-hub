-- Multitenant Security & Isolation Migration
-- This migration implements full tenant isolation using company_id as tenant identifier

-- Step 1: Add tenant_id where missing and create security definer function
-- We'll use company_id from profiles as the tenant identifier

-- Create a security definer function to get user's tenant (company) ID
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Step 2: Enhanced RLS Policies for Tenant Isolation

-- PROFILES: Strengthen existing policies
DROP POLICY IF EXISTS "users_view_own_company_profiles" ON public.profiles;
CREATE POLICY "users_view_own_company_profiles" ON public.profiles
FOR SELECT
USING (
  company_id = get_user_tenant_id(auth.uid()) 
  OR id = auth.uid()
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- BEDRIJVEN: Strengthen tenant isolation
DROP POLICY IF EXISTS "users_view_own_company" ON public.bedrijven;
CREATE POLICY "users_view_own_company" ON public.bedrijven
FOR SELECT
USING (
  id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "users_view_linked_customers" ON public.bedrijven;
CREATE POLICY "users_view_linked_customers" ON public.bedrijven
FOR SELECT
USING (
  (type = 'klant'::bedrijf_type AND EXISTS (
    SELECT 1 FROM bedrijf_relaties r
    WHERE r.klant_id = bedrijven.id 
    AND r.detacheringbureau_id = get_user_tenant_id(auth.uid())
  ))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- VACATURES: Strengthen tenant isolation
DROP POLICY IF EXISTS "users_view_own_company_vacatures" ON public.vacatures;
CREATE POLICY "users_view_own_company_vacatures" ON public.vacatures
FOR SELECT
USING (
  bedrijf_id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "superadmin_ceo_am_insert_vacatures" ON public.vacatures;
CREATE POLICY "tenant_users_insert_vacatures" ON public.vacatures
FOR INSERT
WITH CHECK (
  (bedrijf_id = get_user_tenant_id(auth.uid()) 
   AND (has_role(auth.uid(), 'ceo'::app_role) 
        OR has_role(auth.uid(), 'accountmanager'::app_role)))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "users_update_own_company_vacatures" ON public.vacatures;
CREATE POLICY "tenant_users_update_vacatures" ON public.vacatures
FOR UPDATE
USING (
  (bedrijf_id = get_user_tenant_id(auth.uid())
   AND (has_role(auth.uid(), 'ceo'::app_role) 
        OR has_role(auth.uid(), 'accountmanager'::app_role)
        OR has_role(auth.uid(), 'recruiter'::app_role)))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "superadmin_ceo_am_delete_vacatures" ON public.vacatures;
CREATE POLICY "tenant_admins_delete_vacatures" ON public.vacatures
FOR DELETE
USING (
  (bedrijf_id = get_user_tenant_id(auth.uid())
   AND (has_role(auth.uid(), 'ceo'::app_role) 
        OR has_role(auth.uid(), 'accountmanager'::app_role)))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- KANDIDATEN: Strengthen tenant isolation
DROP POLICY IF EXISTS "users_view_own_company_kandidaten" ON public.kandidaten;
CREATE POLICY "tenant_view_kandidaten" ON public.kandidaten
FOR SELECT
USING (
  vacature_id IN (
    SELECT v.id FROM vacatures v
    WHERE v.bedrijf_id = get_user_tenant_id(auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "users_insert_own_company_kandidaten" ON public.kandidaten;
CREATE POLICY "tenant_insert_kandidaten" ON public.kandidaten
FOR INSERT
WITH CHECK (
  vacature_id IN (
    SELECT v.id FROM vacatures v
    WHERE v.bedrijf_id = get_user_tenant_id(auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "users_update_own_company_kandidaten" ON public.kandidaten;
CREATE POLICY "tenant_update_kandidaten" ON public.kandidaten
FOR UPDATE
USING (
  vacature_id IN (
    SELECT v.id FROM vacatures v
    WHERE v.bedrijf_id = get_user_tenant_id(auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "superadmin_ceo_delete_kandidaten" ON public.kandidaten;
CREATE POLICY "tenant_admins_delete_kandidaten" ON public.kandidaten
FOR DELETE
USING (
  (vacature_id IN (
    SELECT v.id FROM vacatures v
    WHERE v.bedrijf_id = get_user_tenant_id(auth.uid())
  ) AND has_role(auth.uid(), 'ceo'::app_role))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- BEDRIJF_RELATIES: Strengthen tenant isolation
DROP POLICY IF EXISTS "users_view_own_company_relaties" ON public.bedrijf_relaties;
CREATE POLICY "tenant_view_relaties" ON public.bedrijf_relaties
FOR SELECT
USING (
  detacheringbureau_id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "superadmin_ceo_insert_relaties" ON public.bedrijf_relaties;
DROP POLICY IF EXISTS "am_insert_own_relaties" ON public.bedrijf_relaties;
CREATE POLICY "tenant_insert_relaties" ON public.bedrijf_relaties
FOR INSERT
WITH CHECK (
  (detacheringbureau_id = get_user_tenant_id(auth.uid())
   AND (has_role(auth.uid(), 'ceo'::app_role) 
        OR has_role(auth.uid(), 'accountmanager'::app_role)))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "superadmin_ceo_delete_relaties" ON public.bedrijf_relaties;
CREATE POLICY "tenant_delete_relaties" ON public.bedrijf_relaties
FOR DELETE
USING (
  (detacheringbureau_id = get_user_tenant_id(auth.uid())
   AND has_role(auth.uid(), 'ceo'::app_role))
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- ACTIVITY_LOG: Add tenant isolation
DROP POLICY IF EXISTS "Authenticated users can view activity log" ON public.activity_log;
CREATE POLICY "tenant_view_activity_log" ON public.activity_log
FOR SELECT
USING (
  (related_bedrijf_id = get_user_tenant_id(auth.uid()) OR user_id = auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "Authenticated users can insert activity log" ON public.activity_log;
CREATE POLICY "tenant_insert_activity_log" ON public.activity_log
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (related_bedrijf_id = get_user_tenant_id(auth.uid()) OR related_bedrijf_id IS NULL)
);

-- Step 3: Create helper function for automatic tenant assignment on insert
CREATE OR REPLACE FUNCTION public.set_tenant_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign bedrijf_id (tenant) from user's profile if not set
  IF TG_TABLE_NAME = 'vacatures' AND NEW.bedrijf_id IS NULL THEN
    NEW.bedrijf_id := get_user_tenant_id(auth.uid());
  END IF;
  
  -- Auto-assign created_by if not set
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to vacatures table
DROP TRIGGER IF EXISTS set_tenant_on_vacature_insert ON public.vacatures;
CREATE TRIGGER set_tenant_on_vacature_insert
BEFORE INSERT ON public.vacatures
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_on_insert();

-- Step 4: Add index for performance on tenant queries
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_vacatures_bedrijf_id ON public.vacatures(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_bedrijf_relaties_detacheringbureau ON public.bedrijf_relaties(detacheringbureau_id);

-- Step 5: Add comments for documentation
COMMENT ON FUNCTION public.get_user_tenant_id IS 'Returns the tenant (company) ID for a given user. Used for tenant isolation in RLS policies.';
COMMENT ON FUNCTION public.set_tenant_on_insert IS 'Automatically assigns tenant (bedrijf_id) and created_by on insert operations.';
