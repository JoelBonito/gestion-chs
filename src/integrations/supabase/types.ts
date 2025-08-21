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
      clientes: {
        Row: {
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      encomendas: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_criacao: string
          data_entrega: string | null
          data_envio_estimada: string | null
          data_producao_estimada: string | null
          fornecedor_id: string
          id: string
          numero_encomenda: string
          observacoes: string | null
          saldo_devedor: number | null
          status: string
          status_producao: string | null
          updated_at: string | null
          valor_pago: number
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          fornecedor_id: string
          id?: string
          numero_encomenda: string
          observacoes?: string | null
          saldo_devedor?: number | null
          status?: string
          status_producao?: string | null
          updated_at?: string | null
          valor_pago?: number
          valor_total?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          fornecedor_id?: string
          id?: string
          numero_encomenda?: string
          observacoes?: string | null
          saldo_devedor?: number | null
          status?: string
          status_producao?: string | null
          updated_at?: string | null
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "encomendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomendas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          contato: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      itens_encomenda: {
        Row: {
          created_at: string | null
          encomenda_id: string
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number | null
        }
        Insert: {
          created_at?: string | null
          encomenda_id: string
          id?: string
          preco_unitario: number
          produto_id: string
          quantidade?: number
          subtotal?: number | null
        }
        Update: {
          created_at?: string | null
          encomenda_id?: string
          id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_encomenda_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_encomenda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          created_at: string | null
          data_pagamento: string
          encomenda_id: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          updated_at: string | null
          valor_pagamento: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string
          encomenda_id: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_pagamento: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string
          encomenda_id?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_pagamento?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          created_at: string
          id: string
          marca: string
          nome: string
          preco_custo: number
          preco_venda: number
          tamanho: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marca: string
          nome: string
          preco_custo: number
          preco_venda: number
          tamanho: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marca?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          tamanho?: string
          tipo?: string
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
