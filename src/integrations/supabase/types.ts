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
      cuidadores: {
        Row: {
          created_at: string
          id: string
          nome: string
          nome_usuario: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          nome_usuario: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          nome_usuario?: string
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
          created_at: string
          id: string
          mood: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          mood: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          mood?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lembretes: {
        Row: {
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
          created_at?: string
          datas?: Json
          dependente_id?: string | null
          descricao?: string | null
          horarios?: Json
          icone: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
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
        Relationships: []
      }
      medicamentos: {
        Row: {
          alerta_minimo: number
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
          quantidade_atual: number
          quantidade_por_dose: number
          quantidade_por_embalagem: number
          unidade_dose: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_minimo?: number
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
          quantidade_atual?: number
          quantidade_por_dose: number
          quantidade_por_embalagem: number
          unidade_dose: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alerta_minimo?: number
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
          quantidade_atual?: number
          quantidade_por_dose?: number
          quantidade_por_embalagem?: number
          unidade_dose?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "pacientes_dependentes_cuidador_id_fkey"
            columns: ["cuidador_id"]
            isOneToOne: false
            referencedRelation: "cuidadores"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
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
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sinais_vitais: {
        Row: {
          created_at: string
          frequencia_cardiaca: number | null
          id: string
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          saturacao_oxigenio: number | null
          temperatura: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          frequencia_cardiaca?: number | null
          id?: string
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          frequencia_cardiaca?: number | null
          id?: string
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sintomas: {
        Row: {
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
          created_at?: string
          duracao?: string
          fatores_relacionados?: Json
          id?: string
          intensidade?: number
          observacoes?: string | null
          tipo_sintoma?: string
          user_id?: string
        }
        Relationships: []
      }
      task_status: {
        Row: {
          checked: boolean
          day: string
          id: number
          task_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          day: string
          id?: never
          task_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: boolean
          day?: string
          id?: never
          task_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
      server_time_sampa: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
