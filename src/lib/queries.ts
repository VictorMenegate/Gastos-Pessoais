import { createClient } from './supabase/client'
import { currentMonthRef, sumBy, calculateSavingsRate } from './utils'
import type {
  Profile, Account, Transaction, RecurringTransaction,
  Installment, Category, PaymentMethod, Budget, BudgetStatus,
  FinancialGoal, GoalContribution, Alert, DashboardData,
  DashboardSummary, CategoryBreakdown, MonthlyComparison,
} from '@/types'

// ─── ACCOUNT ────────────────────────────────────────────────

export async function getAccount(): Promise<Account | null> {
  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('account_id')
    .not('account_id', 'is', null)
    .limit(1)
  if (!profiles?.length || !profiles[0].account_id) return null

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', profiles[0].account_id)
    .single()
  if (error) return null
  return data
}

export async function createAccount(name: string): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

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

  // Garante que existe uma account
  let accountId = profile.account_id
  if (!accountId) {
    // Verifica se já existe uma account para este usuário
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', profile.user_id!)
      .not('account_id', 'is', null)
      .limit(1)

    if (existingProfiles?.length && existingProfiles[0].account_id) {
      accountId = existingProfiles[0].account_id
    } else {
      // Cria uma nova account
      const { data: newAccount, error: accError } = await supabase
        .from('accounts')
        .insert({ name: 'Minha Conta' })
        .select()
        .single()
      if (accError) throw accError
      accountId = newAccount.id
    }
  }

  const payload = {
    ...profile,
    account_id: accountId,
    salary_schedule: typeof profile.salary_schedule === 'string'
      ? JSON.parse(profile.salary_schedule)
      : profile.salary_schedule,
    updated_at: new Date().toISOString(),
  }
  if (!payload.id) delete payload.id
  if (!payload.created_at) delete payload.created_at
  if (!payload.avatar_url) delete payload.avatar_url
  if (!payload.whatsapp_phone) payload.whatsapp_phone = null

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─── CATEGORIES ─────────────────────────────────────────────

