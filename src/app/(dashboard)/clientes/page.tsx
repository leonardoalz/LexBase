import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClientesTable } from './ClientesTable'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) redirect('/login')

  const { data: clientes } = await supabase
    .from('clientes')
    .select(`
      id, nome, email, telefone, nacionalidade, created_at,
      processos(id, status)
    `)
    .eq('escritorio_id', escritorio.id)
    .order('created_at', { ascending: false })

  const rows = (clientes ?? []).map(c => ({
    ...c,
    processos: (c.processos ?? []) as { id: string; status: string }[],
  }))

  return (
    <div>
      {rows.length > 0 ? (
        <ClientesTable clientes={rows} />
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500 text-sm mt-1">0 clientes registados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <EmptyState
              icon={Users}
              title="Sem clientes"
              description="Adicione o primeiro cliente para começar a gerir processos."
              action={
                <Link href="/clientes/novo" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Plus className="h-4 w-4" /> Novo Cliente
                </Link>
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
