export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          beschrijving: string
          created_at: string
          id: string
          related_bedrijf_id: string | null
          related_vacature_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          beschrijving: string
          created_at?: string
          id?: string
          related_bedrijf_id?: string | null
          related_vacature_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          beschrijving?: string
          created_at?: string
          id?: string
          related_bedrijf_id?: string | null
          related_vacature_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_related_bedrijf_id_fkey"
            columns: ["related_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_related_vacature_id_fkey"
            columns: ["related_vacature_id"]
            isOneToOne: false
            referencedRelation: "vacature_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_related_vacature_id_fkey"
            columns: ["related_vacature_id"]
            isOneToOne: false
            referencedRelation: "vacatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bedrijf_relaties: {
        Row: {
          created_at: string
          created_by: string | null
          detacheringbureau_id: string
          id: string
          klant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detacheringbureau_id: string
          id?: string
          klant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detacheringbureau_id?: string
          id?: string
          klant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrijf_relaties_detacheringbureau_id_fkey"
            columns: ["detacheringbureau_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_relaties_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
        ]
      }
      bedrijven: {
        Row: {
          adres: string | null
          beloning: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          naam: string
          opmerkingen: string | null
          plaats: string | null
          regio: string
          telefoon: string | null
          type: Database["public"]["Enums"]["bedrijf_type"]
          updated_at: string
        }
        Insert: {
          adres?: string | null
          beloning?: string | null
          contactpersoon?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          naam: string
          opmerkingen?: string | null
          plaats?: string | null
          regio: string
          telefoon?: string | null
          type?: Database["public"]["Enums"]["bedrijf_type"]
          updated_at?: string
        }
        Update: {
          adres?: string | null
          beloning?: string | null
          contactpersoon?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          naam?: string
          opmerkingen?: string | null
          plaats?: string | null
          regio?: string
          telefoon?: string | null
          type?: Database["public"]["Enums"]["bedrijf_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrijven_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kandidaten: {
        Row: {
          created_at: string
          created_by: string | null
          cv_url: string | null
          einddatum: string | null
          email: string | null
          id: string
          naam: string
          opmerkingen: string | null
          startdatum: string | null
          status: string
          telefoon: string | null
          updated_at: string
          vacature_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cv_url?: string | null
          einddatum?: string | null
          email?: string | null
          id?: string
          naam: string
          opmerkingen?: string | null
          startdatum?: string | null
          status?: string
          telefoon?: string | null
          updated_at?: string
          vacature_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cv_url?: string | null
          einddatum?: string | null
          email?: string | null
          id?: string
          naam?: string
          opmerkingen?: string | null
          startdatum?: string | null
          status?: string
          telefoon?: string | null
          updated_at?: string
          vacature_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kandidaten_vacature_id_fkey"
            columns: ["vacature_id"]
            isOneToOne: false
            referencedRelation: "vacature_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kandidaten_vacature_id_fkey"
            columns: ["vacature_id"]
            isOneToOne: false
            referencedRelation: "vacatures"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_delete_vacancies: boolean | null
          can_edit_vacancies: boolean | null
          can_manage_companies: boolean | null
          can_manage_users: boolean | null
          can_view_companies: boolean | null
          can_view_users: boolean | null
          can_view_vacancies: boolean | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_delete_vacancies?: boolean | null
          can_edit_vacancies?: boolean | null
          can_manage_companies?: boolean | null
          can_manage_users?: boolean | null
          can_view_companies?: boolean | null
          can_view_users?: boolean | null
          can_view_vacancies?: boolean | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_delete_vacancies?: boolean | null
          can_edit_vacancies?: boolean | null
          can_manage_companies?: boolean | null
          can_manage_users?: boolean | null
          can_view_companies?: boolean | null
          can_view_users?: boolean | null
          can_view_vacancies?: boolean | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          naam: string
          telefoon: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          naam: string
          telefoon?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          naam?: string
          telefoon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacatures: {
        Row: {
          aantal_posities: number
          bedrijf_id: string
          beloning: string | null
          created_at: string
          created_by: string | null
          datum_ingevuld: string | null
          datum_toegevoegd: string
          functietitel: string
          id: string
          opmerkingen: string | null
          prioriteit: Database["public"]["Enums"]["prioriteit_level"]
          status: Database["public"]["Enums"]["vacature_status"]
          updated_at: string
          vereisten: string[] | null
        }
        Insert: {
          aantal_posities?: number
          bedrijf_id: string
          beloning?: string | null
          created_at?: string
          created_by?: string | null
          datum_ingevuld?: string | null
          datum_toegevoegd?: string
          functietitel: string
          id?: string
          opmerkingen?: string | null
          prioriteit?: Database["public"]["Enums"]["prioriteit_level"]
          status?: Database["public"]["Enums"]["vacature_status"]
          updated_at?: string
          vereisten?: string[] | null
        }
        Update: {
          aantal_posities?: number
          bedrijf_id?: string
          beloning?: string | null
          created_at?: string
          created_by?: string | null
          datum_ingevuld?: string | null
          datum_toegevoegd?: string
          functietitel?: string
          id?: string
          opmerkingen?: string | null
          prioriteit?: Database["public"]["Enums"]["prioriteit_level"]
          status?: Database["public"]["Enums"]["vacature_status"]
          updated_at?: string
          vereisten?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "vacatures_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacatures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vacature_stats: {
        Row: {
          aantal_posities: number | null
          bedrijf_id: string | null
          functietitel: string | null
          id: string | null
          posities_open: number | null
          posities_vervuld: number | null
          prioriteit: Database["public"]["Enums"]["prioriteit_level"] | null
          status: Database["public"]["Enums"]["vacature_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vacatures_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "recruiter"
        | "accountmanager"
        | "management"
        | "marketing_hr"
        | "superadmin"
        | "ceo"
      bedrijf_type: "detacheringbureau" | "klant"
      prioriteit_level: "laag" | "normaal" | "hoog" | "urgent"
      vacature_status: "open" | "invulling" | "on_hold" | "gesloten"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "recruiter",
        "accountmanager",
        "management",
        "marketing_hr",
        "superadmin",
        "ceo",
      ],
      bedrijf_type: ["detacheringbureau", "klant"],
      prioriteit_level: ["laag", "normaal", "hoog", "urgent"],
      vacature_status: ["open", "invulling", "on_hold", "gesloten"],
    },
  },
} as const
