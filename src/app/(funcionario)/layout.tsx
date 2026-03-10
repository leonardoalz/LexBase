import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'

export default async function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const { data: funcionario } = await serviceSupabase
    .from('funcionarios')
    .select('nome, escritorios(nome)')
    .eq('auth_user_id', user.id)
    .single()

  if (!funcionario) redirect('/login')

  const escritorioNome = (funcionario.escritorios as unknown as { nome: string } | null)?.nome ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-900">{escritorioNome}</span>
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-sm text-gray-500">{funcionario.nome}</span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
