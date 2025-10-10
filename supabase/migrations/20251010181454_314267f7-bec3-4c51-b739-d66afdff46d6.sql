-- Create kandidaten table for tracking placed candidates
CREATE TABLE public.kandidaten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vacature_id UUID NOT NULL REFERENCES public.vacatures(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  email TEXT,
  telefoon TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'geplaatst' CHECK (status IN ('geplaatst', 'gestart', 'afgerond', 'gestopt')),
  startdatum DATE,
  einddatum DATE,
  opmerkingen TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kandidaten ENABLE ROW LEVEL SECURITY;

-- RLS policies for kandidaten
CREATE POLICY "Authenticated users can view kandidaten"
  ON public.kandidaten FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert kandidaten"
  ON public.kandidaten FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update kandidaten"
  ON public.kandidaten FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete kandidaten"
  ON public.kandidaten FOR DELETE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_kandidaten_vacature_id ON public.kandidaten(vacature_id);
CREATE INDEX idx_kandidaten_status ON public.kandidaten(status);

-- Add trigger for updated_at
CREATE TRIGGER update_kandidaten_updated_at
  BEFORE UPDATE ON public.kandidaten
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for vacature statistics
CREATE OR REPLACE VIEW public.vacature_stats AS
SELECT 
  v.id,
  v.bedrijf_id,
  v.functietitel,
  v.aantal_posities,
  v.status,
  v.prioriteit,
  COUNT(k.id) FILTER (WHERE k.status IN ('geplaatst', 'gestart')) as posities_vervuld,
  v.aantal_posities - COUNT(k.id) FILTER (WHERE k.status IN ('geplaatst', 'gestart')) as posities_open
FROM public.vacatures v
LEFT JOIN public.kandidaten k ON v.id = k.vacature_id
GROUP BY v.id;

-- Grant permissions on the view
GRANT SELECT ON public.vacature_stats TO authenticated;