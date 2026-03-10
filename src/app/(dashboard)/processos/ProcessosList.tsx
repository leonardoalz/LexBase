'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, ArrowUpDown, SlidersHorizontal, ChevronDown, Plus, FolderOpen, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, daysUntil, getUrgenciaBorda, cn } from '@/lib/utils'
import { NovoProcessoModal, ProcessoCreated } from './NovoProcessoModal'
import { createClient } from '@/lib/supabase/client'

interface ProcessoRow {
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

interface Props {
  processos: ProcessoRow[]
  escritorioId: string
  clientes: { id: string; nome: string; email: string }[]
  tiposProcesso: { id: string; nome: string; etapas_padrao: string[]; documentos_padrao: { nome: string; descricao: string; obrigatorio: boolean }[] }[]
  funcionarios: { id: string; nome: string }[]
}

const ALL_STATUSES = ['ativo', 'concluido', 'arquivado'] as const
const ALL_RESPONSAVEIS = ['escritorio', 'cliente', 'orgao_externo'] as const

function DeadlineBadge({ dias }: { dias: number }) {
  if (dias < 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{Math.abs(dias)}d atraso</span>
  }
  if (dias === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Hoje</span>
  }
  if (dias <= 2) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{dias}d</span>
  }
  if (dias <= 7) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{dias}d</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{dias}d</span>
}

