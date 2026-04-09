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
      amostras: {
        Row: {
          archived: boolean
          cliente_id: string | null
          cor: string | null
          created_at: string
          created_by: string
          data: string
          data_envio: string | null
          fragrancia: string | null
          id: string
          ingredientes_adicionais: string | null
          observacoes: string | null
          projeto: string | null
          quantidade_amostras: number | null
          referencia: string
          textura: string | null
          tipo_produto: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string
          data?: string
          data_envio?: string | null
          fragrancia?: string | null
          id?: string
          ingredientes_adicionais?: string | null
          observacoes?: string | null
          projeto?: string | null
          quantidade_amostras?: number | null
          referencia: string
          textura?: string | null
          tipo_produto?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string
          data?: string
          data_envio?: string | null
          fragrancia?: string | null
          id?: string
          ingredientes_adicionais?: string | null
          observacoes?: string | null
          projeto?: string | null
          quantidade_amostras?: number | null
          referencia?: string
          textura?: string | null
          tipo_produto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amostras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
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
          id: string
          storage_path: string
          storage_url: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          storage_path?: string
          storage_url?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_path?: string
          storage_url?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          active: boolean
          contato: string | null
          created_at: string | null
          created_by: string
          deactivated_at: string | null
          deactivated_reason: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          contato?: string | null
          created_at?: string | null
          created_by?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          contato?: string | null
          created_at?: string | null
          created_by?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custos_producao_encomenda: {
        Row: {
          created_at: string | null
          custo_total_brl: number | null
          custo_total_eur: number | null
          diversos: number | null
          embalagem_carol: number | null
          encomenda_id: string
          frete_sp: number | null
          garrafa: number | null
          garrafa_incluso: boolean | null
          id: string
          imposto: number | null
          item_encomenda_id: string
          lucro_joel_real: number | null
          producao_nonato: number | null
          produto_id: string
          rotulo: number | null
          tampa: number | null
          tampa_incluso: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo_total_brl?: number | null
          custo_total_eur?: number | null
          diversos?: number | null
          embalagem_carol?: number | null
          encomenda_id: string
          frete_sp?: number | null
          garrafa?: number | null
          garrafa_incluso?: boolean | null
          id?: string
          imposto?: number | null
          item_encomenda_id: string
          lucro_joel_real?: number | null
          producao_nonato?: number | null
          produto_id: string
          rotulo?: number | null
          tampa?: number | null
          tampa_incluso?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo_total_brl?: number | null
          custo_total_eur?: number | null
          diversos?: number | null
          embalagem_carol?: number | null
          encomenda_id?: string
          frete_sp?: number | null
          garrafa?: number | null
          garrafa_incluso?: boolean | null
          id?: string
          imposto?: number | null
          item_encomenda_id?: string
          lucro_joel_real?: number | null
          producao_nonato?: number | null
          produto_id?: string
          rotulo?: number | null
          tampa?: number | null
          tampa_incluso?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_producao_encomenda_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_producao_encomenda_item_encomenda_id_fkey"
            columns: ["item_encomenda_id"]
            isOneToOne: false
            referencedRelation: "itens_encomenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_producao_encomenda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      encomendas: {
        Row: {
          cliente_id: string
          cliente_nome: string | null
          created_at: string | null
          created_by: string
          custo_frete: number | null
          data_criacao: string
          data_entrega: string | null
          data_envio_estimada: string | null
          data_producao_estimada: string | null
          etiqueta: string | null
          fornecedor_id: string
          fornecedor_nome: string | null
          frete_calculado: boolean | null
          id: string
          numero_encomenda: string
          observacoes: string | null
          observacoes_felipe: string | null
          observacoes_joel: string | null
          peso_total: number | null
          referencia: string | null
          referencia_interna: string | null
          saldo_devedor: number | null
          saldo_devedor_fornecedor: number | null
          sinal_pago: boolean | null
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
          cliente_nome?: string | null
          created_at?: string | null
          created_by?: string
          custo_frete?: number | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          etiqueta?: string | null
          fornecedor_id: string
          fornecedor_nome?: string | null
          frete_calculado?: boolean | null
          id?: string
          numero_encomenda: string
          observacoes?: string | null
          observacoes_felipe?: string | null
          observacoes_joel?: string | null
          peso_total?: number | null
          referencia?: string | null
          referencia_interna?: string | null
          saldo_devedor?: number | null
          saldo_devedor_fornecedor?: number | null
          sinal_pago?: boolean | null
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
          cliente_nome?: string | null
          created_at?: string | null
          created_by?: string
          custo_frete?: number | null
          data_criacao?: string
          data_entrega?: string | null
          data_envio_estimada?: string | null
          data_producao_estimada?: string | null
          etiqueta?: string | null
          fornecedor_id?: string
          fornecedor_nome?: string | null
          frete_calculado?: boolean | null
          id?: string
          numero_encomenda?: string
          observacoes?: string | null
          observacoes_felipe?: string | null
          observacoes_joel?: string | null
          peso_total?: number | null
          referencia?: string | null
          referencia_interna?: string | null
          saldo_devedor?: number | null
          saldo_devedor_fornecedor?: number | null
          sinal_pago?: boolean | null
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
          created_at: string
          created_by: string
          deactivated_at: string | null
          deactivated_reason: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          catalog_file?: string | null
          catalog_url?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          catalog_file?: string | null
          catalog_url?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
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
      invoices: {
        Row: {
          amount: number
          attachment_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          invoice_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices_backup: {
        Row: {
          amount: number | null
          attachment_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          invoice_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          attachment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          invoice_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          attachment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          invoice_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      itens_encomenda: {
        Row: {
          created_at: string | null
          encomenda_id: string
          id: string
          is_bonificacao: boolean
          preco_custo: number
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number | null
        }
        Insert: {
          created_at?: string | null
          encomenda_id: string
          id?: string
          is_bonificacao?: boolean
          preco_custo?: number
          preco_unitario: number
          produto_id: string
          quantidade?: number
          subtotal?: number | null
        }
        Update: {
          created_at?: string | null
          encomenda_id?: string
          id?: string
          is_bonificacao?: boolean
          preco_custo?: number
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_itens_encomenda_produto_id"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_encomenda_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
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
          categoria: string | null
          created_at: string
          data_pagamento: string
          destinatario: string | null
          encomenda_id: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          updated_at: string
          valor_pagamento: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string
          destinatario?: string | null
          encomenda_id: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_pagamento: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string
          destinatario?: string | null
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
          created_by: string
          custo_nonato_breakdown: Json | null
          custo_plus25_breakdown: Json | null
          custo_producao: number | null
          custo_tabela_breakdown: Json | null
          deactivated_at: string | null
          deactivated_reason: string | null
          descricao: string | null
          estoque_garrafas: number
          estoque_rotulos: number
          estoque_tampas: number
          fornecedor_id: string | null
          garrafa_incluso: boolean | null
          id: string
          imagem_url: string | null
          lucro_joel: number | null
          marca: string
          nome: string
          preco_custo: number
          preco_nonato: number | null
          preco_plus25: number | null
          preco_tabela: number | null
          preco_venda: number
          size_weight: number
          tampa_incluso: boolean | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string
          custo_nonato_breakdown?: Json | null
          custo_plus25_breakdown?: Json | null
          custo_producao?: number | null
          custo_tabela_breakdown?: Json | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          descricao?: string | null
          estoque_garrafas?: number
          estoque_rotulos?: number
          estoque_tampas?: number
          fornecedor_id?: string | null
          garrafa_incluso?: boolean | null
          id?: string
          imagem_url?: string | null
          lucro_joel?: number | null
          marca: string
          nome: string
          preco_custo: number
          preco_nonato?: number | null
          preco_plus25?: number | null
          preco_tabela?: number | null
          preco_venda: number
          size_weight?: number
          tampa_incluso?: boolean | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string
          custo_nonato_breakdown?: Json | null
          custo_plus25_breakdown?: Json | null
          custo_producao?: number | null
          custo_tabela_breakdown?: Json | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          descricao?: string | null
          estoque_garrafas?: number
          estoque_rotulos?: number
          estoque_tampas?: number
          fornecedor_id?: string | null
          garrafa_incluso?: boolean | null
          id?: string
          imagem_url?: string | null
          lucro_joel?: number | null
          marca?: string
          nome?: string
          preco_custo?: number
          preco_nonato?: number | null
          preco_plus25?: number | null
          preco_tabela?: number | null
          preco_venda?: number
          size_weight?: number
          tampa_incluso?: boolean | null
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
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      transporte_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string
          id: string
          name: string
          transporte_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          name: string
          transporte_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          transporte_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporte_attachments_transporte_id_fkey"
            columns: ["transporte_id"]
            isOneToOne: false
            referencedRelation: "transportes"
            referencedColumns: ["id"]
          },
        ]
      }
      transportes: {
        Row: {
          archived: boolean
          archived_at: string | null
          archived_reason: string | null
          created_at: string
          created_by: string
          id: string
          referencia: string | null
          tracking_number: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
          created_by?: string
          id?: string
          referencia?: string | null
          tracking_number: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
          created_by?: string
          id?: string
          referencia?: string | null
          tracking_number?: string
          updated_at?: string
        }
        Relationships: []
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
      can_edit: { Args: never; Returns: boolean }
      delete_encomenda_safely: {
        Args: { p_encomenda_id: string }
        Returns: boolean
      }
      exec_sql_readonly: { Args: { query: string }; Returns: Json }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["user_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { p_role: string }; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      recalc_valor_total_custo_encomenda: {
        Args: { p_encomenda: string }
        Returns: undefined
      }
      recalc_valor_total_venda_encomenda: {
        Args: { p_encomenda: string }
        Returns: undefined
      }
      salvar_edicao_encomenda: {
        Args: { p_dados: Json; p_encomenda_id: string; p_itens: Json }
        Returns: {
          id: string
          saldo_devedor_fornecedor: number
          valor_pago_fornecedor: number
          valor_total: number
          valor_total_custo: number
        }[]
      }
    }
    Enums: {
      status_encomenda:
        | "NOVO PEDIDO"
        | "MATÉRIA PRIMA"
        | "PRODUÇÃO"
        | "EMBALAGENS"
        | "TRANSPORTE"
        | "ENTREGUE"
      user_role:
        | "admin"
        | "ops"
        | "client"
        | "factory"
        | "finance"
        | "restricted_fr"
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
        "MATÉRIA PRIMA",
        "PRODUÇÃO",
        "EMBALAGENS",
        "TRANSPORTE",
        "ENTREGUE",
      ],
      user_role: [
        "admin",
        "ops",
        "client",
        "factory",
        "finance",
        "restricted_fr",
      ],
    },
  },
} as const
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.65.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
