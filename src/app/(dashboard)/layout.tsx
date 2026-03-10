import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: escritorio } = await supabase
    .from('escritorios')
    .select('nome')
    .eq('user_id', user.id)
    .single()

  if (!escritorio) {
    const { data: func } = await supabase.from('funcionarios').select('id').eq('auth_user_id', user.id).single()
    if (func) redirect('/funcionario/dashboard')
    else redirect('/login')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f5f5f3]">
        <Sidebar escritorioNome={escritorio?.nome ?? 'Escritório'} />
        <main className="ml-56 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
