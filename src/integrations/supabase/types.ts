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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      care_contexts: {
        Row: {
          caregiver_user_id: string | null
          created_at: string
          id: string
          owner_user_id: string
          type: string
          updated_at: string
        }
        Insert: {
          caregiver_user_id?: string | null
          created_at?: string
          id?: string
          owner_user_id: string
          type: string
          updated_at?: string
        }
        Update: {
          caregiver_user_id?: string | null
          created_at?: string
          id?: string
          owner_user_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_daily_status: {
        Row: {
          checked: boolean
          context_id: string
          created_at: string
          day: string
          horario: string
          id: string
          inactive: boolean
          item_id: string
          item_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          context_id: string
          created_at?: string
          day: string
          horario: string
          id?: string
          inactive?: boolean
          item_id: string
          item_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: boolean
          context_id?: string
          created_at?: string
          day?: string
          horario?: string
          id?: string
          inactive?: boolean
          item_id?: string
          item_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_daily_status_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_lembretes: {
        Row: {
          checked: boolean
          context_id: string
          created_at: string
          day: string
          horario: string
          id: string
          inactive: boolean
          lembrete_id: string
          updated_at: string
        }
        Insert: {
          checked?: boolean
          context_id: string
          created_at?: string
          day: string
          horario: string
          id?: string
          inactive?: boolean
          lembrete_id: string
          updated_at?: string
        }
        Update: {
          checked?: boolean
          context_id?: string
          created_at?: string
          day?: string
          horario?: string
          id?: string
          inactive?: boolean
          lembrete_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_lembretes_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_lembretes_lembrete_id_fkey"
            columns: ["lembrete_id"]
            isOneToOne: false
            referencedRelation: "lembretes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_meds: {
        Row: {
          checked: boolean
          context_id: string
          created_at: string
          day: string
          horario: string
          id: string
          inactive: boolean
          medicamento_id: string
          posologia_id: string | null
          updated_at: string
        }
        Insert: {
          checked?: boolean
          context_id: string
          created_at?: string
          day: string
          horario: string
          id?: string
          inactive?: boolean
          medicamento_id: string
          posologia_id?: string | null
          updated_at?: string
        }
        Update: {
          checked?: boolean
          context_id?: string
          created_at?: string
          day?: string
          horario?: string
          id?: string
          inactive?: boolean
          medicamento_id?: string
          posologia_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_meds_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_meds_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_meds_posologia_id_fkey"
            columns: ["posologia_id"]
            isOneToOne: false
            referencedRelation: "posologias"
            referencedColumns: ["id"]
          },
        ]
      }
      cuidadores: {
        Row: {
          created_at: string
          id: string
          nascimento: string | null
          nome: string
          nome_usuario: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nascimento?: string | null
          nome: string
          nome_usuario?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nascimento?: string | null
          nome?: string
          nome_usuario?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          content: string | null
          context_id: string | null
          created_at: string
          id: string
          mood: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          context_id?: string | null
          created_at?: string
          id?: string
          mood: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string | null
          context_id?: string | null
          created_at?: string
          id?: string
          mood?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes: {
        Row: {
          context_id: string
          created_at: string
          datas: Json
          dependente_id: string | null
          descricao: string | null
          horarios: Json
          icone: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id: string
          created_at?: string
          datas?: Json
          dependente_id?: string | null
          descricao?: string | null
          horarios?: Json
          icone: string
          id?: string
          nome: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          context_id?: string
          created_at?: string
          datas?: Json
          dependente_id?: string | null
          descricao?: string | null
          horarios?: Json
          icone?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos: {
        Row: {
          alerta_minimo: number
          context_id: string
          created_at: string
          data_inicio: string
          dependente_id: string | null
          dosagem: string
          frequencia: string
          horarios: Json
          id: string
          imagem_url: string | null
          nome: string
          precisa_receita: boolean
          prescription_image_url: string | null
          prescription_status: string
          quantidade_atual: number
          quantidade_por_dose: number
          quantidade_por_embalagem: number
          receita_pendente: boolean | null
          receita_url: string | null
          requires_prescription: boolean
          unidade_dose: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_minimo?: number
          context_id: string
          created_at?: string
          data_inicio?: string
          dependente_id?: string | null
          dosagem: string
          frequencia: string
          horarios?: Json
          id?: string
          imagem_url?: string | null
          nome: string
          precisa_receita?: boolean
          prescription_image_url?: string | null
          prescription_status?: string
          quantidade_atual?: number
          quantidade_por_dose: number
          quantidade_por_embalagem: number
          receita_pendente?: boolean | null
          receita_url?: string | null
          requires_prescription?: boolean
          unidade_dose: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          alerta_minimo?: number
          context_id?: string
          created_at?: string
          data_inicio?: string
          dependente_id?: string | null
          dosagem?: string
          frequencia?: string
          horarios?: Json
          id?: string
          imagem_url?: string | null
          nome?: string
          precisa_receita?: boolean
          prescription_image_url?: string | null
          prescription_status?: string
          quantidade_atual?: number
          quantidade_por_dose?: number
          quantidade_por_embalagem?: number
          receita_pendente?: boolean | null
          receita_url?: string | null
          requires_prescription?: boolean
          unidade_dose?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          data_hora: string
          id: string
          medicamento_id: string
          nota: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_hora?: string
          id?: string
          medicamento_id: string
          nota?: string | null
          quantidade: number
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          id?: string
          medicamento_id?: string
          nota?: string | null
          quantidade?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes_autonomos: {
        Row: {
          created_at: string
          id: string
          nascimento: string | null
          nome: string
          nome_usuario: string
          observacoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nascimento?: string | null
          nome: string
          nome_usuario: string
          observacoes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nascimento?: string | null
          nome?: string
          nome_usuario?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pacientes_dependentes: {
        Row: {
          created_at: string
          cuidador_id: string
          id: string
          nascimento: string | null
          nome: string
          nome_usuario: string
          observacoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuidador_id: string
          id?: string
          nascimento?: string | null
          nome: string
          nome_usuario: string
          observacoes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuidador_id?: string
          id?: string
          nascimento?: string | null
          nome?: string
          nome_usuario?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posologias: {
        Row: {
          created_at: string
          duracao_tipo: string
          duracao_valor: number
          frequencia: string
          horarios: Json
          id: string
          medicamento_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duracao_tipo: string
          duracao_valor: number
          frequencia: string
          horarios?: Json
          id?: string
          medicamento_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duracao_tipo?: string
          duracao_valor?: number
          frequencia?: string
          horarios?: Json
          id?: string
          medicamento_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posologias_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string
          caregiver_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          birth_date: string
          caregiver_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          birth_date?: string
          caregiver_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          context_id: string
          created_at: string
          id: string
          imagem_url: string
          medicamento_id: string | null
          nome: string
          updated_at: string
          usada: boolean
          user_id: string
        }
        Insert: {
          context_id: string
          created_at?: string
          id?: string
          imagem_url: string
          medicamento_id?: string | null
          nome: string
          updated_at?: string
          usada?: boolean
          user_id?: string
        }
        Update: {
          context_id?: string
          created_at?: string
          id?: string
          imagem_url?: string
          medicamento_id?: string | null
          nome?: string
          updated_at?: string
          usada?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sinais_vitais: {
        Row: {
          context_id: string | null
          created_at: string
          frequencia_cardiaca: number | null
          glicose: number | null
          id: string
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          saturacao_oxigenio: number | null
          temperatura: number | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          created_at?: string
          frequencia_cardiaca?: number | null
          glicose?: number | null
          id?: string
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          created_at?: string
          frequencia_cardiaca?: number | null
          glicose?: number | null
          id?: string
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinais_vitais_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      sintomas: {
        Row: {
          context_id: string | null
          created_at: string
          duracao: string
          fatores_relacionados: Json
          id: string
          intensidade: number
          observacoes: string | null
          tipo_sintoma: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          created_at?: string
          duracao: string
          fatores_relacionados?: Json
          id?: string
          intensidade: number
          observacoes?: string | null
          tipo_sintoma: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          created_at?: string
          duracao?: string
          fatores_relacionados?: Json
          id?: string
          intensidade?: number
          observacoes?: string | null
          tipo_sintoma?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sintomas_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status: {
        Row: {
          checked: boolean
          context_id: string | null
          day: string
          id: number
          task_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          context_id?: string | null
          day: string
          id?: never
          task_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: boolean
          context_id?: string | null
          day?: string
          id?: never
          task_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "care_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          created_at: string
          id: number
          order: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: never
          order?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: never
          order?: number
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_context: {
        Args: { ctx: string }
        Returns: boolean
      }
      server_time_sampa: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role:
        | "paciente_autonomo"
        | "cuidador"
        | "dependente"
        | "paciente_dependente"
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
      user_role: [
        "paciente_autonomo",
        "cuidador",
        "dependente",
        "paciente_dependente",
      ],
    },
  },
} as const
