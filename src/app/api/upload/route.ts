import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 15 * 1024 * 1024 // 15MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentoId = formData.get('documento_id') as string | null
    const uploadedBy = formData.get('uploaded_by') as 'advogado' | 'cliente' | null
    const token = formData.get('token') as string | null

    if (!file || !documentoId || !uploadedBy) {
      return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de ficheiro não suportado' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 15MB)' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Get documento with processo info
    const { data: documento, error: docError } = await supabase
      .from('documentos')
      .select('*, processos(*, clientes(portal_token, nome, email), escritorios(email, nome))')
      .eq('id', documentoId)
      .single()

    if (docError || !documento) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // For client uploads: validate token matches
    if (uploadedBy === 'cliente') {
      if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 401 })
      const processo = documento.processos as { clientes: { portal_token: string } | null } | null
      if (processo?.clientes?.portal_token !== token) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
      }
    } else {
      // For advogado uploads: would normally validate session, simplified for now
    }

    const processo = documento.processos as {
      id: string; escritorio_id: string; prioridade: string;
      clientes: { portal_token: string; nome: string; email: string } | null;
      escritorios: { email: string; nome: string } | null
    } | null

    if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

    // Build storage path
    const ext = file.name.split('.').pop() ?? 'bin'
    const storagePath = `documentos/${processo.escritorio_id}/${processo.id}/${documentoId}/${Date.now()}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, bytes, { contentType: file.type, upsert: true })

    if (storageError) {
      return NextResponse.json({ error: 'Erro no upload: ' + storageError.message }, { status: 500 })
    }

    // Update document record
    await supabase.from('documentos').update({
      status: 'recebido',
      uploaded_by: uploadedBy,
      storage_path: storagePath,
      nome_ficheiro_original: file.name,
      tamanho_bytes: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString(),
    }).eq('id', documentoId)

    // When client uploads, ball goes back to the office
    if (uploadedBy === 'cliente') {
      await supabase.from('processos').update({ prioridade: 'escritorio' }).eq('id', processo.id)
    }

    // Create event
    await supabase.from('eventos').insert({
      processo_id: processo.id,
      escritorio_id: processo.escritorio_id,
      tipo: 'documento_recebido',
      titulo: `Documento recebido: ${documento.nome}`,
      visivel_cliente: true,
      created_by: uploadedBy,
    })

    // Notify
    if (uploadedBy === 'cliente') {
      fetch(new URL('/api/notify', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'documento_recebido', processo_id: processo.id, documento_id: documentoId }),
      }).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
