-- Fix infinite recursion in profiles policies
-- Drop problematische policy
DROP POLICY IF EXISTS "users_view_own_company_profiles" ON public.profiles;

-- Maak security definer function om company_id op te halen zonder recursie
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Hermaak policy met security definer function
CREATE POLICY "users_view_own_company_profiles"
ON public.profiles FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid()) OR 
  id = auth.uid()
);