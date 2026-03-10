import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check — only authenticated lawyers
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
  if (!escritorio) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

  const { data: doc } = await supabase
    .from('documentos')
    .select('storage_path, nome_ficheiro_original, escritorio_id')
    .eq('id', id)
    .eq('escritorio_id', escritorio.id)
    .single()

  if (!doc || !doc.storage_path) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  }

  const { data: signedUrl, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(doc.storage_path, 3600, {
      download: doc.nome_ficheiro_original ?? undefined,
    })

  if (error || !signedUrl) {
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
