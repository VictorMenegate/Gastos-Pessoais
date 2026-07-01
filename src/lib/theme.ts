// Temas de cor do app. A cor escolhida vira CSS variables no <html>,
// que alimentam globals.css, a paleta `brand` do Tailwind e estilos inline.
// A preferência é salva por aparelho em localStorage (sem banco).

export interface TemaApp {
  id: string
  nome: string
  accent: string      // cor principal
  accentLight: string // tom claro (gradientes, barras)
  accentDark: string  // tom escuro (fundo do hero)
}

export const TEMAS: TemaApp[] = [
  { id: 'azul',    nome: 'Azul',    accent: '#2B4C7E', accentLight: '#567EBB', accentDark: '#1e3a6e' },
  { id: 'verde',   nome: 'Verde',   accent: '#047857', accentLight: '#10b981', accentDark: '#065f46' },
  { id: 'roxo',    nome: 'Roxo',    accent: '#6d28d9', accentLight: '#8b5cf6', accentDark: '#5b21b6' },
  { id: 'rosa',    nome: 'Rosa',    accent: '#be185d', accentLight: '#ec4899', accentDark: '#9d174d' },
  { id: 'laranja', nome: 'Laranja', accent: '#c2410c', accentLight: '#f97316', accentDark: '#9a3412' },
  { id: 'grafite', nome: 'Grafite', accent: '#334155', accentLight: '#64748b', accentDark: '#1e293b' },
]

export const TEMA_PADRAO = TEMAS[0]

const CHAVE_TEMA = 'gastos-tema'
// Snapshot das variables para o script inline do layout aplicar antes do paint
const CHAVE_TEMA_VARS = 'gastos-tema-vars'

function hexParaRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function varsDoTema(tema: TemaApp): Record<string, string> {
  const rgb = hexParaRgb(tema.accent)
  return {
    '--accent': tema.accent,
    '--accent-light': tema.accentLight,
    '--accent-dark': tema.accentDark,
    '--accent-rgb': rgb,
    '--accent-light-rgb': hexParaRgb(tema.accentLight),
    '--accent-glow': `rgba(${rgb}, 0.12)`,
  }
}

export function aplicarTema(tema: TemaApp) {
  const vars = varsDoTema(tema)
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v)
  }
}

export function temaSalvo(): TemaApp {
  if (typeof window === 'undefined') return TEMA_PADRAO
  try {
    const id = localStorage.getItem(CHAVE_TEMA)
    return TEMAS.find(t => t.id === id) ?? TEMA_PADRAO
  } catch {
    return TEMA_PADRAO
  }
}

export function salvarTema(tema: TemaApp) {
  try {
    localStorage.setItem(CHAVE_TEMA, tema.id)
    localStorage.setItem(CHAVE_TEMA_VARS, JSON.stringify(varsDoTema(tema)))
  } catch {}
  aplicarTema(tema)
}

// Lê o valor computado de uma CSS variable (para libs que não aceitam var(),
// como o fill de barras do Recharts)
export function corDaVar(nome: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
  return v || fallback
}
