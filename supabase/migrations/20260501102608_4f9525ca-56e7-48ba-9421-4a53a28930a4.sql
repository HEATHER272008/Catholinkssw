-- Enable scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- School calendar (no-class days, holidays, suspensions)
CREATE TYPE public.calendar_entry_type AS ENUM ('holiday', 'suspended', 'no_classes');

CREATE TABLE public.school_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  entry_type public.calendar_entry_type NOT NULL DEFAULT 'no_classes',
  reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school calendar"
  ON public.school_calendar
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated can view school calendar"
  ON public.school_calendar
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_school_calendar_updated_at
  BEFORE UPDATE ON public.school_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: returns false for weekends OR calendar entries
CREATE OR REPLACE FUNCTION public.is_school_day(check_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dow INT;
  has_entry BOOLEAN;
BEGIN
  dow := EXTRACT(DOW FROM check_date);
  IF dow = 0 OR dow = 6 THEN
    RETURN FALSE;
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.school_calendar WHERE date = check_date) INTO has_entry;
  RETURN NOT has_entry;
END;
$$;