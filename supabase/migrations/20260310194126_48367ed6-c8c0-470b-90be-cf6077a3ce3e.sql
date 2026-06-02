
-- Classroom Tasks table
CREATE TABLE public.classroom_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  section text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tasks" ON public.classroom_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view tasks for their section" ON public.classroom_tasks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND section = classroom_tasks.section)
);

-- Student task completions
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.classroom_tasks(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own completions" ON public.task_completions FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all completions" ON public.task_completions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Reminders table
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reminder_date timestamp with time zone NOT NULL,
  section text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminders" ON public.reminders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view reminders for their section" ON public.reminders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND section = reminders.section)
);

-- Participation tracker
CREATE TABLE public.participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  section text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  recorded_by uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage participation" ON public.participation FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own participation" ON public.participation FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Group activities
CREATE TABLE public.group_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  section text NOT NULL,
  groups_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.group_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group activities" ON public.group_activities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lesson materials
CREATE TABLE public.lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  section text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lesson materials" ON public.lesson_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view lesson materials for their section" ON public.lesson_materials FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND section = lesson_materials.section)
);

-- Substitute teacher plans
CREATE TABLE public.substitute_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instructions text NOT NULL,
  activities text,
  section text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.substitute_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage substitute plans" ON public.substitute_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view active substitute plans for their section" ON public.substitute_plans FOR SELECT TO authenticated USING (
  is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND section = substitute_plans.section)
);
