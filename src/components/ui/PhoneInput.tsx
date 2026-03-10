'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface DDIEntry {
  code: string
  ddi: string
  name: string
}

const CPLP: DDIEntry[] = [
  { code: 'PT', ddi: '+351', name: 'Portugal' },
  { code: 'BR', ddi: '+55',  name: 'Brasil' },
  { code: 'AO', ddi: '+244', name: 'Angola' },
  { code: 'CV', ddi: '+238', name: 'Cabo Verde' },
  { code: 'GW', ddi: '+245', name: 'Guiné-Bissau' },
  { code: 'MZ', ddi: '+258', name: 'Moçambique' },
  { code: 'ST', ddi: '+239', name: 'S. Tomé e Príncipe' },
  { code: 'TL', ddi: '+670', name: 'Timor-Leste' },
  { code: 'GQ', ddi: '+240', name: 'Guiné Equatorial' },
]

const OTHERS: DDIEntry[] = [
  { code: 'ZA', ddi: '+27',  name: 'África do Sul' },
  { code: 'DE', ddi: '+49',  name: 'Alemanha' },
  { code: 'SA', ddi: '+966', name: 'Arábia Saudita' },
  { code: 'AU', ddi: '+61',  name: 'Austrália' },
  { code: 'AT', ddi: '+43',  name: 'Áustria' },
  { code: 'BD', ddi: '+880', name: 'Bangladesh' },
  { code: 'BE', ddi: '+32',  name: 'Bélgica' },
  { code: 'BO', ddi: '+591', name: 'Bolívia' },
  { code: 'CA', ddi: '+1',   name: 'Canadá' },
  { code: 'CL', ddi: '+56',  name: 'Chile' },
  { code: 'CN', ddi: '+86',  name: 'China' },
  { code: 'CO', ddi: '+57',  name: 'Colômbia' },
  { code: 'KR', ddi: '+82',  name: 'Coreia do Sul' },
  { code: 'HR', ddi: '+385', name: 'Croácia' },
  { code: 'CU', ddi: '+53',  name: 'Cuba' },
  { code: 'DK', ddi: '+45',  name: 'Dinamarca' },
  { code: 'EG', ddi: '+20',  name: 'Egipto' },
  { code: 'AE', ddi: '+971', name: 'Emirados Árabes' },
  { code: 'EC', ddi: '+593', name: 'Equador' },
  { code: 'ES', ddi: '+34',  name: 'Espanha' },
  { code: 'US', ddi: '+1',   name: 'EUA' },
  { code: 'ET', ddi: '+251', name: 'Etiópia' },
  { code: 'PH', ddi: '+63',  name: 'Filipinas' },
  { code: 'FI', ddi: '+358', name: 'Finlândia' },
  { code: 'FR', ddi: '+33',  name: 'França' },
  { code: 'GH', ddi: '+233', name: 'Gana' },
  { code: 'GR', ddi: '+30',  name: 'Grécia' },
  { code: 'IN', ddi: '+91',  name: 'Índia' },
  { code: 'ID', ddi: '+62',  name: 'Indonésia' },
  { code: 'IR', ddi: '+98',  name: 'Irão' },
  { code: 'IE', ddi: '+353', name: 'Irlanda' },
  { code: 'IT', ddi: '+39',  name: 'Itália' },
  { code: 'JP', ddi: '+81',  name: 'Japão' },
  { code: 'MA', ddi: '+212', name: 'Marrocos' },
  { code: 'MX', ddi: '+52',  name: 'México' },
  { code: 'MD', ddi: '+373', name: 'Moldávia' },
  { code: 'NP', ddi: '+977', name: 'Nepal' },
  { code: 'NG', ddi: '+234', name: 'Nigéria' },
  { code: 'NL', ddi: '+31',  name: 'Holanda' },
  { code: 'NO', ddi: '+47',  name: 'Noruega' },
  { code: 'PK', ddi: '+92',  name: 'Paquistão' },
  { code: 'PY', ddi: '+595', name: 'Paraguai' },
  { code: 'PE', ddi: '+51',  name: 'Peru' },
  { code: 'PL', ddi: '+48',  name: 'Polónia' },
  { code: 'GB', ddi: '+44',  name: 'Reino Unido' },
  { code: 'CZ', ddi: '+420', name: 'Rep. Checa' },
  { code: 'RO', ddi: '+40',  name: 'Roménia' },
  { code: 'RU', ddi: '+7',   name: 'Rússia' },
  { code: 'SN', ddi: '+221', name: 'Senegal' },
  { code: 'RS', ddi: '+381', name: 'Sérvia' },
  { code: 'LK', ddi: '+94',  name: 'Sri Lanka' },
  { code: 'SE', ddi: '+46',  name: 'Suécia' },
  { code: 'CH', ddi: '+41',  name: 'Suíça' },
  { code: 'TH', ddi: '+66',  name: 'Tailândia' },
  { code: 'TZ', ddi: '+255', name: 'Tanzânia' },
  { code: 'TR', ddi: '+90',  name: 'Turquia' },
  { code: 'UA', ddi: '+380', name: 'Ucrânia' },
  { code: 'UY', ddi: '+598', name: 'Uruguai' },
  { code: 'VE', ddi: '+58',  name: 'Venezuela' },
  { code: 'VN', ddi: '+84',  name: 'Vietname' },
  { code: 'ZW', ddi: '+263', name: 'Zimbabué' },
]

