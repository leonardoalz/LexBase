export default function ClientesLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-8 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="grid grid-cols-5 gap-4">
            {['Nome', 'Email', 'Nacionalidade', 'Processos ativos', 'Criado em'].map(col => (
              <div key={col} className="h-3 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-3 grid grid-cols-5 gap-4 items-center">
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-16 bg-blue-100 rounded-full animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
