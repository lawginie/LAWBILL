import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for bill calculations
export function roundToMinutes(hours: number, roundingMinutes: number = 15): number {
  const roundingHours = roundingMinutes / 60
  return Math.ceil(hours / roundingHours) * roundingHours
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function calculateVAT(amount: number, vatRate: number = 0.15): number {
  return amount * vatRate
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  
  if (h === 0) {
    return `${m}m`
  } else if (m === 0) {
    return `${h}h`
  } else {
    return `${h}h ${m}m`
  }
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}