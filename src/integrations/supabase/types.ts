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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      absence_excuses: {
        Row: {
          absence_date: string
          category: Database["public"]["Enums"]["excuse_category"]
          created_at: string
          id: string
          proof_url: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          section: string
          status: Database["public"]["Enums"]["excuse_status"]
          student_id: string
          student_name: string
          updated_at: string
        }
        Insert: {
          absence_date: string
          category: Database["public"]["Enums"]["excuse_category"]
          created_at?: string
          id?: string
          proof_url?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          section: string
          status?: Database["public"]["Enums"]["excuse_status"]
          student_id: string
          student_name: string
          updated_at?: string
        }
        Update: {
          absence_date?: string
          category?: Database["public"]["Enums"]["excuse_category"]
          created_at?: string
          id?: string
          proof_url?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          section?: string
          status?: Database["public"]["Enums"]["excuse_status"]
          student_id?: string
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_requests: {
        Row: {
          birthday: string | null
          email: string
          id: string
          name: string
          phone: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          temp_password_hash: string
        }
        Insert: {
          birthday?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          temp_password_hash: string
        }
        Update: {
          birthday?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          temp_password_hash?: string
        }
        Relationships: []
      }
      app_ratings: {
        Row: {
          additional_comments: string | null
          attendance_tracking: number | null
          created_at: string
          ease_of_use: number | null
          id: string
          interface_design: number | null
          overall_satisfaction: number | null
          qr_code_functionality: number | null
          reliability: number | null
          response_speed: number | null
          suggestions: string | null
          user_id: string
          user_name: string
          user_section: string | null
          would_recommend: number | null
        }
        Insert: {
          additional_comments?: string | null
          attendance_tracking?: number | null
          created_at?: string
          ease_of_use?: number | null
          id?: string
          interface_design?: number | null
          overall_satisfaction?: number | null
          qr_code_functionality?: number | null
          reliability?: number | null
          response_speed?: number | null
          suggestions?: string | null
          user_id: string
          user_name: string
          user_section?: string | null
          would_recommend?: number | null
        }
        Update: {
          additional_comments?: string | null
          attendance_tracking?: number | null
          created_at?: string
          ease_of_use?: number | null
          id?: string
          interface_design?: number | null
          overall_satisfaction?: number | null
          qr_code_functionality?: number | null
          reliability?: number | null
          response_speed?: number | null
          suggestions?: string | null
          user_id?: string
          user_name?: string
          user_section?: string | null
          would_recommend?: number | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          parent_notified: boolean | null
          scanned_at: string | null
          scanned_by: string
          section: string
          status: Database["public"]["Enums"]["attendance_status"] | null
          student_id: string
          student_name: string
        }
        Insert: {
          id?: string
          parent_notified?: boolean | null
          scanned_at?: string | null
          scanned_by: string
          section: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id: string
          student_name: string
        }
        Update: {
          id?: string
          parent_notified?: boolean | null
          scanned_at?: string | null
          scanned_by?: string
          section?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id?: string
          student_name?: string
        }
        Relationships: []
      }
      classroom_tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          section: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          section?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_qr_codes: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          grade: string
          id: string
          is_active: boolean
          qr_token: string
          section: string
          student_name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          grade: string
          id?: string
          is_active?: boolean
          qr_token: string
          section: string
          student_name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          grade?: string
          id?: string
          is_active?: boolean
          qr_token?: string
          section?: string
          student_name?: string
        }
        Relationships: []
      }
      group_activities: {
        Row: {
          created_at: string
          created_by: string
          groups_data: Json
          id: string
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          groups_data?: Json
          id?: string
          section: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          groups_data?: Json
          id?: string
          section?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_materials: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          section: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          section: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          section?: string
          title?: string
        }
        Relationships: []
      }
      music_pin_likes: {
        Row: {
          created_at: string
          id: string
          pin_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_pin_likes_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "music_pins"
            referencedColumns: ["id"]
          },
        ]
      }
      music_pins: {
        Row: {
          artist: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          quote: string | null
          song_title: string
          song_url: string | null
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          quote?: string | null
          song_title: string
          song_url?: string | null
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          quote?: string | null
          song_title?: string
          song_url?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          id: string
          notification_type: string | null
          sent_at: string
          sent_by: string
          sent_to: string[] | null
          title: string
        }
        Insert: {
          body: string
          id?: string
          notification_type?: string | null
          sent_at?: string
          sent_by: string
          sent_to?: string[] | null
          title: string
        }
        Update: {
          body?: string
          id?: string
          notification_type?: string | null
          sent_at?: string
          sent_by?: string
          sent_to?: string[] | null
          title?: string
        }
        Relationships: []
      }
      participation: {
        Row: {
          id: string
          points: number
          recorded_at: string
          recorded_by: string
          section: string
          student_id: string
          student_name: string
        }
        Insert: {
          id?: string
          points?: number
          recorded_at?: string
          recorded_by: string
          section: string
          student_id: string
          student_name: string
        }
        Update: {
          id?: string
          points?: number
          recorded_at?: string
          recorded_by?: string
          section?: string
          student_id?: string
          student_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adviser_name: string | null
          birthday: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          parent_guardian_name: string | null
          parent_number: string | null
          phone: string | null
          profile_picture_url: string | null
          section: string | null
          terms_accepted: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adviser_name?: string | null
          birthday?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          parent_guardian_name?: string | null
          parent_number?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          section?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adviser_name?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          parent_guardian_name?: string | null
          parent_number?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          section?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          reminder_date: string
          section: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          reminder_date: string
          section: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          reminder_date?: string
          section?: string
          title?: string
        }
        Relationships: []
      }
      research_questionnaire: {
        Row: {
          acc_accommodates_needs: number | null
          acc_device_access: number | null
          acc_easy_info_access: number | null
          acc_loads_quickly: number | null
          acc_no_interruptions: number | null
          career_path: string
          career_path_other: string | null
          created_at: string
          dev_dependable_tools: number | null
          dev_design_suitable: number | null
          dev_fulfills_purpose: number | null
          dev_meets_needs: number | null
          dev_properly_tested: number | null
          eff_conn_minimal_interruptions: number | null
          eff_conn_notifications_timely: number | null
          eff_conn_realtime_functions: number | null
          eff_conn_stable_performance: number | null
          eff_conn_syncs_devices: number | null
          eff_scale_adapts_upgrades: number | null
          eff_scale_features_remain: number | null
          eff_scale_handles_data: number | null
          eff_scale_performs_any_usage: number | null
          eff_scale_supports_users: number | null
          eff_security_auth_prevents_unauthorized: number | null
          eff_security_confidentiality: number | null
          eff_security_feels_safe: number | null
          eff_security_protects_data: number | null
          eff_security_tamper_proof: number | null
          feedback: string | null
          grade_level: string
          id: string
          imp_conn_enhanced_communication: number | null
          imp_conn_enhanced_reliability: number | null
          imp_conn_improved_stability: number | null
          imp_conn_improved_sync: number | null
          imp_conn_weak_signal_support: number | null
          imp_scale_enhanced_data_mgmt: number | null
          imp_scale_expanded_features: number | null
          imp_scale_improved_performance: number | null
          imp_scale_increased_capacity: number | null
          imp_scale_strengthened_stability: number | null
          imp_security_better_protection: number | null
          imp_security_less_breach_concern: number | null
          imp_security_more_trust: number | null
          imp_security_stronger_auth: number | null
          imp_security_stronger_measures: number | null
          sat_addresses_needs: number | null
          sat_meets_expectations: number | null
          sat_positive_impression: number | null
          sat_reliable_performance: number | null
          sat_satisfying_experience: number | null
          sex: string
          track: string | null
          updated_at: string
          usb_clear_instructions: number | null
          usb_efficient_tasks: number | null
          usb_intuitive_interface: number | null
          usb_user_friendly: number | null
          usb_well_organized: number | null
          user_id: string
          user_name: string
        }
        Insert: {
          acc_accommodates_needs?: number | null
          acc_device_access?: number | null
          acc_easy_info_access?: number | null
          acc_loads_quickly?: number | null
          acc_no_interruptions?: number | null
          career_path: string
          career_path_other?: string | null
          created_at?: string
          dev_dependable_tools?: number | null
          dev_design_suitable?: number | null
          dev_fulfills_purpose?: number | null
          dev_meets_needs?: number | null
          dev_properly_tested?: number | null
          eff_conn_minimal_interruptions?: number | null
          eff_conn_notifications_timely?: number | null
          eff_conn_realtime_functions?: number | null
          eff_conn_stable_performance?: number | null
          eff_conn_syncs_devices?: number | null
          eff_scale_adapts_upgrades?: number | null
          eff_scale_features_remain?: number | null
          eff_scale_handles_data?: number | null
          eff_scale_performs_any_usage?: number | null
          eff_scale_supports_users?: number | null
          eff_security_auth_prevents_unauthorized?: number | null
          eff_security_confidentiality?: number | null
          eff_security_feels_safe?: number | null
          eff_security_protects_data?: number | null
          eff_security_tamper_proof?: number | null
          feedback?: string | null
          grade_level: string
          id?: string
          imp_conn_enhanced_communication?: number | null
          imp_conn_enhanced_reliability?: number | null
          imp_conn_improved_stability?: number | null
          imp_conn_improved_sync?: number | null
          imp_conn_weak_signal_support?: number | null
          imp_scale_enhanced_data_mgmt?: number | null
          imp_scale_expanded_features?: number | null
          imp_scale_improved_performance?: number | null
          imp_scale_increased_capacity?: number | null
          imp_scale_strengthened_stability?: number | null
          imp_security_better_protection?: number | null
          imp_security_less_breach_concern?: number | null
          imp_security_more_trust?: number | null
          imp_security_stronger_auth?: number | null
          imp_security_stronger_measures?: number | null
          sat_addresses_needs?: number | null
          sat_meets_expectations?: number | null
          sat_positive_impression?: number | null
          sat_reliable_performance?: number | null
          sat_satisfying_experience?: number | null
          sex: string
          track?: string | null
          updated_at?: string
          usb_clear_instructions?: number | null
          usb_efficient_tasks?: number | null
          usb_intuitive_interface?: number | null
          usb_user_friendly?: number | null
          usb_well_organized?: number | null
          user_id: string
          user_name: string
        }
        Update: {
          acc_accommodates_needs?: number | null
          acc_device_access?: number | null
          acc_easy_info_access?: number | null
          acc_loads_quickly?: number | null
          acc_no_interruptions?: number | null
          career_path?: string
          career_path_other?: string | null
          created_at?: string
          dev_dependable_tools?: number | null
          dev_design_suitable?: number | null
          dev_fulfills_purpose?: number | null
          dev_meets_needs?: number | null
          dev_properly_tested?: number | null
          eff_conn_minimal_interruptions?: number | null
          eff_conn_notifications_timely?: number | null
          eff_conn_realtime_functions?: number | null
          eff_conn_stable_performance?: number | null
          eff_conn_syncs_devices?: number | null
          eff_scale_adapts_upgrades?: number | null
          eff_scale_features_remain?: number | null
          eff_scale_handles_data?: number | null
          eff_scale_performs_any_usage?: number | null
          eff_scale_supports_users?: number | null
          eff_security_auth_prevents_unauthorized?: number | null
          eff_security_confidentiality?: number | null
          eff_security_feels_safe?: number | null
          eff_security_protects_data?: number | null
          eff_security_tamper_proof?: number | null
          feedback?: string | null
          grade_level?: string
          id?: string
          imp_conn_enhanced_communication?: number | null
          imp_conn_enhanced_reliability?: number | null
          imp_conn_improved_stability?: number | null
          imp_conn_improved_sync?: number | null
          imp_conn_weak_signal_support?: number | null
          imp_scale_enhanced_data_mgmt?: number | null
          imp_scale_expanded_features?: number | null
          imp_scale_improved_performance?: number | null
          imp_scale_increased_capacity?: number | null
          imp_scale_strengthened_stability?: number | null
          imp_security_better_protection?: number | null
          imp_security_less_breach_concern?: number | null
          imp_security_more_trust?: number | null
          imp_security_stronger_auth?: number | null
          imp_security_stronger_measures?: number | null
          sat_addresses_needs?: number | null
          sat_meets_expectations?: number | null
          sat_positive_impression?: number | null
          sat_reliable_performance?: number | null
          sat_satisfying_experience?: number | null
          sex?: string
          track?: string | null
          updated_at?: string
          usb_clear_instructions?: number | null
          usb_efficient_tasks?: number | null
          usb_intuitive_interface?: number | null
          usb_user_friendly?: number | null
          usb_well_organized?: number | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      school_calendar: {
        Row: {
          created_at: string
          created_by: string
          date: string
          entry_type: Database["public"]["Enums"]["calendar_entry_type"]
          id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          entry_type?: Database["public"]["Enums"]["calendar_entry_type"]
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          entry_type?: Database["public"]["Enums"]["calendar_entry_type"]
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      substitute_plans: {
        Row: {
          activities: string | null
          created_at: string
          created_by: string
          id: string
          instructions: string
          is_active: boolean
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          created_by: string
          id?: string
          instructions: string
          is_active?: boolean
          section: string
          title: string
          updated_at?: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          created_by?: string
          id?: string
          instructions?: string
          is_active?: boolean
          section?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          student_id: string
          task_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          student_id: string
          task_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          student_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "classroom_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_day: { Args: { check_date: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student" | "super_admin"
      attendance_status: "present" | "late" | "absent" | "half_day" | "excused"
      calendar_entry_type: "holiday" | "suspended" | "no_classes"
      excuse_category:
        | "sick"
        | "emergency"
        | "family"
        | "event"
        | "school_activity"
        | "transportation"
        | "other"
      excuse_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "student", "super_admin"],
      attendance_status: ["present", "late", "absent", "half_day", "excused"],
      calendar_entry_type: ["holiday", "suspended", "no_classes"],
      excuse_category: [
        "sick",
        "emergency",
        "family",
        "event",
        "school_activity",
        "transportation",
        "other",
      ],
      excuse_status: ["pending", "approved", "rejected"],
    },
  },
} as const
