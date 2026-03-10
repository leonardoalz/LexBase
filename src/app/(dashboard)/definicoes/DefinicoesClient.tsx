'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Escritorio, Funcionario } from '@/types/database'
import { useToast } from '@/components/ui/Toast'
import { Building2, CreditCard, Shield, Users, Plus, Trash2 } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  morada: z.string().optional(),
  nif: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

const planoLabels = { trial: 'Trial (10 processos)', starter: 'Starter', pro: 'Pro' }
const planoBadge = { trial: 'bg-gray-100 text-gray-600', starter: 'bg-blue-100 text-blue-700', pro: 'bg-purple-100 text-purple-700' }

const CAMPO_LABELS: Record<string, string> = {
  nome: 'Nome do escritório',
  email: 'Email de contacto',
  telefone: 'Telefone',
  morada: 'Morada',
  nif: 'NIF',
}

interface Props {
  escritorio: Escritorio
  email: string
}

export function DefinicoesClient({ escritorio, email }: Props) {
  const { toast } = useToast()
  const [requesting, setRequesting] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [novoFunc, setNovoFunc] = useState({ nome: '', email: '' })
  const [addingFunc, setAddingFunc] = useState(false)
  const [savingFunc, setSavingFunc] = useState(false)
  const [invitingFunc, setInvitingFunc] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: escritorio.nome,
      email: escritorio.email,
      telefone: escritorio.telefone ?? '',
      morada: escritorio.morada ?? '',
      nif: escritorio.nif ?? '',
    },
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('funcionarios')
      .select('*')
      .eq('escritorio_id', escritorio.id)
      .eq('active', true)
      .order('created_at')
      .then(({ data }) => { if (data) setFuncionarios(data as Funcionario[]) })
  }, [escritorio.id])

  async function onSubmit(data: FormData) {
    setRequesting(true)
    const campos: Record<string, string> = {}
    if (data.nome !== escritorio.nome) campos[CAMPO_LABELS.nome] = data.nome
    if (data.email !== escritorio.email) campos[CAMPO_LABELS.email] = data.email
    if ((data.telefone ?? '') !== (escritorio.telefone ?? '')) campos[CAMPO_LABELS.telefone] = data.telefone ?? ''
    if ((data.morada ?? '') !== (escritorio.morada ?? '')) campos[CAMPO_LABELS.morada] = data.morada ?? ''
    if ((data.nif ?? '') !== (escritorio.nif ?? '')) campos[CAMPO_LABELS.nif] = data.nif ?? ''

    if (Object.keys(campos).length === 0) {
      toast('Nenhuma alteração detectada.', 'info')
      setRequesting(false)
      return
    }

    await fetch('/api/change-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escritorio_id: escritorio.id, escritorio_nome: escritorio.nome, campos }),
    })

    toast('Pedido enviado! O administrador irá processar as alterações.')
    setRequesting(false)
  }

  async function changePassword() {
    if (newPassword.length < 8) { toast('Mínimo 8 caracteres.', 'error'); return }
    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast('Erro ao alterar password.', 'error') }
    else { toast('Password alterada!'); setNewPassword(''); setChangingPassword(false) }
    setPasswordLoading(false)
  }

  async function addFuncionario() {
    if (!novoFunc.nome.trim()) return
    setSavingFunc(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('funcionarios').insert({
      escritorio_id: escritorio.id,
      nome: novoFunc.nome.trim(),
      email: novoFunc.email.trim() || null,
    }).select().single()
    if (!error && data) {
      setFuncionarios(f => [...f, data as Funcionario])
      setNovoFunc({ nome: '', email: '' })
      setAddingFunc(false)
      toast('Funcionário adicionado.')
    } else {
      toast('Erro ao adicionar.', 'error')
    }
    setSavingFunc(false)
  }

  async function inviteFuncionario(f: Funcionario) {
    if (!f.email) { toast('Este funcionário não tem email definido.', 'error'); return }
    setInvitingFunc(f.id)
    const res = await fetch('/api/invite-funcionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funcionario_id: f.id, email: f.email, nome: f.nome }),
    })
    if (res.ok) {
      setFuncionarios(prev => prev.map(x => x.id === f.id ? { ...x, auth_user_id: 'sent' } : x))
      toast('Convite enviado para ' + f.email + '!')
    } else {
      toast('Erro ao enviar convite.', 'error')
    }
    setInvitingFunc(null)
  }

  async function removeFuncionario(id: string) {
    const supabase = createClient()
    await supabase.from('funcionarios').update({ active: false }).eq('id', id)
    setFuncionarios(f => f.filter(x => x.id !== id))
    toast('Funcionário removido.')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
        <p className="text-gray-500 text-sm mt-1">Gerir os dados do escritório e conta</p>
      </div>

      {/* Dados do escritório */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Dados do Escritório</h2>
        </div>
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-amber-700">
            Alterações aos dados requerem aprovação do administrador. Preencha e clique em "Solicitar alterações".
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Nome do escritório *</label>
            <input {...register('nome')} className={inputClass} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email de contacto *</label>
              <input {...register('email')} type="email" className={inputClass} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input {...register('telefone')} className={inputClass} placeholder="+351 21 000 0000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Morada</label>
            <input {...register('morada')} className={inputClass} placeholder="Rua Exemplo, 123, Lisboa" />
          </div>
          <div>
            <label className={labelClass}>NIF</label>
            <input {...register('nif')} className={inputClass} placeholder="500 000 000" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={requesting} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {requesting ? 'A enviar...' : 'Solicitar alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Equipa */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Equipa</h2>
          </div>
          <button onClick={() => setAddingFunc(true)} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
        <div className="p-6 space-y-3">
          {funcionarios.length === 0 && !addingFunc && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum funcionário adicionado.</p>
          )}
          {funcionarios.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{f.nome}</p>
                {f.email && <p className="text-xs text-gray-400">{f.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                {f.auth_user_id ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Acesso ativo</span>
                ) : f.email ? (
                  <button
                    onClick={() => inviteFuncionario(f)}
                    disabled={invitingFunc === f.id}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {invitingFunc === f.id ? 'A enviar...' : 'Convidar'}
                  </button>
                ) : (
                  <span className="text-xs text-gray-300">Sem email</span>
                )}
                <button onClick={() => removeFuncionario(f.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {addingFunc && (
            <div className="pt-2 space-y-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nome *</label>
                  <input value={novoFunc.nome} onChange={e => setNovoFunc(n => ({ ...n, nome: e.target.value }))} className={inputClass} placeholder="Ana Santos" autoFocus />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={novoFunc.email} onChange={e => setNovoFunc(n => ({ ...n, email: e.target.value }))} type="email" className={inputClass} placeholder="ana@escritorio.pt" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAddingFunc(false)} className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm">Cancelar</button>
                <button onClick={addFuncionario} disabled={savingFunc || !novoFunc.nome.trim()} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {savingFunc ? 'A guardar...' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plano */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Plano</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${planoBadge[escritorio.plano]}`}>
              {planoLabels[escritorio.plano]}
            </span>
            <p className="text-sm text-gray-500 mt-1">Limite: {escritorio.processos_ativos_limite} processos ativos</p>
          </div>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Fazer upgrade</button>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Segurança</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Email de acesso: <span className="font-medium">{email}</span></p>
          {!changingPassword ? (
            <button onClick={() => setChangingPassword(true)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Alterar password
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nova password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setChangingPassword(false); setNewPassword('') }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={changePassword} disabled={passwordLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {passwordLoading ? 'A alterar...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
