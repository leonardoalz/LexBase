'use client'

import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, daysUntil, getUrgenciaBorda } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'

interface ProcessoRow {
  id: string
  titulo: string
  status: 'ativo' | 'concluido' | 'cancelado' | 'suspenso'
  prioridade: 'escritorio' | 'cliente' | 'orgao_externo'
  referencia_interna: string | null
  data_prazo: string | null
  etapa_atual: number
  etapas: string[]
  clientes: { nome: string } | null
}

interface Props {
  processos: ProcessoRow[]
  funcionarioNome: string
}

export function FuncionarioDashboardClient({ processos, funcionarioNome }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Os seus processos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Olá, {funcionarioNome}. {processos.length > 0
            ? `Tem ${processos.length} processo${processos.length !== 1 ? 's' : ''} atribuído${processos.length !== 1 ? 's' : ''}.`
            : 'Sem processos atribuídos por agora.'}
        </p>
      </div>

      {processos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sem processos atribuídos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processos.map(p => {
            const dias = daysUntil(p.data_prazo)
            const pct = p.etapas.length > 0 ? Math.round((p.etapa_atual / p.etapas.length) * 100) : 0
            const urgencia = getUrgenciaBorda(p.data_prazo)
            const prazoUrgente = dias !== null && dias <= 7
            const etapaAtual = p.etapas[p.etapa_atual] ?? (p.etapa_atual >= p.etapas.length ? 'Concluído' : '—')

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 space-y-3"
              >
                {/* Row 1: badges + ref + deadline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status} />
                    <Badge variant={p.prioridade} />
                    {urgencia !== 'normal' && <Badge variant={urgencia} />}
                    {p.referencia_interna && (
                      <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                        {p.referencia_interna}
                      </span>
                    )}
                  </div>
                  {p.data_prazo && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${prazoUrgente ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatDate(p.data_prazo)}
                      </span>
                      {dias !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          prazoUrgente ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {dias === 0 ? 'Hoje' : dias < 0 ? `${Math.abs(dias)}d atraso` : `${dias}d`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 2: title + client */}
                <div>
                  <h3 className="font-medium text-gray-900">{p.titulo}</h3>
                  {p.clientes?.nome && <p className="text-sm text-gray-400 mt-0.5">{p.clientes.nome}</p>}
                </div>

                {/* Row 3: current step */}
                {p.etapas.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Etapa atual: <span className="text-gray-600 font-medium">{etapaAtual}</span>
                    {' '}({p.etapa_atual}/{p.etapas.length})
                  </p>
                )}

                {/* Row 4: progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar current={p.etapa_atual} total={p.etapas.length} showLabel={false} color={urgencia} />
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 w-9 text-right">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
