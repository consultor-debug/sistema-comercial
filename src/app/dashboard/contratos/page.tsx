'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Download, Plus, Search } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

interface Contract {
    id: string
    codigo: string
    tipo: 'SEPARACION' | 'COMPRAVENTA'
    clienteNombres: string
    clienteApellidos: string
    clienteDni: string
    clienteEmail: string
    precioTotal: number
    docxUrl: string | null
    createdAt: string
    lot: {
        code: string
        manzana: string
        loteNumero: number
        project: { name: string }
    }
    user: { name: string }
}

const TIPO_LABELS: Record<string, string> = {
    ALL: 'Todos',
    SEPARACION: 'Separación',
    COMPRAVENTA: 'Compraventa',
}

export default function ContratosPage() {
    const [contracts, setContracts] = React.useState<Contract[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<'ALL' | 'SEPARACION' | 'COMPRAVENTA'>('ALL')
    const [search, setSearch] = React.useState('')

    React.useEffect(() => {
        const url = filter === 'ALL' ? '/api/contracts' : `/api/contracts?tipo=${filter}`
        setLoading(true)
        fetch(url)
            .then(r => r.json())
            .then(d => { if (d.success) setContracts(d.contracts) })
            .finally(() => setLoading(false))
    }, [filter])

    const filtered = contracts.filter(c => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            c.codigo.toLowerCase().includes(q) ||
            c.clienteNombres.toLowerCase().includes(q) ||
            c.clienteApellidos.toLowerCase().includes(q) ||
            c.clienteDni.includes(q) ||
            c.lot.code.toLowerCase().includes(q)
        )
    })

    const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const fmtCurrency = (n: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                {/* Header */}
                <header className="h-14 sticky top-0 z-30 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <FileText className="w-4 h-4" />
                        <span>Contratos</span>
                    </div>
                    <Link
                        href="/dashboard/wizard"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nuevo contrato
                    </Link>
                </header>

                <div className="max-w-6xl mx-auto py-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Contratos</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Separaciones y compraventas generadas</p>
                        </div>
                        <div className="text-sm text-slate-500 hidden md:block">
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por código, cliente, DNI o lote..."
                                className="w-full bg-slate-900 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8 shrink-0">
                            {(['ALL', 'SEPARACION', 'COMPRAVENTA'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                                        filter === f ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
                                    )}
                                >
                                    {TIPO_LABELS[f]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay contratos{search ? ' que coincidan' : ' generados aún'}</p>
                            {!search && (
                                <Link href="/dashboard/wizard" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors">
                                    <Plus className="w-4 h-4" /> Generar primer contrato
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {['Código', 'Tipo', 'Lote', 'Cliente', 'Precio', 'Fecha', 'Asesor', 'Archivo'].map((h, i) => (
                                                <th key={h} className={cn('px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase', i === 7 ? 'text-right' : 'text-left')}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c, i) => (
                                            <tr key={c.id} className={cn('border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors', i === filtered.length - 1 && 'border-b-0')}>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs text-slate-400">{c.codigo}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
                                                        c.tipo === 'SEPARACION' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                                                    )}>
                                                        {c.tipo === 'SEPARACION' ? 'Separación' : 'Compraventa'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-white font-medium text-xs">{c.lot.code}</p>
                                                    <p className="text-slate-500 text-[11px]">{c.lot.project.name}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-white text-xs">{c.clienteNombres} {c.clienteApellidos}</p>
                                                    <p className="text-slate-500 text-[11px]">DNI: {c.clienteDni}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-white text-xs font-medium">{fmtCurrency(c.precioTotal)}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-slate-400 text-xs">{fmtDate(c.createdAt)}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-slate-400 text-xs">{c.user.name}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {c.docxUrl ? (
                                                        <a
                                                            href={c.docxUrl}
                                                            download
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                                                        >
                                                            <Download className="w-3 h-3" /> DOCX
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs">—</span>
                                                    )}
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
