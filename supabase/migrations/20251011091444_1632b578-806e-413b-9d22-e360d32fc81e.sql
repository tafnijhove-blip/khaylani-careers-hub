-- Add CASCADE deletion for profiles
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add CASCADE deletion for user_roles
ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add CASCADE deletion for kandidaten -> vacatures
ALTER TABLE kandidaten
  DROP CONSTRAINT IF EXISTS kandidaten_vacature_id_fkey;

ALTER TABLE kandidaten
  ADD CONSTRAINT kandidaten_vacature_id_fkey
  FOREIGN KEY (vacature_id) REFERENCES vacatures(id)
  ON DELETE CASCADE;

-- Add CASCADE deletion for vacatures -> bedrijven
ALTER TABLE vacatures
  DROP CONSTRAINT IF EXISTS vacatures_bedrijf_id_fkey;

ALTER TABLE vacatures
  ADD CONSTRAINT vacatures_bedrijf_id_fkey
  FOREIGN KEY (bedrijf_id) REFERENCES bedrijven(id)
  ON DELETE CASCADE;

-- Add CASCADE deletion for bedrijf_relaties -> bedrijven
ALTER TABLE bedrijf_relaties
  DROP CONSTRAINT IF EXISTS bedrijf_relaties_detacheringbureau_id_fkey;

ALTER TABLE bedrijf_relaties
  ADD CONSTRAINT bedrijf_relaties_detacheringbureau_id_fkey
  FOREIGN KEY (detacheringbureau_id) REFERENCES bedrijven(id)
  ON DELETE CASCADE;

ALTER TABLE bedrijf_relaties
  DROP CONSTRAINT IF EXISTS bedrijf_relaties_klant_id_fkey;

ALTER TABLE bedrijf_relaties
  ADD CONSTRAINT bedrijf_relaties_klant_id_fkey
  FOREIGN KEY (klant_id) REFERENCES bedrijven(id)
  ON DELETE CASCADE;