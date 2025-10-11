-- Allow creators to read the companies they create (so INSERT ... RETURNING works)
CREATE POLICY users_view_created_customers
ON public.bedrijven
FOR SELECT
USING (created_by = auth.uid());