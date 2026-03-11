'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Processo, Documento } from '@/types/database'

type EmailTemplate = 'faltam_documentos' | 'atualizacao_estado' | 'agendamento' | 'concluido'

const templateLabels: Record<EmailTemplate, string> = {
  faltam_documentos: 'Faltam documentos',
  atualizacao_estado: 'Atualização de estado',
  agendamento: 'Agendamento marcado',
  concluido: 'Processo concluído',
}

function gerarTextoEmail(template: EmailTemplate, processo: Processo, documentos: Documento[]): string {
  const pendentes = documentos
    .filter(d => d.status === 'pendente' || d.status === 'rejeitado')
    .map(d => `• ${d.nome}`)
  const etapaAtual = processo.etapas[processo.etapa_atual] ?? 'em análise'

  switch (template) {
    case 'faltam_documentos':
      return `Exmo(a) Sr(a).,\n\nInformamos que, para prosseguir com o seu processo "${processo.titulo}", necessitamos ainda dos seguintes documentos:\n\n${pendentes.join('\n') || '• (nenhum pendente)'}\n\nQueira, por favor, enviar os documentos em falta através do portal de cliente, ou contactar-nos caso tenha alguma dúvida.\n\nCom os melhores cumprimentos,`
    case 'atualizacao_estado':
      return `Exmo(a) Sr(a).,\n\nVimos por este meio informar que o seu processo "${processo.titulo}" se encontra atualmente na fase: ${etapaAtual}.\n\nPode acompanhar o estado detalhado do seu processo no portal de cliente.\n\nEstamos à sua disposição para qualquer esclarecimento.\n\nCom os melhores cumprimentos,`
    case 'agendamento':
      return `Exmo(a) Sr(a).,\n\nInformamos que foi marcado um agendamento no âmbito do seu processo "${processo.titulo}".\n\nData: [DATA]\nHora: [HORA]\nLocal: [LOCAL]\n\nPor favor confirme a sua presença respondendo a este email.\n\nCom os melhores cumprimentos,`
    case 'concluido':
      return `Exmo(a) Sr(a).,\n\nTemos o prazer de informar que o seu processo "${processo.titulo}" foi concluído com sucesso.\n\nAgradecemos a confiança depositada no nosso escritório e ficamos ao dispor para qualquer futura necessidade.\n\nCom os melhores cumprimentos,`
  }
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  processo: Processo
  documentos: Documento[]
  onSent: () => void
}

export function EmailGeneratorModal({ open, onOpenChange, processo, documentos, onSent }: Props) {
  const [template, setTemplate] = useState<EmailTemplate>('faltam_documentos')
  const [texto, setTexto] = useState(() => gerarTextoEmail('faltam_documentos', processo, documentos))
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  function changeTemplate(t: EmailTemplate) {
    setTemplate(t)
    setTexto(gerarTextoEmail(t, processo, documentos))
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendEmail() {
    setSending(true)
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email_personalizado', processo_id: processo.id, corpo: texto }),
      })
      onOpenChange(false)
      onSent()
    } catch {
      // onSent with error would need toast — caller handles feedback
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Gerar email para o cliente" className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Situação</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(templateLabels) as EmailTemplate[]).map(t => (
              <button
                key={t}
                onClick={() => changeTemplate(t)}
                className={`px-3 py-2 rounded-lg text-sm border text-left transition-colors ${
                  template === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {templateLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto do email (editável)</label>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            {copied ? '✓ Copiado!' : 'Copiar texto'}
          </button>
          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">
              Fechar
            </button>
            <button
              onClick={sendEmail}
              disabled={sending}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {sending ? 'A enviar...' : 'Enviar por email'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
