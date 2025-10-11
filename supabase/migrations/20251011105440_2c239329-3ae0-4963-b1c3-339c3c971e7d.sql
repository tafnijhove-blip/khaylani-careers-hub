-- Fix the users_view_linked_customers policy
DROP POLICY IF EXISTS users_view_linked_customers ON public.bedrijven;

CREATE POLICY users_view_linked_customers
ON public.bedrijven
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bedrijf_relaties r
    WHERE r.klant_id = bedrijven.id
      AND r.detacheringbureau_id = public.get_user_company_id(auth.uid())
  )
);