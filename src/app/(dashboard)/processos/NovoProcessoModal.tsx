'use client'

import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { createClient } from '@/lib/supabase/client'
import { Search, ChevronLeft } from 'lucide-react'

const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

const processoSchema = z.object({
  titulo: z.string().min(2, 'Mínimo 2 caracteres'),
  tipo_processo_id: z.string().optional(),
  funcionario_id: z.string().optional(),
  referencia_interna: z.string().optional(),
  data_inicio: z.string().min(1, 'Obrigatório'),
  data_prazo: z.string().optional(),
  prioridade: z.enum(['escritorio', 'cliente', 'orgao_externo']),
  descricao: z.string().optional(),
})
type ProcessoForm = z.infer<typeof processoSchema>

export interface ProcessoCreated {
  id: string
  titulo: string
  status: 'ativo' | 'concluido' | 'cancelado' | 'suspenso' | 'indeferido'
  prioridade: 'escritorio' | 'cliente' | 'orgao_externo'
  referencia_interna: string | null
  data_prazo: string | null
  etapa_atual: number
  etapas: string[]
  clientes: { nome: string } | null
}

interface ClienteOpt { id: string; nome: string; email: string }
interface TipoOpt {
  id: string
  nome: string
  etapas_padrao: string[]
  documentos_padrao: { nome: string; descricao: string; obrigatorio: boolean }[]
}
interface FuncOpt { id: string; nome: string }

interface Props {
  open: boolean
  onClose: () => void
  escritorioId: string
  clientes: ClienteOpt[]
  tiposProcesso: TipoOpt[]
  funcionarios: FuncOpt[]
  onCreated: (p: ProcessoCreated) => void
}

export function NovoProcessoModal({ open, onClose, escritorioId, clientes, tiposProcesso, funcionarios, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCliente, setSelectedCliente] = useState<ClienteOpt | null>(null)
  const [clienteSearch, setClienteSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<ProcessoForm>({
    resolver: zodResolver(processoSchema),
    defaultValues: {
      prioridade: 'escritorio' as const,
      data_inicio: new Date().toISOString().split('T')[0],
    },
  })

  function handleClose() {
    onClose()
    // reset after animation
    setTimeout(() => {
      setStep(1)
      setSelectedCliente(null)
      setClienteSearch('')
      setError(null)
      reset()
    }, 200)
  }

  async function selectCliente(c: ClienteOpt) {
    setSelectedCliente(c)
    setError(null)
    // auto-generate reference
    const supabase = createClient()
    const year = new Date().getFullYear()
    const { count } = await supabase.from('processos')
      .select('id', { count: 'exact', head: true })
      .eq('escritorio_id', escritorioId)
    const seq = String((count ?? 0) + 1).padStart(3, '0')
    setValue('referencia_interna', `${year}/${seq}`)
    setStep(2)
  }

  async function onSubmit(data: ProcessoForm) {
    if (!selectedCliente) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const [{ data: esc }, { count: ativos }] = await Promise.all([
      supabase.from('escritorios').select('processos_ativos_limite').eq('id', escritorioId).single(),
      supabase.from('processos').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('status', 'ativo'),
    ])
    const limite: number = esc?.processos_ativos_limite ?? 0
    if ((ativos ?? 0) >= limite) {
      setError(`Limite de ${limite} processos ativos atingido.`)
      setLoading(false)
      return
    }

    const tipo = tiposProcesso.find(t => t.id === data.tipo_processo_id)

    const { data: processo, error: err } = await supabase.from('processos').insert({
      escritorio_id: escritorioId,
      cliente_id: selectedCliente.id,
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

    if (err || !processo) {
      setError('Erro ao criar processo. Tente novamente.')
      setLoading(false)
      return
    }

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

    onCreated({
      id: processo.id,
      titulo: processo.titulo,
      status: processo.status,
      prioridade: processo.prioridade,
      referencia_interna: processo.referencia_interna,
      data_prazo: processo.data_prazo,
      etapa_atual: processo.etapa_atual,
      etapas: processo.etapas as string[],
      clientes: { nome: selectedCliente.nome },
    })
    setLoading(false)
    handleClose()
  }

  const filteredClientes = clienteSearch.trim()
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clienteSearch.toLowerCase())
      )
    : clientes

  return (
    <Modal
      open={open}
      onOpenChange={v => { if (!v) handleClose() }}
      title={step === 1 ? 'Selecionar cliente' : 'Novo processo'}
      description={step === 2 && selectedCliente ? `Cliente: ${selectedCliente.nome}` : undefined}
      className="max-w-lg"
    >
      {step === 1 ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={clienteSearch}
              onChange={e => setClienteSearch(e.target.value)}
              placeholder="Pesquisar cliente..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Client list */}
          <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
            {filteredClientes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente encontrado.</p>
            ) : (
              filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCliente(c)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-900">{c.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Back to client selection */}
          <button
            type="button"
            onClick={() => { setStep(1); setError(null) }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors -mt-2 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Mudar cliente
          </button>

          {/* Título */}
          <div>
            <label className={labelClass}>Título <span className="text-red-500">*</span></label>
            <input {...register('titulo')} className={inputClass} placeholder="Ex: Autorização de Residência" />
            {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
          </div>

          {/* Tipo de processo */}
          <div>
            <label className={labelClass}>Tipo de processo</label>
            <select {...register('tipo_processo_id')} className={inputClass}>
              <option value="">— Nenhum —</option>
              {tiposProcesso.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data início */}
            <div>
              <label className={labelClass}>Data de início <span className="text-red-500">*</span></label>
              <Controller control={control} name="data_inicio" render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )} />
            </div>

            {/* Data prazo */}
            <div>
              <label className={labelClass}>Prazo</label>
              <Controller control={control} name="data_prazo" render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Sem prazo" />
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Referência */}
            <div>
              <label className={labelClass}>Referência interna</label>
              <input {...register('referencia_interna')} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>

            {/* Funcionário */}
            {funcionarios.length > 0 && (
              <div>
                <label className={labelClass}>Funcionário</label>
                <select {...register('funcionario_id')} className={inputClass}>
                  <option value="">— Nenhum —</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Em posse de */}
          <div>
            <label className={labelClass}>Em posse de</label>
            <select {...register('prioridade')} className={inputClass}>
              <option value="escritorio">Escritório</option>
              <option value="cliente">Cliente</option>
              <option value="orgao_externo">Órgão externo</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              {...register('descricao')}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Notas sobre o processo (opcional)"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1a1c20] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'A criar...' : 'Criar processo'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
