UPDATE public.user_roles SET role = 'super_admin' WHERE user_id = '9d863ddc-64eb-4abe-8476-c0a182874953';

-- Allow super_admin to read user_roles
CREATE POLICY "Super admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to read all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to read all attendance
CREATE POLICY "Super admins can view all attendance" ON public.attendance FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));