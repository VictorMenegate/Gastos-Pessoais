import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CURRENCY, LOCALE } from './constants'

// --- Formatação ---

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
  }).format(value)
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatMonthYear(monthRef: string): string {
  return format(parseISO(`${monthRef}-01`), "MMMM 'de' yyyy", { locale: ptBR })
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

// --- Mês ---

export function currentMonthRef(): string {
  return format(new Date(), 'yyyy-MM')
}

export function monthRefFromDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM')
}

export function getMonthRange(monthRef: string) {
  const date = parseISO(`${monthRef}-01`)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

export function getPreviousMonths(count: number): string[] {
  const months: string[] = []
  for (let i = 0; i < count; i++) {
    months.push(format(subMonths(new Date(), i), 'yyyy-MM'))
  }
  return months
}

// --- Cálculos ---

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0
  return Math.max(0, ((income - expenses) / income) * 100)
}

export function calculateInstallmentProgress(paid: number, total: number) {
  const percentage = Math.round((paid / total) * 100)
  const remaining = total - paid
  return { percentage, remaining }
}

export function sumBy<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((sum, item) => sum + getter(item), 0)
}

// --- Validação ---

export function isValidMonthRef(ref: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(ref)
}

export function isValidAmount(value: string): boolean {
  const num = parseFloat(value)
  return !isNaN(num) && num > 0
}

// --- CSS Helpers ---

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