function flag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 0x1F1A5))
}

// Parse value "+351912345678" → { entry: ..., number: "912345678" }
function parseValue(value: string): { entry: DDIEntry; number: string } {
  const all = [...CPLP, ...OTHERS]
  // Try longest match first
  const sorted = [...all].sort((a, b) => b.ddi.length - a.ddi.length)
  for (const entry of sorted) {
    if (value.startsWith(entry.ddi)) {
      return { entry, number: value.slice(entry.ddi.length) }
    }
  }
  return { entry: CPLP[0], number: value }
}

interface Props {
  value: string
  onChange: (value: string) => void
  error?: boolean
  placeholder?: string
}

export function PhoneInput({ value, onChange, error, placeholder = '912 345 678' }: Props) {
  const { entry: selected, number } = parseValue(value || CPLP[0].ddi)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  function openDropdown() {
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 20)
  }

  function selectEntry(entry: DDIEntry) {
    onChange(entry.ddi + number)
    setOpen(false)
    setSearch('')
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only digits and spaces
    const num = e.target.value.replace(/[^\d\s]/g, '')
    onChange(selected.ddi + num)
  }

  const q = search.toLowerCase()
  const filteredCPLP = CPLP.filter(e => e.name.toLowerCase().includes(q) || e.ddi.includes(q))
  const filteredOthers = OTHERS.filter(e => e.name.toLowerCase().includes(q) || e.ddi.includes(q))

  const ringClass = error
    ? 'ring-2 ring-red-400 border-red-400'
    : 'border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center border rounded-lg overflow-hidden transition-all ${ringClass}`}>
        {/* DDI selector */}
        <button
          type="button"
          onClick={openDropdown}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0 text-sm"
        >
          <span className="text-base leading-none">{flag(selected.code)}</span>
          <span className="text-gray-600 font-medium">{selected.ddi}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-white focus:outline-none"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar país..."
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filteredCPLP.length > 0 && (
              <>
                {!search && <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">CPLP</li>}
                {filteredCPLP.map(e => (
                  <li
                    key={e.code}
                    onClick={() => selectEntry(e)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors
                      ${selected.code === e.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span className="text-base">{flag(e.code)}</span>
                    <span className="flex-1">{e.name}</span>
                    <span className="text-gray-400">{e.ddi}</span>
                  </li>
                ))}
              </>
            )}
            {filteredCPLP.length > 0 && filteredOthers.length > 0 && (
              <li className="mx-3 my-1 border-t border-gray-100" />
            )}
            {filteredOthers.length > 0 && (
              <>
                {!search && <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Outros países</li>}
                {filteredOthers.map(e => (
                  <li
                    key={e.code}
                    onClick={() => selectEntry(e)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors
                      ${selected.code === e.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span className="text-base">{flag(e.code)}</span>
                    <span className="flex-1">{e.name}</span>
                    <span className="text-gray-400">{e.ddi}</span>
                  </li>
                ))}
              </>
            )}
            {filteredCPLP.length === 0 && filteredOthers.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-400 text-center">Nenhum resultado</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
