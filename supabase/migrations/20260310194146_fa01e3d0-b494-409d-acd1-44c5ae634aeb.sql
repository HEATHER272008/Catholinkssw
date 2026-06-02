
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-materials', 'lesson-materials', true);

CREATE POLICY "Admins can upload lesson materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lesson materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lesson-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view lesson materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lesson-materials');
