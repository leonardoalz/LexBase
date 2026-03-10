import { createClient } from '@/lib/supabase/server'
import { PortalClient } from './PortalClient'
import { PortalData } from '@/types/database'

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Small delay to prevent token enumeration
  await new Promise(r => setTimeout(r, 300))

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_portal_data', { p_token: token })

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-gray-900">Link inválido</h1>
          <p className="text-gray-500 text-sm mt-2">Este link não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  const portalData = data as PortalData

  return <PortalClient data={portalData} />
}
