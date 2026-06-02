-- Add excused status to attendance enum
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'excused';

-- Excuse reason categories enum
DO $$ BEGIN
  CREATE TYPE excuse_category AS ENUM ('sick','emergency','family','event','school_activity','transportation','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Excuse status enum
DO $$ BEGIN
  CREATE TYPE excuse_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.absence_excuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  section text NOT NULL,
  absence_date date NOT NULL,
  category excuse_category NOT NULL,
  reason text NOT NULL,
  proof_url text,
  status excuse_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_absence_excuses_student ON public.absence_excuses(student_id);
CREATE INDEX IF NOT EXISTS idx_absence_excuses_date ON public.absence_excuses(absence_date);
CREATE INDEX IF NOT EXISTS idx_absence_excuses_status ON public.absence_excuses(status);

ALTER TABLE public.absence_excuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view their own excuses"
ON public.absence_excuses FOR SELECT TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Students create their own excuses"
ON public.absence_excuses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update their own pending excuses"
ON public.absence_excuses FOR UPDATE TO authenticated
USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Students delete their own pending excuses"
ON public.absence_excuses FOR DELETE TO authenticated
USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins view all excuses"
ON public.absence_excuses FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins update excuses"
ON public.absence_excuses FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins delete excuses"
ON public.absence_excuses FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_absence_excuses_updated_at
BEFORE UPDATE ON public.absence_excuses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();