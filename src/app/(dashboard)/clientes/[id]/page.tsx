import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClienteDetailClient } from './ClienteDetailClient'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('escritorio_id', escritorio.id)
    .single()

  if (!cliente) notFound()

  const { data: processos } = await supabase
    .from('processos')
    .select('id, titulo, status, prioridade, data_prazo, data_inicio, etapa_atual, etapas')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false })

  const [{ data: tiposProcesso }, { data: funcionarios }] = await Promise.all([
    supabase.from('tipos_processo').select('*'),
    supabase.from('funcionarios').select('*').eq('escritorio_id', escritorio.id).eq('active', true).order('nome'),
  ])

  return (
    <ClienteDetailClient
      cliente={cliente}
      processos={processos ?? []}
      tiposProcesso={tiposProcesso ?? []}
      escritorioId={escritorio.id}
      funcionarios={funcionarios ?? []}
    />
  )
}
