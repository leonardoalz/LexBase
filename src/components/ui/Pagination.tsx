'use client'

interface Props {
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, null, total]
  if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total]
  return [1, null, current - 1, current, current + 1, null, total]
}

export function Pagination({ total, page, perPage, onPageChange }: Props) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-gray-500">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                page === p
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}
