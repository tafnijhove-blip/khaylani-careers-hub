-- Fix RLS on user_roles to allow superadmin to manage roles
begin;

-- Remove conflicting policy that references non-existent 'management' role
DROP POLICY IF EXISTS "Only management can manage roles" ON public.user_roles;

-- Create a clear superadmin-only management policy
CREATE POLICY superadmin_manage_user_roles
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

commit;