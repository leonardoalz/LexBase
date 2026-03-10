'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Cliente, Processo, TipoProcesso, Funcionario } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { CountrySelect } from '@/components/ui/CountrySelect'
import { formatDate, getPortalUrl } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'
import { Copy, ExternalLink, Plus, FolderOpen, Trash2 } from 'lucide-react'

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

const processoSchema = z.object({
  titulo: z.string().min(2),
  tipo_processo_id: z.string().optional(),
  funcionario_id: z.string().optional(),
  referencia_interna: z.string().optional(),
  data_inicio: z.string(),
  data_prazo: z.string().optional(),
  prioridade: z.enum(['escritorio', 'cliente', 'orgao_externo']),
  descricao: z.string().optional(),
})
type ProcessoData = z.infer<typeof processoSchema>

const clienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  nacionalidade: z.string().optional(),
  nif_pt: z.string().optional(),
  data_nascimento: z.string().optional(),
})
type ClienteEditData = z.infer<typeof clienteSchema>

type ProcessoRow = Pick<Processo, 'id' | 'titulo' | 'status' | 'prioridade' | 'data_prazo' | 'data_inicio' | 'etapa_atual' | 'etapas'>

interface Props {
  cliente: Cliente
  processos: ProcessoRow[]
  tiposProcesso: TipoProcesso[]
  escritorioId: string
  funcionarios: Funcionario[]
}

