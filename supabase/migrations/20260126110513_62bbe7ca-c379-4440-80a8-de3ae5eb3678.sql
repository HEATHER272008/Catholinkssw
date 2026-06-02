-- Create table for pending admin requests
CREATE TABLE public.admin_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  birthday date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  rejection_reason text,
  -- Store the password hash temporarily (will be used when creating the account)
  temp_password_hash text NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all requests
CREATE POLICY "Admins can view all admin requests"
ON public.admin_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update admin requests"
ON public.admin_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous inserts for signup requests
CREATE POLICY "Anyone can submit admin requests"
ON public.admin_requests
FOR INSERT
WITH CHECK (true);

-- Admins can delete requests
CREATE POLICY "Admins can delete admin requests"
ON public.admin_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));