export const PROCESSO_STATUS = ['ativo', 'concluido', 'cancelado', 'suspenso', 'indeferido'] as const
export type ProcessoStatus = typeof PROCESSO_STATUS[number]

export const DOCUMENTO_STATUS = ['pendente', 'recebido', 'aprovado', 'rejeitado', 'nao_aplicavel'] as const
export type DocumentoStatus = typeof DOCUMENTO_STATUS[number]

export const PRIORIDADE = ['escritorio', 'cliente', 'orgao_externo'] as const
export type Prioridade = typeof PRIORIDADE[number]

export const PRIORIDADE_LABELS: Record<string, string> = {
  escritorio: 'Escritório',
  cliente: 'Cliente',
  orgao_externo: 'Órgão externo',
}

export const PROCESSO_STATUS_LABELS: Record<string, string> = {
  ativo: 'Reativado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  indeferido: 'Indeferido',
  suspenso: 'Suspenso',
}

export const DOCUMENTO_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  nao_aplicavel: 'Não aplicável',
}
