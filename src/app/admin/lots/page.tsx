'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    ArrowLeft, Plus, Upload, Download, Search, Pencil, Trash2,
    Loader2, Check, AlertCircle, FileSpreadsheet, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
    id: string
    name: string
    tenantId: string
}

interface LotRow {
    id: string
    code: string
    manzana: string
    loteNumero: number
    etapa: string | null
    tipologia: string | null
    areaM2: number
    frenteM: number | null
    fondoM: number | null
    ladoDerM: number | null
    ladoIzqM: number | null
    precioLista: number
    estado: 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
}

interface ImportRow {
    manzana: string
    loteNumero: number
    etapa: string
    tipologia: string
    areaM2: number
    frenteM: number
    fondoM: number
    ladoDerM: number
    ladoIzqM: number
    precioLista: number
}

type EstadoFilter = 'ALL' | 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
type ModalMode = 'new' | 'edit' | null

const PAGE_SIZE = 50

const ESTADO_LABELS: Record<string, string> = {
    LIBRE: 'Disponible',
    SEPARADO: 'Separado',
    VENDIDO: 'Vendido',
    NO_DISPONIBLE: 'No Disponible',
}

const ESTADO_COLORS: Record<string, string> = {
    LIBRE: 'text-emerald-400 bg-emerald-400/10',
    SEPARADO: 'text-amber-400 bg-amber-400/10',
    VENDIDO: 'text-rose-400 bg-rose-400/10',
    NO_DISPONIBLE: 'text-slate-400 bg-slate-400/10',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(v: string): number {
    if (!v) return 0
    return parseFloat(v.replace(/"/g, '').replace(',', '.')) || 0
}

function parseCSV(text: string): ImportRow[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    // split a line honoring quoted fields
    const splitLine = (line: string) => {
        const vals: string[] = []
        let cur = ''
        let inQ = false
        for (const ch of line) {
            if (ch === '"') { inQ = !inQ }
            else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
            else cur += ch
        }
        vals.push(cur.trim())
        return vals
    }

    return lines.slice(1).map(line => {
        const v = splitLine(line)
        return {
            manzana: v[0] || '',
            loteNumero: parseInt(v[1]) || 0,
            etapa: v[2] || '',
            tipologia: v[3] || '',
            areaM2: parseNum(v[4]),
            frenteM: parseNum(v[5]),
            fondoM: parseNum(v[6]),
            ladoDerM: parseNum(v[7]),
            ladoIzqM: parseNum(v[8]),
            precioLista: parseNum(v[9]),
        }
    }).filter(r => r.manzana && r.loteNumero)
}

function exportCSV(lots: LotRow[]) {
    const header = 'manzana,lote,etapa,tipologia,area_m2,frente_m,fondo_m,lado_der_m,lado_izq_m,precio_lista,estado'
    const rows = lots.map(l =>
        [l.manzana, l.loteNumero, l.etapa || '', l.tipologia || '',
            l.areaM2, l.frenteM ?? '', l.fondoM ?? '', l.ladoDerM ?? '', l.ladoIzqM ?? '',
            l.precioLista, l.estado].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lotes.csv'
    a.click()
    URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[110px]">
            <span className={cn('text-2xl font-bold', color)}>{value}</span>
            <span className="text-xs text-slate-400 leading-tight">{label}</span>
        </div>
    )
}

function Badge({ estado }: { estado: string }) {
    return (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', ESTADO_COLORS[estado] || ESTADO_COLORS.NO_DISPONIBLE)}>
            {ESTADO_LABELS[estado] || estado}
        </span>
    )
}

// ─── Lot Form Modal ───────────────────────────────────────────────────────────

interface LotFormProps {
    mode: ModalMode
    lot: Partial<LotRow>
    projectId: string
    onClose: () => void
    onSaved: () => void
}

function LotFormModal({ mode, lot, projectId, onClose, onSaved }: LotFormProps) {
    const [form, setForm] = React.useState({
        manzana: lot.manzana || '',
        loteNumero: String(lot.loteNumero || ''),
        etapa: lot.etapa || '',
        tipologia: lot.tipologia || 'Lote Residencial',
        areaM2: String(lot.areaM2 || ''),
        frenteM: String(lot.frenteM ?? ''),
        fondoM: String(lot.fondoM ?? ''),
        ladoDerM: String(lot.ladoDerM ?? ''),
        ladoIzqM: String(lot.ladoIzqM ?? ''),
        precioLista: String(lot.precioLista || ''),
    })
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState('')

    const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const payload = {
                projectId,
                manzana: form.manzana,
                loteNumero: Number(form.loteNumero),
                etapa: form.etapa,
                tipologia: form.tipologia,
                areaM2: Number(form.areaM2),
                frenteM: form.frenteM ? Number(form.frenteM) : undefined,
                fondoM: form.fondoM ? Number(form.fondoM) : undefined,
                ladoDerM: form.ladoDerM ? Number(form.ladoDerM) : undefined,
                ladoIzqM: form.ladoIzqM ? Number(form.ladoIzqM) : undefined,
                precioLista: Number(form.precioLista),
            }

            let res: Response
            if (mode === 'new') {
                res = await fetch('/api/lots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            } else {
                res = await fetch(`/api/lots/${lot.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            }

            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Error al guardar')
            onSaved()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setSaving(false)
        }
    }

    const fields: { key: keyof typeof form; label: string; type?: string; required?: boolean }[] = [
        { key: 'manzana', label: 'Manzana', required: true },
        { key: 'loteNumero', label: 'N° Lote', type: 'number', required: true },
        { key: 'etapa', label: 'Etapa' },
        { key: 'tipologia', label: 'Tipología' },
        { key: 'areaM2', label: 'Área (m²)', type: 'number', required: true },
        { key: 'frenteM', label: 'Frente (m)', type: 'number' },
        { key: 'fondoM', label: 'Fondo (m)', type: 'number' },
        { key: 'ladoDerM', label: 'Lado Der. (m)', type: 'number' },
        { key: 'ladoIzqM', label: 'Lado Izq. (m)', type: 'number' },
        { key: 'precioLista', label: 'Precio Lista (S/)', type: 'number', required: true },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                    <h2 className="text-sm font-semibold text-white">
                        {mode === 'new' ? 'Nuevo Lote' : `Editar Lote ${lot.code}`}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {fields.map(f => (
                            <div key={f.key} className={f.key === 'tipologia' || f.key === 'etapa' ? 'col-span-2' : ''}>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                    {f.label}{f.required && <span className="text-rose-400 ml-0.5">*</span>}
                                </label>
                                <input
                                    type={f.type || 'text'}
                                    value={form[f.key]}
                                    onChange={e => set(f.key, e.target.value)}
                                    required={f.required}
                                    step={f.type === 'number' ? 'any' : undefined}
                                    className="w-full h-8 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/25 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                    {error && (
                        <p className="text-xs text-rose-400 mb-3 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {error}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 h-9 text-sm text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 h-9 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {mode === 'new' ? 'Crear' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Import Panel ─────────────────────────────────────────────────────────────

interface ImportPanelProps {
    projectId: string
    onImported: () => void
    onClose: () => void
}

function ImportPanel({ projectId, onImported, onClose }: ImportPanelProps) {
    const [rows, setRows] = React.useState<ImportRow[]>([])
    const [status, setStatus] = React.useState<'idle' | 'saving' | 'done' | 'error'>('idle')
    const [result, setResult] = React.useState<{ created: number; updated: number; errors: string[] } | null>(null)
    const fileRef = React.useRef<HTMLInputElement>(null)

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
            const parsed = parseCSV(ev.target?.result as string)
            setRows(parsed)
            setStatus('idle')
            setResult(null)
        }
        reader.readAsText(file)
    }

    const handleImport = async () => {
        if (!rows.length) return
        setStatus('saving')
        try {
            const res = await fetch('/api/admin/lots/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, lots: rows })
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Error al importar')
            setResult(data.results)
            setStatus('done')
            onImported()
        } catch (err) {
            setResult({ created: 0, updated: 0, errors: [err instanceof Error ? err.message : 'Error'] })
            setStatus('error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                        Importar Lotes (CSV)
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Format reference */}
                    <div className="bg-white/3 rounded-xl p-4 border border-white/6">
                        <p className="text-[11px] text-slate-400 mb-2 font-medium uppercase tracking-wider">Formato esperado (10 columnas)</p>
                        <code className="text-[11px] text-slate-300 break-all leading-relaxed">
                            manzana, lote, etapa, tipologia, area_m2, frente_m, fondo_m, lado_der_m, lado_izq_m, precio_lista
                        </code>
                        <p className="text-[11px] text-slate-500 mt-2">Requeridos: manzana, lote, area_m2, precio_lista. El resto es opcional.</p>
                    </div>

                    {/* File upload */}
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/60 transition-colors group">
                        <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                        <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                            {rows.length > 0 ? `${rows.length} filas cargadas — clic para cambiar` : 'Clic o arrastra un archivo CSV'}
                        </p>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                    </label>

                    {/* Preview */}
                    {rows.length > 0 && (
                        <div className="border border-white/8 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-white/3 border-b border-white/8">
                                <span className="text-xs text-slate-400">{rows.length} lotes para importar</span>
                                <span className="text-[11px] text-slate-500">Mostrando primeros 10</span>
                            </div>
                            <div className="overflow-x-auto max-h-48">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {['Manzana', 'Lote', 'Etapa', 'Tipología', 'Área', 'Precio'].map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-slate-500 font-medium">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 10).map((r, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                                                <td className="px-3 py-1.5 text-white">{r.manzana}</td>
                                                <td className="px-3 py-1.5 text-slate-300">{r.loteNumero}</td>
                                                <td className="px-3 py-1.5 text-slate-400">{r.etapa || '—'}</td>
                                                <td className="px-3 py-1.5 text-slate-400">{r.tipologia || '—'}</td>
                                                <td className="px-3 py-1.5 text-slate-300">{r.areaM2} m²</td>
                                                <td className="px-3 py-1.5 text-emerald-400">S/ {r.precioLista.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className={cn(
                            'rounded-xl p-4 text-sm',
                            status === 'done' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'
                        )}>
                            {status === 'done' ? (
                                <p className="text-emerald-400 flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    {result.created} creados · {result.updated} actualizados
                                    {result.errors.length > 0 && ` · ${result.errors.length} errores`}
                                </p>
                            ) : (
                                <p className="text-rose-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {result.errors[0]}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button onClick={onClose}
                            className="flex-1 h-9 text-sm text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            {status === 'done' ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {rows.length > 0 && status !== 'done' && (
                            <button onClick={handleImport} disabled={status === 'saving'}
                                className="flex-1 h-9 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {status === 'saving'
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importando…</>
                                    : <><Upload className="w-3.5 h-3.5" /> Importar {rows.length} lotes</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLotsPage() {
    const [projects, setProjects] = React.useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = React.useState('')
    const [lots, setLots] = React.useState<LotRow[]>([])
    const [loadingLots, setLoadingLots] = React.useState(false)

    // Filters
    const [search, setSearch] = React.useState('')
    const [estadoFilter, setEstadoFilter] = React.useState<EstadoFilter>('ALL')
    const [etapaFilter, setEtapaFilter] = React.useState('')
    const [tipologiaFilter, setTipologiaFilter] = React.useState('')

    // Pagination
    const [page, setPage] = React.useState(1)

    // Modals
    const [modalMode, setModalMode] = React.useState<ModalMode>(null)
    const [editingLot, setEditingLot] = React.useState<Partial<LotRow>>({})
    const [showImport, setShowImport] = React.useState(false)

    // Inline price edit
    const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null)
    const [priceInput, setPriceInput] = React.useState('')

    // Delete confirm
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    // Toast
    const [toast, setToast] = React.useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

    // Load projects
    React.useEffect(() => {
        fetch('/api/projects').then(r => r.json()).then(d => {
            if (d.success && d.projects.length) {
                setProjects(d.projects)
                setSelectedProjectId(d.projects[0].id)
            }
        })
    }, [])

    // Load lots when project changes
    const fetchLots = React.useCallback(async () => {
        if (!selectedProjectId) return
        setLoadingLots(true)
        try {
            const res = await fetch(`/api/lots?projectId=${selectedProjectId}`)
            const data = await res.json()
            if (data.success) setLots(data.lots)
        } finally {
            setLoadingLots(false)
        }
    }, [selectedProjectId])

    React.useEffect(() => {
        fetchLots()
        setPage(1)
    }, [fetchLots])

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Derived values
    const etapas = React.useMemo(() =>
        [...new Set(lots.map(l => l.etapa).filter(Boolean) as string[])].sort(), [lots])
    const tipologias = React.useMemo(() =>
        [...new Set(lots.map(l => l.tipologia).filter(Boolean) as string[])].sort(), [lots])

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return lots.filter(l => {
            if (q && !l.code.toLowerCase().includes(q) && !l.manzana.toLowerCase().includes(q)) return false
            if (estadoFilter !== 'ALL' && l.estado !== estadoFilter) return false
            if (etapaFilter && l.etapa !== etapaFilter) return false
            if (tipologiaFilter && l.tipologia !== tipologiaFilter) return false
            return true
        })
    }, [lots, search, estadoFilter, etapaFilter, tipologiaFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const stats = React.useMemo(() => ({
        total: lots.length,
        libre: lots.filter(l => l.estado === 'LIBRE').length,
        separado: lots.filter(l => l.estado === 'SEPARADO').length,
        vendido: lots.filter(l => l.estado === 'VENDIDO').length,
    }), [lots])

    // Inline price save
    const savePriceInline = async (lot: LotRow) => {
        const newPrice = parseFloat(priceInput)
        if (isNaN(newPrice) || newPrice === lot.precioLista) { setEditingPriceId(null); return }
        try {
            const res = await fetch(`/api/lots/${lot.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manzana: lot.manzana, loteNumero: lot.loteNumero, precioLista: newPrice })
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)
            setLots(prev => prev.map(l => l.id === lot.id ? { ...l, precioLista: newPrice } : l))
            showToast('Precio actualizado')
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al guardar precio', 'err')
        }
        setEditingPriceId(null)
    }

    // Delete lot
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/lots/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)
            setLots(prev => prev.filter(l => l.id !== id))
            showToast('Lote eliminado')
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al eliminar', 'err')
        }
        setDeletingId(null)
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            <div className="flex-1 md:pl-52 flex flex-col min-h-screen">

                {/* Header */}
                <header className="shrink-0 border-b border-white/5 bg-slate-950 z-40">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link href="/admin"
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors shrink-0">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Admin</span>
                            </Link>
                            <div className="h-4 w-px bg-white/10" />
                            <h1 className="text-sm font-semibold text-white">Administrador de Lotes</h1>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => exportCSV(filtered)}
                                className="flex items-center gap-1.5 px-3 h-8 text-xs text-slate-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <Download className="w-3.5 h-3.5" /> Exportar CSV
                            </button>
                            <button onClick={() => setShowImport(true)}
                                className="flex items-center gap-1.5 px-3 h-8 text-xs text-slate-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <Upload className="w-3.5 h-3.5" /> Importar CSV
                            </button>
                            <button
                                onClick={() => { setEditingLot({}); setModalMode('new') }}
                                disabled={!selectedProjectId}
                                className="flex items-center gap-1.5 px-3 h-8 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-40">
                                <Plus className="w-3.5 h-3.5" /> Nuevo Lote
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                    <div className="px-4 md:px-6 py-4 space-y-4">

                        {/* Project selector + Stats */}
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedProjectId}
                                onChange={e => { setSelectedProjectId(e.target.value); setPage(1) }}
                                className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            {lots.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatCard label="Total" value={stats.total} color="text-white" />
                                    <StatCard label="Disponibles" value={stats.libre} color="text-emerald-400" />
                                    <StatCard label="Separados" value={stats.separado} color="text-amber-400" />
                                    <StatCard label="Vendidos" value={stats.vendido} color="text-rose-400" />
                                </div>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar lote o manzana…"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                                    className="h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-colors w-52"
                                />
                            </div>

                            {/* Estado tabs */}
                            <div className="flex items-center gap-1">
                                {(['ALL', 'LIBRE', 'SEPARADO', 'VENDIDO'] as EstadoFilter[]).map(e => (
                                    <button key={e} onClick={() => { setEstadoFilter(e); setPage(1) }}
                                        className={cn(
                                            'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
                                            estadoFilter === e ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}>
                                        {e === 'ALL' ? 'Todos' : ESTADO_LABELS[e]}
                                    </button>
                                ))}
                            </div>

                            {etapas.length > 0 && (
                                <select value={etapaFilter} onChange={e => { setEtapaFilter(e.target.value); setPage(1) }}
                                    className="h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none">
                                    <option value="">Todas las etapas</option>
                                    {etapas.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            )}

                            {tipologias.length > 0 && (
                                <select value={tipologiaFilter} onChange={e => { setTipologiaFilter(e.target.value); setPage(1) }}
                                    className="h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none">
                                    <option value="">Todas las tipologías</option>
                                    {tipologias.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}

                            <span className="ml-auto text-[11px] text-slate-500 self-center">
                                {filtered.length} de {lots.length} lotes
                            </span>
                        </div>

                        {/* Table */}
                        {loadingLots ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                            </div>
                        ) : paginated.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 text-sm">
                                {lots.length === 0
                                    ? 'No hay lotes en este proyecto. Importa un CSV o crea uno nuevo.'
                                    : 'No hay lotes que coincidan con los filtros.'}
                            </div>
                        ) : (
                            <div className="border border-white/8 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/8 bg-white/3">
                                                {['Código', 'Etapa', 'Tipología', 'Área m²', 'Frente', 'Fondo', 'L.Der', 'L.Izq', 'Precio Lista', 'Estado', ''].map(h => (
                                                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {paginated.map(lot => (
                                                <tr key={lot.id} className="hover:bg-white/3 transition-colors group">
                                                    <td className="px-3 py-2.5 font-mono text-xs text-white whitespace-nowrap">{lot.code}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{lot.etapa || '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap max-w-[120px] truncate">{lot.tipologia || '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-300 whitespace-nowrap">{lot.areaM2} m²</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{lot.frenteM ?? '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{lot.fondoM ?? '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{lot.ladoDerM ?? '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{lot.ladoIzqM ?? '—'}</td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        {editingPriceId === lot.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    value={priceInput}
                                                                    onChange={e => setPriceInput(e.target.value)}
                                                                    onBlur={() => savePriceInline(lot)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') savePriceInline(lot)
                                                                        if (e.key === 'Escape') setEditingPriceId(null)
                                                                    }}
                                                                    className="w-24 h-6 px-1.5 bg-white/10 border border-indigo-500/60 rounded text-xs text-white focus:outline-none"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setEditingPriceId(lot.id); setPriceInput(String(lot.precioLista)) }}
                                                                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 group/price">
                                                                S/ {lot.precioLista.toLocaleString()}
                                                                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        <Badge estado={lot.estado} />
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingLot(lot); setModalMode('edit') }}
                                                                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingId(lot.id)}
                                                                disabled={lot.estado === 'VENDIDO'}
                                                                className="p-1 rounded-md hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 bg-white/2">
                                        <span className="text-[11px] text-slate-500">
                                            Pág. {page} de {totalPages} · {filtered.length} lotes
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                className="p-1 rounded-md hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                                className="p-1 rounded-md hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lot form modal */}
            {modalMode && (
                <LotFormModal
                    mode={modalMode}
                    lot={editingLot}
                    projectId={selectedProjectId}
                    onClose={() => setModalMode(null)}
                    onSaved={() => { setModalMode(null); fetchLots(); showToast(modalMode === 'new' ? 'Lote creado' : 'Lote actualizado') }}
                />
            )}

            {/* Import panel */}
            {showImport && (
                <ImportPanel
                    projectId={selectedProjectId}
                    onImported={fetchLots}
                    onClose={() => setShowImport(false)}
                />
            )}

            {/* Delete confirm */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-sm font-semibold text-white mb-2">¿Eliminar este lote?</h3>
                        <p className="text-xs text-slate-400 mb-5">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeletingId(null)}
                                className="flex-1 h-9 text-sm text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={() => handleDelete(deletingId)}
                                className="flex-1 h-9 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors flex items-center justify-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={cn(
                    'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-2 duration-200',
                    toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                )}>
                    {toast.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
