'use client'

import React, { useMemo, useState } from 'react'
import { DictationInput } from '@/components/dictation/DictationButton'

function parseSpokenDate(input: string): string {
  // Returns ISO `YYYY-MM-DD` when possible, else empty string
  const trimmed = input.trim().toLowerCase()
  // Direct ISO date
  const isoMatch = trimmed.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoMatch) return isoMatch[0]

  // Common patterns: "12 March 2024", "12 Mar 2024", "March 12 2024"
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12
  }

  // Remove ordinal suffixes ("12th", "1st", "2nd", "3rd")
  const normalized = trimmed.replace(/(\d+)(st|nd|rd|th)/g, '$1').replace(/[,]/g, ' ')
  const parts = normalized.split(/\s+/).filter(Boolean)

  // Numeric formats: 12/03/2024 or 12-03-2024
  const numericMatch = normalized.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/)
  if (numericMatch) {
    const d1 = parseInt(numericMatch[1], 10)
    const d2 = parseInt(numericMatch[2], 10)
    const year = parseInt(numericMatch[3], 10)
    let day = d1
    let month = d2
    // Heuristic to infer dd/mm vs mm/dd
    if (d1 <= 12 && d2 > 12) {
      month = d1
      day = d2
    }
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${year}-${mm}-${dd}`
    }
  }

  // Try formats
  // e.g., 12 march 2024
  if (parts.length >= 3) {
    // day month year
    const dayDMY = parseInt(parts[0], 10)
    const monthDMY = months[parts[1]]
    const yearDMY = parseInt(parts[2], 10)
    if (!isNaN(dayDMY) && monthDMY && yearDMY && yearDMY > 1900) {
      const mm = String(monthDMY).padStart(2, '0')
      const dd = String(dayDMY).padStart(2, '0')
      return `${yearDMY}-${mm}-${dd}`
    }
    // month day year (e.g., march 12 2024)
    const monthMDY = months[parts[0]]
    const dayMDY = parseInt(parts[1], 10)
    const yearMDY = parseInt(parts[2], 10)
    if (monthMDY && !isNaN(dayMDY) && yearMDY && yearMDY > 1900) {
      const mm = String(monthMDY).padStart(2, '0')
      const dd = String(dayMDY).padStart(2, '0')
      return `${yearMDY}-${mm}-${dd}`
    }
  }

  // Relative forms: today, yesterday, last <weekday>
  const weekdays: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  }
  const ymd = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (normalized === 'today') return ymd(new Date())
  if (normalized === 'yesterday') {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return ymd(d)
  }
  const lastWeekdayMatch = normalized.match(/^last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/)
  if (lastWeekdayMatch) {
    const target = weekdays[lastWeekdayMatch[1]]
    const d = new Date()
    // Move back to the previous occurrence of the target weekday
    let delta = (d.getDay() - target + 7) % 7
    if (delta === 0) delta = 7
    d.setDate(d.getDate() - delta)
    return ymd(d)
  }
  return ''
}

export function DictationDateInput({
  value,
  onChange,
  label,
  id,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  id: string
}) {
  const [lastSpoken, setLastSpoken] = useState('')
  const [error, setError] = useState('')

  const helperText = useMemo(() => {
    if (error) return error
    if (lastSpoken) return `Heard: "${lastSpoken}"`
    return 'Say dates like "12 March 2024" or "today"'
  }, [error, lastSpoken])

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <DictationInput
          value={lastSpoken}
          onChange={(spoken) => {
            setLastSpoken(spoken)
            const parsed = parseSpokenDate(spoken)
            if (parsed) {
              setError('')
              onChange(parsed)
            } else {
              setError('Could not parse that into a date')
            }
          }}
          placeholder="Dictate date"
          className="w-[140px]"
        />
      </div>
      <p className={error ? 'text-xs text-red-600 mt-1' : 'text-xs text-gray-500 mt-1'}>{helperText}</p>
    </div>
  )
}

export default DictationDateInput