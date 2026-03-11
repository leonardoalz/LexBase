import { Resend } from 'resend'
import { getPortalUrl } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'ImigraFlow <noreply@imigraflow.pt>'

function btn(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;background:#1a56db;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`
}

function layout(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
${content}
<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
<p style="color:#9ca3af;font-size:12px;margin:0;">ImigraFlow · Gestão de processos de imigração</p>
</div></body></html>`
}

// 1. Boas-vindas ao cliente
export async function sendBoasVindasCliente({ clienteNome, clienteEmail, portalToken, escritorioNome }: {
  clienteNome: string; clienteEmail: string; portalToken: string; escritorioNome: string
}) {
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: 'O seu portal de acompanhamento de processo está pronto',
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Olá, ${clienteNome}!</h2>
      <p style="color:#6b7280;">O escritório <strong>${escritorioNome}</strong> criou o seu portal de acompanhamento de processos.</p>
      <p style="color:#6b7280;">Pode acompanhar o estado dos seus processos, ver quais documentos são necessários e enviar documentos diretamente através do portal.</p>
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Aceder ao meu portal')}</div>
      <p style="color:#9ca3af;font-size:12px;">Este link é único e pessoal. Não partilhe com terceiros.</p>
    `),
  })
}

// 2. Novo processo
export async function sendNovoProcesso({ clienteNome, clienteEmail, portalToken, processoTitulo }: {
  clienteNome: string; clienteEmail: string; portalToken: string; processoTitulo: string
}) {
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: `Processo iniciado: ${processoTitulo}`,
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Novo processo aberto</h2>
      <p style="color:#6b7280;">Olá ${clienteNome},</p>
      <p style="color:#6b7280;">Foi iniciado um novo processo para si: <strong>${processoTitulo}</strong>.</p>
      <p style="color:#6b7280;">Aceda ao seu portal para ver os documentos necessários e acompanhar o progresso.</p>
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Ver processo')}</div>
    `),
  })
}

// 3. Etapa avançada
export async function sendEtapaAvancada({ clienteNome, clienteEmail, portalToken, processoTitulo, etapaAtual, proximaEtapa }: {
  clienteNome: string; clienteEmail: string; portalToken: string; processoTitulo: string; etapaAtual: string; proximaEtapa: string
}) {
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: `Atualização do seu processo: ${etapaAtual}`,
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">O seu processo avançou!</h2>
      <p style="color:#6b7280;">Olá ${clienteNome},</p>
      <p style="color:#6b7280;">O processo <strong>${processoTitulo}</strong> avançou para uma nova etapa.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#166534;font-weight:600;">✓ ${etapaAtual}</p>
      </div>
      ${proximaEtapa ? `<p style="color:#6b7280;">Próxima etapa: <strong>${proximaEtapa}</strong></p>` : '<p style="color:#6b7280;">O processo foi concluído!</p>'}
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Ver detalhe')}</div>
    `),
  })
}

// 4. Documento aprovado
export async function sendDocumentoAprovado({ clienteNome, clienteEmail, portalToken, documentoNome }: {
  clienteNome: string; clienteEmail: string; portalToken: string; documentoNome: string
}) {
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: 'Documento aprovado ✓',
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Documento aprovado!</h2>
      <p style="color:#6b7280;">Olá ${clienteNome},</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#166534;font-weight:600;">✓ ${documentoNome}</p>
      </div>
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Ver portal')}</div>
    `),
  })
}

// 5. Documento rejeitado
export async function sendDocumentoRejeitado({ clienteNome, clienteEmail, portalToken, documentoNome, notaRejeicao }: {
  clienteNome: string; clienteEmail: string; portalToken: string; documentoNome: string; notaRejeicao: string
}) {
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: '⚠️ Documento precisa ser substituído',
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Ação necessária: documento rejeitado</h2>
      <p style="color:#6b7280;">Olá ${clienteNome},</p>
      <p style="color:#6b7280;">O documento <strong>${documentoNome}</strong> foi rejeitado e precisa de ser substituído.</p>
      ${notaRejeicao ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#9a3412;"><strong>Motivo:</strong> ${notaRejeicao}</p></div>` : ''}
      <p style="color:#6b7280;">Aceda ao portal e reenvie o documento corrigido.</p>
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Enviar documento')}</div>
    `),
  })
}

// 6. Novo documento recebido (para o advogado)
export async function sendNovoDocumentoAdvogado({ advogadoEmail, clienteNome, documentoNome, processoUrl }: {
  advogadoEmail: string; clienteNome: string; documentoNome: string; processoUrl: string
}) {
  await resend.emails.send({
    from: FROM, to: advogadoEmail,
    subject: `Novo documento recebido — ${clienteNome}`,
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Novo documento recebido</h2>
      <p style="color:#6b7280;">O cliente <strong>${clienteNome}</strong> enviou um novo documento:</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#1e40af;font-weight:600;">${documentoNome}</p>
      </div>
      <div style="margin:24px 0;">${btn(processoUrl, 'Ver processo')}</div>
    `),
  })
}

// 7. Alerta de prazo (para o advogado)
export async function sendAlertaPrazo({ advogadoEmail, processoTitulo, diasRestantes, processoUrl }: {
  advogadoEmail: string; processoTitulo: string; diasRestantes: number; processoUrl: string
}) {
  await resend.emails.send({
    from: FROM, to: advogadoEmail,
    subject: `⏰ Prazo em ${diasRestantes} dias: ${processoTitulo}`,
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Alerta de prazo</h2>
      <p style="color:#6b7280;">O processo <strong>${processoTitulo}</strong> tem prazo em <strong>${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}</strong>.</p>
      <div style="margin:24px 0;">${btn(processoUrl, 'Ver processo')}</div>
    `),
  })
}

// 8. Email personalizado (corpo escrito pelo advogado)
export async function sendEmailPersonalizado({ clienteNome, clienteEmail, portalToken, processoTitulo, corpo }: {
  clienteNome: string; clienteEmail: string; portalToken: string; processoTitulo: string; corpo: string
}) {
  const corpoHtml = corpo.replace(/\n/g, '<br>')
  await resend.emails.send({
    from: FROM, to: clienteEmail,
    subject: `Mensagem sobre o seu processo: ${processoTitulo}`,
    html: layout(`
      <h2 style="color:#111827;margin:0 0 8px;">Mensagem do seu escritório</h2>
      <p style="color:#6b7280;line-height:1.6;">${corpoHtml}</p>
      <div style="margin:24px 0;">${btn(getPortalUrl(portalToken), 'Ver portal')}</div>
    `),
  })
}
