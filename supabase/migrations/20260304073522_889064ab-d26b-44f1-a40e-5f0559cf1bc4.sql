
-- Table for admin-generated QR codes (for students without phones)
CREATE TABLE public.generated_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  grade text NOT NULL,
  section text NOT NULL,
  qr_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.generated_qr_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can CRUD
CREATE POLICY "Admins can view generated QR codes"
ON public.generated_qr_codes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert generated QR codes"
ON public.generated_qr_codes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update generated QR codes"
ON public.generated_qr_codes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete generated QR codes"
ON public.generated_qr_codes FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
