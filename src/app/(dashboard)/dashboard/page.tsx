import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Processo, Evento } from '@/types/database'
import { FolderOpen, FileText, Bell, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const eid = escritorio.id
  const today = new Date().toISOString().split('T')[0]
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { count: processosAtivos },
    { count: docsPendentes },
    { count: alertasHoje },
    { count: processosConcluidosMes },
    { data: processosUrgentes },
    { data: eventos },
  ] = await Promise.all([
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('escritorio_id', eid).eq('status', 'ativo'),
    supabase.from('documentos').select('*', { count: 'exact', head: true }).eq('escritorio_id', eid).eq('status', 'pendente'),
    supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('escritorio_id', eid).eq('data_alerta', today).eq('status', 'pendente'),
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('escritorio_id', eid).eq('status', 'concluido').gte('updated_at', startOfMonth),
    supabase.from('processos')
      .select('*, clientes(nome)')
      .eq('escritorio_id', eid)
      .eq('status', 'ativo')
      .not('data_prazo', 'is', null)
      .lte('data_prazo', in30days)
      .order('data_prazo', { ascending: true })
      .limit(10),
    supabase.from('eventos')
      .select('*, processos(titulo, clientes(nome))')
      .eq('escritorio_id', eid)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const metrics = [
    { label: 'Processos Ativos', value: processosAtivos ?? 0, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Documentos Pendentes', value: docsPendentes ?? 0, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Alertas Hoje', value: alertasHoje ?? 0, icon: Bell, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Concluídos este mês', value: processosConcluidosMes ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(today)}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Urgent processes table */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Processos com Prazo Próximo
            </h2>
          </div>
          {processosUrgentes && processosUrgentes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-50">
                  <th className="text-left px-6 py-3">Processo</th>
                  <th className="text-left px-6 py-3">Cliente</th>
                  <th className="text-left px-6 py-3">Prazo</th>
                  <th className="text-left px-6 py-3">Em posse</th>
                </tr>
              </thead>
              <tbody>
                {processosUrgentes.map((p: Processo & { clientes: { nome: string } | null }) => {
                  const dias = daysUntil(p.data_prazo)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link href={`/processos/${p.id}`} className="text-blue-600 hover:underline font-medium">
                          {p.titulo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{p.clientes?.nome ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`font-medium ${dias !== null && dias <= 7 ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(p.data_prazo)}
                          {dias !== null && <span className="text-xs ml-1 text-gray-400">({dias}d)</span>}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={p.prioridade} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Sem processos com prazo nos próximos 30 dias
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {eventos && eventos.length > 0 ? eventos.map((e: Evento & { processos: { titulo: string; clientes: { nome: string } | null } | null }) => (
              <div key={e.id} className="px-5 py-3">
                <p className="text-sm text-gray-800 font-medium">{e.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {e.processos?.clientes?.nome ?? ''} · {formatDate(e.created_at)}
                </p>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">Sem atividade recente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
