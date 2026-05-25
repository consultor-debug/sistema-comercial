'use client'

import React from 'react'
import { Users, Search, FileText, Map } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

interface Cliente {
    dni: string
    nombres: string
    apellidos: string
    email: string
    telefono: string | null
    contratos: number
    cotizaciones: number
    ultimaActividad: string | null
}

export default function ClientesPage() {
    const [clientes, setClientes] = React.useState<Cliente[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')

    React.useEffect(() => {
        Promise.allSettled([
            fetch('/api/contracts').then(r => r.json()) as Promise<any>,
            (fetch('/api/quotations/list').then(r => r.json()).catch(() => ({ quotations: [] }))) as Promise<any>,
        ]).then(([contratosResult, cotizacionesResult]) => {
            const map: Record<string, Cliente> = {}

            // From contracts
            const contracts: any[] = contratosResult.status === 'fulfilled' ? ((contratosResult.value as any).contracts || []) : []
            for (const c of contracts) {
                const key: string = c.clienteDni
                if (!map[key]) {
                    map[key] = {
                        dni: c.clienteDni,
                        nombres: c.clienteNombres,
                        apellidos: c.clienteApellidos,
                        email: c.clienteEmail,
                        telefono: c.clientePhone || null,
                        contratos: 1,
                        cotizaciones: 0,
                        ultimaActividad: c.createdAt,
                    }
                } else {
                    map[key].contratos++
                    if (!map[key].ultimaActividad || c.createdAt > map[key].ultimaActividad!) {
                        map[key].ultimaActividad = c.createdAt
                    }
                }
            }

            // From quotations (if available)
            const quotations: any[] = cotizacionesResult.status === 'fulfilled'
                ? ((cotizacionesResult.value as any).quotations || (cotizacionesResult.value as any).data || [])
                : []
            for (const q of quotations) {
                const key: string = q.clienteDni
                if (!map[key]) {
                    map[key] = {
                        dni: q.clienteDni,
                        nombres: q.clienteNombres,
                        apellidos: q.clienteApellidos,
                        email: q.clienteEmail,
                        telefono: null,
                        contratos: 0,
                        cotizaciones: 1,
                        ultimaActividad: q.createdAt,
                    }
                } else {
                    map[key].cotizaciones++
                    if (!map[key].ultimaActividad || q.createdAt > map[key].ultimaActividad!) {
                        map[key].ultimaActividad = q.createdAt
                    }
                }
            }

            const list = Object.values(map).sort((a: Cliente, b: Cliente) => {
                if (!a.ultimaActividad) return 1
                if (!b.ultimaActividad) return -1
                return b.ultimaActividad.localeCompare(a.ultimaActividad)
            })
            setClientes(list)
        }).finally(() => setLoading(false))
    }, [])

    const filtered = clientes.filter(c => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            c.dni.includes(q) ||
            c.nombres.toLowerCase().includes(q) ||
            c.apellidos.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
    })

    const fmtDate = (s: string | null) => {
        if (!s) return '—'
        return new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                <header className="h-14 sticky top-0 z-30 flex items-center gap-2 text-sm text-slate-400 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <Users className="w-4 h-4" />
                    <span>Clientes</span>
                </header>

                <div className="max-w-6xl mx-auto py-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Clientes</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Compradores registrados en cotizaciones y contratos</p>
                        </div>
                        <div className="text-sm text-slate-500 hidden md:block">
                            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por DNI, nombre o email..."
                            className="w-full bg-slate-900 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay clientes registrados</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {['DNI', 'Nombre', 'Email', 'Teléfono', 'Contratos', 'Cotizaciones', 'Última actividad'].map((h, i) => (
                                                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c, i) => (
                                            <tr key={c.dni} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs text-slate-400">{c.dni}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-white text-xs font-medium">{c.nombres} {c.apellidos}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-slate-400 text-xs">{c.email}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-slate-400 text-xs">{c.telefono || '—'}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3 text-slate-600" />
                                                        <span className="text-white text-xs font-semibold">{c.contratos}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Map className="w-3 h-3 text-slate-600" />
                                                        <span className="text-white text-xs font-semibold">{c.cotizaciones}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-slate-400 text-xs">{fmtDate(c.ultimaActividad)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
