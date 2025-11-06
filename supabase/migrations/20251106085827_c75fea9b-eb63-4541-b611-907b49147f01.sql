-- Función para obtener todos los usuarios con sus roles
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  role app_role,
  created_at timestamptz,
  must_change_password boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id as user_id,
    u.email,
    ur.role,
    u.created_at,
    COALESCE(ur.must_change_password, false) as must_change_password
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC
$$;

-- Policy para permitir al super admin actualizar roles
CREATE POLICY "Super admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));