export function ClienteDetailClient({ cliente, processos: initial, tiposProcesso, escritorioId, funcionarios }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'processos' | 'dados' | 'notas'>('processos')
  const [processos, setProcessos] = useState(initial)
  const [showNovoProcesso, setShowNovoProcesso] = useState(false)
  const [processoLoading, setProcessoLoading] = useState(false)
  const [processoError, setProcessoError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notas, setNotas] = useState(cliente.notas_internas ?? '')
  const [notasSaved, setNotasSaved] = useState(false)
  const [confirmDeleteCliente, setConfirmDeleteCliente] = useState(false)
  const [deletingCliente, setDeletingCliente] = useState(false)

  const processoForm = useForm<ProcessoData>({
    resolver: zodResolver(processoSchema),
    defaultValues: { prioridade: 'escritorio' as const, data_inicio: new Date().toISOString().split('T')[0] }
  })

  const clienteForm = useForm<ClienteEditData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone ?? '',
      nacionalidade: cliente.nacionalidade ?? '',
      nif_pt: cliente.nif_pt ?? '',
      data_nascimento: cliente.data_nascimento ?? '',
    }
  })

  async function openNovoProcesso() {
    setShowNovoProcesso(true)
    setProcessoError(null)
    const supabase = createClient()
    const year = new Date().getFullYear()
    const { count } = await supabase.from('processos')
      .select('id', { count: 'exact', head: true })
      .eq('escritorio_id', escritorioId)
    const seq = String((count ?? 0) + 1).padStart(3, '0')
    processoForm.setValue('referencia_interna', `${year}/${seq}`)
  }

  async function criarProcesso(data: ProcessoData) {
    setProcessoLoading(true)
    setProcessoError(null)
    const supabase = createClient()

    const [{ data: esc }, { count: ativos }] = await Promise.all([
      supabase.from('escritorios').select('processos_ativos_limite').eq('id', escritorioId).single(),
      supabase.from('processos').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('status', 'ativo'),
    ])
    const limite: number = esc?.processos_ativos_limite ?? 0
    if ((ativos ?? 0) >= limite) {
      setProcessoError(`Limite de ${limite} processos ativos atingido. Conclua ou cancele processos existentes, ou faça upgrade do plano.`)
      setProcessoLoading(false)
      return
    }

    const tipo = tiposProcesso.find(t => t.id === data.tipo_processo_id)

    const { data: processo, error } = await supabase.from('processos').insert({
      escritorio_id: escritorioId,
      cliente_id: cliente.id,
      tipo_processo_id: data.tipo_processo_id || null,
      funcionario_id: data.funcionario_id || null,
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || null,
      prioridade: data.prioridade,
      data_inicio: data.data_inicio,
      data_prazo: data.data_prazo || null,
      referencia_interna: data.referencia_interna?.trim() || null,
      etapas: tipo?.etapas_padrao ?? [],
      etapa_atual: 0,
    }).select().single()

    if (!error && processo) {
      if (tipo?.documentos_padrao?.length) {
        await supabase.from('documentos').insert(
          tipo.documentos_padrao.map(d => ({
            processo_id: processo.id,
            escritorio_id: escritorioId,
            nome: d.nome,
            descricao: d.descricao || null,
            obrigatorio: d.obrigatorio,
          }))
        )
      }
      setProcessos(prev => [processo as ProcessoRow, ...prev])
      setShowNovoProcesso(false)
      processoForm.reset()
    }
    setProcessoLoading(false)
  }

  async function saveCliente(data: ClienteEditData) {
    const supabase = createClient()
    await supabase.from('clientes').update({
      nome: data.nome.trim(),
      email: data.email.trim(),
      telefone: data.telefone?.trim() || null,
      nacionalidade: data.nacionalidade?.trim() || null,
      nif_pt: data.nif_pt?.trim() || null,
      data_nascimento: data.data_nascimento || null,
    }).eq('id', cliente.id)
    router.refresh()
  }

  async function saveNotas() {
    const supabase = createClient()
    await supabase.from('clientes').update({ notas_internas: notas.trim() }).eq('id', cliente.id)
    setNotasSaved(true)
    setTimeout(() => setNotasSaved(false), 2000)
  }

  async function deleteCliente() {
    if (processos.length > 0) return
    setDeletingCliente(true)
    const supabase = createClient()
    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id)
    if (error) {
      setDeletingCliente(false)
      setConfirmDeleteCliente(false)
    } else {
      router.push('/clientes')
    }
  }

  function copyPortalLink() {
    navigator.clipboard.writeText(getPortalUrl(cliente.portal_token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'processos', label: 'Processos' },
    { key: 'dados', label: 'Dados' },
    { key: 'notas', label: 'Notas internas' },
  ] as const

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clientes" className="text-sm text-gray-400 hover:text-gray-600">← Clientes</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{cliente.nome}</h1>
          <p className="text-gray-500 text-sm">{cliente.email} {cliente.telefone ? `· ${cliente.telefone}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyPortalLink}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copiado!' : 'Copiar link do portal'}
          </button>
          <a
            href={getPortalUrl(cliente.portal_token)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            Ver portal
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'processos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openNovoProcesso}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Novo Processo
            </button>
          </div>

          {processos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Sem processos. Crie o primeiro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processos.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={p.status} />
                      <Badge variant={p.prioridade} />
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{p.titulo}</h3>
                    <div className="mt-2 max-w-xs">
                      <ProgressBar current={p.etapa_atual} total={p.etapas.length} />
                    </div>
                    {p.data_prazo && <p className="text-xs text-gray-400 mt-1">Prazo: {formatDate(p.data_prazo)}</p>}
                  </div>
                  <Link
                    href={`/processos/${p.id}`}
                    className="ml-4 text-sm text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Ver processo →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'dados' && (
        <form onSubmit={clienteForm.handleSubmit(saveCliente)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nome completo</label>
              <input {...clienteForm.register('nome')} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Email</label>
              <input {...clienteForm.register('email')} type="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input {...clienteForm.register('telefone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nacionalidade</label>
              <Controller
                control={clienteForm.control}
                name="nacionalidade"
                render={({ field }) => (
                  <CountrySelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    className={inputClass}
                  />
                )}
              />
            </div>
            <div>
              <label className={labelClass}>NIF Português</label>
              <input {...clienteForm.register('nif_pt')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Data de nascimento</label>
              <Controller control={clienteForm.control} name="data_nascimento" render={({ field }) => (
                <DatePicker value={field.value ?? ''} onChange={field.onChange} />
              )} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-2">Link do portal do cliente</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={getPortalUrl(cliente.portal_token)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
              <button type="button" onClick={copyPortalLink} className="border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                {copied ? 'Copiado!' : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Guardar alterações
            </button>
          </div>

          {/* Danger zone */}
          <div className="border-t border-red-100 pt-4 mt-2">
            <p className="text-xs font-medium text-red-600 mb-2">Zona de perigo</p>
            {processos.length > 0 ? (
              <p className="text-xs text-gray-400">Para eliminar este cliente, remova primeiro os {processos.length} processo{processos.length !== 1 ? 's' : ''} associado{processos.length !== 1 ? 's' : ''}.</p>
            ) : !confirmDeleteCliente ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteCliente(true)}
                className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar cliente
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-700">Tem a certeza? Esta ação é irreversível.</span>
                <button
                  type="button"
                  onClick={deleteCliente}
                  disabled={deletingCliente}
                  className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deletingCliente ? 'A eliminar...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteCliente(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {tab === 'notas' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={12}
            className={inputClass}
            placeholder="Notas internas sobre este cliente (não visíveis ao cliente)..."
          />
          <div className="flex items-center justify-between">
            {notasSaved && <span className="text-green-600 text-sm">Guardado!</span>}
            <div className="ml-auto">
              <button onClick={saveNotas} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Guardar notas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Novo Processo Modal */}
      <Modal open={showNovoProcesso} onOpenChange={setShowNovoProcesso} title="Novo Processo" className="max-w-lg">
        <form onSubmit={processoForm.handleSubmit(criarProcesso)} className="space-y-4">
          <div>
            <label className={labelClass}>Título *</label>
            <input {...processoForm.register('titulo')} className={inputClass} placeholder="Renovação AR — João Silva" />
            {processoForm.formState.errors.titulo && <p className="text-red-500 text-xs mt-1">Título obrigatório</p>}
          </div>
          <div>
            <label className={labelClass}>Tipo de processo</label>
            <select {...processoForm.register('tipo_processo_id')} className={inputClass}>
              <option value="">Selecionar...</option>
              {tiposProcesso.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          {funcionarios.length > 0 && (
            <div>
              <label className={labelClass}>Responsável</label>
              <select {...processoForm.register('funcionario_id')} className={inputClass}>
                <option value="">Sem responsável</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Referência interna</label>
              <input {...processoForm.register('referencia_interna')} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className={labelClass}>Em posse de</label>
              <select {...processoForm.register('prioridade')} className={inputClass}>
                <option value="escritorio">Escritório</option>
                <option value="cliente">Cliente</option>
                <option value="orgao_externo">Órgão externo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Data início</label>
              <Controller control={processoForm.control} name="data_inicio" render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label className={labelClass}>Prazo estimado</label>
              <Controller control={processoForm.control} name="data_prazo" render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Sem prazo" />
              )} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notas</label>
            <textarea {...processoForm.register('descricao')} rows={3} className={inputClass} />
          </div>
          {processoError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{processoError}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNovoProcesso(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={processoLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {processoLoading ? 'A criar...' : 'Criar processo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
