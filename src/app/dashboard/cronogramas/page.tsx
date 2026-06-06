'use client'

import React from 'react'
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

type CuotaEstado = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'

interface CuotaItem {
    id: string
    numero: number
    fecha: string // ISO string from fechaVenc
    monto: number
    estado: CuotaEstado
}

interface CronogramaEntry {
    contractId: string
    codigo: string
    clienteNombre: string
    lotCode: string
    projectName: string
    precioTotal: number
    cuotasTotal: number
    cuotas: CuotaItem[]
    createdAt: string
}

export default function CronogramasPage() {
    const [entries, setEntries] = React.useState<CronogramaEntry[]>([])
    const [loading, setLoading] = React.useState(true)
    const [expanded, setExpanded] = React.useState<string | null>(null)

    React.useEffect(() => {
        fetch('/api/contratos?tipo=COMPRAVENTA')
            .then(r => r.json())
            .then(d => {
                const contratos: any[] = d.contratos || []
                const result: CronogramaEntry[] = contratos
                    .filter((c: any) => Array.isArray(c.cuotas) && c.cuotas.length > 0)
                    .map((c: any) => ({
                        contractId: c.id,
                        codigo: c.codigo,
                        clienteNombre: `${c.clienteNombres} ${c.clienteApellidos}`,
                        lotCode: c.lot?.code ?? '—',
                        projectName: c.lot?.project?.name ?? '—',
                        precioTotal: c.precioTotal,
                        cuotasTotal: c.cuotas.length,
                        cuotas: c.cuotas.map((q: any) => ({
                            id: q.id,
                            numero: q.numero,
                            fecha: q.fechaVenc,
                            monto: q.monto,
                            estado: q.estado as CuotaEstado,
                        })).sort((a: CuotaItem, b: CuotaItem) => a.numero - b.numero),
                        createdAt: c.createdAt,
                    }))
                setEntries(result)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const today = new Date()

    const getProximaCuota = (cuotas: CuotaItem[]) => {
        return cuotas
            .filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO' || c.estado === 'PARCIAL')
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0] || null
    }

    const getPagadas = (cuotas: CuotaItem[]) =>
        cuotas.filter(c => c.estado === 'PAGADO').length

    const getPendienteMonto = (cuotas: CuotaItem[]) =>
        cuotas
            .filter(c => c.estado !== 'PAGADO')
            .reduce((s, c) => s + c.monto, 0)

    const fmtCurrency = (n: number) =>
        `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

    const fmtDate = (s: string) => {
        const d = new Date(s)
        if (isNaN(d.getTime())) return s
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const estadoConfig: Record<CuotaEstado, { label: string; color: string }> = {
        PAGADO:    { label: 'Pagado',   color: 'text-emerald-500' },
        PENDIENTE: { label: 'Pendiente', color: 'text-slate-400'  },
        VENCIDO:   { label: 'Vencido',  color: 'text-red-400'    },
        PARCIAL:   { label: 'Parcial',  color: 'text-amber-400'  },
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                <header className="h-14 sticky top-0 z-30 flex items-center gap-2 text-sm text-slate-400 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <Calendar className="w-4 h-4" />
                    <span>Cronogramas</span>
                </header>

                <div className="max-w-5xl mx-auto py-8 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cronogramas de pago</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Contratos de compraventa con cuotas activas</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-20">
                            <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay cronogramas activos</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map(entry => {
                                const proxima = getProximaCuota(entry.cuotas)
                                const pagadas = getPagadas(entry.cuotas)
                                const pendienteMonto = getPendienteMonto(entry.cuotas)
                                const isExpanded = expanded === entry.contractId
                                const proximaDate = proxima ? new Date(proxima.fecha) : null
                                const isUrgent = proximaDate
                                    ? (proximaDate.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000
                                    : false
                                const hayVencidas = entry.cuotas.some(c => c.estado === 'VENCIDO')

                                return (
                                    <div key={entry.contractId} className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
                                        <button
                                            onClick={() => setExpanded(isExpanded ? null : entry.contractId)}
                                            className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-xs text-slate-500">{entry.codigo}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-medium">Compraventa</span>
                                                        {hayVencidas && (
                                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                                <AlertCircle className="w-3 h-3" /> Cuota vencida
                                                            </span>
                                                        )}
                                                        {!hayVencidas && isUrgent && (
                                                            <span className="flex items-center gap-1 text-xs text-amber-400">
                                                                <AlertCircle className="w-3 h-3" /> Próximo vence
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white font-semibold text-sm">{entry.clienteNombre}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5">{entry.lotCode} · {entry.projectName}</p>
                                                </div>
                                                <div className="flex items-center gap-6 text-right shrink-0">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 mb-0.5">Pagadas</p>
                                                        <p className="text-sm font-semibold text-white">{pagadas}/{entry.cuotasTotal}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 mb-0.5">Pendiente</p>
                                                        <p className={cn('text-sm font-semibold', pendienteMonto > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                                                            {fmtCurrency(pendienteMonto)}
                                                        </p>
                                                    </div>
                                                    {proxima && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 mb-0.5">Próx. vencimiento</p>
                                                            <p className={cn('text-xs font-medium', hayVencidas ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white')}>
                                                                {fmtDate(proxima.fecha)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-white/5 p-5">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                                    Detalle del cronograma
                                                </p>
                                                <div className="grid gap-1.5 max-h-64 overflow-y-auto">
                                                    {entry.cuotas.map(cuota => {
                                                        const cfg = estadoConfig[cuota.estado]
                                                        const isPagado = cuota.estado === 'PAGADO'
                                                        return (
                                                            <div
                                                                key={cuota.id}
                                                                className={cn(
                                                                    'flex items-center justify-between py-2 px-3 rounded-lg text-xs',
                                                                    isPagado ? 'bg-white/[0.02] opacity-60' : 'bg-white/[0.04]',
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-slate-600 w-6 text-right">{cuota.numero}</span>
                                                                    <span className={isPagado ? 'text-slate-500' : 'text-white'}>
                                                                        {fmtDate(cuota.fecha)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={cn('font-semibold', isPagado ? 'text-emerald-500' : 'text-white')}>
                                                                        {fmtCurrency(cuota.monto)}
                                                                    </span>
                                                                    <span className={cn('text-[10px] w-16 text-right', cfg.color)}>
                                                                        {cfg.label}
                                                                    </span>
                                                                    {isPagado && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
