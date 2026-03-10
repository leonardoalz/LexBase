import { cn } from '@/lib/utils'

const colorClass: Record<string, string> = {
  // Urgência (novo sistema)
  critico: 'bg-red-500',
  atencao: 'bg-amber-400',
  em_andamento: 'bg-blue-500',
  aguardando: 'bg-gray-300',
  // Legacy
  urgente: 'bg-red-500',
  alta: 'bg-orange-500',
  normal: 'bg-blue-600',
  baixa: 'bg-gray-400',
}

interface ProgressBarProps {
  current: number
  total: number
  className?: string
  showLabel?: boolean
  color?: string
}

export function ProgressBar({ current, total, className, showLabel = true, color = 'normal' }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const bar = colorClass[color] ?? 'bg-blue-600'
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Etapa {current} de {total}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
