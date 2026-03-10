'use client'

import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { pt } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import * as Popover from '@radix-ui/react-popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string        // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecionar data',
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const selected = parsed && isValid(parsed) ? parsed : undefined
  const display = selected ? format(selected, 'dd/MM/yyyy') : ''

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-left',
            'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent',
            !display && 'text-gray-400',
            disabled && 'cursor-not-allowed opacity-50 bg-gray-50',
            className,
          )}
        >
          <span>{display || placeholder}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[200] rounded-xl border border-gray-100 bg-white p-3 shadow-lg outline-none"
        >
          <DayPicker
            mode="single"
            locale={pt}
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
            captionLayout="dropdown"
            weekStartsOn={0}
            startMonth={new Date(1920, 0)}
            endMonth={new Date(2026, 11)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
