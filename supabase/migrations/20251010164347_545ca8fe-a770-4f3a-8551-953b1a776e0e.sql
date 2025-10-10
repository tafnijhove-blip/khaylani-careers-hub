-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('recruiter', 'accountmanager', 'management', 'marketing_hr');

-- Create enum for vacature status
CREATE TYPE public.vacature_status AS ENUM ('open', 'invulling', 'on_hold', 'gesloten');

-- Create enum for prioriteit
CREATE TYPE public.prioriteit_level AS ENUM ('laag', 'normaal', 'hoog', 'urgent');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create bedrijven table
CREATE TABLE public.bedrijven (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  logo_url TEXT,
  regio TEXT NOT NULL,
  plaats TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  contactpersoon TEXT,
  telefoon TEXT,
  email TEXT,
  beloning TEXT,
  opmerkingen TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vacatures table
CREATE TABLE public.vacatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedrijf_id UUID REFERENCES public.bedrijven(id) ON DELETE CASCADE NOT NULL,
  functietitel TEXT NOT NULL,
  vereisten TEXT[] DEFAULT '{}',
  aantal_posities INTEGER NOT NULL DEFAULT 1,
  status vacature_status NOT NULL DEFAULT 'open',
  prioriteit prioriteit_level NOT NULL DEFAULT 'normaal',
  beloning TEXT,
  opmerkingen TEXT,
  datum_toegevoegd TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  datum_ingevuld TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  beschrijving TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_bedrijf_id UUID REFERENCES public.bedrijven(id) ON DELETE SET NULL,
  related_vacature_id UUID REFERENCES public.vacatures(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedrijven ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, naam, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'naam', NEW.email),
    NEW.email
  );
  
  -- Assign default role as recruiter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'recruiter');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only management can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'management'));

-- RLS Policies for bedrijven
CREATE POLICY "Authenticated users can view bedrijven"
  ON public.bedrijven FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Accountmanagers and management can insert bedrijven"
  ON public.bedrijven FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accountmanager') OR 
    public.has_role(auth.uid(), 'management')
  );

CREATE POLICY "Accountmanagers and management can update bedrijven"
  ON public.bedrijven FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'accountmanager') OR 
    public.has_role(auth.uid(), 'management')
  );

CREATE POLICY "Only management can delete bedrijven"
  ON public.bedrijven FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'management'));

-- RLS Policies for vacatures
CREATE POLICY "Authenticated users can view vacatures"
  ON public.vacatures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Accountmanagers and management can insert vacatures"
  ON public.vacatures FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accountmanager') OR 
    public.has_role(auth.uid(), 'management')
  );

CREATE POLICY "Recruiters can update vacature status"
  ON public.vacatures FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only management can delete vacatures"
  ON public.vacatures FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'management'));

-- RLS Policies for activity_log
CREATE POLICY "Authenticated users can view activity log"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity log"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bedrijven_updated_at
  BEFORE UPDATE ON public.bedrijven
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacatures_updated_at
  BEFORE UPDATE ON public.vacatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bedrijven_regio ON public.bedrijven(regio);
CREATE INDEX idx_vacatures_bedrijf_id ON public.vacatures(bedrijf_id);
CREATE INDEX idx_vacatures_status ON public.vacatures(status);
CREATE INDEX idx_vacatures_prioriteit ON public.vacatures(prioriteit);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);