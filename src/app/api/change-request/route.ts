import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@imigraflow.pt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { escritorio_id, escritorio_nome, campos } = body

    const linhas = Object.entries(campos as Record<string, string>)
      .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#6b7280;width:140px">${k}</td><td style="padding:6px 12px;font-weight:500">${v || '—'}</td></tr>`)
      .join('')

    await resend.emails.send({
      from: 'ImigraFlow <noreply@imigraflow.pt>',
      to: ADMIN_EMAIL,
      subject: `[ImigraFlow] Pedido de alteração — ${escritorio_nome}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 0">
          <h2 style="margin:0 0 8px;color:#111827">Pedido de alteração de dados</h2>
          <p style="color:#6b7280;margin:0 0 24px">O escritório <strong>${escritorio_nome}</strong> (ID: ${escritorio_id}) solicitou as seguintes alterações:</p>
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
            ${linhas}
          </table>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">Acesse o painel de administração para aprovar ou rejeitar esta alteração.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar pedido' }, { status: 500 })
  }
}
