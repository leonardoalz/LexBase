import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  sendEtapaAvancada,
  sendDocumentoAprovado,
  sendDocumentoRejeitado,
  sendNovoDocumentoAdvogado,
  sendEmailPersonalizado,
} from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, processo_id, documento_id, corpo } = body

    if (!processo_id) return NextResponse.json({ error: 'processo_id obrigatório' }, { status: 400 })

    const supabase = await createServiceClient()

    const { data: processo } = await supabase
      .from('processos')
      .select('*, clientes(*), escritorios(*)')
      .eq('id', processo_id)
      .single()

    if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

    const cliente = processo.clientes as { nome: string; email: string; portal_token: string } | null
    const escritorio = processo.escritorios as { email: string; nome: string } | null
    if (!cliente || !escritorio) return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const processoUrl = `${appUrl}/processos/${processo.id}`

    switch (type) {
      case 'etapa_avancada': {
        const etapaIdx = processo.etapa_atual - 1
        const etapas = processo.etapas as string[]
        await sendEtapaAvancada({
          clienteNome: cliente.nome,
          clienteEmail: cliente.email,
          portalToken: cliente.portal_token,
          processoTitulo: processo.titulo,
          etapaAtual: etapas[etapaIdx] ?? '',
          proximaEtapa: etapas[etapaIdx + 1] ?? '',
        })
        break
      }

      case 'documento_aprovado': {
        if (!documento_id) break
        const { data: doc } = await supabase.from('documentos').select('nome').eq('id', documento_id).single()
        if (doc) await sendDocumentoAprovado({
          clienteNome: cliente.nome,
          clienteEmail: cliente.email,
          portalToken: cliente.portal_token,
          documentoNome: doc.nome,
        })
        break
      }

      case 'documento_rejeitado': {
        if (!documento_id) break
        const { data: doc } = await supabase.from('documentos').select('nome, notas').eq('id', documento_id).single()
        if (doc) await sendDocumentoRejeitado({
          clienteNome: cliente.nome,
          clienteEmail: cliente.email,
          portalToken: cliente.portal_token,
          documentoNome: doc.nome,
          notaRejeicao: doc.notas ?? '',
        })
        break
      }

      case 'documento_recebido': {
        if (!documento_id) break
        const { data: doc } = await supabase.from('documentos').select('nome').eq('id', documento_id).single()
        if (doc) await sendNovoDocumentoAdvogado({
          advogadoEmail: escritorio.email,
          clienteNome: cliente.nome,
          documentoNome: doc.nome,
          processoUrl,
        })
        break
      }

      case 'email_personalizado': {
        if (!corpo) break
        await sendEmailPersonalizado({
          clienteNome: cliente.nome,
          clienteEmail: cliente.email,
          portalToken: cliente.portal_token,
          processoTitulo: processo.titulo,
          corpo,
        })
        // Log event
        await supabase.from('eventos').insert({
          processo_id,
          escritorio_id: processo.escritorio_id,
          tipo: 'email_enviado',
          titulo: 'Email personalizado enviado ao cliente',
          visivel_cliente: false,
          created_by: 'advogado',
        })
        break
      }

      default:
        return NextResponse.json({ error: `Tipo desconhecido: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notify error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
