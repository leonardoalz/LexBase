import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProcessoDetailClient } from './ProcessoDetailClient'

export default async function ProcessoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const { data: processo } = await supabase
    .from('processos')
    .select('*, clientes(*)')
    .eq('id', id)
    .eq('escritorio_id', escritorio.id)
    .single()

  if (!processo) notFound()

  const [{ data: documentos }, { data: eventos }, { data: funcionarios }] = await Promise.all([
    supabase.from('documentos').select('*').eq('processo_id', id).order('created_at'),
    supabase.from('eventos').select('*').eq('processo_id', id).order('created_at', { ascending: false }),
    supabase.from('funcionarios').select('*').eq('escritorio_id', escritorio.id).eq('active', true).order('nome'),
  ])

  return (
    <ProcessoDetailClient
      processo={processo}
      documentos={documentos ?? []}
      eventos={eventos ?? []}
      escritorioId={escritorio.id}
      funcionarios={funcionarios ?? []}
    />
  )
}
