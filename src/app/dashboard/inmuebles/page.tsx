'use client'

import React from 'react'
import Link from 'next/link'
import { Database, Search, ExternalLink, Unlock, Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

interface Lot {
    id: string
    code: string
    manzana: string
    loteNumero: number
    areaM2: number
    precioLista: number
    estado: 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
    project: { id: string; name: string }
    asesor: { name: string } | null
}

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    LIBRE:         { label: 'Libre',         bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    SEPARADO:      { label: 'Separado',      bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
    VENDIDO:       { label: 'Vendido',        bg: 'bg-rose-500/10',    text: 'text-rose-400'    },
    NO_DISPONIBLE: { label: 'No disponible', bg: 'bg-slate-500/10',   text: 'text-slate-400'   },
}

export default function InmueblesPage() {
    const [lots, setLots] = React.useState<Lot[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')
    const [estadoFilter, setEstadoFilter] = React.useState<'ALL' | 'LIBRE' | 'SEPARADO' | 'VENDIDO'>('ALL')
    const [liberando, setLiberando] = React.useState<string | null>(null)
    const [confirmId, setConfirmId] = React.useState<string | null>(null)

    async function liberarLote(id: string) {
        setLiberando(id)
        try {
            const res = await fetch(`/api/lots/${id}/liberar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: 'Liberación desde panel de inmuebles' }),
            })
            if (res.ok) {
                setLots(prev => prev.map(l => l.id === id ? { ...l, estado: 'LIBRE' } : l))
            }
        } finally {
            setLiberando(null)
            setConfirmId(null)
        }
    }

    React.useEffect(() => {
        fetch('/api/admin/lots')
            .then(r => r.json())
            .then(d => setLots(d.lots || d.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const filtered = lots.filter(l => {
        const matchEstado = estadoFilter === 'ALL' || l.estado === estadoFilter
        if (!matchEstado) return false
        if (!search) return true
        const q = search.toLowerCase()
        return (
            l.code.toLowerCase().includes(q) ||
            l.manzana.toLowerCase().includes(q) ||
            l.project.name.toLowerCase().includes(q) ||
            (l.asesor?.name || '').toLowerCase().includes(q)
        )
    })

    const fmtCurrency = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                <header className="h-14 sticky top-0 z-30 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Database className="w-4 h-4" />
                        <span>Inmuebles</span>
                    </div>
                    <Link href="/admin/lots" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
                        Gestión avanzada <ExternalLink className="w-3 h-3" />
                    </Link>
                </header>

                <div className="max-w-6xl mx-auto py-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Inmuebles / Lotes</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Inventario completo de lotes por proyecto</p>
                        </div>
                        <div className="text-sm text-slate-500 hidden md:block">{filtered.length} lotes</div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por código, manzana, proyecto o asesor..."
                                className="w-full bg-slate-900 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8 shrink-0">
                            {(['ALL', 'LIBRE', 'SEPARADO', 'VENDIDO'] as const).map(f => (
                                <button key={f} onClick={() => setEstadoFilter(f)} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', estadoFilter === f ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white')}>
                                    {f === 'ALL' ? 'Todos' : ESTADO_CONFIG[f].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay lotes que mostrar</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {['Código', 'Manzana', 'Lote', 'Área', 'Proyecto', 'Estado', 'Precio', 'Asesor', ''].map(h => (
                                                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((l, i) => {
                                            const cfg = ESTADO_CONFIG[l.estado] || ESTADO_CONFIG.NO_DISPONIBLE
                                            return (
                                                <tr key={l.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                                                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-slate-400">{l.code}</span></td>
                                                    <td className="px-5 py-3.5"><span className="text-white text-xs">{l.manzana}</span></td>
                                                    <td className="px-5 py-3.5"><span className="text-white text-xs">{l.loteNumero}</span></td>
                                                    <td className="px-5 py-3.5"><span className="text-slate-400 text-xs">{l.areaM2} m²</span></td>
                                                    <td className="px-5 py-3.5">
                                                        <Link href={`/projects/${l.project.id}`} className="text-sky-400 hover:text-sky-300 text-xs transition-colors">{l.project.name}</Link>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium', cfg.bg, cfg.text)}>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5"><span className="text-white text-xs font-medium">{fmtCurrency(l.precioLista)}</span></td>
                                                    <td className="px-5 py-3.5"><span className="text-slate-400 text-xs">{l.asesor?.name || '—'}</span></td>
                                                    <td className="px-5 py-3.5">
                                                        {l.estado === 'SEPARADO' && (
                                                            confirmId === l.id ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => liberarLote(l.id)}
                                                                        disabled={liberando === l.id}
                                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                                                                    >
                                                                        {liberando === l.id
                                                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                            : <Unlock className="w-3 h-3" />}
                                                                        Confirmar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmId(null)}
                                                                        className="px-2 py-1 rounded-md text-slate-400 hover:text-white text-xs transition-colors"
                                                                    >
                                                                        No
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setConfirmId(l.id)}
                                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs transition-colors"
                                                                >
                                                                    <Unlock className="w-3 h-3" />
                                                                    Liberar
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
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
