import type { Metadata } from 'next'
import './globals.css'
import 'react-quill/dist/quill.snow.css'
import { Toaster } from 'sonner'
import { Providers } from '@/components/Providers'
import { ActivityTracker } from '@/components/ActivityTracker'
import { SecurityLayer } from '@/components/SecurityLayer'

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
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <ActivityTracker />
          <SecurityLayer />
          {children}
          <ToasterWrapper />
        </Providers>
      </body>
    </html>
  )
}

// Dynamic Toaster that reads the current theme
function ToasterWrapper() {
  return (
    <Toaster
      position="top-right"
      theme="system"
      toastOptions={{
        classNames: {
          toast: 'dark:!bg-slate-900 dark:!border-white/8 dark:!text-slate-100 !bg-white !border-slate-200 !text-slate-900',
        },
      }}
    />
  )
}
