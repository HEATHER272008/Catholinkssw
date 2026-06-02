CREATE TABLE public.music_pin_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL REFERENCES public.music_pins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (pin_id, user_id)
);

ALTER TABLE public.music_pin_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view likes"
  ON public.music_pin_likes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can like"
  ON public.music_pin_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own"
  ON public.music_pin_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_music_pin_likes_pin ON public.music_pin_likes(pin_id);