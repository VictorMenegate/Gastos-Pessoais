import type { Metadata, Viewport } from 'next'
import './globals.css'
import BiometricGate from '@/components/BiometricGate'
import PushInit from '@/components/PushInit'

export const metadata: Metadata = {
  title: 'Gastos Pessoais',
  description: 'Sistema financeiro pessoal multiusuário',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gastos',
  },
}

export const viewport: Viewport = {
  themeColor: '#2B4C7E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Aplica a cor do app salva no aparelho antes do primeiro paint (evita flash do tema padrão) */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var v=JSON.parse(localStorage.getItem('gastos-tema-vars'));if(v)for(var k in v)document.documentElement.style.setProperty(k,v[k])}catch(e){}`
        }} />
      </head>
      <body className="antialiased">
        <BiometricGate>{children}</BiometricGate>
        <PushInit />
      </body>
    </html>
  )
}
