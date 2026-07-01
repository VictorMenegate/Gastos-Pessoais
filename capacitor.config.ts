import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.gastospessoais.app',
  appName: 'Gastos',
  // Exigido pelo CLI, mas não usado em modo remoto (o conteúdo vem de server.url)
  webDir: 'public',
  server: {
    // O WebView carrega o PWA já publicado (deploy Coolify)
    url: 'https://gastos.161.97.159.77.sslip.io',
    androidScheme: 'https',
    // Domínios extras que o WebView pode navegar dentro do app (Supabase Auth/Storage)
    allowNavigation: ['*.supabase.co', '*.sslip.io'],
  },
}

export default config
