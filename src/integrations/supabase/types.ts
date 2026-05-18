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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      archived_visits: {
        Row: {
          archived_at: string
          id: string
          snapshot: Json
          visit_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          snapshot: Json
          visit_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          snapshot?: Json
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          device: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      diagnoses_suggestions: {
        Row: {
          created_at: string
          disease: string
          id: string
          medicine_id: string
        }
        Insert: {
          created_at?: string
          disease: string
          id?: string
          medicine_id: string
        }
        Update: {
          created_at?: string
          disease?: string
          id?: string
          medicine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_suggestions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_med_fk"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      excel_imports: {
        Row: {
          created_at: string
          entity_type: string
          errors: Json | null
          failed_rows: number
          file_name: string | null
          id: string
          imported_by: string | null
          success_rows: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          entity_type: string
          errors?: Json | null
          failed_rows?: number
          file_name?: string | null
          id?: string
          imported_by?: string | null
          success_rows?: number
          total_rows?: number
        }
        Update: {
          created_at?: string
          entity_type?: string
          errors?: Json | null
          failed_rows?: number
          file_name?: string | null
          id?: string
          imported_by?: string | null
          success_rows?: number
          total_rows?: number
        }
        Relationships: []
      }
      inventory_counts: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          counted_pills: number
          created_at: string
          id: string
          medicine_id: string
          notes: string | null
          performed_by: string | null
          previous_pills: number
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          counted_pills: number
          created_at?: string
          id?: string
          medicine_id: string
          notes?: string | null
          performed_by?: string | null
          previous_pills: number
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          counted_pills?: number
          created_at?: string
          id?: string
          medicine_id?: string
          notes?: string | null
          performed_by?: string | null
          previous_pills?: number
        }
        Relationships: [
          {
            foreignKeyName: "ic_med_fk"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          barcode: string | null
          commercial_name: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          minimum_pills: number
          name: string
          pills_per_strip: number
          status: Database["public"]["Enums"]["medicine_status"]
          strips_per_box: number
          total_pills: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          commercial_name?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          minimum_pills?: number
          name: string
          pills_per_strip?: number
          status?: Database["public"]["Enums"]["medicine_status"]
          strips_per_box?: number
          total_pills?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          commercial_name?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          minimum_pills?: number
          name?: string
          pills_per_strip?: number
          status?: Database["public"]["Enums"]["medicine_status"]
          strips_per_box?: number
          total_pills?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          created_by: string | null
          full_name: string
          id: string
          military_number: string
          notes: string | null
          other_diseases: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          full_name: string
          id?: string
          military_number: string
          notes?: string | null
          other_diseases?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          full_name?: string
          id?: string
          military_number?: string
          notes?: string | null
          other_diseases?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dispensed_pills: number
          id: string
          medicine_id: string
          notes: string | null
          prescription_id: string
          quantity: number
          unit: Database["public"]["Enums"]["medicine_unit"]
        }
        Insert: {
          created_at?: string
          dispensed_pills?: number
          id?: string
          medicine_id: string
          notes?: string | null
          prescription_id: string
          quantity: number
          unit?: Database["public"]["Enums"]["medicine_unit"]
        }
        Update: {
          created_at?: string
          dispensed_pills?: number
          id?: string
          medicine_id?: string
          notes?: string | null
          prescription_id?: string
          quantity?: number
          unit?: Database["public"]["Enums"]["medicine_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rxi_med_fk"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rxi_rx_fk"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rx_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      shortages: {
        Row: {
          created_at: string
          id: string
          last_requested_at: string
          medicine_id: string
          missing_pills: number
          request_count: number
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          last_requested_at?: string
          medicine_id: string
          missing_pills?: number
          request_count?: number
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          last_requested_at?: string
          medicine_id?: string
          missing_pills?: number
          request_count?: number
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sh_med_fk"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortages_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          performed_by: string | null
          pills_delta: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          performed_by?: string | null
          pills_delta: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          performed_by?: string | null
          pills_delta?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sm_med_fk"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          patient_id: string | null
          size_bytes: number | null
          uploaded_by: string | null
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          patient_id?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          patient_id?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uf_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uf_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
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
      visits: {
        Row: {
          archived: boolean
          closed_at: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          priority: Database["public"]["Enums"]["visit_priority"]
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          archived?: boolean
          closed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: Database["public"]["Enums"]["visit_priority"]
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          archived?: boolean
          closed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: Database["public"]["Enums"]["visit_priority"]
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_has_any_role: { Args: never; Returns: boolean }
      get_current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "doctor" | "pharmacist"
      medicine_status: "available" | "low_stock" | "out_of_stock" | "expired"
      medicine_unit: "box" | "strip" | "pill"
      stock_movement_type: "in" | "out" | "adjustment" | "count"
      visit_priority: "high" | "medium" | "low"
      visit_status:
        | "pending"
        | "in_progress"
        | "partially_dispensed"
        | "dispensed"
        | "not_available"
        | "closed"
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
      app_role: ["admin", "doctor", "pharmacist"],
      medicine_status: ["available", "low_stock", "out_of_stock", "expired"],
      medicine_unit: ["box", "strip", "pill"],
      stock_movement_type: ["in", "out", "adjustment", "count"],
      visit_priority: ["high", "medium", "low"],
      visit_status: [
        "pending",
        "in_progress",
        "partially_dispensed",
        "dispensed",
        "not_available",
        "closed",
      ],
    },
  },
} as const
