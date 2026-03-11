export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse mb-3" />
            <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1.5" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-5 w-52 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
