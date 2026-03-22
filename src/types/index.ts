export type PaymentType = 'split' | 'single'

export interface SalaryEntry {
  label: string
  amount: number
  day: number
}

export interface Profile {
  id: string
  user_id: string
  name: string
  payment_type: PaymentType
  salary_schedule: SalaryEntry[]
  color: string
  created_at: string
  updated_at: string
}

export interface IncomeEntry {
  id: string
  profile_id: string
  label: string
  amount: number
  expected_date: string
  received_date: string | null
  month_ref: string
  notes: string | null
  created_at: string
}

export interface Category {
  id: string
  profile_id: string | null
  name: string
  icon: string
  color: string
}

export interface Expense {
  id: string
  profile_id: string
  category_id: string | null
  description: string
  amount: number
  date: string
  month_ref: string
  paid: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // joins
  categories?: Category
  profiles?: Profile
}

export interface RecurringBill {
  id: string
  profile_id: string
  category_id: string | null
  description: string
  amount: number
  due_day: number
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // joins
  categories?: Category
  profiles?: Profile
}

export interface BillOccurrence {
  id: string
  recurring_bill_id: string
  month_ref: string
  due_date: string
  amount: number
  paid: boolean
  paid_at: string | null
  notes: string | null
  created_at: string
  // joins
  recurring_bills?: RecurringBill
}

export interface Installment {
  id: string
  profile_id: string
  category_id: string | null
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
  // joins
  categories?: Category
  profiles?: Profile
}

export interface MonthlySummary {
  profile_id: string
  profile_name: string
  month_ref: string
  total_expenses: number
  total_income_expected: number
  total_income_received: number
}

// Helper type para formulários
export type ExpenseFormData = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'categories' | 'profiles'>
export type RecurringBillFormData = Omit<RecurringBill, 'id' | 'created_at' | 'updated_at' | 'categories' | 'profiles'>
export type InstallmentFormData = Omit<Installment, 'id' | 'created_at' | 'updated_at' | 'categories' | 'profiles'>
