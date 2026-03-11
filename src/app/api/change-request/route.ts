import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@imigraflow.pt'

interface CampoDiff {
  de: string
  para: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { escritorio_id, escritorio_nome, campos } = body as {
      escritorio_id: string
      escritorio_nome: string
      campos: Record<string, CampoDiff>
    }

    if (!escritorio_id || !escritorio_nome || !campos || Object.keys(campos).length === 0) {
      return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
    }

    const linhas = Object.entries(campos)
      .map(([campo, { de, para }]) => `
        <tr>
          <td style="padding:8px 12px;color:#6b7280;width:140px;font-size:13px;border-bottom:1px solid #f3f4f6">${campo}</td>
          <td style="padding:8px 12px;color:#ef4444;font-size:13px;border-bottom:1px solid #f3f4f6;text-decoration:line-through">${de || '—'}</td>
          <td style="padding:8px 12px;color:#16a34a;font-weight:500;font-size:13px;border-bottom:1px solid #f3f4f6">${para || '—'}</td>
        </tr>
      `)
      .join('')

    await resend.emails.send({
      from: 'ImigraFlow <noreply@imigraflow.pt>',
      to: ADMIN_EMAIL,
      subject: `[ImigraFlow] Pedido de alteração — ${escritorio_nome}`,
      html: `
        <div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px 0">
          <h2 style="margin:0 0 8px;color:#111827">Pedido de alteração de dados</h2>
          <p style="color:#6b7280;margin:0 0 24px">O escritório <strong>${escritorio_nome}</strong> (ID: <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px">${escritorio_id}</code>) solicitou as seguintes alterações:</p>
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Campo</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Valor atual</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Novo valor</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
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
