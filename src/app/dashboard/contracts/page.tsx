'use client'

import React from 'react'
import { FileText, Download, Filter } from 'lucide-react'
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

export default function ContractsPage() {
    const [contracts, setContracts] = React.useState<Contract[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<'ALL' | 'SEPARACION' | 'COMPRAVENTA'>('ALL')

    React.useEffect(() => {
        const url = filter === 'ALL' ? '/api/contracts' : `/api/contracts?tipo=${filter}`
        setLoading(true)
        fetch(url)
            .then(r => r.json())
            .then(d => {
                if (d.success) setContracts(d.contracts)
            })
            .finally(() => setLoading(false))
    }, [filter])

    const formatDate = (s: string) =>
        new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Contratos</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Separaciones y compraventas generadas</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/8">
                    <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
                    {(['ALL', 'SEPARACION', 'COMPRAVENTA'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                                filter === f
                                    ? 'bg-white text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            {f === 'ALL' ? 'Todos' : f === 'SEPARACION' ? 'Separaciones' : 'Compraventas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-20">
                    <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay contratos generados aún</p>
                </div>
            ) : (
                <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Código</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Tipo</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Lote</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Cliente</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Precio</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Fecha</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Generado por</th>
                                    <th className="text-right px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Archivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.map((c, i) => (
                                    <tr key={c.id} className={cn(
                                        'border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors',
                                        i === contracts.length - 1 && 'border-b-0'
                                    )}>
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs text-slate-400">{c.codigo}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
                                                c.tipo === 'SEPARACION'
                                                    ? 'bg-amber-500/10 text-amber-400'
                                                    : 'bg-emerald-500/10 text-emerald-400'
                                            )}>
                                                {c.tipo === 'SEPARACION' ? 'Separación' : 'Compraventa'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="text-white font-medium text-xs">{c.lot.code}</p>
                                                <p className="text-slate-500 text-[11px]">{c.lot.project.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="text-white text-xs">{c.clienteNombres} {c.clienteApellidos}</p>
                                                <p className="text-slate-500 text-[11px]">DNI: {c.clienteDni}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-white text-xs font-medium">{formatCurrency(c.precioTotal)}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-slate-400 text-xs">{formatDate(c.createdAt)}</span>
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
                                                    <Download className="w-3 h-3" />
                                                    DOCX
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
    )
}
