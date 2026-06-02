CREATE TABLE public.music_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  song_title text NOT NULL,
  artist text,
  quote text,
  song_url text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.music_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all music pins"
  ON public.music_pins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own music pins"
  ON public.music_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music pins"
  ON public.music_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music pins"
  ON public.music_pins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any music pin"
  ON public.music_pins FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_music_pins_updated_at
  BEFORE UPDATE ON public.music_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_music_pins_user_id ON public.music_pins(user_id);
CREATE INDEX idx_music_pins_created_at ON public.music_pins(created_at DESC);