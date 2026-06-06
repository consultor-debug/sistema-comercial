'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Download, Plus, Search, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
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
    montoSeparacion: number | null
    datos: Record<string, unknown> | null
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

// ─── GenDocModal ─────────────────────────────────────────────────────────────

interface GenDocModalProps {
    contrato: Contract
    onClose: () => void
    onDone: () => void
}

function GenDocModal({ contrato, onClose, onDone }: GenDocModalProps) {
    const [dni, setDni] = React.useState('')
    const [telefono, setTelefono] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [estadoCivil, setEstadoCivil] = React.useState('Soltero(a)')
    const [domicilio, setDomicilio] = React.useState('')
    const [nombres, setNombres] = React.useState('')
    const [apellidos, setApellidos] = React.useState('')
    const [reniecStatus, setReniecStatus] = React.useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Auto-RENIEC at 8 digits
    React.useEffect(() => {
        if (dni.length !== 8) {
            setReniecStatus('idle')
            setNombres('')
            setApellidos('')
            return
        }
        let cancelled = false
        setReniecStatus('loading')
        fetch(`/api/clients/validate?dni=${dni}`)
            .then(r => r.json())
            .then(d => {
                if (cancelled) return
                if (d?.nombres) {
                    setNombres(d.nombres)
                    setApellidos(d.apellidos ?? '')
                    setReniecStatus('found')
                } else {
                    setReniecStatus('not_found')
                }
            })
            .catch(() => { if (!cancelled) setReniecStatus('not_found') })
        return () => { cancelled = true }
    }, [dni])

    async function handleGenerar() {
        if (dni.length !== 8) { setError('Ingresa un DNI de 8 dígitos'); return }
        if (!telefono.trim()) { setError('Ingresa el teléfono'); return }
        if (!email.trim()) { setError('Ingresa el email'); return }
        setLoading(true)
        setError(null)
        try {
            const r = await fetch(`/api/separaciones/${contrato.id}/pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, telefono, email, estadoCivil, domicilio }),
            })
            if (!r.ok) {
                const d = await r.json().catch(() => ({}))
                throw new Error(d.error ?? 'Error al generar PDF')
            }
            // Download the PDF blob
            const blob = await r.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `separacion-${contrato.codigo}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            onDone()
            onClose()
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al generar')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Generar constancia de separación</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Contrato {contrato.codigo} · Lote {contrato.lot.code}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-4">

                    {/* DNI + RENIEC */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">
                            DNI <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={8}
                                value={dni}
                                onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                                placeholder="12345678"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                {reniecStatus === 'loading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                                {reniecStatus === 'found' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </span>
                        </div>
                        {reniecStatus === 'found' && (nombres || apellidos) && (
                            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                {nombres} {apellidos}
                            </p>
                        )}
                        {reniecStatus === 'not_found' && (
                            <p className="text-[11px] text-gray-400 mt-1">DNI no encontrado en RENIEC — se usará S/N</p>
                        )}
                    </div>

                    {/* Row: Teléfono + Email */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1.5">
                                Celular <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="tel"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                placeholder="999 999 999"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1.5">
                                Email <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="correo@mail.com"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            />
                        </div>
                    </div>

                    {/* Estado civil */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Estado civil</label>
                        <select
                            value={estadoCivil}
                            onChange={e => setEstadoCivil(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                        >
                            <option>Soltero(a)</option>
                            <option>Casado(a)</option>
                            <option>Divorciado(a)</option>
                            <option>Viudo(a)</option>
                            <option>Conviviente</option>
                        </select>
                    </div>

                    {/* Domicilio (optional) */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Domicilio <span className="text-gray-400">(opcional)</span></label>
                        <input
                            type="text"
                            value={domicilio}
                            onChange={e => setDomicilio(e.target.value)}
                            placeholder="Av. Lima 123, Lima"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerar}
                        disabled={loading || dni.length !== 8 || !telefono.trim() || !email.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <><Download className="w-3.5 h-3.5" /> Generar PDF</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContratosPage() {
    const [contracts, setContracts] = React.useState<Contract[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<'ALL' | 'SEPARACION' | 'COMPRAVENTA'>('ALL')
    const [search, setSearch] = React.useState('')
    const [genDocContrato, setGenDocContrato] = React.useState<Contract | null>(null)

    const fetchContratos = React.useCallback(() => {
        const url = filter === 'ALL' ? '/api/contratos' : `/api/contratos?tipo=${filter}`
        setLoading(true)
        fetch(url)
            .then(r => r.json())
            .then(d => { if (d.ok) setContracts(d.contratos) })
            .finally(() => setLoading(false))
    }, [filter])

    React.useEffect(() => { fetchContratos() }, [fetchContratos])

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
            {genDocContrato && (
                <GenDocModal
                    contrato={genDocContrato}
                    onClose={() => setGenDocContrato(null)}
                    onDone={fetchContratos}
                />
            )}
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
                                            {['Código', 'Tipo', 'Lote', 'Cliente', 'Precio', 'Fecha', 'Asesor', 'Acción'].map((h, i) => (
                                                <th key={h} className={cn('px-5 py-3.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase', i === 7 ? 'text-right' : 'text-left')}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c, i) => {
                                            const pendiente = c.tipo === 'SEPARACION' && c.clienteDni === 'PENDIENTE'
                                            return (
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
                                                        {pendiente ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[11px] rounded-md font-medium">
                                                                Pendiente datos
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <p className="text-white text-xs">{c.clienteNombres} {c.clienteApellidos}</p>
                                                                <p className="text-slate-500 text-[11px]">DNI: {c.clienteDni}</p>
                                                            </>
                                                        )}
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
                                                        {pendiente ? (
                                                            <button
                                                                onClick={() => setGenDocContrato(c)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                                                            >
                                                                <FileText className="w-3 h-3" /> Generar doc.
                                                            </button>
                                                        ) : c.docxUrl ? (
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
