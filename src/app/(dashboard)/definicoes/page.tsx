import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DefinicoesClient } from './DefinicoesClient'

export default async function DefinicoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase
    .from('escritorios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!escritorio) redirect('/login')

  return <DefinicoesClient escritorio={escritorio} email={user.email ?? ''} />
}
