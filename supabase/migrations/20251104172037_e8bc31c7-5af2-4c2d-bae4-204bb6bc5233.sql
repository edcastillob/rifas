-- Add column to track if user needs to change password
ALTER TABLE public.user_roles
ADD COLUMN must_change_password boolean NOT NULL DEFAULT true;

-- The super admin doesn't need to change password
UPDATE public.user_roles
SET must_change_password = false
WHERE role = 'super_admin';