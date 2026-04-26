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
      apostas: {
        Row: {
          atualizado_em: string
          banca_id: string
          casa_de_aposta: string | null
          colocada_em: string
          criado_em: string
          descricao: string | null
          edge: number | null
          eh_freebet: boolean
          estrategia_id: string | null
          estrategia_override: boolean
          formato: Database["public"]["Enums"]["formato_aposta"]
          id: string
          lucro: number | null
          motivo_override: string | null
          observacao: string | null
          odd_total: number
          resolvida_em: string | null
          retorno_potencial: number | null
          retorno_real: number | null
          stake: number
          status: Database["public"]["Enums"]["status_aposta"]
          usuario_id: string
          valor_esperado: number | null
        }
        Insert: {
          atualizado_em?: string
          banca_id: string
          casa_de_aposta?: string | null
          colocada_em?: string
          criado_em?: string
          descricao?: string | null
          edge?: number | null
          eh_freebet?: boolean
          estrategia_id?: string | null
          estrategia_override?: boolean
          formato?: Database["public"]["Enums"]["formato_aposta"]
          id?: string
          lucro?: number | null
          motivo_override?: string | null
          observacao?: string | null
          odd_total: number
          resolvida_em?: string | null
          retorno_potencial?: number | null
          retorno_real?: number | null
          stake: number
          status?: Database["public"]["Enums"]["status_aposta"]
          usuario_id: string
          valor_esperado?: number | null
        }
        Update: {
          atualizado_em?: string
          banca_id?: string
          casa_de_aposta?: string | null
          colocada_em?: string
          criado_em?: string
          descricao?: string | null
          edge?: number | null
          eh_freebet?: boolean
          estrategia_id?: string | null
          estrategia_override?: boolean
          formato?: Database["public"]["Enums"]["formato_aposta"]
          id?: string
          lucro?: number | null
          motivo_override?: string | null
          observacao?: string | null
          odd_total?: number
          resolvida_em?: string | null
          retorno_potencial?: number | null
          retorno_real?: number | null
          stake?: number
          status?: Database["public"]["Enums"]["status_aposta"]
          usuario_id?: string
          valor_esperado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apostas_banca_id_fkey"
            columns: ["banca_id"]
            isOneToOne: false
            referencedRelation: "bancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      apostas_selecoes: {
        Row: {
          aposta_id: string
          atualizado_em: string
          criado_em: string
          descricao: string
          id: string
          linha: string | null
          odd: number
          partida_id: string | null
          status: Database["public"]["Enums"]["status_aposta"]
          tipo_aposta_id: number | null
          usuario_id: string
        }
        Insert: {
          aposta_id: string
          atualizado_em?: string
          criado_em?: string
          descricao: string
          id?: string
          linha?: string | null
          odd: number
          partida_id?: string | null
          status?: Database["public"]["Enums"]["status_aposta"]
          tipo_aposta_id?: number | null
          usuario_id: string
        }
        Update: {
          aposta_id?: string
          atualizado_em?: string
          criado_em?: string
          descricao?: string
          id?: string
          linha?: string | null
          odd?: number
          partida_id?: string | null
          status?: Database["public"]["Enums"]["status_aposta"]
          tipo_aposta_id?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostas_selecoes_aposta_id_fkey"
            columns: ["aposta_id"]
            isOneToOne: false
            referencedRelation: "apostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_selecoes_aposta_id_fkey"
            columns: ["aposta_id"]
            isOneToOne: false
            referencedRelation: "vw_apostas_resumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_selecoes_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_selecoes_tipo_aposta_id_fkey"
            columns: ["tipo_aposta_id"]
            isOneToOne: false
            referencedRelation: "tipos_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_selecoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      bancas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          casa_de_aposta: string | null
          criado_em: string
          e_principal: boolean
          id: string
          moeda: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          usuario_id: string
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          casa_de_aposta?: string | null
          criado_em?: string
          e_principal?: boolean
          id?: string
          moeda?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          usuario_id: string
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          casa_de_aposta?: string | null
          criado_em?: string
          e_principal?: boolean
          id?: string
          moeda?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bancas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      esportes: {
        Row: {
          ativo: boolean
          criado_em: string
          id: number
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      estrategias: {
        Row: {
          arquivada_em: string | null
          atualizado_em: string
          banca_referencia: string
          contextos: string[]
          cor: string | null
          criado_em: string
          descricao: string | null
          drawdown_alerta_pct: number | null
          edge_minimo: number | null
          esporte_id: number
          estrategia_pai_id: string | null
          id: string
          meta_banca: number | null
          metodo_stake: Database["public"]["Enums"]["metodo_stake"]
          minuto_minimo: number | null
          nome: string
          odd_maxima: number | null
          odd_minima: number | null
          reds_consec_alerta: number | null
          regras_jsonb: Json
          regras_versao: number
          revisao_apos_apostas: number | null
          revisao_apos_dias: number | null
          stake_base: number | null
          stake_config: Json
          status: Database["public"]["Enums"]["status_estrategia"]
          stop_loss_banca_pct: number | null
          stop_loss_reds: number | null
          tags: string[]
          tipo_aposta_id: number | null
          usuario_id: string
          yield_minimo_alerta: number | null
        }
        Insert: {
          arquivada_em?: string | null
          atualizado_em?: string
          banca_referencia?: string
          contextos?: string[]
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          drawdown_alerta_pct?: number | null
          edge_minimo?: number | null
          esporte_id: number
          estrategia_pai_id?: string | null
          id?: string
          meta_banca?: number | null
          metodo_stake?: Database["public"]["Enums"]["metodo_stake"]
          minuto_minimo?: number | null
          nome: string
          odd_maxima?: number | null
          odd_minima?: number | null
          reds_consec_alerta?: number | null
          regras_jsonb?: Json
          regras_versao?: number
          revisao_apos_apostas?: number | null
          revisao_apos_dias?: number | null
          stake_base?: number | null
          stake_config?: Json
          status?: Database["public"]["Enums"]["status_estrategia"]
          stop_loss_banca_pct?: number | null
          stop_loss_reds?: number | null
          tags?: string[]
          tipo_aposta_id?: number | null
          usuario_id: string
          yield_minimo_alerta?: number | null
        }
        Update: {
          arquivada_em?: string | null
          atualizado_em?: string
          banca_referencia?: string
          contextos?: string[]
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          drawdown_alerta_pct?: number | null
          edge_minimo?: number | null
          esporte_id?: number
          estrategia_pai_id?: string | null
          id?: string
          meta_banca?: number | null
          metodo_stake?: Database["public"]["Enums"]["metodo_stake"]
          minuto_minimo?: number | null
          nome?: string
          odd_maxima?: number | null
          odd_minima?: number | null
          reds_consec_alerta?: number | null
          regras_jsonb?: Json
          regras_versao?: number
          revisao_apos_apostas?: number | null
          revisao_apos_dias?: number | null
          stake_base?: number | null
          stake_config?: Json
          status?: Database["public"]["Enums"]["status_estrategia"]
          stop_loss_banca_pct?: number | null
          stop_loss_reds?: number | null
          tags?: string[]
          tipo_aposta_id?: number | null
          usuario_id?: string
          yield_minimo_alerta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_esporte_id_fkey"
            columns: ["esporte_id"]
            isOneToOne: false
            referencedRelation: "esportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_estrategia_pai_id_fkey"
            columns: ["estrategia_pai_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_tipo_aposta_id_fkey"
            columns: ["tipo_aposta_id"]
            isOneToOne: false
            referencedRelation: "tipos_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategias_ligas: {
        Row: {
          criado_em: string
          estrategia_id: string
          liga_id: number
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          estrategia_id: string
          liga_id: number
          usuario_id: string
        }
        Update: {
          criado_em?: string
          estrategia_id?: string
          liga_id?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_ligas_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_ligas_liga_id_fkey"
            columns: ["liga_id"]
            isOneToOne: false
            referencedRelation: "ligas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_ligas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategias_progresso: {
        Row: {
          atualizado_em: string
          estrategia_id: string
          greens_consecutivos: number
          lucro_acumulado: number
          passo_atual: number
          reds_consecutivos: number
          total_apostas: number
          total_greens: number
          total_reds: number
          ultima_aposta_em: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          estrategia_id: string
          greens_consecutivos?: number
          lucro_acumulado?: number
          passo_atual?: number
          reds_consecutivos?: number
          total_apostas?: number
          total_greens?: number
          total_reds?: number
          ultima_aposta_em?: string | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          estrategia_id?: string
          greens_consecutivos?: number
          lucro_acumulado?: number
          passo_atual?: number
          reds_consecutivos?: number
          total_apostas?: number
          total_greens?: number
          total_reds?: number
          ultima_aposta_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_progresso_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: true
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_progresso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategias_regras_versoes: {
        Row: {
          estrategia_id: string
          id: number
          regras_jsonb: Json
          usuario_id: string
          versao_num: number
          vigente_ate: string | null
          vigente_desde: string
        }
        Insert: {
          estrategia_id: string
          id?: number
          regras_jsonb: Json
          usuario_id: string
          versao_num: number
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Update: {
          estrategia_id?: string
          id?: number
          regras_jsonb?: Json
          usuario_id?: string
          versao_num?: number
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_regras_versoes_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_regras_versoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategias_tipos_aposta: {
        Row: {
          criado_em: string
          estrategia_id: string
          tipo_aposta_id: number
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          estrategia_id: string
          tipo_aposta_id: number
          usuario_id: string
        }
        Update: {
          criado_em?: string
          estrategia_id?: string
          tipo_aposta_id?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_tipos_aposta_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_tipos_aposta_tipo_aposta_id_fkey"
            columns: ["tipo_aposta_id"]
            isOneToOne: false
            referencedRelation: "tipos_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategias_tipos_aposta_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_banca: {
        Row: {
          banca_id: string
          criado_em: string
          id: string
          observacao: string | null
          ocorrido_em: string
          tipo: Database["public"]["Enums"]["tipo_evento_banca"]
          usuario_id: string
          valor: number
        }
        Insert: {
          banca_id: string
          criado_em?: string
          id?: string
          observacao?: string | null
          ocorrido_em?: string
          tipo: Database["public"]["Enums"]["tipo_evento_banca"]
          usuario_id: string
          valor: number
        }
        Update: {
          banca_id?: string
          criado_em?: string
          id?: string
          observacao?: string | null
          ocorrido_em?: string
          tipo?: Database["public"]["Enums"]["tipo_evento_banca"]
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "eventos_banca_banca_id_fkey"
            columns: ["banca_id"]
            isOneToOne: false
            referencedRelation: "bancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_banca_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      ligas: {
        Row: {
          ativo: boolean
          criado_em: string
          esporte_id: number
          id: number
          nome: string
          pais_id: number | null
          slug: string
          temporada: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          esporte_id: number
          id?: number
          nome: string
          pais_id?: number | null
          slug: string
          temporada?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          esporte_id?: number
          id?: number
          nome?: string
          pais_id?: number | null
          slug?: string
          temporada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ligas_esporte_id_fkey"
            columns: ["esporte_id"]
            isOneToOne: false
            referencedRelation: "esportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligas_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      paises: {
        Row: {
          codigo_iso: string
          criado_em: string
          id: number
          nome: string
        }
        Insert: {
          codigo_iso: string
          criado_em?: string
          id?: number
          nome: string
        }
        Update: {
          codigo_iso?: string
          criado_em?: string
          id?: number
          nome?: string
        }
        Relationships: []
      }
      partidas: {
        Row: {
          atualizado_em: string
          criado_em: string
          encerrada: boolean
          esporte_id: number
          id: string
          inicio: string
          liga_id: number | null
          mandante_nome: string | null
          placar_mandante: number | null
          placar_visitante: number | null
          time_mandante_id: number | null
          time_visitante_id: number | null
          usuario_id: string
          visitante_nome: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          encerrada?: boolean
          esporte_id: number
          id?: string
          inicio: string
          liga_id?: number | null
          mandante_nome?: string | null
          placar_mandante?: number | null
          placar_visitante?: number | null
          time_mandante_id?: number | null
          time_visitante_id?: number | null
          usuario_id: string
          visitante_nome?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          encerrada?: boolean
          esporte_id?: number
          id?: string
          inicio?: string
          liga_id?: number | null
          mandante_nome?: string | null
          placar_mandante?: number | null
          placar_visitante?: number | null
          time_mandante_id?: number | null
          time_visitante_id?: number | null
          usuario_id?: string
          visitante_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partidas_esporte_id_fkey"
            columns: ["esporte_id"]
            isOneToOne: false
            referencedRelation: "esportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_liga_id_fkey"
            columns: ["liga_id"]
            isOneToOne: false
            referencedRelation: "ligas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_time_mandante_id_fkey"
            columns: ["time_mandante_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_time_visitante_id_fkey"
            columns: ["time_visitante_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          atualizado_em: string
          avatar_url: string | null
          criado_em: string
          email: string
          fuso_horario: string
          id: string
          moeda: string
          nome_completo: string | null
          papel: Database["public"]["Enums"]["papel_usuario"]
        }
        Insert: {
          atualizado_em?: string
          avatar_url?: string | null
          criado_em?: string
          email: string
          fuso_horario?: string
          id: string
          moeda?: string
          nome_completo?: string | null
          papel?: Database["public"]["Enums"]["papel_usuario"]
        }
        Update: {
          atualizado_em?: string
          avatar_url?: string | null
          criado_em?: string
          email?: string
          fuso_horario?: string
          id?: string
          moeda?: string
          nome_completo?: string | null
          papel?: Database["public"]["Enums"]["papel_usuario"]
        }
        Relationships: []
      }
      times: {
        Row: {
          criado_em: string
          escudo_url: string | null
          esporte_id: number
          id: number
          nome: string
          pais_id: number | null
          slug: string
        }
        Insert: {
          criado_em?: string
          escudo_url?: string | null
          esporte_id: number
          id?: number
          nome: string
          pais_id?: number | null
          slug: string
        }
        Update: {
          criado_em?: string
          escudo_url?: string | null
          esporte_id?: number
          id?: number
          nome?: string
          pais_id?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "times_esporte_id_fkey"
            columns: ["esporte_id"]
            isOneToOne: false
            referencedRelation: "esportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "times_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_aposta: {
        Row: {
          ativo: boolean
          categoria: string
          criado_em: string
          descricao: string | null
          esporte_id: number
          id: number
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          criado_em?: string
          descricao?: string | null
          esporte_id: number
          id?: number
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          criado_em?: string
          descricao?: string | null
          esporte_id?: number
          id?: number
          nome?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_aposta_esporte_id_fkey"
            columns: ["esporte_id"]
            isOneToOne: false
            referencedRelation: "esportes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_apostas_resumo: {
        Row: {
          banca_id: string | null
          colocada_em: string | null
          eh_freebet: boolean | null
          estrategia_id: string | null
          formato: Database["public"]["Enums"]["formato_aposta"] | null
          id: string | null
          lucro: number | null
          odd_total: number | null
          qtd_selecoes: number | null
          resolvida: boolean | null
          resolvida_em: string | null
          retorno_real: number | null
          stake: number | null
          status: Database["public"]["Enums"]["status_aposta"] | null
          usuario_id: string | null
        }
        Insert: {
          banca_id?: string | null
          colocada_em?: string | null
          eh_freebet?: boolean | null
          estrategia_id?: string | null
          formato?: Database["public"]["Enums"]["formato_aposta"] | null
          id?: string | null
          lucro?: number | null
          odd_total?: number | null
          qtd_selecoes?: never
          resolvida?: never
          resolvida_em?: string | null
          retorno_real?: number | null
          stake?: number | null
          status?: Database["public"]["Enums"]["status_aposta"] | null
          usuario_id?: string | null
        }
        Update: {
          banca_id?: string | null
          colocada_em?: string | null
          eh_freebet?: boolean | null
          estrategia_id?: string | null
          formato?: Database["public"]["Enums"]["formato_aposta"] | null
          id?: string | null
          lucro?: number | null
          odd_total?: number | null
          qtd_selecoes?: never
          resolvida?: never
          resolvida_em?: string | null
          retorno_real?: number | null
          stake?: number | null
          status?: Database["public"]["Enums"]["status_aposta"] | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apostas_banca_id_fkey"
            columns: ["banca_id"]
            isOneToOne: false
            referencedRelation: "bancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_estrategia_id_fkey"
            columns: ["estrategia_id"]
            isOneToOne: false
            referencedRelation: "estrategias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_criar_aposta_multipla: { Args: { payload: Json }; Returns: string }
      fn_criar_aposta_simples: { Args: { payload: Json }; Returns: string }
      fn_eh_admin: { Args: never; Returns: boolean }
      fn_reabrir_aposta: { Args: { p_aposta_id: string }; Returns: string }
      fn_recalcular_progresso_estrategia: {
        Args: { p_estrategia_id: string }
        Returns: undefined
      }
      fn_recalcular_saldo_banca: {
        Args: { p_banca_id: string }
        Returns: undefined
      }
      fn_resolver_aposta: {
        Args: {
          p_aposta_id: string
          p_observacao?: string
          p_retorno_real?: number
          p_status: Database["public"]["Enums"]["status_aposta"]
        }
        Returns: string
      }
      fn_resolver_selecao: {
        Args: {
          p_selecao_id: string
          p_status: Database["public"]["Enums"]["status_aposta"]
        }
        Returns: string
      }
    }
    Enums: {
      formato_aposta: "simples" | "multipla" | "sistema"
      metodo_stake: "fixo" | "percentual" | "progressao" | "kelly" | "livre"
      papel_usuario: "admin" | "executor" | "consulta" | "usuario"
      status_aposta:
        | "pendente"
        | "ganha"
        | "perdida"
        | "anulada"
        | "cashout"
        | "meio_green"
        | "meio_red"
      status_estrategia: "ativa" | "pausada" | "arquivada"
      tipo_evento_banca:
        | "deposito"
        | "saque"
        | "ajuste"
        | "saldo_inicial"
        | "aposta"
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
      formato_aposta: ["simples", "multipla", "sistema"],
      metodo_stake: ["fixo", "percentual", "progressao", "kelly", "livre"],
      papel_usuario: ["admin", "executor", "consulta", "usuario"],
      status_aposta: [
        "pendente",
        "ganha",
        "perdida",
        "anulada",
        "cashout",
        "meio_green",
        "meio_red",
      ],
      status_estrategia: ["ativa", "pausada", "arquivada"],
      tipo_evento_banca: [
        "deposito",
        "saque",
        "ajuste",
        "saldo_inicial",
        "aposta",
      ],
    },
  },
} as const
