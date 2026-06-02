
-- Create storage bucket for excuse proof uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('excuse-proofs', 'excuse-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Excuse proofs publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'excuse-proofs');

CREATE POLICY "Students upload own excuse proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'excuse-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students delete own excuse proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'excuse-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins delete any excuse proof"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'excuse-proofs'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);
