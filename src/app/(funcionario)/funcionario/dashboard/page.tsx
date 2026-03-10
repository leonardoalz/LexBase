import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { FuncionarioDashboardClient } from './FuncionarioDashboardClient'

export default async function FuncionarioDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  const { data: funcionario } = await serviceSupabase
    .from('funcionarios')
    .select('id, nome')
    .eq('auth_user_id', user.id)
    .single()

  if (!funcionario) redirect('/login')

  const { data: processos } = await serviceSupabase
    .from('processos')
    .select('id, titulo, status, prioridade, referencia_interna, data_prazo, etapa_atual, etapas, clientes(nome)')
    .eq('funcionario_id', funcionario.id)
    .order('created_at', { ascending: false })

  const rows = (processos ?? []).map(p => ({
    ...p,
    clientes: p.clientes as unknown as { nome: string } | null,
  }))

  return <FuncionarioDashboardClient processos={rows} funcionarioNome={funcionario.nome} />
}
