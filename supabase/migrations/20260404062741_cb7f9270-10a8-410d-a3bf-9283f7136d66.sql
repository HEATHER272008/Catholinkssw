DROP POLICY IF EXISTS "Anyone can submit admin requests" ON public.admin_requests;

CREATE POLICY "Anyone can submit admin requests"
ON public.admin_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);