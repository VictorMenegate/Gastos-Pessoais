import { createClient } from './supabase/client'
import { format } from 'date-fns'
import type {
  Profile, Expense, RecurringBill, BillOccurrence,
  Installment, IncomeEntry, Category
} from '@/types'

const monthRef = (date = new Date()) => format(date, 'yyyy-MM')

// ─── PROFILES ───────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function upsertProfile(profile: Partial<Profile>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── INCOME ENTRIES ─────────────────────────────────────────

export async function getIncomeEntries(month?: string) {
  const supabase = createClient()
  const ref = month ?? monthRef()
  const { data, error } = await supabase
    .from('income_entries')
    .select('*, profiles(name, color)')
    .eq('month_ref', ref)
    .order('expected_date')
  if (error) throw error
  return data as (IncomeEntry & { profiles: Pick<Profile, 'name' | 'color'> })[]
}

export async function upsertIncomeEntry(entry: Partial<IncomeEntry>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('income_entries')
    .upsert(entry)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markIncomeReceived(id: string, received_date: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('income_entries')
    .update({ received_date })
    .eq('id', id)
  if (error) throw error
}

// ─── CATEGORIES ─────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// ─── EXPENSES ───────────────────────────────────────────────

export async function getExpenses(month?: string) {
  const supabase = createClient()
  const ref = month ?? monthRef()
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(name, icon, color), profiles(name, color)')
    .eq('month_ref', ref)
    .order('date', { ascending: false })
  if (error) throw error
  return data as (Expense & { categories: Category; profiles: Pick<Profile, 'name' | 'color'> })[]
}

export async function createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, month_ref: expense.month_ref || monthRef(new Date(expense.date)) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ─── RECURRING BILLS ────────────────────────────────────────

export async function getRecurringBills() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*, categories(name, icon, color), profiles(name, color)')
    .eq('active', true)
    .order('due_day')
  if (error) throw error
  return data as (RecurringBill & { categories: Category; profiles: Pick<Profile, 'name' | 'color'> })[]
}

export async function createRecurringBill(bill: Omit<RecurringBill, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_bills')
    .insert(bill)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecurringBill(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_bills')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}

// ─── BILL OCCURRENCES ───────────────────────────────────────

export async function getBillOccurrences(month?: string) {
  const supabase = createClient()
  const ref = month ?? monthRef()
  const { data, error } = await supabase
    .from('bill_occurrences')
    .select('*, recurring_bills(description, categories(name, icon, color), profiles(name, color))')
    .eq('month_ref', ref)
    .order('due_date')
  if (error) throw error
  return data as (BillOccurrence & {
    recurring_bills: RecurringBill & { categories: Category; profiles: Pick<Profile, 'name' | 'color'> }
  })[]
}

export async function toggleBillPaid(id: string, paid: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('bill_occurrences')
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

// ─── INSTALLMENTS ───────────────────────────────────────────

export async function getInstallments() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('installments')
    .select('*, categories(name, icon, color), profiles(name, color)')
    .eq('active', true)
    .order('start_date')
  if (error) throw error
  return data as (Installment & { categories: Category; profiles: Pick<Profile, 'name' | 'color'> })[]
}

export async function createInstallment(inst: Omit<Installment, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('installments')
    .insert(inst)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markInstallmentPaid(id: string) {
  const supabase = createClient()
  const inst = await supabase.from('installments').select('paid_installments, total_installments').eq('id', id).single()
  if (inst.error) throw inst.error
  const next = inst.data.paid_installments + 1
  const { error } = await supabase
    .from('installments')
    .update({
      paid_installments: next,
      active: next < inst.data.total_installments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// ─── DASHBOARD SUMMARY ──────────────────────────────────────

export async function getDashboardData(month?: string) {
  const ref = month ?? monthRef()
  const [expenses, incomes, bills, installments, profiles] = await Promise.all([
    getExpenses(ref),
    getIncomeEntries(ref),
    getBillOccurrences(ref),
    getInstallments(),
    getProfiles(),
  ])

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0)
  const totalInstallments = installments.reduce((s, i) => s + Number(i.installment_value), 0)
  const pendingBills = bills.filter(b => !b.paid).length

  // Gastos por categoria
  const byCategory = expenses.reduce((acc, e) => {
    const name = e.categories?.name ?? 'Outros'
    const icon = e.categories?.icon ?? '💸'
    const color = e.categories?.color ?? '#6b7280'
    acc[name] = { name, icon, color, value: (acc[name]?.value ?? 0) + Number(e.amount) }
    return acc
  }, {} as Record<string, { name: string; icon: string; color: string; value: number }>)

  return {
    month: ref,
    profiles,
    expenses,
    incomes,
    bills,
    installments,
    summary: {
      totalExpenses,
      totalIncome,
      totalBills,
      totalInstallments,
      totalCommitted: totalExpenses + totalBills + totalInstallments,
      balance: totalIncome - (totalExpenses + totalBills + totalInstallments),
      pendingBills,
    },
    byCategory: Object.values(byCategory).sort((a, b) => b.value - a.value),
  }
}