export async function getCategories(type?: 'expense' | 'income'): Promise<Category[]> {
  const supabase = createClient()
  let query = supabase.from('categories').select('*').order('name')
  if (type) {
    query = query.in('type', [type, 'both'])
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createCategory(category: Partial<Category>): Promise<Category> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── PAYMENT METHODS ────────────────────────────────────────

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('active', true)
    .order('is_default', { ascending: false })
  if (error) throw error
  return data
}

export async function createPaymentMethod(method: Partial<PaymentMethod>): Promise<PaymentMethod> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_methods')
    .insert(method)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── TRANSACTIONS ───────────────────────────────────────────

export async function getTransactions(month?: string, type?: 'income' | 'expense') {
  const supabase = createClient()
  const ref = month ?? currentMonthRef()
  let query = supabase
    .from('transactions')
    .select('*, categories(name, icon, color), profiles(name, color), payment_methods(name, icon, type)')
    .eq('month_ref', ref)
    .order('date', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

export async function createTransaction(transaction: Partial<Transaction>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transaction,
      month_ref: transaction.month_ref || currentMonthRef(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ─── RECURRING TRANSACTIONS ────────────────────────────────

export async function getRecurringTransactions(type?: 'income' | 'expense') {
  const supabase = createClient()
  let query = supabase
    .from('recurring_transactions')
    .select('*, categories(name, icon, color), profiles(name, color), payment_methods(name, icon, type)')
    .eq('active', true)
    .order('day_of_month')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data as RecurringTransaction[]
}

export async function createRecurringTransaction(recurring: Partial<RecurringTransaction>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert(recurring)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteRecurringTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}

// ─── INSTALLMENTS ───────────────────────────────────────────

export async function getInstallments() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('installments')
    .select('*, categories(name, icon, color), profiles(name, color), payment_methods(name, icon, type)')
    .eq('active', true)
    .order('start_date')
  if (error) throw error
  return data as Installment[]
}

export async function createInstallment(inst: Partial<Installment>) {
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

// ─── BUDGETS ────────────────────────────────────────────────

export async function getBudgets(month?: string): Promise<Budget[]> {
  const supabase = createClient()
  const ref = month ?? currentMonthRef()
  const { data, error } = await supabase
    .from('budgets')
    .select('*, categories(name, icon, color), profiles(name, color)')
    .or(`month_ref.eq.${ref},month_ref.is.null`)
    .order('created_at')
  if (error) throw error
  return data as Budget[]
}

export async function getBudgetStatus(month?: string): Promise<BudgetStatus[]> {
  const supabase = createClient()
  const ref = month ?? currentMonthRef()
  const { data, error } = await supabase
    .from('v_budget_status')
    .select('*')
    .eq('month_ref', ref)
  if (error) throw error
  return data as BudgetStatus[]
}

export async function upsertBudget(budget: Partial<Budget>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBudget(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

// ─── FINANCIAL GOALS ────────────────────────────────────────

export async function getFinancialGoals(status?: 'active' | 'completed'): Promise<FinancialGoal[]> {
  const supabase = createClient()
  let query = supabase
    .from('financial_goals')
    .select('*, profiles(name, color)')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data as FinancialGoal[]
}

export async function createFinancialGoal(goal: Partial<FinancialGoal>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('financial_goals')
    .insert(goal)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFinancialGoal(id: string, updates: Partial<FinancialGoal>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('financial_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function addGoalContribution(contribution: Partial<GoalContribution>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goal_contributions')
    .insert(contribution)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getGoalContributions(goalId: string): Promise<GoalContribution[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// ─── ALERTS ─────────────────────────────────────────────────

export async function getAlerts(unreadOnly = false): Promise<Alert[]> {
  const supabase = createClient()
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (unreadOnly) query = query.eq('read', false)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function markAlertRead(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('alerts')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllAlertsRead() {
  const supabase = createClient()
  const { error } = await supabase
    .from('alerts')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('read', false)
  if (error) throw error
}

// ─── DASHBOARD ──────────────────────────────────────────────

export async function getDashboardData(month?: string): Promise<DashboardData> {
  const ref = month ?? currentMonthRef()
  const [transactions, recurringTransactions, installments, profiles, budgetStatus, alerts] = await Promise.all([
    getTransactions(ref),
    getRecurringTransactions(),
    getInstallments(),
    getProfiles(),
    getBudgetStatus(ref),
    getAlerts(true),
  ])

  const incomes = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')

  const totalIncome = sumBy(incomes, t => Number(t.amount))
  const totalExpenses = sumBy(expenses, t => Number(t.amount))
  const totalRecurring = sumBy(
    recurringTransactions.filter(r => r.type === 'expense'),
    r => Number(r.amount)
  )
  const totalInstallments = sumBy(installments, i => Number(i.installment_value))
  const totalCommitted = totalExpenses + totalInstallments

  const summary: DashboardSummary = {
    totalIncome,
    totalExpenses,
    totalRecurring,
    totalInstallments,
    totalCommitted,
    balance: totalIncome - totalCommitted,
    savingsRate: calculateSavingsRate(totalIncome, totalCommitted),
    transactionCount: transactions.length,
  }

  // Gastos por categoria
  const categoryMap = expenses.reduce((acc, t) => {
    const key = t.categories?.name ?? 'Outros'
    if (!acc[key]) {
      acc[key] = {
        name: key,
        icon: t.categories?.icon ?? '💸',
        color: t.categories?.color ?? '#6b7280',
        value: 0,
        percentage: 0,
        count: 0,
      }
    }
    acc[key].value += Number(t.amount)
    acc[key].count++
    return acc
  }, {} as Record<string, CategoryBreakdown>)

  const byCategory = Object.values(categoryMap)
    .map(c => ({
      ...c,
      percentage: totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0,
      budget: budgetStatus.find(b => b.category_name === c.name)?.budget_amount,
    }))
    .sort((a, b) => b.value - a.value)

  // Comparação mensal (últimos 6 meses)
  const monthlyComparison = await getMonthlyComparison(6)

  return {
    month: ref,
    profiles,
    transactions,
    recurringTransactions,
    installments,
    summary,
    byCategory,
    monthlyComparison,
    budgetStatus,
    alerts,
  }
}

async function getMonthlyComparison(months: number): Promise<MonthlyComparison[]> {
  const supabase = createClient()
  const monthRefs = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthRefs.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('month_ref, type, amount')
    .in('month_ref', monthRefs)
  if (error) return []

  const map: Record<string, MonthlyComparison> = {}
  for (const ref of monthRefs) {
    map[ref] = { month: ref, income: 0, expenses: 0, balance: 0 }
  }
  for (const t of data) {
    if (!map[t.month_ref]) continue
    if (t.type === 'income') map[t.month_ref].income += Number(t.amount)
    else map[t.month_ref].expenses += Number(t.amount)
  }
  return Object.values(map).map(m => ({
    ...m,
    balance: m.income - m.expenses,
  }))
}
