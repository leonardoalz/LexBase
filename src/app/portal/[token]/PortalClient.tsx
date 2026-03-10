'use client'

import { useState } from 'react'
import { PortalData, Documento, PortalProcesso } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { FileUpload } from '@/components/ui/FileUpload'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, Circle, AlertCircle, Upload, ChevronRight, FileText } from 'lucide-react'

interface Props {
  data: PortalData
}

export function PortalClient({ data }: Props) {
  const { cliente, processos } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-blue-600">ImigraFlow</span>
            <span className="text-xs text-gray-400 ml-2">Portal do Cliente</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{cliente.nome}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Olá, {cliente.nome.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe o estado dos seus processos aqui.</p>
        </div>

        {!processos || processos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-500">Ainda não tem processos ativos.</p>
          </div>
        ) : (
          processos.map((pp) => (
            <ProcessoCard key={pp.processo.id} pp={pp} clienteId={cliente.id} />
          ))
        )}
      </main>
    </div>
  )
}

function ProcessoCard({ pp, clienteId }: { pp: PortalProcesso; clienteId: string }) {
  const { processo, documentos, eventos } = pp
  const [docs, setDocs] = useState<Documento[]>(documentos ?? [])
  const [showUpload, setShowUpload] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const pendentes = docs.filter(d => d.status === 'pendente' || d.status === 'rejeitado')
  const entregues = docs.filter(d => d.status === 'recebido' || d.status === 'aprovado' || d.status === 'nao_aplicavel')

  async function handleUpload(docId: string, token: string) {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('documento_id', docId)
    formData.append('uploaded_by', 'cliente')
    formData.append('token', token)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      setDocs(d => d.map(doc => doc.id === docId ? { ...doc, status: 'recebido', uploaded_at: new Date().toISOString() } : doc))
      setShowUpload(null)
      setUploadFile(null)
    } else {
      const body = await res.json().catch(() => ({}))
      setUploadError(body.error ?? 'Erro ao enviar ficheiro.')
    }
    setUploading(false)
  }

  // We need token from URL for upload
  const token = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() ?? '' : ''

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Process header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={processo.status} />
        </div>
        <h2 className="font-semibold text-gray-900">{processo.titulo}</h2>
        <div className="mt-3">
          <ProgressBar current={processo.etapa_atual} total={processo.etapas.length} />
        </div>
      </div>

      {/* Steps */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Etapas</h3>
        <div className="space-y-2">
          {processo.etapas.map((etapa, i) => {
            const done = i < processo.etapa_atual
            const current = i === processo.etapa_atual
            return (
              <div key={i} className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : current ? (
                  <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-200 flex-shrink-0" />
                )}
                <span className={`text-sm ${done ? 'text-gray-300 line-through' : current ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                  {etapa}
                </span>
                {current && <span className="ml-auto text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Atual</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Documents to send */}
      {pendentes.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Documentos que precisa enviar ({pendentes.length})
          </h3>
          <div className="space-y-3">
            {pendentes.map(doc => (
              <div key={doc.id} className={`rounded-lg p-3 border ${doc.status === 'rejeitado' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status} />
                      {doc.obrigatorio && <span className="text-xs text-gray-400">Obrigatório</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{doc.nome}</p>
                    {doc.descricao && <p className="text-xs text-gray-500">{doc.descricao}</p>}
                    {doc.status === 'rejeitado' && doc.notas && (
                      <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {doc.notas}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowUpload(doc.id); setUploadFile(null); setUploadError(null) }}
                    className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0 ml-3"
                  >
                    <Upload className="h-3 w-3" />
                    Enviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents delivered */}
      {entregues.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Documentos entregues ({entregues.length})
          </h3>
          <div className="space-y-2">
            {entregues.map(doc => (
              <div key={doc.id} className="flex items-center gap-2">
                <Badge variant={doc.status} />
                <span className="text-sm text-gray-600">{doc.nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events feed */}
      {eventos && eventos.length > 0 && (
        <div className="p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Atualizações</h3>
          <div className="space-y-3">
            {eventos.slice(0, 5).map(e => (
              <div key={e.id} className="flex gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  {e.tipo === 'etapa_avancada' ? <ChevronRight className="h-4 w-4 text-blue-400" /> :
                   e.tipo === 'documento_aprovado' ? <CheckCircle className="h-4 w-4 text-green-400" /> :
                   <FileText className="h-4 w-4 text-gray-300" />}
                </div>
                <div>
                  <p className="text-sm text-gray-700">{e.titulo}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(e.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload modal */}
      <Modal
        open={!!showUpload}
        onOpenChange={() => { setShowUpload(null); setUploadFile(null); setUploadError(null) }}
        title="Enviar documento"
        description={showUpload ? docs.find(d => d.id === showUpload)?.nome : undefined}
      >
        <div className="space-y-4">
          <FileUpload onFileSelect={setUploadFile} />
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowUpload(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button
              onClick={() => showUpload && handleUpload(showUpload, token)}
              disabled={!uploadFile || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'A enviar...' : 'Enviar documento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
