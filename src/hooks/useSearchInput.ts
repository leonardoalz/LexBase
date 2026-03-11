'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export function useSearchInput() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setSearch('')
    setSearchOpen(false)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSearch])

  return { searchOpen, search, setSearch, openSearch, closeSearch, inputRef }
}
