-- Recreate the insert policy for Account Managers with simplified logic
DROP POLICY IF EXISTS ceo_am_insert_customers ON public.bedrijven;

CREATE POLICY ceo_am_insert_customers
ON public.bedrijven
FOR INSERT
WITH CHECK (
  type = 'klant'::bedrijf_type
  AND (
    public.has_role(auth.uid(), 'ceo'::app_role) 
    OR public.has_role(auth.uid(), 'accountmanager'::app_role)
  )
);