function ProcessoCard({ p, showResponsavel, showStatus, statusOverride, hideProgress, onStatusChange }: {
  p: ProcessoRow
  showResponsavel?: boolean
  showStatus?: boolean
  statusOverride?: ProcessoRow['status']
  hideProgress?: boolean
  onStatusChange?: (id: string, newStatus: ProcessoRow['status']) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dias = daysUntil(p.data_prazo)
  const pct = p.etapas.length > 0 ? Math.round((p.etapa_atual / p.etapas.length) * 100) : 0
  const urgenciaBorda = getUrgenciaBorda(p.data_prazo)

  const isConcluidoCard = p.status === 'concluido' || (p.etapas.length > 0 && p.etapa_atual >= p.etapas.length)
  const isArquivadoCard = p.status === 'cancelado' || p.status === 'suspenso' || p.status === 'indeferido'

  const actions: { label: string; status: ProcessoRow['status'] }[] =
    isConcluidoCard || isArquivadoCard
      ? [{ label: 'Reativar', status: 'ativo' }]
      : [
          { label: 'Concluir', status: 'concluido' },
          { label: 'Cancelar', status: 'cancelado' },
          { label: 'Indeferir', status: 'indeferido' },
          { label: 'Suspender', status: 'suspenso' },
        ]

  return (
    <div className="relative group">
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}

      <Link
        href={`/processos/${p.id}`}
        className="block bg-white rounded-xl border border-[#e8e8e4] hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden"
      >
        <div className="relative">
          {/* Left urgency border — deadline-based, ativos only */}
          {!hideProgress && urgenciaBorda !== 'normal' && (
            <div className={cn(
              'absolute left-0 top-0 bottom-0 w-[3px]',
              urgenciaBorda === 'critico' ? 'bg-red-500' : 'bg-amber-400'
            )} />
          )}

          <div className="px-5 py-4 grid gap-4" style={{ gridTemplateColumns: '1fr auto' }}>
            {/* Left column */}
            <div className="min-w-0 space-y-2">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {showResponsavel && <Badge variant={p.prioridade} />}
                {showStatus && <Badge variant={statusOverride ?? p.status} />}
                {p.referencia_interna && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                    {p.referencia_interna}
                  </span>
                )}
              </div>

              {/* Title + client */}
              <div>
                <h3 className="font-medium text-gray-900 leading-snug truncate">{p.titulo}</h3>
                {p.clientes?.nome && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{p.clientes.nome}</p>
                )}
              </div>

              {/* Progress */}
              {!hideProgress && p.etapas.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 220, flexShrink: 0 }}>
                    <ProgressBar current={p.etapa_atual} total={p.etapas.length} showLabel={false} />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {pct}% · {p.etapa_atual} de {p.etapas.length} etapas
                  </span>
                </div>
              )}
            </div>

            {/* Right column — deadline */}
            {!hideProgress && p.data_prazo && (
              <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0">
                <span className="text-sm text-gray-500">{formatDate(p.data_prazo)}</span>
                {dias !== null && <DeadlineBadge dias={dias} />}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Status change button — appears on hover */}
      {onStatusChange && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`p-1 rounded-lg hover:bg-gray-100 transition-all ${menuOpen ? 'opacity-100 bg-gray-100' : 'opacity-0 group-hover:opacity-100'}`}
            title="Mover processo"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              {actions.map(action => (
                <button
                  key={action.status}
                  onClick={() => { onStatusChange(p.id, action.status); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  label, count, open, onToggle, legend,
}: {
  label: string; count: number; open: boolean; onToggle: () => void; legend?: React.ReactNode
}) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 w-full group cursor-pointer py-1">
      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="inline-flex items-center justify-center h-[20px] min-w-[20px] px-1.5 rounded-full bg-gray-200 text-gray-600 text-[11px] font-semibold leading-none">
        {count}
      </span>
      {legend && <div className="ml-1">{legend}</div>}
      <div className="flex-1" />
      <ChevronDown className={`h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-transform duration-200${open ? '' : ' -rotate-90'}`} />
    </button>
  )
}

export function ProcessosList({ processos, escritorioId, clientes, tiposProcesso, funcionarios }: Props) {
  const [allProcessos, setAllProcessos] = useState<ProcessoRow[]>(processos)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recente' | 'prazo'>('recente')
  const [showAtivosSection, setShowAtivosSection] = useState(true)
  const [showConcluidosSection, setShowConcluidosSection] = useState(true)
  const [showArchive, setShowArchive] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set(ALL_STATUSES))
  const [filterResponsaveis, setFilterResponsaveis] = useState<Set<string>>(new Set(ALL_RESPONSAVEIS))

  const inputRef = useRef<HTMLInputElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeSearch() {
    setSearch('')
    setSearchOpen(false)
  }

  function toggleStatus(s: string) {
    setFilterStatuses(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function toggleResponsavel(r: string) {
    setFilterResponsaveis(prev => {
      const next = new Set(prev)
      next.has(r) ? next.delete(r) : next.add(r)
      return next
    })
  }

  function resetFilters() {
    setFilterStatuses(new Set())
    setFilterResponsaveis(new Set())
  }

  const activeFilterCount =
    (ALL_STATUSES.length - filterStatuses.size) +
    (ALL_RESPONSAVEIS.length - filterResponsaveis.size)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeSearch(); setFilterOpen(false) }
    }
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  function handleProcessoCreated(p: ProcessoCreated) {
    setAllProcessos(prev => [p, ...prev])
  }

  async function handleStatusChange(id: string, newStatus: ProcessoRow['status']) {
    const supabase = createClient()
    await supabase.from('processos').update({ status: newStatus }).eq('id', id)
    setAllProcessos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  const isConcluido = (p: ProcessoRow) =>
    p.status === 'concluido' || (p.etapas.length > 0 && p.etapa_atual >= p.etapas.length)
  const isArquivado = (p: ProcessoRow) =>
    p.status === 'cancelado' || p.status === 'suspenso' || p.status === 'indeferido'

  function filterRow(p: ProcessoRow, ignoreResponsavel = false) {
    const q = search.toLowerCase()
    const matchSearch = q === '' ||
      p.titulo.toLowerCase().includes(q) ||
      p.referencia_interna?.toLowerCase().includes(q) ||
      p.clientes?.nome.toLowerCase().includes(q)
    if (ignoreResponsavel) return matchSearch
    const knownValues = new Set<string>(ALL_RESPONSAVEIS)
    const prioridade = knownValues.has(p.prioridade) ? p.prioridade : 'escritorio'
    return matchSearch && filterResponsaveis.has(prioridade)
  }

  function sortRows(rows: ProcessoRow[]) {
    return [...rows].sort((a, b) => {
      if (sortBy === 'prazo') {
        if (!a.data_prazo && !b.data_prazo) return 0
        if (!a.data_prazo) return 1
        if (!b.data_prazo) return -1
        return a.data_prazo.localeCompare(b.data_prazo)
      }
      return 0
    })
  }

  function sortAtivos(rows: ProcessoRow[]) {
    const BORDA_ORDER = { critico: 0, atencao: 1, normal: 2 } as const
    return [...rows].sort((a, b) => {
      const diff = BORDA_ORDER[getUrgenciaBorda(a.data_prazo)] - BORDA_ORDER[getUrgenciaBorda(b.data_prazo)]
      if (diff !== 0) return diff
      if (!a.data_prazo && !b.data_prazo) return 0
      if (!a.data_prazo) return 1
      if (!b.data_prazo) return -1
      return a.data_prazo.localeCompare(b.data_prazo)
    })
  }

  const showAtivos = filterStatuses.has('ativo')
  const showConcluidos = filterStatuses.has('concluido')
  const showArquivados = filterStatuses.has('arquivado')

  const ativos = sortAtivos(allProcessos.filter(p => !isConcluido(p) && !isArquivado(p) && filterRow(p)))
  const concluidos = sortRows(allProcessos.filter(p => isConcluido(p) && filterRow(p, true)))
  const arquivados = sortRows(allProcessos.filter(p => isArquivado(p) && filterRow(p, true)))

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out rounded-lg border
            ${searchOpen
              ? 'w-56 border-gray-300 bg-white px-2 focus-within:ring-2 focus-within:ring-gray-400 focus-within:border-transparent'
              : 'w-8 border-transparent'}`}
          >
            <button onClick={openSearch} className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
              <Search className="h-4 w-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className={`text-sm bg-transparent focus:outline-none transition-all duration-300 ${searchOpen ? 'w-full py-1' : 'w-0 p-0'}`}
            />
            {searchOpen && (
              <button onClick={closeSearch} className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort button + panel */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(v => !v)}
              className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                sortBy !== 'recente'
                  ? 'border-gray-800 bg-gray-900 text-white hover:bg-gray-800'
                  : 'border-[#e8e8e4] bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Ordenar
            </button>
            <div className={`absolute right-0 top-full mt-1.5 z-30 w-52 bg-white border border-[#e8e8e4] rounded-xl shadow-lg transition-all duration-200 origin-top-right ${
              sortOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <div className="p-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Ordenar por</p>
                <div className="space-y-0.5">
                  {([
                    { value: 'recente', label: 'Mais recentes' },
                    { value: 'prazo', label: 'Prazo mais próximo' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                        sortBy === opt.value ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`flex-shrink-0 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                        sortBy === opt.value ? 'border-gray-800' : 'border-gray-300'
                      }`}>
                        {sortBy === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-gray-800" />}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filter button + panel */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                activeFilterCount > 0
                  ? 'border-gray-800 bg-gray-900 text-white hover:bg-gray-800'
                  : 'border-[#e8e8e4] bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtrar
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white text-gray-900 text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter panel */}
            <div className={`absolute right-0 top-full mt-1.5 z-30 w-80 bg-white border border-[#e8e8e4] rounded-xl shadow-lg transition-all duration-200 origin-top-right ${
              filterOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <div className="p-4">
                <div className="flex gap-5">
                  {/* Status */}
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Status</p>
                    <div className="space-y-2">
                      {ALL_STATUSES.map(s => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterStatuses.has(s)}
                            onChange={() => toggleStatus(s)}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors select-none whitespace-nowrap">
                            {s === 'ativo' ? 'Ativos' : s === 'concluido' ? 'Concluídos' : 'Arquivados'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-gray-100" />

                  {/* Responsável */}
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Em posse de</p>
                    <div className="space-y-2">
                      {ALL_RESPONSAVEIS.map(r => (
                        <label key={r} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterResponsaveis.has(r)}
                            onChange={() => toggleResponsavel(r)}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors select-none whitespace-nowrap">
                            {r === 'escritorio' ? 'Escritório' : r === 'cliente' ? 'Cliente' : 'Órgão externo'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-gray-100">
                  {filterStatuses.size === 0 && filterResponsaveis.size === 0 ? (
                    <button
                      onClick={() => { setFilterStatuses(new Set(ALL_STATUSES)); setFilterResponsaveis(new Set(ALL_RESPONSAVEIS)) }}
                      className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Marcar tudo
                    </button>
                  ) : (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Desmarcar tudo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* New process */}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#1a1c20] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo processo
          </button>
        </div>
      </div>

      {/* Empty state */}
      {allProcessos.length === 0 && (
        <div className="bg-white rounded-xl border border-[#e8e8e4] py-16 text-center">
          <FolderOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Sem processos</p>
          <p className="text-gray-400 text-xs mt-1">Crie o primeiro processo clicando em "Novo processo".</p>
        </div>
      )}

      {/* Active processes */}
      {allProcessos.length > 0 && showAtivos && (
        <div className="space-y-2.5">
          <SectionHeader
            label="Ativos"
            count={ativos.length}
            open={showAtivosSection}
            onToggle={() => setShowAtivosSection(v => !v)}
            legend={
              <span className="flex items-center gap-2.5 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><span className="text-blue-500">●</span> Escritório</span>
                <span className="flex items-center gap-1"><span className="text-orange-400">●</span> Cliente</span>
                <span className="flex items-center gap-1"><span className="text-gray-400">●</span> Órgão externo</span>
              </span>
            }
          />
          {showAtivosSection && (ativos.length > 0 ? (
            <div className="space-y-2">
              {ativos.map(p => <ProcessoCard key={p.id} p={p} showResponsavel onStatusChange={handleStatusChange} />)}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e8e8e4] py-10 text-center">
              <p className="text-gray-400 text-sm">
                {search || activeFilterCount ? 'Nenhum processo ativo corresponde aos filtros.' : 'Sem processos ativos.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Completed processes */}
      {allProcessos.length > 0 && showConcluidos && concluidos.length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader
            label="Concluídos"
            count={concluidos.length}
            open={showConcluidosSection}
            onToggle={() => setShowConcluidosSection(v => !v)}
          />
          {showConcluidosSection && (
            <div className="space-y-2">
              {concluidos.map(p => <ProcessoCard key={p.id} p={p} showStatus statusOverride="concluido" hideProgress onStatusChange={handleStatusChange} />)}
            </div>
          )}
        </div>
      )}

      {/* Archived processes */}
      {showArquivados && (
        <div className="space-y-2.5">
          <SectionHeader
            label="Arquivados"
            count={arquivados.length}
            open={showArchive}
            onToggle={() => setShowArchive(v => !v)}
          />
          {showArchive && (arquivados.length > 0 ? (
            <div className="space-y-2">
              {arquivados.map(p => <ProcessoCard key={p.id} p={p} showStatus hideProgress onStatusChange={handleStatusChange} />)}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e8e8e4] py-10 text-center">
              <p className="text-gray-400 text-sm">Sem processos arquivados.</p>
            </div>
          ))}
        </div>
      )}

      <NovoProcessoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        escritorioId={escritorioId}
        clientes={clientes}
        tiposProcesso={tiposProcesso}
        funcionarios={funcionarios}
        onCreated={handleProcessoCreated}
      />
    </div>
  )
}
