'use client'

import * as React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import {
    Loader2, Search, AlertTriangle, Clock, CheckCircle2,
    X, DollarSign, CreditCard, Smartphone, Building2,
    ChevronDown, Filter
} from 'lucide-react'

interface Cuota {
    id: string
    numero: number
    descripcion: string | null
    monto: number
    fechaVenc: string
    fechaPago: string | null
    montoPagado: number | null
    estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'
    metodoPago: string | null
    numOperacion: string | null
    contract: {
        codigo: string
        clienteNombres: string
        clienteApellidos: string
        clienteDni: string
        lot: { code: string; manzana: string }
    }
    registradoPor: { name: string } | null
}

type FilterTab = 'TODAS' | 'VENCIDO' | 'PENDIENTE' | 'PAGADO'

const METODOS = [
    { value: 'BCP', label: 'Depósito BCP' },
    { value: 'BBVA', label: 'Depósito BBVA' },
    { value: 'INTERBANK', label: 'Depósito Interbank' },
    { value: 'YAPE', label: 'Yape / Plin' },
    { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'OTRO', label: 'Otro' },
]

function fmtS(n: number) { return `S/ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` }
function fmtDate(d: string) {
    const dt = new Date(d)
    return dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysFromNow(d: string): number {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

const STATUS_BADGE: Record<string, string> = {
    PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-200',
    VENCIDO:   'bg-rose-50 text-rose-700 border-rose-200',
    PAGADO:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    PARCIAL:   'bg-amber-50 text-amber-700 border-amber-200',
}
const STATUS_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente', VENCIDO: 'Vencida', PAGADO: 'Pagada', PARCIAL: 'Parcial'
}

export default function PagosPage() {
    const [cuotas, setCuotas] = React.useState<Cuota[]>([])
    const [loading, setLoading] = React.useState(true)
    const [tab, setTab] = React.useState<FilterTab>('TODAS')
    const [search, setSearch] = React.useState('')
    const [pagarCuota, setPagarCuota] = React.useState<Cuota | null>(null)

    const fetchCuotas = React.useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/cuotas')
            const d = await r.json()
            if (d.ok) setCuotas(d.cuotas)
        } finally { setLoading(false) }
    }, [])

    React.useEffect(() => { fetchCuotas() }, [fetchCuotas])

    const stats = React.useMemo(() => ({
        vencidas: cuotas.filter(c => c.estado === 'VENCIDO'),
        proximas: cuotas.filter(c => c.estado === 'PENDIENTE' && daysFromNow(c.fechaVenc) <= 7),
        pagadasMes: cuotas.filter(c => {
            if (c.estado !== 'PAGADO' || !c.fechaPago) return false
            const d = new Date(c.fechaPago)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }),
    }), [cuotas])

    const filtered = React.useMemo(() => {
        let list = cuotas
        if (tab !== 'TODAS') list = list.filter(c => c.estado === tab)
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(c =>
                c.contract.clienteNombres.toLowerCase().includes(q) ||
                c.contract.clienteApellidos.toLowerCase().includes(q) ||
                c.contract.clienteDni.includes(q) ||
                c.contract.codigo.toLowerCase().includes(q) ||
                c.contract.lot.code.toLowerCase().includes(q)
            )
        }
        return list
    }, [cuotas, tab, search])

    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'TODAS',    label: 'Todas',     count: cuotas.length },
        { key: 'VENCIDO',  label: 'Vencidas',  count: stats.vencidas.length },
        { key: 'PENDIENTE',label: 'Pendientes',count: cuotas.filter(c => c.estado === 'PENDIENTE').length },
        { key: 'PAGADO',   label: 'Pagadas',   count: cuotas.filter(c => c.estado === 'PAGADO').length },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">Pagos y Cuotas</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Cronograma de cobros y registro de pagos</p>
                </div>

                <div className="flex-1 p-6 space-y-5">
                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-4">
                        <MetricCard
                            icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                            label="Vencidas"
                            count={stats.vencidas.length}
                            amount={stats.vencidas.reduce((s, c) => s + c.monto, 0)}
                            color="border-l-rose-500"
                            onClick={() => setTab('VENCIDO')}
                        />
                        <MetricCard
                            icon={<Clock className="w-4 h-4 text-amber-500" />}
                            label="Próximas (7 días)"
                            count={stats.proximas.length}
                            amount={stats.proximas.reduce((s, c) => s + c.monto, 0)}
                            color="border-l-amber-500"
                            onClick={() => setTab('PENDIENTE')}
                        />
                        <MetricCard
                            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            label="Cobradas este mes"
                            count={stats.pagadasMes.length}
                            amount={stats.pagadasMes.reduce((s, c) => s + (c.montoPagado || c.monto), 0)}
                            color="border-l-emerald-500"
                            onClick={() => setTab('PAGADO')}
                        />
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                placeholder="Cliente, DNI, contrato..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-3 h-8 w-52 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {tabs.map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={cn(
                                        'px-3 h-8 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5',
                                        tab === t.key
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    )}>
                                    {t.label}
                                    <span className={cn('text-xs font-semibold', tab === t.key ? 'text-blue-200' : 'text-gray-400')}>
                                        {t.count}
                                    </span>
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
                                <DollarSign className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm">No hay cuotas{tab !== 'TODAS' ? ` ${STATUS_LABEL[tab]?.toLowerCase()}s` : ''}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contrato / Cliente</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lote</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N°</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(c => {
                                        const days = daysFromNow(c.fechaVenc)
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="text-xs font-mono text-gray-500">{c.contract.codigo}</div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {c.contract.clienteNombres} {c.contract.clienteApellidos}
                                                    </div>
                                                    <div className="text-xs text-gray-400">DNI {c.contract.clienteDni}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {c.contract.lot.manzana}-{c.contract.lot.code}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">#{c.numero}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-700">{fmtDate(c.fechaVenc)}</div>
                                                    {c.estado === 'VENCIDO' && (
                                                        <div className="text-xs text-rose-500 font-medium">
                                                            hace {Math.abs(days)} días
                                                        </div>
                                                    )}
                                                    {c.estado === 'PENDIENTE' && days <= 7 && days >= 0 && (
                                                        <div className="text-xs text-amber-500 font-medium">
                                                            en {days} días
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-sm font-semibold text-gray-900">{fmtS(c.monto)}</div>
                                                    {c.montoPagado && c.montoPagado < c.monto && (
                                                        <div className="text-xs text-amber-500">Pagado: {fmtS(c.montoPagado)}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', STATUS_BADGE[c.estado])}>
                                                        {STATUS_LABEL[c.estado]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {c.estado !== 'PAGADO' && (
                                                        <button onClick={() => setPagarCuota(c)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                                            Registrar pago
                                                        </button>
                                                    )}
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

            {/* Modal Registrar Pago */}
            {pagarCuota && (
                <PagarModal
                    cuota={pagarCuota}
                    onClose={() => setPagarCuota(null)}
                    onSuccess={() => { setPagarCuota(null); fetchCuotas() }}
                />
            )}
        </div>
    )
}

function MetricCard({ icon, label, count, amount, color, onClick }: {
    icon: React.ReactNode; label: string; count: number; amount: number; color: string; onClick: () => void
}) {
    return (
        <button onClick={onClick}
            className={cn('bg-white rounded-xl border border-gray-200 border-l-4 p-4 text-left hover:shadow-sm transition-shadow w-full', color)}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-gray-500">{label}</span></div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500 mt-0.5">{fmtS(amount)}</div>
        </button>
    )
}

function PagarModal({ cuota, onClose, onSuccess }: {
    cuota: Cuota; onClose: () => void; onSuccess: () => void
}) {
    const [form, setForm] = React.useState({
        montoPagado: cuota.monto.toFixed(2),
        metodoPago: 'BCP',
        numOperacion: '',
        fechaPago: new Date().toISOString().split('T')[0],
    })
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState('')

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.numOperacion.trim()) { setError('El número de operación es obligatorio'); return }
        setSaving(true)
        setError('')
        try {
            const r = await fetch(`/api/cuotas/${cuota.id}/pagar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            const d = await r.json()
            if (!d.ok) throw new Error(d.error || 'Error')
            onSuccess()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al registrar')
        } finally { setSaving(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="font-bold text-gray-900">Registrar pago</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Cuota #{cuota.numero} · {cuota.contract.clienteNombres} {cuota.contract.clienteApellidos}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {cuota.estado === 'VENCIDO' && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Esta cuota está vencida. Corresponde aplicar penalidad de mora según las condiciones comerciales.
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Monto cuota</span><span className="font-semibold">{fmtS(cuota.monto)}</span></div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Monto pagado (S/)</label>
                        <input type="number" step="0.01" min="0" value={form.montoPagado}
                            onChange={e => setForm(f => ({ ...f, montoPagado: e.target.value }))}
                            className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Método de pago</label>
                        <select value={form.metodoPago} onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))}
                            className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                            {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">N° de operación / voucher <span className="text-rose-500">*</span></label>
                        <input type="text" placeholder="Ej. 12345678" value={form.numOperacion}
                            onChange={e => setForm(f => ({ ...f, numOperacion: e.target.value }))}
                            className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de pago</label>
                        <input type="date" value={form.fechaPago}
                            onChange={e => setForm(f => ({ ...f, fechaPago: e.target.value }))}
                            className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                    </div>

                    {error && <p className="text-xs text-rose-600">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Confirmar pago
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
