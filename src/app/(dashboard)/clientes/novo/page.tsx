'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { TipoProcesso, Funcionario } from '@/types/database'
import { CountrySelect } from '@/components/ui/CountrySelect'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { DatePicker } from '@/components/ui/DatePicker'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone obrigatório'),
  nacionalidade: z.string().min(1, 'Nacionalidade obrigatória'),
  nif_pt: z.string().optional(),
  data_nascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  notas_internas: z.string().optional(),
})

const processoSchema = z.object({
  titulo: z.string().min(2, 'Título obrigatório'),
  tipo_processo_id: z.string().optional(),
  funcionario_id: z.string().optional(),
  referencia_interna: z.string().optional(),
  data_inicio: z.string(),
  data_prazo: z.string().optional(),
  prioridade: z.enum(['escritorio', 'cliente', 'orgao_externo']),
  descricao: z.string().optional(),
})

type ClienteData = z.infer<typeof clienteSchema>
type ProcessoData = z.infer<typeof processoSchema>

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const readonlyInputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const reqLabel = (text: string) => (
  <label className={labelClass}>{text} <span className="text-red-500">*</span></label>
)

export default function NovoClientePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [criarProcesso, setCriarProcesso] = useState(false)
  const [tiposProcesso, setTiposProcesso] = useState<TipoProcesso[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clienteData, setClienteData] = useState<ClienteData | null>(null)

  const clienteForm = useForm<ClienteData>({ resolver: zodResolver(clienteSchema) })
  const processoForm = useForm<ProcessoData>({
    resolver: zodResolver(processoSchema),
    defaultValues: { prioridade: 'escritorio' as const, data_inicio: new Date().toISOString().split('T')[0] }
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('tipos_processo').select('*').then(({ data }) => { if (data) setTiposProcesso(data) })
    async function loadFuncionarios() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: esc } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
      if (!esc) return
      const { data } = await supabase.from('funcionarios').select('*').eq('escritorio_id', esc.id).eq('active', true).order('nome')
      if (data) setFuncionarios(data as Funcionario[])
    }
    loadFuncionarios()
  }, [])

  // Auto-generate referencia_interna when step 2 is reached
  useEffect(() => {
    if (step !== 2 || !criarProcesso) return
    async function generateRef() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: escritorio } = await supabase.from('escritorios').select('id').eq('user_id', user.id).single()
      if (!escritorio) return
      const year = new Date().getFullYear()
      const { count } = await supabase.from('processos')
        .select('id', { count: 'exact', head: true })
        .eq('escritorio_id', escritorio.id)
      const seq = String((count ?? 0) + 1).padStart(3, '0')
      processoForm.setValue('referencia_interna', `${year}/${seq}`)
    }
    generateRef()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, criarProcesso])

  async function onClienteSubmit(data: ClienteData) {
    setClienteData(data)
    setStep(2)
  }

  async function onFinish(processoData?: ProcessoData) {
    if (!clienteData) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada'); setLoading(false); return }

    const { data: escritorio } = await supabase.from('escritorios').select('id, processos_ativos_limite').eq('user_id', user.id).single()
    if (!escritorio) { setError('Escritório não encontrado'); setLoading(false); return }

    const { data: cliente, error: clienteError } = await supabase.from('clientes').insert({
      escritorio_id: escritorio.id,
      nome: clienteData.nome.trim(),
      email: clienteData.email.trim(),
      telefone: clienteData.telefone?.trim() || null,
      nacionalidade: clienteData.nacionalidade?.trim() || null,
      nif_pt: clienteData.nif_pt?.trim() || null,
      data_nascimento: clienteData.data_nascimento || null,
      notas_internas: clienteData.notas_internas?.trim() || null,
    }).select().single()

    if (clienteError) { setError('Erro ao criar cliente: ' + clienteError.message); setLoading(false); return }

    if (criarProcesso && processoData && cliente) {
      const { count: ativos } = await supabase.from('processos')
        .select('id', { count: 'exact', head: true })
        .eq('escritorio_id', escritorio.id)
        .eq('status', 'ativo')
      const limite: number = escritorio.processos_ativos_limite
      if ((ativos ?? 0) >= limite) {
        setError(`Limite de ${limite} processos ativos atingido. Conclua ou cancele processos existentes, ou faça upgrade do plano.`)
        setLoading(false)
        return
      }

      const tipo = tiposProcesso.find(t => t.id === processoData.tipo_processo_id)
      const { error: pError } = await supabase.from('processos').insert({
        escritorio_id: escritorio.id,
        cliente_id: cliente.id,
        tipo_processo_id: processoData.tipo_processo_id || null,
        funcionario_id: processoData.funcionario_id || null,
        titulo: processoData.titulo.trim(),
        descricao: processoData.descricao?.trim() || null,
        prioridade: processoData.prioridade,
        data_inicio: processoData.data_inicio,
        data_prazo: processoData.data_prazo || null,
        referencia_interna: processoData.referencia_interna?.trim() || null,
        etapas: tipo?.etapas_padrao ?? [],
        etapa_atual: 0,
      })

      if (pError) { setError('Cliente criado, mas erro no processo: ' + pError.message); setLoading(false); return }

      // Insert default documents
      if (tipo?.documentos_padrao?.length) {
        // Get the process to get its ID
        const { data: processo } = await supabase.from('processos')
          .select('id').eq('cliente_id', cliente.id).single()
        if (processo) {
          await supabase.from('documentos').insert(
            tipo.documentos_padrao.map(d => ({
              processo_id: processo.id,
              escritorio_id: escritorio.id,
              nome: d.nome,
              descricao: d.descricao || null,
              obrigatorio: d.obrigatorio,
            }))
          )
        }
      }
    }

    router.push(`/clientes/${cliente.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 1 ? router.back() : setStep(1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-500 text-sm">Passo {step} de 2</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium
              ${s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Dados do cliente' : 'Primeiro processo'}
            </span>
            {s < 2 && <div className="h-px w-8 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={clienteForm.handleSubmit(onClienteSubmit)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              {reqLabel('Nome completo')}
              <input {...clienteForm.register('nome')} className={inputClass} />
              {clienteForm.formState.errors.nome && <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.nome.message}</p>}
            </div>
            <div className="col-span-2">
              {reqLabel('Email')}
              <input {...clienteForm.register('email')} type="email" className={inputClass} />
              {clienteForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.email.message}</p>}
            </div>
            <div className="col-span-2">
              {reqLabel('Telefone')}
              <Controller
                control={clienteForm.control}
                name="telefone"
                render={({ field }) => (
                  <PhoneInput
                    value={field.value ?? '+351'}
                    onChange={field.onChange}
                    error={!!clienteForm.formState.errors.telefone}
                  />
                )}
              />
              {clienteForm.formState.errors.telefone && <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.telefone.message}</p>}
            </div>
            <div>
              {reqLabel('Nacionalidade')}
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
              {clienteForm.formState.errors.nacionalidade && <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.nacionalidade.message}</p>}
            </div>
            <div>
              {reqLabel('Data de nascimento')}
              <Controller control={clienteForm.control} name="data_nascimento" render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )} />
              {clienteForm.formState.errors.data_nascimento && <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.data_nascimento.message}</p>}
            </div>
            <div>
              <label className={labelClass}>NIF Português</label>
              <input {...clienteForm.register('nif_pt')} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notas internas</label>
              <textarea {...clienteForm.register('notas_internas')} rows={3} className={inputClass} placeholder="Informações relevantes sobre o cliente..." />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Seguinte <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Deseja criar um processo agora?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCriarProcesso(true)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${criarProcesso ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-300'}`}
              >
                Sim, criar processo
              </button>
              <button
                type="button"
                onClick={() => setCriarProcesso(false)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${!criarProcesso ? 'bg-gray-100 text-gray-700 border-gray-300' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                Não, só o cliente
              </button>
            </div>
          </div>

          {criarProcesso && (
            <form onSubmit={processoForm.handleSubmit(onFinish)} className="space-y-4 border-t border-gray-100 pt-5">
              <div>
                <label className={labelClass}>Título do processo *</label>
                <input {...processoForm.register('titulo')} className={inputClass} placeholder="ex: Renovação AR — João Silva" />
                {processoForm.formState.errors.titulo && <p className="text-red-500 text-xs mt-1">{processoForm.formState.errors.titulo.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Tipo de processo</label>
                <select {...processoForm.register('tipo_processo_id')} className={inputClass}>
                  <option value="">Selecionar tipo...</option>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Referência interna</label>
                  <input {...processoForm.register('referencia_interna')} readOnly className={readonlyInputClass} />
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
                  <label className={labelClass}>Data de início</label>
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
                <label className={labelClass}>Notas / Descrição</label>
                <textarea {...processoForm.register('descricao')} rows={3} className={inputClass} />
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="text-gray-500 text-sm hover:text-gray-700">← Voltar</button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'A guardar...' : 'Criar cliente e processo'}
                </button>
              </div>
            </form>
          )}

          {!criarProcesso && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="text-gray-500 text-sm hover:text-gray-700">← Voltar</button>
                <button
                  type="button"
                  onClick={() => onFinish()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'A guardar...' : 'Criar cliente'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
