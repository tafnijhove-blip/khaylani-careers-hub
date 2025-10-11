-- Allow users to view linked customer companies (klanten) via relationships
CREATE POLICY users_view_linked_customers
ON public.bedrijven
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);

-- Allow CEOs and Account Managers to insert customer companies only
CREATE POLICY ceo_am_insert_customers
ON public.bedrijven
FOR INSERT
WITH CHECK (
  (type = 'klant'::bedrijf_type)
  AND (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'accountmanager'::app_role))
);

-- Allow Account Managers to create relationships for their own detacheringsbureau
CREATE POLICY am_insert_own_relaties
ON public.bedrijf_relaties
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(),'accountmanager'::app_role)
  AND detacheringbureau_id = public.get_user_company_id(auth.uid())
);

-- Vacatures: allow viewing for users on linked customers (all roles within org)
CREATE POLICY users_view_linked_vacatures
ON public.vacatures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = public.vacatures.bedrijf_id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);

-- Vacatures: allow CEO and Account Manager to insert for linked customers
CREATE POLICY ceo_am_insert_linked_vacatures
ON public.vacatures
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'accountmanager'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = public.vacatures.bedrijf_id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);

-- Vacatures: allow CEO and Account Manager to update for linked customers
CREATE POLICY ceo_am_update_linked_vacatures
ON public.vacatures
FOR UPDATE
USING (
  (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'accountmanager'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = public.vacatures.bedrijf_id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);

-- Vacatures: allow CEO and Account Manager to delete for linked customers
CREATE POLICY ceo_am_delete_linked_vacatures
ON public.vacatures
FOR DELETE
USING (
  (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'accountmanager'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = public.vacatures.bedrijf_id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);