'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alerta } from '@/types/database'
import { formatDate, daysUntil } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { Bell, Plus, Check, Eye } from 'lucide-react'

type AlertaWithProcesso = Alerta & { processos: { titulo: string } | null }

interface Props {
  alertas: AlertaWithProcesso[]
  processos: { id: string; titulo: string }[]
  escritorioId: string
}

export function AlertasClient({ alertas: initial, processos, escritorioId }: Props) {
  const [alertas, setAlertas] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [novo, setNovo] = useState({ titulo: '', descricao: '', data_alerta: '', processo_id: '' })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function criarAlerta() {
    if (!novo.titulo || !novo.data_alerta) return
    setLoading(true)
    const { data, error } = await supabase.from('alertas').insert({
      escritorio_id: escritorioId,
      processo_id: novo.processo_id,
      titulo: novo.titulo.trim(),
      descricao: novo.descricao.trim() || null,
      data_alerta: novo.data_alerta,
    }).select('*, processos(titulo)').single()

    if (!error && data) {
      setAlertas(a => [...a, data as AlertaWithProcesso])
      setShowModal(false)
      setNovo({ titulo: '', descricao: '', data_alerta: '', processo_id: '' })
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: Alerta['status']) {
    await supabase.from('alertas').update({ status }).eq('id', id)
    setAlertas(a => a.map(al => al.id === id ? { ...al, status } : al))
  }

  const today = new Date().toISOString().split('T')[0]
  const pendentes = alertas.filter(a => a.status === 'pendente')
  const vistos = alertas.filter(a => a.status !== 'pendente')

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-500 text-sm mt-1">{pendentes.length} alerta{pendentes.length !== 1 ? 's' : ''} pendente{pendentes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Novo Alerta
        </button>
      </div>

      {/* Pending alerts */}
      {pendentes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Pendentes</h2>
          {pendentes.map(a => {
            const dias = daysUntil(a.data_alerta)
            const overdue = dias !== null && dias < 0
            const today_alert = a.data_alerta === today
            return (
              <div key={a.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 ${overdue ? 'border-red-200' : today_alert ? 'border-orange-200' : 'border-gray-100'}`}>
                <div className={`p-2 rounded-lg flex-shrink-0 ${overdue ? 'bg-red-50' : today_alert ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                  <Bell className={`h-4 w-4 ${overdue ? 'text-red-500' : today_alert ? 'text-orange-500' : 'text-yellow-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{a.titulo}</p>
                  {a.processos && <p className="text-xs text-gray-400 mt-0.5">{a.processos.titulo}</p>}
                  {a.descricao && <p className="text-sm text-gray-500 mt-1">{a.descricao}</p>}
                  <p className={`text-xs mt-1 font-medium ${overdue ? 'text-red-500' : today_alert ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formatDate(a.data_alerta)}
                    {dias !== null && (overdue ? ` (${Math.abs(dias)}d em atraso)` : dias === 0 ? ' (hoje)' : ` (${dias}d)`)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateStatus(a.id, 'visto')} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Marcar como visto">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => updateStatus(a.id, 'resolvido')} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Marcar como resolvido">
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Past alerts */}
      {vistos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase">Resolvidos / Vistos</h2>
          {vistos.slice(0, 20).map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 opacity-60">
              <Bell className="h-4 w-4 text-gray-300" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">{a.titulo}</p>
                <p className="text-xs text-gray-400">{formatDate(a.data_alerta)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'resolvido' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                {a.status === 'resolvido' ? 'Resolvido' : 'Visto'}
              </span>
            </div>
          ))}
        </div>
      )}

      {alertas.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Sem alertas. Crie um para acompanhar prazos importantes.</p>
        </div>
      )}

      <Modal open={showModal} onOpenChange={setShowModal} title="Novo Alerta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input value={novo.titulo} onChange={e => setNovo(n => ({ ...n, titulo: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do alerta *</label>
            <DatePicker value={novo.data_alerta} onChange={v => setNovo(n => ({ ...n, data_alerta: v }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processo associado</label>
            <select value={novo.processo_id} onChange={e => setNovo(n => ({ ...n, processo_id: e.target.value }))} className={inputClass}>
              <option value="">Selecionar processo...</option>
              {processos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={novo.descricao} onChange={e => setNovo(n => ({ ...n, descricao: e.target.value }))} rows={2} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
            <button onClick={criarAlerta} disabled={loading || !novo.titulo || !novo.data_alerta} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'A criar...' : 'Criar alerta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
