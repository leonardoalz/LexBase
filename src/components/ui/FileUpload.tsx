'use client'

import { useRef, useState } from 'react'
import { Upload, File, X } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  className?: string
  disabled?: boolean
}

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function FileUpload({ onFileSelect, accept, maxSizeMB = 15, className, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) return 'Tipo de ficheiro não suportado. Use PDF, imagem ou Word.'
    if (file.size > maxSizeMB * 1024 * 1024) return `Ficheiro demasiado grande. Máximo ${maxSizeMB}MB.`
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <File className="h-8 w-8 text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
            </div>
            <button onClick={clear} className="ml-2 text-gray-400 hover:text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Arraste um ficheiro ou clique para selecionar</p>
            <p className="text-xs text-gray-400 mt-1">PDF, imagem ou Word — máx. {maxSizeMB}MB</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept || '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
    </div>
  )
}
