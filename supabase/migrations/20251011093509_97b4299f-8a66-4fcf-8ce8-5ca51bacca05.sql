-- Allow superadmins to update any profile (needed to assign users to detacheringsbureaus)
-- Keep existing policy that lets users update their own profile

-- Create policy for superadmins to update any profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'superadmin_update_profiles'
  ) THEN
    CREATE POLICY "superadmin_update_profiles"
    ON public.profiles
    FOR UPDATE
    USING (has_role(auth.uid(), 'superadmin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
  END IF;
END $$;