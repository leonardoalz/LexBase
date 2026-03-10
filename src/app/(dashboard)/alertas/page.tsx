import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertasClient } from './AlertasClient'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, processos(titulo)')
    .eq('escritorio_id', escritorio.id)
    .order('data_alerta', { ascending: true })

  const { data: processos } = await supabase
    .from('processos')
    .select('id, titulo')
    .eq('escritorio_id', escritorio.id)
    .eq('status', 'ativo')
    .order('titulo')

  return <AlertasClient alertas={alertas ?? []} processos={processos ?? []} escritorioId={escritorio.id} />
}
