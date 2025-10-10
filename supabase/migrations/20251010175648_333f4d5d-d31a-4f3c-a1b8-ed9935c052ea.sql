-- Add adres column to bedrijven table
ALTER TABLE public.bedrijven
ADD COLUMN IF NOT EXISTS adres TEXT;