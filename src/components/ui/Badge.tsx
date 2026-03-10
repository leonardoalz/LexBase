import { cn } from '@/lib/utils'

type Variant =
  | 'pendente' | 'recebido' | 'aprovado' | 'rejeitado' | 'nao_aplicavel'
  | 'ativo' | 'concluido' | 'cancelado' | 'suspenso' | 'indeferido'
  | 'escritorio' | 'cliente' | 'orgao_externo'
  | 'critico' | 'atencao'
  | 'baixa' | 'normal' | 'alta' | 'urgente'
  | 'default'

const variants: Record<Variant, string> = {
  // Documento status
  pendente: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
  nao_aplicavel: 'bg-gray-100 text-gray-500',
  // Processo status
  ativo: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-600',
  suspenso: 'bg-gray-100 text-gray-600',
  indeferido: 'bg-gray-100 text-gray-600',
  // Responsável atual (ball in court)
  escritorio: 'bg-blue-100 text-blue-800',
  cliente: 'bg-orange-100 text-orange-800',
  orgao_externo: 'bg-gray-100 text-gray-700',
  // Urgência de prazo
  critico: 'bg-red-100 text-red-700',
  atencao: 'bg-amber-100 text-amber-700',
  // Legacy
  baixa: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-700',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-700',
}

const labels: Record<Variant, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  nao_aplicavel: 'N/A',
  ativo: 'Ativo',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  suspenso: 'Suspenso',
  indeferido: 'Indeferido',
  escritorio: 'Escritório',
  cliente: 'Cliente',
  orgao_externo: 'Órgão externo',
  critico: 'Crítico',
  atencao: 'Atenção',
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
  default: '',
}

interface BadgeProps {
  variant: Variant
  label?: string
  className?: string
}

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {label ?? labels[variant]}
    </span>
  )
}
