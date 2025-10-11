import { z } from "zod";

// Company validation (bedrijf)
export const companySchema = z.object({
  naam: z.string().trim().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  email: z.string().trim().email("Ongeldig emailadres").max(255, "Email mag maximaal 255 karakters zijn").optional().or(z.literal("")),
  telefoon: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]*$/, "Ongeldig telefoonnummer formaat")
    .max(20, "Telefoonnummer mag maximaal 20 karakters zijn")
    .optional()
    .or(z.literal("")),
  regio: z.string().min(1, "Regio is verplicht").max(100, "Regio mag maximaal 100 karakters zijn"),
  adres: z.string().trim().max(200, "Adres mag maximaal 200 karakters zijn").optional().or(z.literal("")),
  plaats: z.string().trim().max(100, "Plaats mag maximaal 100 karakters zijn").optional().or(z.literal("")),
  contactpersoon: z.string().trim().max(100, "Contactpersoon mag maximaal 100 karakters zijn").optional().or(z.literal("")),
  opmerkingen: z.string().trim().max(2000, "Opmerkingen mogen maximaal 2000 karakters zijn").optional().or(z.literal("")),
  beloning: z.string().trim().max(500, "Beloning mag maximaal 500 karakters zijn").optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// User validation
export const userSchema = z.object({
  naam: z.string().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  email: z.string().email("Ongeldig emailadres"),
  telefoon: z
    .string()
    .regex(/^(\+31|0)?[0-9]{9,10}$/, "Ongeldig Nederlands telefoonnummer")
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 karakters zijn"),
  role: z.enum(["superadmin", "ceo", "accountmanager", "recruiter"]),
  company_id: z.string().uuid().optional().or(z.literal("")),
});

export const userUpdateSchema = userSchema.omit({ password: true, email: true });

export type UserFormData = z.infer<typeof userSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

// Vacancy validation (updated to match database enums)
export const vacancySchema = z.object({
  functietitel: z.string().trim().min(2, "Functietitel moet minimaal 2 karakters zijn").max(200, "Functietitel mag maximaal 200 karakters zijn"),
  aantal_posities: z.number().int("Moet een geheel getal zijn").min(1, "Minimaal 1 positie").max(999, "Maximaal 999 posities"),
  bedrijf_id: z.string().uuid("Selecteer een geldig bedrijf"),
  prioriteit: z.enum(["laag", "normaal", "hoog", "urgent"]),
  status: z.enum(["open", "invulling", "on_hold", "gesloten"]),
  vereisten: z.array(z.string().trim().max(500)).max(50, "Maximaal 50 vereisten").optional(),
  beloning: z.string().trim().max(500, "Beloning mag maximaal 500 karakters zijn").optional().or(z.literal("")),
  opmerkingen: z.string().trim().max(2000, "Opmerkingen mogen maximaal 2000 karakters zijn").optional().or(z.literal("")),
});

export type VacancyFormData = z.infer<typeof vacancySchema>;

// Vacancy edit schema (without bedrijf_id since it doesn't change)
export const vacancyEditSchema = vacancySchema.omit({ bedrijf_id: true });

export type VacancyEditFormData = z.infer<typeof vacancyEditSchema>;

// Candidate validation (updated to match database enums)
export const candidateSchema = z.object({
  naam: z.string().trim().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  email: z.string().trim().email("Ongeldig emailadres").max(255, "Email mag maximaal 255 karakters zijn").optional().or(z.literal("")),
  telefoon: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]*$/, "Ongeldig telefoonnummer formaat")
    .max(20, "Telefoonnummer mag maximaal 20 karakters zijn")
    .optional()
    .or(z.literal("")),
  vacature_id: z.string().uuid("Selecteer een geldige vacature"),
  status: z.enum(["geplaatst", "gestart", "afgerond", "gestopt"]),
  startdatum: z.string().optional().or(z.literal("")),
  einddatum: z.string().optional().or(z.literal("")),
  opmerkingen: z.string().trim().max(2000, "Opmerkingen mogen maximaal 2000 karakters zijn").optional().or(z.literal("")),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;

// Contact form schema
export const contactFormSchema = z.object({
  naam: z.string().trim().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam te lang"),
  bedrijfsnaam: z.string().trim().min(2, "Bedrijfsnaam moet minimaal 2 karakters zijn").max(150, "Bedrijfsnaam te lang"),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255, "E-mailadres te lang"),
  aantalMedewerkers: z.string().trim().min(1, "Aantal medewerkers is verplicht").max(50, "Te veel karakters"),
  bericht: z.string().trim().min(10, "Bericht moet minimaal 10 karakters zijn").max(2000, "Bericht te lang"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
