// ============================================================
// CONSTANTES DO SISTEMA
// ============================================================

export const APP_NAME = 'Gastos Pessoais'
export const APP_DESCRIPTION = 'Sistema financeiro pessoal multiusuário'
export const CURRENCY = 'BRL'
export const LOCALE = 'pt-BR'

// Cores dos perfis
export const PROFILE_COLORS = [
  '#16a34a', '#2563eb', '#9333ea', '#db2777', '#ea580c', '#0891b2',
  '#65a30d', '#c026d3', '#dc2626', '#0d9488',
]

// Cores para gráficos
export const CHART_COLORS = [
  '#567EBB', '#2B4C7E', '#606D80', '#DCE0E6', '#8b5cf6',
  '#ec4899', '#6e7b8d', '#f97316', '#6366f1', '#2B4C7E',
  '#a855f7', '#e11d48', '#0ea5e9', '#567EBB', '#d946ef',
]

// Ícones padrão para metas
export const GOAL_ICONS = [
  '🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍',
  '👶', '🏖️', '💪', '🎮', '📚', '🔧', '🎸', '🏋️',
]

// Frequências com labels
export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
] as const

// Tipos de transação
export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Saída', icon: '📤', color: '#ef4444' },
  { value: 'income', label: 'Entrada', icon: '📥', color: '#2B4C7E' },
] as const

// Métodos de pagamento
export const PAYMENT_METHOD_TYPES = [
  { value: 'credit', label: 'Crédito', icon: '💳' },
  { value: 'debit', label: 'Débito', icon: '💳' },
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'transfer', label: 'Transferência', icon: '🏦' },
  { value: 'other', label: 'Outro', icon: '💸' },
] as const

// Severidade de alertas
export const ALERT_SEVERITY_CONFIG = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: '⚠️' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-500', icon: '🚨' },
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', icon: '✅' },
} as const
