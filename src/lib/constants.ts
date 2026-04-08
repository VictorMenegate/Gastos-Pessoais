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
  '#9ACC77', '#45936C', '#334F53', '#E5EAD4', '#8b5cf6',
  '#ec4899', '#3d5d61', '#f97316', '#6366f1', '#45936C',
  '#a855f7', '#e11d48', '#0ea5e9', '#9ACC77', '#d946ef',
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
  { value: 'income', label: 'Entrada', icon: '📥', color: '#9ACC77' },
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
  info: { bg: 'bg-blue-900/50', border: 'border-blue-800', text: 'text-blue-400', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-900/50', border: 'border-amber-800', text: 'text-amber-400', icon: '⚠️' },
  danger: { bg: 'bg-red-900/50', border: 'border-red-800', text: 'text-red-400', icon: '🚨' },
  success: { bg: 'bg-green-900/50', border: 'border-green-800', text: 'text-green-400', icon: '✅' },
} as const
