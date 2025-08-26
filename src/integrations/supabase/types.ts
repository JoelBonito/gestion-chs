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
      activity_log: {
        Row: {
          action: string
          by_user: string | null
          details: Json | null
          entity: string
          entity_id: string
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          by_user?: string | null
          details?: Json | null
          entity: string
          entity_id: string
          id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          by_user?: string | null
          details?: Json | null
          entity?: string
          entity_id?: string
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          file_type: string
          gdrive_download_link: string
          gdrive_file_id: string
          gdrive_view_link: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_type: string
          gdrive_download_link: string
          gdrive_file_id: string
          gdrive_view_link: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          gdrive_download_link?: string
          gdrive_file_id?: string
          gdrive_view_link?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          active: boolean
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
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
          frete_calculado: boolean | null
          id: string
          numero_encomenda: string
          observacoes: string | null
          peso_total: number | null
          saldo_devedor: number | null
          saldo_devedor_fornecedor: number | null
          status: Database["public"]["Enums"]["status_encomenda"]
          status_producao: string | null
          updated_at: string | null
          valor_frete: number | null
          valor_pago: number
          valor_pago_fornecedor: number | null
          valor_total: number
          valor_total_custo: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          fornecedor_id: string
          frete_calculado?: boolean | null
          id?: string
          numero_encomenda: string
          observacoes?: string | null
          peso_total?: number | null
          saldo_devedor?: number | null
          saldo_devedor_fornecedor?: number | null
          status?: Database["public"]["Enums"]["status_encomenda"]
          status_producao?: string | null
          updated_at?: string | null
          valor_frete?: number | null
          valor_pago?: number
          valor_pago_fornecedor?: number | null
          valor_total?: number
          valor_total_custo?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          fornecedor_id?: string
          frete_calculado?: boolean | null
          id?: string
          numero_encomenda?: string
          observacoes?: string | null
          peso_total?: number | null
          saldo_devedor?: number | null
          saldo_devedor_fornecedor?: number | null
          status?: Database["public"]["Enums"]["status_encomenda"]
          status_producao?: string | null
          updated_at?: string | null
          valor_frete?: number | null
          valor_pago?: number
          valor_pago_fornecedor?: number | null
          valor_total?: number
          valor_total_custo?: number | null
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
          active: boolean
          catalog_file: string | null
          catalog_url: string | null
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
          active?: boolean
          catalog_file?: string | null
          catalog_url?: string | null
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
          active?: boolean
          catalog_file?: string | null
          catalog_url?: string | null
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
      frete_encomenda: {
        Row: {
          created_at: string
          descricao: string
          encomenda_id: string
          id: string
          peso_total: number
          updated_at: string
          valor_frete: number
        }
        Insert: {
          created_at?: string
          descricao?: string
          encomenda_id: string
          id?: string
          peso_total: number
          updated_at?: string
          valor_frete: number
        }
        Update: {
          created_at?: string
          descricao?: string
          encomenda_id?: string
          id?: string
          peso_total?: number
          updated_at?: string
          valor_frete?: number
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
      pagamentos_fornecedor: {
        Row: {
          created_at: string
          data_pagamento: string
          encomenda_id: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          updated_at: string
          valor_pagamento: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          encomenda_id: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_pagamento: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          encomenda_id?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_pagamento?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_fornecedor_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          created_at: string
          fornecedor_id: string | null
          id: string
          marca: string
          nome: string
          preco_custo: number
          preco_venda: number
          size_weight: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          marca: string
          nome: string
          preco_custo: number
          preco_venda: number
          size_weight?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          marca?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          size_weight?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      status_encomenda:
        | "NOVO PEDIDO"
        | "PRODUÇÃO"
        | "EMBALAGEM"
        | "TRANSPORTE"
        | "ENTREGUE"
      user_role: "admin" | "ops" | "client" | "factory"
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
      status_encomenda: [
        "NOVO PEDIDO",
        "PRODUÇÃO",
        "EMBALAGEM",
        "TRANSPORTE",
        "ENTREGUE",
      ],
      user_role: ["admin", "ops", "client", "factory"],
    },
  },
} as const
