// ============================================================
// TYPES - Sistema Financeiro Pessoal
// ============================================================

// --- Enums ---
export type TransactionType = 'income' | 'expense'
export type PaymentMethodType = 'credit' | 'debit' | 'pix' | 'cash' | 'transfer' | 'other'
export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success'
export type AlertType = 'budget_warning' | 'budget_exceeded' | 'bill_due' | 'bill_overdue' | 'goal_milestone' | 'spending_spike' | 'income_received' | 'custom'
export type TransactionSource = 'manual' | 'whatsapp' | 'bank_sync' | 'recurring' | 'installment'
export type ProfileRole = 'owner' | 'admin' | 'member'
export type PaymentType = 'split' | 'single'
export type CategoryType = 'expense' | 'income' | 'both'
export type WhatsAppSessionState = 'pending' | 'awaiting_type' | 'awaiting_payment' | 'awaiting_category' | 'awaiting_confirm' | 'completed'

// --- Entities ---

export interface Account {
  id: string
  name: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface SalaryEntry {
  label: string
  amount: number
  day: number
}

export interface Profile {
  id: string
  user_id: string
  account_id: string
  name: string
  salary: number
  payment_type: PaymentType
  salary_schedule: SalaryEntry[]
  color: string
  avatar_url: string | null
  role: ProfileRole
  whatsapp_phone: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  account_id: string | null
  profile_id: string | null
  name: string
  icon: string
  color: string
  type: CategoryType
  created_at: string
}

export interface PaymentMethod {
  id: string
  account_id: string
  name: string
  type: PaymentMethodType
  icon: string
  color: string
  is_default: boolean
  active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  profile_id: string
  category_id: string | null
  payment_method_id: string | null
  type: TransactionType
  description: string
  amount: number
  date: string
  month_ref: string
  is_recurring: boolean
  recurring_id: string | null
  installment_id: string | null
  tags: string[]
  notes: string | null
  source: TransactionSource
  created_at: string
  updated_at: string
  // Joins
  categories?: Category
  profiles?: Pick<Profile, 'name' | 'color'>
  payment_methods?: PaymentMethod
}

export interface RecurringTransaction {
  id: string
  account_id: string
  profile_id: string
  category_id: string | null
  payment_method_id: string | null
  type: TransactionType
  description: string
  amount: number
  frequency: Frequency
  day_of_month: number | null
  day_of_week: number | null
  start_date: string
  end_date: string | null
  active: boolean
  auto_confirm: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  categories?: Category
  profiles?: Pick<Profile, 'name' | 'color'>
  payment_methods?: PaymentMethod
}

export interface Installment {
  id: string
  account_id: string
  profile_id: string
  category_id: string | null
  payment_method_id: string | null
  description: string
  total_amount: number
  installment_value: number
  total_installments: number
  paid_installments: number
  start_date: string
  due_day: number
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  categories?: Category
  profiles?: Pick<Profile, 'name' | 'color'>
  payment_methods?: PaymentMethod
}

export interface Budget {
  id: string
  account_id: string
  category_id: string | null
  profile_id: string | null
  amount: number
  month_ref: string | null
  alert_threshold: number
  created_at: string
  updated_at: string
  // Joins
  categories?: Category
  profiles?: Pick<Profile, 'name' | 'color'>
}

export interface BudgetStatus extends Budget {
  category_name: string
  category_icon: string
  spent_amount: number
  spent_percentage: number
}

export interface FinancialGoal {
  id: string
  account_id: string
  profile_id: string | null
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  status: GoalStatus
  created_at: string
  updated_at: string
  // Joins
  profiles?: Pick<Profile, 'name' | 'color'>
}

export interface GoalContribution {
  id: string
  goal_id: string
  profile_id: string
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export interface Alert {
  id: string
  account_id: string
  profile_id: string | null
  type: AlertType
  title: string
  message: string
  severity: AlertSeverity
  read: boolean
  read_at: string | null
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

export interface WhatsAppSession {
  id: string
  profile_id: string
  phone: string
  state: WhatsAppSessionState
  temp_data: Record<string, any>
  last_message_at: string
  created_at: string
}

// --- Dashboard Types ---

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  totalRecurring: number
  totalInstallments: number
  totalCommitted: number
  balance: number
  savingsRate: number
  transactionCount: number
}

export interface CategoryBreakdown {
  name: string
  icon: string
  color: string
  value: number
  percentage: number
  count: number
  budget?: number
}

export interface MonthlyComparison {
  month: string
  income: number
  expenses: number
  balance: number
}

export interface DashboardData {
  month: string
  profiles: Profile[]
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  installments: Installment[]
  summary: DashboardSummary
  byCategory: CategoryBreakdown[]
  monthlyComparison: MonthlyComparison[]
  budgetStatus: BudgetStatus[]
  alerts: Alert[]
}

// --- Form Types ---

export type TransactionFormData = {
  type: TransactionType
  description: string
  amount: string
  date: string
  category_id: string
  payment_method_id: string
  profile_id: string
  notes: string
  tags: string[]
}

export type RecurringFormData = {
  type: TransactionType
  description: string
  amount: string
  frequency: Frequency
  day_of_month: string
  category_id: string
  payment_method_id: string
  profile_id: string
  notes: string
}

export type InstallmentFormData = {
  description: string
  total_amount: string
  installment_value: string
  total_installments: string
  start_date: string
  due_day: string
  category_id: string
  payment_method_id: string
  profile_id: string
  notes: string
}

export type BudgetFormData = {
  category_id: string
  profile_id: string
  amount: string
  alert_threshold: string
}

export type GoalFormData = {
  name: string
  description: string
  target_amount: string
  deadline: string
  icon: string
  color: string
  profile_id: string
}
