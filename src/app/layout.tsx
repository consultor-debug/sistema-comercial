import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'SisteMattika | Sistema Comercial Inmobiliario',
  description: 'SisteMattika — Sistema de gestión de inventario inmobiliario con plano interactivo, cotizador y automatizaciones.',
  keywords: ['inmobiliaria', 'lotes', 'cotizador', 'plano interactivo', 'SisteMattika', 'Mattika'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f8fafc',
            },
          }}
        />
        </Providers>
      </body>
    </html>
  )
}
