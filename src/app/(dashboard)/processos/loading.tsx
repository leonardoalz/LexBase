export default function ProcessosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr auto' }}>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2 w-56 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
