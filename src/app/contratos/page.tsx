'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import {
    Loader2, Search, FileText, Plus, Eye, Clock, CheckCircle2,
    XCircle, AlertCircle, Download, ChevronRight
} from 'lucide-react'

interface Contrato {
    id: string
    codigo: string
    tipo: 'SEPARACION' | 'COMPRAVENTA'
    estado: 'BORRADOR' | 'ACTIVO' | 'FIRMADO' | 'CANCELADO'
    clienteNombres: string
    clienteApellidos: string
    clienteDni: string
    clienteEmail: string
    precioTotal: number
    descuentoPct: number
    inicial: number | null
    cuotasNum: number | null
    createdAt: string
    lot: { code: string; manzana: string; areaM2: number }
    user: { name: string }
    cuotas: { id: string; estado: string }[]
}

const ESTADO_BADGE: Record<string, string> = {
    BORRADOR:  'bg-gray-100 text-gray-600 border-gray-200',
    ACTIVO:    'bg-blue-50 text-blue-700 border-blue-200',
    FIRMADO:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELADO: 'bg-rose-50 text-rose-600 border-rose-200',
}
const ESTADO_LABEL: Record<string, string> = {
    BORRADOR: 'Borrador', ACTIVO: 'Activo', FIRMADO: 'Firmado', CANCELADO: 'Cancelado'
}
const TIPO_LABEL: Record<string, string> = {
    SEPARACION: 'Separación', COMPRAVENTA: 'Compraventa'
}

function fmtS(n: number) { return `S/ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ContratosPage() {
    const [contratos, setContratos] = React.useState<Contrato[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')
    const [estadoFilter, setEstadoFilter] = React.useState<string>('ALL')

    React.useEffect(() => {
        fetch('/api/contratos').then(r => r.json()).then(d => {
            if (d.ok) setContratos(d.contratos)
        }).finally(() => setLoading(false))
    }, [])

    const filtered = React.useMemo(() => {
        let list = contratos
        if (estadoFilter !== 'ALL') list = list.filter(c => c.estado === estadoFilter)
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(c =>
                c.clienteNombres.toLowerCase().includes(q) ||
                c.clienteApellidos.toLowerCase().includes(q) ||
                c.clienteDni.includes(q) ||
                c.codigo.toLowerCase().includes(q) ||
                c.lot.code.toLowerCase().includes(q)
            )
        }
        return list
    }, [contratos, search, estadoFilter])

    const stats = {
        total: contratos.length,
        activos: contratos.filter(c => c.estado === 'ACTIVO').length,
        firmados: contratos.filter(c => c.estado === 'FIRMADO').length,
        separaciones: contratos.filter(c => c.tipo === 'SEPARACION').length,
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Contratos</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {stats.total} contratos · {stats.activos} activos · {stats.firmados} firmados
                            </p>
                        </div>
                        <Link
                            href="/vender"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Nueva venta
                        </Link>
                    </div>
                </div>

                <div className="flex-1 p-6 space-y-4">
                    {/* Métricas rápidas */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-gray-900' },
                            { label: 'Activos', value: stats.activos, color: 'text-blue-600' },
                            { label: 'Firmados', value: stats.firmados, color: 'text-emerald-600' },
                            { label: 'Separaciones', value: stats.separaciones, color: 'text-amber-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                                <div className={cn('text-2xl font-bold mt-0.5', s.color)}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                placeholder="Cliente, DNI, código..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-3 h-8 w-52 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {['ALL', 'ACTIVO', 'FIRMADO', 'BORRADOR', 'CANCELADO'].map(e => (
                                <button key={e} onClick={() => setEstadoFilter(e)}
                                    className={cn(
                                        'px-3 h-8 rounded-lg border text-xs font-medium transition-colors',
                                        estadoFilter === e
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    )}>
                                    {e === 'ALL' ? 'Todos' : ESTADO_LABEL[e]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <FileText className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm">No hay contratos</p>
                                <Link href="/vender" className="mt-2 text-sm text-blue-600 hover:underline">
                                    Crear primera venta
                                </Link>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lote</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Precio</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuotas</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(c => {
                                        const pagadas = c.cuotas.filter(q => q.estado === 'PAGADO').length
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.codigo}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {c.clienteNombres} {c.clienteApellidos}
                                                    </div>
                                                    <div className="text-xs text-gray-400">DNI {c.clienteDni}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    Mz.{c.lot.manzana} · {c.lot.code}
                                                    <div className="text-xs text-gray-400">{c.lot.areaM2} m²</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-600">{TIPO_LABEL[c.tipo]}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-sm font-semibold text-gray-900">{fmtS(c.precioTotal)}</div>
                                                    {c.descuentoPct > 0 && (
                                                        <div className="text-xs text-emerald-600">-{c.descuentoPct}% dscto</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {c.cuotas.length > 0 ? (
                                                        <span>{pagadas}/{c.cuotas.length}</span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', ESTADO_BADGE[c.estado])}>
                                                        {ESTADO_LABEL[c.estado]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(c.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <Link href={`/contratos/${c.id}`}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
