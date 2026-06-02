DROP POLICY IF EXISTS "Anyone can submit admin requests" ON public.admin_requests;

CREATE POLICY "Anyone can submit admin requests"
ON public.admin_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(coalesce(email, ''))) > 0
  AND length(trim(coalesce(name, ''))) > 0
  AND length(trim(coalesce(temp_password_hash, ''))) > 0
);