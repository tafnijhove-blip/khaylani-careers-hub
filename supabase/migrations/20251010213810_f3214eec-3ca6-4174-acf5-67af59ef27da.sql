-- Add bedrijf type enum and column to distinguish between recruitment agencies and client companies
CREATE TYPE bedrijf_type AS ENUM ('detacheringbureau', 'klant');

-- Add type column to bedrijven table
ALTER TABLE public.bedrijven 
ADD COLUMN type bedrijf_type NOT NULL DEFAULT 'klant';

-- Update existing companies to be detacheringbureaus if they have users
UPDATE public.bedrijven
SET type = 'detacheringbureau'
WHERE id IN (
  SELECT DISTINCT company_id 
  FROM public.profiles 
  WHERE company_id IS NOT NULL
);

-- Create a relation table for which detacheringbureau manages which klant
CREATE TABLE public.bedrijf_relaties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detacheringbureau_id UUID NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  klant_id UUID NOT NULL REFERENCES public.bedrijven(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(detacheringbureau_id, klant_id),
  CHECK (detacheringbureau_id != klant_id)
);

-- Enable RLS
ALTER TABLE public.bedrijf_relaties ENABLE ROW LEVEL SECURITY;

-- RLS policies for bedrijf_relaties
CREATE POLICY "superadmin_view_all_relaties"
ON public.bedrijf_relaties FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_view_own_company_relaties"
ON public.bedrijf_relaties FOR SELECT
USING (
  detacheringbureau_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "superadmin_ceo_insert_relaties"
ON public.bedrijf_relaties FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin') OR
  (
    detacheringbureau_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND
    has_role(auth.uid(), 'ceo')
  )
);

CREATE POLICY "superadmin_ceo_delete_relaties"
ON public.bedrijf_relaties FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin') OR
  (
    detacheringbureau_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND
    has_role(auth.uid(), 'ceo')
  )
);