'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/Sidebar'
import { Input } from '@/components/ui/Input'
import {
    Users, Search, Mail, FileText, ChevronLeft, Loader2, ArrowLeft,
    Calendar, EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface ClientData {
    dni: string
    nombres: string
    apellidos: string
    email: string
    quotationCount: number
    lastQuotationAt: string
    totalValue: number
}

export default function ClientsPage() {
    const { data: session } = useSession()
    const role = (session?.user as any)?.role as string | undefined
    const isSuperAdmin = role === 'SUPER_ADMIN'

    const [clients, setClients] = React.useState<ClientData[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState('')

    React.useEffect(() => {
        fetch('/api/clients')
            .then(r => r.json())
            .then(d => { if (d.success) setClients(d.clients) })
            .finally(() => setIsLoading(false))
    }, [])

    const filtered = clients.filter(c => {
        if (!searchTerm) return true
        const q = searchTerm.toLowerCase()
        // For non-super admins, only search by count/date (no PII)
        if (!isSuperAdmin) return true
        return (
            `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
            c.dni.includes(q) ||
            c.email.toLowerCase().includes(q)
        )
    })

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            <div className="flex-1 md:pl-52 flex flex-col min-h-screen">
                {/* Header */}
                <header className="shrink-0 border-b border-white/5 bg-slate-950 z-40">
                    <div className="flex items-center gap-3 px-4 md:px-6 py-3">
                        <Link href="/dashboard"
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors shrink-0">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-white">
                                    {isSuperAdmin ? 'Directorio de Clientes' : 'Resumen de Cotizaciones'}
                                </h1>
                                <p className="text-[11px] text-slate-500">
                                    {isSuperAdmin
                                        ? 'Prospectos y clientes que han solicitado cotizaciones'
                                        : 'Actividad de cotizaciones (datos de clientes protegidos)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-4 md:px-6 py-5 max-w-5xl">
                    {/* Privacy notice for non-super-admin */}
                    {!isSuperAdmin && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl mb-5 text-xs text-slate-400">
                            <EyeOff className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p>
                                Los datos personales de los clientes (nombre, DNI, email) son privados y solo visibles para el Super Admin.
                                Aquí puedes ver el resumen de actividad: cuántas cotizaciones se han generado, montos y fechas.
                            </p>
                        </div>
                    )}

                    {/* Search — only for super admin */}
                    {isSuperAdmin && (
                        <div className="relative mb-5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, DNI o email…"
                                className="pl-9 bg-white/5 border-white/10 text-sm"
                            />
                        </div>
                    )}

                    {/* Table */}
                    <div className="border border-white/8 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-white/8 bg-white/3">
                                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            {isSuperAdmin ? 'Cliente' : 'Referencia'}
                                        </th>
                                        {isSuperAdmin && (
                                            <>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">DNI</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                            </>
                                        )}
                                        <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cotizaciones</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Última actividad</th>
                                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={isSuperAdmin ? 6 : 4} className="px-4 py-16 text-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-500 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500">Cargando...</p>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={isSuperAdmin ? 6 : 4} className="px-4 py-16 text-center text-slate-500 text-sm">
                                                No hay clientes registrados aún.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((client, idx) => (
                                            <tr key={isSuperAdmin ? client.dni : idx} className="hover:bg-white/3 transition-colors group">
                                                {/* Name / Reference */}
                                                <td className="px-4 py-3">
                                                    {isSuperAdmin ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-white">
                                                                {client.nombres} {client.apellidos}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <span className="text-xs text-slate-400 font-mono">
                                                                Cliente #{String(idx + 1).padStart(3, '0')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* DNI + Email — super admin only */}
                                                {isSuperAdmin && (
                                                    <>
                                                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                                            {client.dni}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <Mail className="w-3 h-3 text-slate-600 shrink-0" />
                                                                <span className="truncate max-w-[180px]">{client.email}</span>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}

                                                {/* Count */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                                        {client.quotationCount}
                                                    </span>
                                                </td>

                                                {/* Last activity */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Calendar className="w-3 h-3 shrink-0" />
                                                        {new Date(client.lastQuotationAt).toLocaleDateString('es-ES', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </div>
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-semibold text-emerald-400">
                                                        {formatCurrency(client.totalValue)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary footer */}
                    {!isLoading && filtered.length > 0 && (
                        <p className="text-[11px] text-slate-600 mt-3 text-right">
                            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} ·{' '}
                            {formatCurrency(filtered.reduce((s, c) => s + c.totalValue, 0))} en cotizaciones
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
