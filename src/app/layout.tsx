import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema Comercial | Inmobiliaria SaaS',
  description: 'Sistema de gestión de inventario inmobiliario con plano interactivo, cotizador y automatizaciones',
  keywords: ['inmobiliaria', 'lotes', 'cotizador', 'plano interactivo', 'SaaS'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
