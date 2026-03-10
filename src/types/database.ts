export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// DOMAIN TYPES
// ============================================

export interface Escritorio {
  id: string
  user_id: string
  nome: string
  email: string
  telefone: string | null
  morada: string | null
  nif: string | null
  plano: 'trial' | 'starter' | 'pro'
  processos_ativos_limite: number
  created_at: string
}

export interface Cliente {
  id: string
  escritorio_id: string
  nome: string
  email: string
  telefone: string | null
  nacionalidade: string | null
  nif_pt: string | null
  data_nascimento: string | null
  portal_token: string
  notas_internas: string | null
  created_at: string
  updated_at: string
}

export interface TipoProcesso {
  id: string
  slug: string
  nome: string
  descricao: string | null
  etapas_padrao: string[]
  documentos_padrao: DocumentoPadrao[]
}

export interface DocumentoPadrao {
  nome: string
  descricao: string
  obrigatorio: boolean
}

export interface Processo {
  id: string
  escritorio_id: string
  cliente_id: string
  tipo_processo_id: string | null
  titulo: string
  descricao: string | null
  status: 'ativo' | 'concluido' | 'cancelado' | 'suspenso' | 'indeferido'
  etapa_atual: number
  etapas: string[]
  prioridade: 'escritorio' | 'cliente' | 'orgao_externo'
  data_inicio: string
  data_prazo: string | null
  notas_internas: string | null
  referencia_interna: string | null
  funcionario_id: string | null
  created_at: string
  updated_at: string
}

export interface Funcionario {
  id: string
  escritorio_id: string
  nome: string
  email: string | null
  active: boolean
  auth_user_id: string | null
  created_at: string
}

