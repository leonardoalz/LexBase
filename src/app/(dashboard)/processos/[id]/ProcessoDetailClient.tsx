'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Processo, Documento, Evento, Cliente, Funcionario } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { FileUpload } from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatDateTime, getUrgenciaBorda } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  CheckCircle, Circle, AlertCircle, ChevronRight, Eye, EyeOff,
  Plus, Download, Check, X, Upload, FileText, Clock, Mail, Pencil, Trash2, ChevronDown
} from 'lucide-react'

type ProcessoWithCliente = Processo & { clientes: Cliente }

interface Props {
  processo: ProcessoWithCliente
  documentos: Documento[]
  eventos: Evento[]
  escritorioId: string
  funcionarios: Funcionario[]
}

const eventoIcons: Record<Evento['tipo'], React.ReactNode> = {
  etapa_avancada: <ChevronRight className="h-4 w-4 text-blue-500" />,
  documento_recebido: <FileText className="h-4 w-4 text-yellow-500" />,
  documento_aprovado: <Check className="h-4 w-4 text-green-500" />,
  documento_rejeitado: <X className="h-4 w-4 text-red-500" />,
  nota: <FileText className="h-4 w-4 text-gray-400" />,
  prazo: <Clock className="h-4 w-4 text-orange-500" />,
  email_enviado: <FileText className="h-4 w-4 text-purple-500" />,
}

