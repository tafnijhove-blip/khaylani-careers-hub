import { z } from "zod";

// Company validation
export const companySchema = z.object({
  naam: z.string().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  email: z.string().email("Ongeldig emailadres").optional().or(z.literal("")),
  telefoon: z
    .string()
    .regex(/^(\+31|0)?[0-9]{9,10}$/, "Ongeldig Nederlands telefoonnummer")
    .optional()
    .or(z.literal("")),
  regio: z.string().min(1, "Regio is verplicht").max(50, "Regio mag maximaal 50 karakters zijn"),
  adres: z.string().max(200, "Adres mag maximaal 200 karakters zijn").optional().or(z.literal("")),
  plaats: z.string().max(100, "Plaats mag maximaal 100 karakters zijn").optional().or(z.literal("")),
  contactpersoon: z.string().max(100, "Contactpersoon mag maximaal 100 karakters zijn").optional().or(z.literal("")),
  opmerkingen: z.string().max(1000, "Opmerkingen mogen maximaal 1000 karakters zijn").optional().or(z.literal("")),
  beloning: z.string().max(200, "Beloning mag maximaal 200 karakters zijn").optional().or(z.literal("")),
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

// Vacancy validation
export const vacancySchema = z.object({
  functietitel: z.string().min(2, "Functietitel moet minimaal 2 karakters zijn").max(100),
  aantal_posities: z.number().min(1, "Minimaal 1 positie").max(100, "Maximaal 100 posities"),
  bedrijf_id: z.string().uuid("Selecteer een geldig bedrijf"),
  prioriteit: z.enum(["laag", "normaal", "hoog", "urgent"]),
  status: z.enum(["open", "gesloten", "vervuld"]),
  vereisten: z.array(z.string()).optional(),
  beloning: z.string().max(200).optional().or(z.literal("")),
  opmerkingen: z.string().max(1000).optional().or(z.literal("")),
});

export type VacancyFormData = z.infer<typeof vacancySchema>;

// Candidate validation
export const candidateSchema = z.object({
  naam: z.string().min(2, "Naam moet minimaal 2 karakters zijn").max(100),
  email: z.string().email("Ongeldig emailadres").optional().or(z.literal("")),
  telefoon: z
    .string()
    .regex(/^(\+31|0)?[0-9]{9,10}$/, "Ongeldig Nederlands telefoonnummer")
    .optional()
    .or(z.literal("")),
  vacature_id: z.string().uuid("Selecteer een geldige vacature"),
  status: z.enum(["aangemeld", "in_gesprek", "geplaatst", "afgewezen"]),
  startdatum: z.string().optional(),
  einddatum: z.string().optional(),
  opmerkingen: z.string().max(1000).optional().or(z.literal("")),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;
