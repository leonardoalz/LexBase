import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProcessosList } from './ProcessosList'

export default async function ProcessosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const [
    { data: processos },
    { data: clientes },
    { data: tiposProcesso },
    { data: funcionarios },
  ] = await Promise.all([
    supabase
      .from('processos')
      .select('id, titulo, status, prioridade, referencia_interna, data_prazo, etapa_atual, etapas, clientes(nome)')
      .eq('escritorio_id', escritorio.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clientes')
      .select('id, nome, email')
      .eq('escritorio_id', escritorio.id)
      .order('nome'),
    supabase
      .from('tipos_processo')
      .select('id, nome, etapas_padrao, documentos_padrao')
      .order('nome'),
    supabase
      .from('funcionarios')
      .select('id, nome')
      .eq('escritorio_id', escritorio.id)
      .eq('active', true)
      .order('nome'),
  ])

  const rows = (processos ?? []).map(p => ({
    ...p,
    clientes: (p.clientes as unknown as { nome: string } | null),
  }))

  return (
    <ProcessosList
      processos={rows}
      escritorioId={escritorio.id}
      clientes={clientes ?? []}
      tiposProcesso={(tiposProcesso ?? []) as { id: string; nome: string; etapas_padrao: string[]; documentos_padrao: { nome: string; descricao: string; obrigatorio: boolean }[] }[]}
      funcionarios={funcionarios ?? []}
    />
  )
}