export function ProcessoDetailClient({ processo: initial, documentos: initialDocs, eventos: initialEvs, escritorioId, funcionarios }: Props) {
  const router = useRouter()
  const [processo, setProcesso] = useState(initial)
  const [documentos, setDocumentos] = useState(initialDocs)
  const [eventos, setEventos] = useState(initialEvs)
  const [showInternal, setShowInternal] = useState(false)
  const [advancingStep, setAdvancingStep] = useState(false)
  const [showConfirmStep, setShowConfirmStep] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showUpload, setShowUpload] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [novoDoc, setNovoDoc] = useState({ nome: '', descricao: '', obrigatorio: true })
  const [uploadLoading, setUploadLoading] = useState(false)
  const [showEmailGen, setShowEmailGen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showResponsavelMenu, setShowResponsavelMenu] = useState(false)
  // Inline editing
  const [editingPrazo, setEditingPrazo] = useState(false)
  const [tempPrazo, setTempPrazo] = useState(processo.data_prazo ?? '')
  const [editingFuncionario, setEditingFuncionario] = useState(false)

  const urgenciaBorda = getUrgenciaBorda(processo.data_prazo)

  async function changeStatus(newStatus: Processo['status']) {
    await supabase.from('processos').update({ status: newStatus }).eq('id', processo.id)
    setProcesso(p => ({ ...p, status: newStatus }))
    setShowStatusMenu(false)
    const labels: Record<string, string> = { ativo: 'Reativado', concluido: 'Concluído', cancelado: 'Cancelado', indeferido: 'Indeferido', suspenso: 'Suspenso' }
    toast(labels[newStatus] ?? 'Estado atualizado.')
  }

  async function changeResponsavel(novaProioridade: Processo['prioridade']) {
    await supabase.from('processos').update({ prioridade: novaProioridade }).eq('id', processo.id)
    setProcesso(p => ({ ...p, prioridade: novaProioridade }))
    setShowResponsavelMenu(false)
    const labels: Record<string, string> = { escritorio: 'Em posse do escritório.', cliente: 'Em posse do cliente.', orgao_externo: 'Em posse de órgão externo.' }
    toast(labels[novaProioridade] ?? 'Responsável atualizado.')
  }

  async function savePrazo() {
    const val = tempPrazo || null
    await supabase.from('processos').update({ data_prazo: val }).eq('id', processo.id)
    setProcesso(p => ({ ...p, data_prazo: val }))
    setEditingPrazo(false)
    toast('Prazo atualizado.')
  }

  async function saveFuncionario(funcionario_id: string | null) {
    await supabase.from('processos').update({ funcionario_id }).eq('id', processo.id)
    setProcesso(p => ({ ...p, funcionario_id }))
    setEditingFuncionario(false)
    toast('Responsável atualizado.')
  }

  async function deleteProcesso() {
    setDeleting(true)
    await supabase.from('alertas').delete().eq('processo_id', processo.id)
    await supabase.from('eventos').delete().eq('processo_id', processo.id)
    await supabase.from('documentos').delete().eq('processo_id', processo.id)
    const { error } = await supabase.from('processos').delete().eq('id', processo.id)
    if (error) {
      toast('Erro ao eliminar processo.', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    } else {
      router.push('/processos')
    }
  }

  const supabase = createClient()
  const { toast } = useToast()

  // ---- Step advancement ----
  async function avancarEtapa() {
    setAdvancingStep(true)
    const novaEtapa = processo.etapa_atual + 1
    const concluido = novaEtapa >= processo.etapas.length
    const update: Record<string, unknown> = { etapa_atual: novaEtapa, prioridade: 'escritorio' }
    if (concluido) update.status = 'concluido'
    const { error } = await supabase
      .from('processos')
      .update(update)
      .eq('id', processo.id)

    if (!error) {
      await supabase.from('eventos').insert({
        processo_id: processo.id,
        escritorio_id: escritorioId,
        tipo: 'etapa_avancada',
        titulo: concluido
          ? 'Processo concluído'
          : `Etapa avançada: ${processo.etapas[novaEtapa - 1] ?? ''} → ${processo.etapas[novaEtapa] ?? ''}`,
        descricao: null,
        visivel_cliente: true,
        created_by: 'advogado',
      })

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'etapa_avancada', processo_id: processo.id }),
      })

      setProcesso(p => ({ ...p, etapa_atual: novaEtapa, prioridade: 'escritorio', ...(concluido ? { status: 'concluido' as const } : {}) }))
      const { data: evs } = await supabase.from('eventos').select('*').eq('processo_id', processo.id).order('created_at', { ascending: false })
      if (evs) setEventos(evs)
      toast(concluido ? 'Processo concluído! Cliente notificado por email.' : 'Etapa avançada! Cliente notificado por email.')
    } else {
      toast('Erro ao avançar etapa.', 'error')
    }
    setAdvancingStep(false)
    setShowConfirmStep(false)
  }

  // ---- Document actions ----
  async function aprovarDoc(docId: string) {
    const nome = documentos.find(d => d.id === docId)?.nome ?? ''
    const { error } = await supabase.from('documentos').update({ status: 'aprovado', reviewed_at: new Date().toISOString() }).eq('id', docId)
    if (!error) {
      setDocumentos(d => d.map(doc => doc.id === docId ? { ...doc, status: 'aprovado', reviewed_at: new Date().toISOString() } : doc))
      await supabase.from('eventos').insert({
        processo_id: processo.id, escritorio_id: escritorioId, tipo: 'documento_aprovado',
        titulo: `Documento aprovado: ${nome}`,
        visivel_cliente: true, created_by: 'advogado',
      })
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'documento_aprovado', processo_id: processo.id, documento_id: docId }),
      })
      toast(`"${nome}" aprovado!`)
    } else {
      toast('Erro ao aprovar documento.', 'error')
    }
  }

  async function rejeitarDoc(docId: string) {
    const nome = documentos.find(d => d.id === docId)?.nome ?? ''
    const { error } = await supabase.from('documentos').update({ status: 'rejeitado', notas: rejectNote.trim(), reviewed_at: new Date().toISOString() }).eq('id', docId)
    if (!error) {
      setDocumentos(d => d.map(doc => doc.id === docId ? { ...doc, status: 'rejeitado', notas: rejectNote.trim() } : doc))
      await supabase.from('eventos').insert({
        processo_id: processo.id, escritorio_id: escritorioId, tipo: 'documento_rejeitado',
        titulo: `Documento rejeitado: ${nome}`,
        descricao: rejectNote.trim() || null,
        visivel_cliente: true, created_by: 'advogado',
      })
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'documento_rejeitado', processo_id: processo.id, documento_id: docId }),
      })
      toast(`"${nome}" rejeitado. Cliente notificado.`, 'info')
    } else {
      toast('Erro ao rejeitar documento.', 'error')
    }
    setShowRejectModal(null)
    setRejectNote('')
  }

  async function addDoc() {
    if (!novoDoc.nome.trim()) return
    const { data, error } = await supabase.from('documentos').insert({
      processo_id: processo.id, escritorio_id: escritorioId,
      nome: novoDoc.nome.trim(), descricao: novoDoc.descricao.trim() || null, obrigatorio: novoDoc.obrigatorio,
    }).select().single()
    if (!error && data) {
      setDocumentos(d => [...d, data])
      setShowAddDoc(false)
      setNovoDoc({ nome: '', descricao: '', obrigatorio: true })
      toast('Documento adicionado à checklist.')
    }
  }

  async function uploadDocAdvogado(docId: string) {
    if (!uploadFile) return
    setUploadLoading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('documento_id', docId)
    formData.append('uploaded_by', 'advogado')

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const { data } = await supabase.from('documentos').select('*').eq('id', docId).single()
      if (data) setDocumentos(d => d.map(doc => doc.id === docId ? data : doc))
      toast('Documento enviado com sucesso.')
    } else {
      toast('Erro ao enviar ficheiro.', 'error')
    }
    setUploadLoading(false)
    setShowUpload(null)
    setUploadFile(null)
  }

  async function downloadDoc(docId: string) {
    const res = await fetch(`/api/download/${docId}`)
    if (res.ok) {
      const { url } = await res.json()
      window.open(url, '_blank')
    } else {
      toast('Erro ao gerar link de download.', 'error')
    }
  }

  const visibleEvs = showInternal ? eventos : eventos.filter(e => e.visivel_cliente)
  const canAdvance = processo.etapa_atual < processo.etapas.length

  return (
    <div className="space-y-6">
      {urgenciaBorda !== 'normal' && (
        <div className={`h-1 rounded-full ${urgenciaBorda === 'critico' ? 'bg-red-400' : 'bg-amber-300'}`} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/processos" className="text-sm text-gray-400 hover:text-gray-600">← Processos</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{processo.titulo}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={processo.status} />
            {/* Clickable Em posse de tag */}
            <div className="relative">
              {showResponsavelMenu && <div className="fixed inset-0 z-10" onClick={() => setShowResponsavelMenu(false)} />}
              <button
                onClick={() => setShowResponsavelMenu(v => !v)}
                className="flex items-center gap-0.5 cursor-pointer"
                title="Mudar em posse de"
              >
                <Badge variant={processo.prioridade} />
                <ChevronDown className="h-3 w-3 text-gray-400 -ml-0.5" />
              </button>
              {showResponsavelMenu && (
                <div className="absolute left-0 top-full mt-1 z-20 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                  {(['escritorio', 'cliente', 'orgao_externo'] as const).filter(r => r !== processo.prioridade).map(r => (
                    <button
                      key={r}
                      onClick={() => changeResponsavel(r)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {r === 'escritorio' ? 'Escritório' : r === 'cliente' ? 'Cliente' : 'Órgão externo'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {urgenciaBorda !== 'normal' && <Badge variant={urgenciaBorda} />}
            {processo.referencia_interna && <span className="text-xs text-gray-400">· Ref: {processo.referencia_interna}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status change dropdown */}
          <div className="relative">
            {showStatusMenu && <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />}
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Estado
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {processo.status !== 'ativo' && (
                  <button onClick={() => changeStatus('ativo')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Reativar</button>
                )}
                {processo.status === 'ativo' && (
                  <>
                    <button onClick={() => changeStatus('concluido')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Concluir</button>
                    <button onClick={() => changeStatus('cancelado')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button onClick={() => changeStatus('indeferido')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Indeferir</button>
                    <button onClick={() => changeStatus('suspenso')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Suspender</button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowEmailGen(true)}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            <Mail className="h-4 w-4" />
            Gerar email
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar processo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-red-700 font-medium">Eliminar processo?</span>
              <button
                onClick={deleteProcesso}
                disabled={deleting}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deleting ? 'A eliminar...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* LEFT — Timeline + Events */}
        <div className="col-span-3 space-y-6">
          {/* Etapas */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Etapas do Processo</h2>
              {canAdvance && (
                <button
                  onClick={() => setShowConfirmStep(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <ChevronRight className="h-4 w-4" />
                  Avançar etapa
                </button>
              )}
            </div>

            <div className="mb-4">
              <ProgressBar current={processo.etapa_atual} total={processo.etapas.length} />
            </div>

            <div className="space-y-2">
              {processo.etapas.map((etapa, i) => {
                const done = i < processo.etapa_atual
                const current = i === processo.etapa_atual
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${current ? 'bg-blue-50 border border-blue-100' : ''}`}>
                    {done ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : current ? (
                      <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-200 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${done ? 'text-gray-400 line-through' : current ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                      {etapa}
                    </span>
                    {current && <span className="ml-auto text-xs text-blue-500 font-medium">Atual</span>}
                  </div>
                )
              })}
              {processo.etapa_atual >= processo.etapas.length && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Processo concluído!</span>
                </div>
              )}
            </div>
          </div>

          {/* Eventos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Histórico de Eventos</h2>
              <button
                onClick={() => setShowInternal(s => !s)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
              >
                {showInternal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showInternal ? 'Ocultar internos' : 'Mostrar internos'}
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {visibleEvs.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">Sem eventos</div>
              ) : visibleEvs.map(e => (
                <div key={e.id} className={`px-6 py-3 flex gap-3 ${!e.visivel_cliente ? 'bg-gray-50' : ''}`}>
                  <div className="mt-0.5 flex-shrink-0">{eventoIcons[e.tipo]}</div>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{e.titulo}</p>
                    {e.descricao && <p className="text-xs text-gray-500 mt-0.5">{e.descricao}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(e.created_at)}</p>
                  </div>
                  {!e.visivel_cliente && <span className="ml-auto text-xs text-gray-400 italic">interno</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Documents + Info */}
        <div className="col-span-2 space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Cliente</span>
              <Link href={`/clientes/${processo.cliente_id}`} className="text-blue-600 hover:underline font-medium">
                {processo.clientes.nome}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Início</span>
              <span className="text-gray-700">{formatDate(processo.data_inicio)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Prazo</span>
              {editingPrazo ? (
                <div className="flex items-center gap-1">
                  <DatePicker
                    value={tempPrazo}
                    onChange={setTempPrazo}
                    placeholder="Sem prazo"
                    className="text-xs py-1 min-w-[140px]"
                  />
                  <button onClick={savePrazo} className="text-xs text-green-600 hover:text-green-700 font-medium px-1">✓</button>
                  <button onClick={() => setEditingPrazo(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => { setTempPrazo(processo.data_prazo ?? ''); setEditingPrazo(true) }}
                  className="flex items-center gap-1 group text-gray-700"
                >
                  <span>{formatDate(processo.data_prazo)}</span>
                  <Pencil className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              )}
            </div>
            {funcionarios.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Funcionário</span>
                {editingFuncionario ? (
                  <select
                    autoFocus
                    defaultValue={processo.funcionario_id ?? ''}
                    onChange={e => saveFuncionario(e.target.value || null)}
                    onBlur={() => setEditingFuncionario(false)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem responsável</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                ) : (
                  <button
                    onClick={() => setEditingFuncionario(true)}
                    className="flex items-center gap-1 group text-gray-700"
                    title="Clique para editar responsável"
                  >
                    <span>{funcionarios.find(f => f.id === processo.funcionario_id)?.nome ?? <span className="text-gray-400 italic">—</span>}</span>
                    <Pencil className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                )}
              </div>
            )}
            {processo.notas_internas && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-600 text-xs">{processo.notas_internas}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Documentos</h2>
              <button onClick={() => setShowAddDoc(true)} className="text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {documentos.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">Sem documentos</div>
              ) : documentos.map(doc => (
                <div key={doc.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={doc.status} />
                        {doc.obrigatorio && <span className="text-xs text-gray-400">*</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{doc.nome}</p>
                      {doc.descricao && <p className="text-xs text-gray-400">{doc.descricao}</p>}
                      {doc.notas && <p className="text-xs text-orange-600 mt-1 italic">{doc.notas}</p>}
                      {doc.nome_ficheiro_original && <p className="text-xs text-gray-400 mt-0.5">{doc.nome_ficheiro_original}</p>}
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {doc.status === 'recebido' && (
                        <>
                          <button onClick={() => aprovarDoc(doc.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Aprovar</button>
                          <button onClick={() => { setShowRejectModal(doc.id); setRejectNote('') }} className="text-xs text-red-500 hover:text-red-600 font-medium">Rejeitar</button>
                        </>
                      )}
                      {doc.storage_path && (
                        <button onClick={() => downloadDoc(doc.id)} className="text-xs text-blue-500 hover:text-blue-600">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(doc.status === 'pendente' || doc.status === 'rejeitado') && (
                        <button onClick={() => { setShowUpload(doc.id); setUploadFile(null) }} className="text-xs text-gray-400 hover:text-gray-600">
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm step modal */}
      <Modal open={showConfirmStep} onOpenChange={setShowConfirmStep} title="Avançar etapa?">
        <p className="text-sm text-gray-600 mb-4">
          Vai avançar de <strong>{processo.etapas[processo.etapa_atual - 1] ?? 'início'}</strong> para{' '}
          <strong>{processo.etapas[processo.etapa_atual] ?? 'conclusão'}</strong>.
          O cliente receberá uma notificação por email.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowConfirmStep(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
          <button onClick={avancarEtapa} disabled={advancingStep} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {advancingStep ? 'A avançar...' : 'Confirmar'}
          </button>
        </div>
      </Modal>

      {/* Reject document modal */}
      <Modal open={!!showRejectModal} onOpenChange={() => setShowRejectModal(null)} title="Rejeitar documento">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Motivo da rejeição (visível ao cliente)</label>
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Documento ilegível, falta a apostila, etc."
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowRejectModal(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button onClick={() => showRejectModal && rejeitarDoc(showRejectModal)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
              Rejeitar documento
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload document modal */}
      <Modal open={!!showUpload} onOpenChange={() => setShowUpload(null)} title="Upload de documento">
        <div className="space-y-4">
          <FileUpload onFileSelect={setUploadFile} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowUpload(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button
              onClick={() => showUpload && uploadDocAdvogado(showUpload)}
              disabled={!uploadFile || uploadLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadLoading ? 'A enviar...' : 'Enviar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add document modal */}
      <Modal open={showAddDoc} onOpenChange={setShowAddDoc} title="Adicionar documento à checklist">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do documento *</label>
            <input value={novoDoc.nome} onChange={e => setNovoDoc(n => ({ ...n, nome: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Instrução</label>
            <input value={novoDoc.descricao} onChange={e => setNovoDoc(n => ({ ...n, descricao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={novoDoc.obrigatorio} onChange={e => setNovoDoc(n => ({ ...n, obrigatorio: e.target.checked }))} />
            Obrigatório
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddDoc(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button onClick={addDoc} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Adicionar</button>
          </div>
        </div>
      </Modal>

      {/* Email generator modal */}
      <EmailGeneratorModal
        open={showEmailGen}
        onOpenChange={setShowEmailGen}
        processo={processo}
        documentos={documentos}
        onSent={() => toast('Email enviado com sucesso!')}
      />
    </div>
  )
}

// ============================================
// EMAIL GENERATOR MODAL
// ============================================

type EmailTemplate = 'faltam_documentos' | 'atualizacao_estado' | 'agendamento' | 'concluido'

const templateLabels: Record<EmailTemplate, string> = {
  faltam_documentos: 'Faltam documentos',
  atualizacao_estado: 'Atualização de estado',
  agendamento: 'Agendamento marcado',
  concluido: 'Processo concluído',
}

function gerarTextoEmail(template: EmailTemplate, processo: Processo, documentos: Documento[]): string {
  const pendentes = documentos.filter(d => d.status === 'pendente' || d.status === 'rejeitado').map(d => `• ${d.nome}`)
  const etapaAtual = processo.etapas[processo.etapa_atual] ?? 'em análise'

  switch (template) {
    case 'faltam_documentos':
      return `Exmo(a) Sr(a).,\n\nInformamos que, para prosseguir com o seu processo "${processo.titulo}", necessitamos ainda dos seguintes documentos:\n\n${pendentes.join('\n')}\n\nQueira, por favor, enviar os documentos em falta através do portal de cliente, ou contactar-nos caso tenha alguma dúvida.\n\nCom os melhores cumprimentos,`
    case 'atualizacao_estado':
      return `Exmo(a) Sr(a).,\n\nVimos por este meio informar que o seu processo "${processo.titulo}" se encontra atualmente na fase: ${etapaAtual}.\n\nPode acompanhar o estado detalhado do seu processo no portal de cliente.\n\nEstamos à sua disposição para qualquer esclarecimento.\n\nCom os melhores cumprimentos,`
    case 'agendamento':
      return `Exmo(a) Sr(a).,\n\nInformamos que foi marcado um agendamento no âmbito do seu processo "${processo.titulo}".\n\nData: [DATA]\nHora: [HORA]\nLocal: [LOCAL]\n\nPor favor confirme a sua presença respondendo a este email.\n\nCom os melhores cumprimentos,`
    case 'concluido':
      return `Exmo(a) Sr(a).,\n\nTemos o prazer de informar que o seu processo "${processo.titulo}" foi concluído com sucesso.\n\nAgradecemos a confiança depositada no nosso escritório e ficamos ao dispor para qualquer futura necessidade.\n\nCom os melhores cumprimentos,`
  }
}

interface EmailGenProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  processo: Processo
  documentos: Documento[]
  onSent: () => void
}

function EmailGeneratorModal({ open, onOpenChange, processo, documentos, onSent }: EmailGenProps) {
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
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email_personalizado', processo_id: processo.id, corpo: texto }),
    })
    setSending(false)
    onOpenChange(false)
    onSent()
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
                className={`px-3 py-2 rounded-lg text-sm border text-left transition-colors ${template === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}
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
            <button onClick={() => onOpenChange(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Fechar</button>
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
