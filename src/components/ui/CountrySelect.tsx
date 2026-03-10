'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { CPLP_COUNTRIES, OTHER_COUNTRIES } from '@/lib/countries'

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function CountrySelect({ value, onChange, className, placeholder = 'Selecionar país...' }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const q = search.toLowerCase()
  const filteredCPLP = CPLP_COUNTRIES.filter(c => c.toLowerCase().includes(q))
  const filteredOther = OTHER_COUNTRIES.filter(c => c.toLowerCase().includes(q))
  const hasResults = filteredCPLP.length > 0 || filteredOther.length > 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(country: string) {
    onChange(country)
    setOpen(false)
    setSearch('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  function handleOpen() {
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className={`${className} flex items-center justify-between cursor-pointer`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar país..."
              className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto">
            {!hasResults ? (
              <li className="px-3 py-2 text-sm text-gray-400 text-center">Nenhum resultado</li>
            ) : (
              <>
                {filteredCPLP.length > 0 && (
                  <>
                    {!search && (
                      <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        CPLP
                      </li>
                    )}
                    {filteredCPLP.map(country => (
                      <li
                        key={country}
                        onClick={() => handleSelect(country)}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors
                          ${value === country ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      >
                        {country}
                      </li>
                    ))}
                  </>
                )}

                {filteredCPLP.length > 0 && filteredOther.length > 0 && (
                  <li className="mx-3 my-1 border-t border-gray-100" />
                )}

                {filteredOther.length > 0 && (
                  <>
                    {!search && (
                      <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Outros países
                      </li>
                    )}
                    {filteredOther.map(country => (
                      <li
                        key={country}
                        onClick={() => handleSelect(country)}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors
                          ${value === country ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      >
                        {country}
                      </li>
                    ))}
                  </>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
