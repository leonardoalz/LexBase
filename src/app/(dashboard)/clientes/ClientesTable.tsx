'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, X, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ClienteRow {
  id: string
  nome: string
  email: string
  telefone: string | null
  nacionalidade: string | null
  created_at: string
  processos: { id: string; status: string }[]
}

type SortCol = 'nome' | 'email' | 'nacionalidade' | 'ativos' | 'created_at'
type SortDir = 'asc' | 'desc'

export function ClientesTable({ clientes }: { clientes: ClienteRow[] }) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ col: SortCol; dir: SortDir }>({ col: 'nome', dir: 'asc' })
  const inputRef = useRef<HTMLInputElement>(null)

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeSearch() {
    setSearch('')
    setSearchOpen(false)
  }

  function toggleSort(col: SortCol) {
    setSort(prev => prev.col === col
      ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' }
    )
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtered = search.trim() === ''
    ? clientes
    : clientes.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )

  const sorted = [...filtered].sort((a, b) => {
    const mul = sort.dir === 'asc' ? 1 : -1
    switch (sort.col) {
      case 'nome': return mul * a.nome.localeCompare(b.nome)
      case 'email': return mul * a.email.localeCompare(b.email)
      case 'nacionalidade': return mul * (a.nacionalidade ?? '').localeCompare(b.nacionalidade ?? '')
      case 'ativos': {
        const aA = a.processos.filter(p => p.status === 'ativo').length
        const bA = b.processos.filter(p => p.status === 'ativo').length
        return mul * (aA - bA)
      }
      case 'created_at': return mul * a.created_at.localeCompare(b.created_at)
      default: return 0
    }
  })

  function SortIcon({ col }: { col: SortCol }) {
    if (sort.col !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />
    return sort.dir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  function Th({ col, label }: { col: SortCol; label: string }) {
    return (
      <th
        className="text-left px-6 py-3 cursor-pointer select-none hover:text-gray-600 transition-colors"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 rounded-full bg-gray-200 text-gray-600 text-[12px] font-semibold leading-none">
              {clientes.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out rounded-lg border
            ${searchOpen
              ? 'w-56 border-gray-300 bg-white px-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'
              : 'w-8 border-transparent'}`}
          >
            <button onClick={openSearch} className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
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

          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-1.5 bg-[#1a1c20] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {sorted.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <Th col="nome" label="Nome" />
                <Th col="email" label="Email" />
                <Th col="nacionalidade" label="Nacionalidade" />
                <Th col="ativos" label="Processos ativos" />
                <Th col="created_at" label="Criado em" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const ativos = c.processos.filter(p => p.status === 'ativo').length
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clientes/${c.id}`)}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{c.nome}</td>
                    <td className="px-6 py-3 text-gray-500">{c.email}</td>
                    <td className="px-6 py-3 text-gray-500">{c.nacionalidade ?? '—'}</td>
                    <td className="px-6 py-3">
                      {ativos > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ativos} ativo{ativos !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400">{formatDate(c.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">
              {search ? `Nenhum cliente encontrado para "${search}"` : 'Sem clientes.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
