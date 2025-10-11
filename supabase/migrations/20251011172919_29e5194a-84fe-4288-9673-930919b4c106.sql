-- Add explicit denial of public/unauthenticated access to profiles table
-- This ensures that only authenticated users can even attempt to access the table
CREATE POLICY "deny_unauthenticated_access_profiles" 
ON profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add explicit denial of public/unauthenticated access to kandidaten table
-- This protects candidate personal information from unauthorized access
CREATE POLICY "deny_unauthenticated_access_kandidaten" 
ON kandidaten
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add explicit denial of public/unauthenticated access to activity_log table
-- This ensures audit logs are only accessible to authenticated users
CREATE POLICY "deny_unauthenticated_access_activity_log" 
ON activity_log
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add explicit denial of public/unauthenticated access to bedrijven table
-- This protects company information from public access
CREATE POLICY "deny_unauthenticated_access_bedrijven" 
ON bedrijven
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add explicit denial of public/unauthenticated access to bedrijf_relaties table
-- This protects business relationships from public visibility
CREATE POLICY "deny_unauthenticated_access_bedrijf_relaties" 
ON bedrijf_relaties
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add explicit denial of public/unauthenticated access to vacatures table
-- This prevents public scraping of job postings and business intelligence
CREATE POLICY "deny_unauthenticated_access_vacatures" 
ON vacatures
FOR ALL
USING (auth.uid() IS NOT NULL);