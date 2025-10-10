-- Update user role to superadmin
UPDATE public.user_roles 
SET role = 'superadmin' 
WHERE user_id = '96fcf043-bba3-4d59-9150-3ff3fd26d761';