export interface Documento {
  id: string
  processo_id: string
  escritorio_id: string
  nome: string
  descricao: string | null
  obrigatorio: boolean
  status: 'pendente' | 'recebido' | 'aprovado' | 'rejeitado' | 'nao_aplicavel'
  uploaded_by: 'advogado' | 'cliente' | null
  storage_path: string | null
  nome_ficheiro_original: string | null
  tamanho_bytes: number | null
  mime_type: string | null
  notas: string | null
  uploaded_at: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Evento {
  id: string
  processo_id: string
  escritorio_id: string
  tipo: 'etapa_avancada' | 'documento_recebido' | 'documento_aprovado' | 'documento_rejeitado' | 'nota' | 'prazo' | 'email_enviado'
  titulo: string
  descricao: string | null
  visivel_cliente: boolean
  created_by: 'advogado' | 'cliente' | 'sistema' | null
  created_at: string
}

export interface Alerta {
  id: string
  escritorio_id: string
  processo_id: string
  titulo: string
  descricao: string | null
  data_alerta: string
  status: 'pendente' | 'visto' | 'resolvido'
  created_at: string
}

// ============================================
// SUPABASE DATABASE TYPE
// ============================================

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      escritorios: {
        Row: Escritorio
        Insert: {
          id?: string
          user_id: string
          nome: string
          email: string
          telefone?: string | null
          morada?: string | null
          nif?: string | null
          plano?: 'trial' | 'starter' | 'pro'
          processos_ativos_limite?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          email?: string
          telefone?: string | null
          morada?: string | null
          nif?: string | null
          plano?: 'trial' | 'starter' | 'pro'
          processos_ativos_limite?: number
          created_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: Cliente
        Insert: {
          id?: string
          escritorio_id: string
          nome: string
          email: string
          telefone?: string | null
          nacionalidade?: string | null
          nif_pt?: string | null
          data_nascimento?: string | null
          portal_token?: string
          notas_internas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escritorio_id?: string
          nome?: string
          email?: string
          telefone?: string | null
          nacionalidade?: string | null
          nif_pt?: string | null
          data_nascimento?: string | null
          portal_token?: string
          notas_internas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tipos_processo: {
        Row: TipoProcesso
        Insert: {
          id?: string
          slug: string
          nome: string
          descricao?: string | null
          etapas_padrao?: Json
          documentos_padrao?: Json
        }
        Update: {
          id?: string
          slug?: string
          nome?: string
          descricao?: string | null
          etapas_padrao?: Json
          documentos_padrao?: Json
        }
        Relationships: []
      }
      processos: {
        Row: Processo
        Insert: {
          id?: string
          escritorio_id: string
          cliente_id: string
          tipo_processo_id?: string | null
          titulo: string
          descricao?: string | null
          status?: 'ativo' | 'concluido' | 'cancelado' | 'suspenso' | 'indeferido'
          etapa_atual?: number
          etapas?: Json
          prioridade?: 'escritorio' | 'cliente' | 'orgao_externo'
          data_inicio?: string
          data_prazo?: string | null
          notas_internas?: string | null
          referencia_interna?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escritorio_id?: string
          cliente_id?: string
          tipo_processo_id?: string | null
          titulo?: string
          descricao?: string | null
          status?: 'ativo' | 'concluido' | 'cancelado' | 'suspenso' | 'indeferido'
          etapa_atual?: number
          etapas?: Json
          prioridade?: 'escritorio' | 'cliente' | 'orgao_externo'
          data_inicio?: string
          data_prazo?: string | null
          notas_internas?: string | null
          referencia_interna?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documentos: {
        Row: Documento
        Insert: {
          id?: string
          processo_id: string
          escritorio_id: string
          nome: string
          descricao?: string | null
          obrigatorio?: boolean
          status?: 'pendente' | 'recebido' | 'aprovado' | 'rejeitado' | 'nao_aplicavel'
          uploaded_by?: 'advogado' | 'cliente' | null
          storage_path?: string | null
          nome_ficheiro_original?: string | null
          tamanho_bytes?: number | null
          mime_type?: string | null
          notas?: string | null
          uploaded_at?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          processo_id?: string
          escritorio_id?: string
          nome?: string
          descricao?: string | null
          obrigatorio?: boolean
          status?: 'pendente' | 'recebido' | 'aprovado' | 'rejeitado' | 'nao_aplicavel'
          uploaded_by?: 'advogado' | 'cliente' | null
          storage_path?: string | null
          nome_ficheiro_original?: string | null
          tamanho_bytes?: number | null
          mime_type?: string | null
          notas?: string | null
          uploaded_at?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: Evento
        Insert: {
          id?: string
          processo_id: string
          escritorio_id: string
          tipo: 'etapa_avancada' | 'documento_recebido' | 'documento_aprovado' | 'documento_rejeitado' | 'nota' | 'prazo' | 'email_enviado'
          titulo: string
          descricao?: string | null
          visivel_cliente?: boolean
          created_by?: 'advogado' | 'cliente' | 'sistema' | null
          created_at?: string
        }
        Update: {
          id?: string
          processo_id?: string
          escritorio_id?: string
          tipo?: 'etapa_avancada' | 'documento_recebido' | 'documento_aprovado' | 'documento_rejeitado' | 'nota' | 'prazo' | 'email_enviado'
          titulo?: string
          descricao?: string | null
          visivel_cliente?: boolean
          created_by?: 'advogado' | 'cliente' | 'sistema' | null
        }
        Relationships: []
      }
      alertas: {
        Row: Alerta
        Insert: {
          id?: string
          escritorio_id: string
          processo_id: string
          titulo: string
          descricao?: string | null
          data_alerta: string
          status?: 'pendente' | 'visto' | 'resolvido'
          created_at?: string
        }
        Update: {
          id?: string
          escritorio_id?: string
          processo_id?: string
          titulo?: string
          descricao?: string | null
          data_alerta?: string
          status?: 'pendente' | 'visto' | 'resolvido'
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_portal_data: {
        Args: { p_token: string }
        Returns: Json
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

// ============================================
// PORTAL DATA (returned by get_portal_data RPC)
// ============================================

export interface PortalData {
  cliente: Cliente
  processos: PortalProcesso[] | null
}

export interface PortalProcesso {
  processo: Processo
  documentos: Documento[] | null
  eventos: Evento[] | null
}

// ============================================
// EXTENDED TYPES (joins)
// ============================================

export interface ProcessoComCliente extends Processo {
  clientes: Pick<Cliente, 'id' | 'nome' | 'email' | 'portal_token'>
}

export interface ClienteComProcessos extends Cliente {
  processos: Pick<Processo, 'id' | 'titulo' | 'status' | 'prioridade' | 'data_prazo'>[]
}
