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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      distributeurs: {
        Row: {
          actif: boolean
          created_at: string
          email_contact: string | null
          id: string
          marge_moyen_conso_eur: number
          marge_petit_conso_eur: number
          nom: string
          telephone_contact: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email_contact?: string | null
          id?: string
          marge_moyen_conso_eur?: number
          marge_petit_conso_eur?: number
          nom: string
          telephone_contact?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          email_contact?: string | null
          id?: string
          marge_moyen_conso_eur?: number
          marge_petit_conso_eur?: number
          nom?: string
          telephone_contact?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          mois_concerne: string | null
          nom_fichier: string
          prospect_id: string
          storage_path: string | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          mois_concerne?: string | null
          nom_fichier: string
          prospect_id: string
          storage_path?: string | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          mois_concerne?: string | null
          nom_fichier?: string
          prospect_id?: string
          storage_path?: string | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          activity: string | null
          annual_budget_eur: number | null
          city: string | null
          company_name: string | null
          created_at: string
          current_tariff: string | null
          email: string
          estimated_roi_years: number | null
          estimated_savings_eur: number | null
          first_name: string
          has_ac: boolean | null
          has_ev: boolean | null
          has_heat_pump: boolean | null
          has_pool: boolean | null
          housing_type: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string
          postal_code: string | null
          recommended_config: string | null
          region: string | null
          source: string | null
          status: string
          surface_m2: number | null
          type: string
          updated_at: string
        }
        Insert: {
          activity?: string | null
          annual_budget_eur?: number | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_tariff?: string | null
          email: string
          estimated_roi_years?: number | null
          estimated_savings_eur?: number | null
          first_name: string
          has_ac?: boolean | null
          has_ev?: boolean | null
          has_heat_pump?: boolean | null
          has_pool?: boolean | null
          housing_type?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          recommended_config?: string | null
          region?: string | null
          source?: string | null
          status?: string
          surface_m2?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          activity?: string | null
          annual_budget_eur?: number | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_tariff?: string | null
          email?: string
          estimated_roi_years?: number | null
          estimated_savings_eur?: number | null
          first_name?: string
          has_ac?: boolean | null
          has_ev?: boolean | null
          has_heat_pump?: boolean | null
          has_pool?: boolean | null
          housing_type?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          recommended_config?: string | null
          region?: string | null
          source?: string | null
          status?: string
          surface_m2?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      parametres_globaux: {
        Row: {
          cle: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          valeur: string
        }
        Insert: {
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur: string
        }
        Update: {
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          adresse_pdl: string | null
          config_choisie: Database["public"]["Enums"]["prospect_config"] | null
          created_at: string
          distributeur_id: string | null
          email: string | null
          facture_actuelle_data: Json | null
          id: string
          marge_distributeur_eur: number | null
          marge_dynawatt_eur: number
          nom_entreprise: string
          notes_commerciales: string | null
          pdl: string | null
          prix_client_custom_ht: number | null
          prix_client_custom_ttc: number | null
          resultats_simulation: Json | null
          statut: Database["public"]["Enums"]["prospect_statut"]
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse_pdl?: string | null
          config_choisie?: Database["public"]["Enums"]["prospect_config"] | null
          created_at?: string
          distributeur_id?: string | null
          email?: string | null
          facture_actuelle_data?: Json | null
          id?: string
          marge_distributeur_eur?: number | null
          marge_dynawatt_eur?: number
          nom_entreprise: string
          notes_commerciales?: string | null
          pdl?: string | null
          prix_client_custom_ht?: number | null
          prix_client_custom_ttc?: number | null
          resultats_simulation?: Json | null
          statut?: Database["public"]["Enums"]["prospect_statut"]
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse_pdl?: string | null
          config_choisie?: Database["public"]["Enums"]["prospect_config"] | null
          created_at?: string
          distributeur_id?: string | null
          email?: string | null
          facture_actuelle_data?: Json | null
          id?: string
          marge_distributeur_eur?: number | null
          marge_dynawatt_eur?: number
          nom_entreprise?: string
          notes_commerciales?: string | null
          pdl?: string | null
          prix_client_custom_ht?: number | null
          prix_client_custom_ttc?: number | null
          resultats_simulation?: Json | null
          statut?: Database["public"]["Enums"]["prospect_statut"]
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_distributeur_id_fkey"
            columns: ["distributeur_id"]
            isOneToOne: false
            referencedRelation: "distributeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          client_adresse: string
          client_email: string
          client_nom: string
          client_pdl: string
          client_telephone: string
          config_choisie: string | null
          created_at: string
          current_step: number
          facture_actuelle: Json | null
          id: string
          resultats_simulation: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          client_adresse: string
          client_email: string
          client_nom: string
          client_pdl: string
          client_telephone: string
          config_choisie?: string | null
          created_at?: string
          current_step?: number
          facture_actuelle?: Json | null
          id?: string
          resultats_simulation?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          client_adresse?: string
          client_email?: string
          client_nom?: string
          client_pdl?: string
          client_telephone?: string
          config_choisie?: string | null
          created_at?: string
          current_step?: number
          facture_actuelle?: Json | null
          id?: string
          resultats_simulation?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulator_documents: {
        Row: {
          created_at: string
          data: Json
          id: string
          mois: string | null
          simulation_id: string
          type: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          mois?: string | null
          simulation_id: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          mois?: string | null
          simulation_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_documents_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      switchgrid_sessions: {
        Row: {
          address: string | null
          ask_id: string | null
          consent_id: string | null
          created_at: string
          error_message: string | null
          id: string
          loadcurve_request_id: string | null
          order_id: string | null
          prm: string | null
          signer_first_name: string | null
          signer_genre: string | null
          signer_last_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          ask_id?: string | null
          consent_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          loadcurve_request_id?: string | null
          order_id?: string | null
          prm?: string | null
          signer_first_name?: string | null
          signer_genre?: string | null
          signer_last_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          ask_id?: string | null
          consent_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          loadcurve_request_id?: string | null
          order_id?: string | null
          prm?: string | null
          signer_first_name?: string | null
          signer_genre?: string | null
          signer_last_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_type: "facture_pdf" | "json_sobry"
      prospect_config: "PETIT" | "MOYEN"
      prospect_statut:
        | "brouillon"
        | "en_cours"
        | "devis_envoye"
        | "vendu"
        | "perdu"
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
      document_type: ["facture_pdf", "json_sobry"],
      prospect_config: ["PETIT", "MOYEN"],
      prospect_statut: [
        "brouillon",
        "en_cours",
        "devis_envoye",
        "vendu",
        "perdu",
      ],
    },
  },
} as const
