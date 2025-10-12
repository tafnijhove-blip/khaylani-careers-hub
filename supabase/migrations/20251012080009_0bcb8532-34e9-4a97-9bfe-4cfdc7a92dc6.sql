-- Add explicit RLS policies to user_roles table to prevent privilege escalation

-- Drop the overly permissive "Users can view all roles" policy
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;

-- Only allow users to view their own roles (not all roles)
CREATE POLICY "users_view_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

-- Explicitly deny UPDATE operations for non-superadmins
CREATE POLICY "only_superadmin_update_roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Explicitly deny DELETE operations for non-superadmins
CREATE POLICY "only_superadmin_delete_roles"
ON user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Explicitly deny INSERT operations for non-superadmins
CREATE POLICY "only_superadmin_insert_roles"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Create secure RPC function for role management (replaces client-side updates)
CREATE OR REPLACE FUNCTION public.manage_user_role(
  target_user_id uuid,
  new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only superadmins can manage user roles';
  END IF;

  -- Prevent self-demotion (superadmin removing their own superadmin role)
  IF target_user_id = auth.uid() AND new_role != 'superadmin'::app_role THEN
    IF has_role(auth.uid(), 'superadmin'::app_role) THEN
      RAISE EXCEPTION 'Superadmins cannot demote themselves';
    END IF;
  END IF;

  -- Delete existing roles for the user
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Insert the new role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role);
END;
$$;