import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { funcionario_id, email, nome } = await request.json()
    if (!funcionario_id || !email) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/funcionario/dashboard`,
      data: { funcionario_nome: nome },
    })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Erro ao enviar convite' }, { status: 500 })
    }

    await supabase.from('funcionarios').update({ auth_user_id: data.user.id }).eq('id', funcionario_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
