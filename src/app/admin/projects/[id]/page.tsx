'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    ArrowLeft, Save, Loader2, Map, Database,
    Settings, Globe, Webhook, BarChart3, Upload,
    CheckCircle2, AlertCircle, Trash2, ExternalLink,
    Activity, Plus, X, FileText, Image, FileCheck,
    Pencil, TrendingUp, TrendingDown, Clock,
    ChevronDown, ChevronUp, Link2, File
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectData {
    id: string
    name: string
    description: string | null
    isActive: boolean
    maxCuotas: number
    minInicial: number
    sheetsId: string | null
    n8nWebhookUrl: string | null
    mapImageUrl: string | null
    tenant?: { name: string } | null
    stats?: { total: number; libre: number; separado: number; vendido: number; noDisponible: number }
}

interface ProjectUpdate {
    id: string
    title: string
    description: string | null
    percentage: number
    imageUrl: string | null
    createdAt: string
    author: { name: string }
}

interface LotRow {
    id: string
    code: string
    manzana: string
    etapa: string | null
    precioLista: number
    estado: string
}

interface LotDocument {
    id: string
    name: string
    type: string
    fileUrl: string
    createdAt: string
    uploadedBy: { name: string }
}

interface PriceEntry {
    date: string
    oldPrice: number | null
    newPrice: number | null
    changedBy: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    PLANO:     { label: 'Plano',     icon: Map,       color: 'text-blue-400' },
    ESCRITURA: { label: 'Escritura', icon: FileCheck,  color: 'text-emerald-400' },
    CONTRATO:  { label: 'Contrato',  icon: FileText,   color: 'text-amber-400' },
    FOTO:      { label: 'Foto',      icon: Image,      color: 'text-purple-400' },
    OTRO:      { label: 'Otro',      icon: File,       color: 'text-slate-400' },
}

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, action }: {
    title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode
}) {
    return (
        <div className="bg-slate-900/50 border border-white/6 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-medium text-slate-300">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
            {children}
        </div>
    )
}

function ProgressBar({ pct }: { pct: number }) {
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-indigo-500'
    return (
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
    )
}

const inputClass = "w-full h-9 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.07] transition-all"

// ─── Add Update Form ──────────────────────────────────────────────────────────

function AddUpdateForm({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
    const [form, setForm] = React.useState({ title: '', description: '', percentage: '0', imageUrl: '' })
    const [saving, setSaving] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description || null,
                    percentage: Number(form.percentage),
                    imageUrl: form.imageUrl || null,
                }),
            })
            if (res.ok) {
                setForm({ title: '', description: '', percentage: '0', imageUrl: '' })
                setOpen(false)
                onAdded()
            }
        } finally {
            setSaving(false)
        }
    }

    if (!open) return (
        <button onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 h-7 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar actualización
        </button>
    )

    return (
        <form onSubmit={handleSubmit} className="mt-4 bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-slate-300">Nueva actualización</p>
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-white rounded-lg hover:bg-white/5">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div>
                <label className="block text-[10px] text-slate-500 mb-1">Título <span className="text-rose-400">*</span></label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="ej. Avance de cimentación"
                    className={cn(inputClass, 'h-8')} />
            </div>

            <div>
                <label className="block text-[10px] text-slate-500 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Detalle del avance…"
                    className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-white/20 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-slate-500 mb-1">% Avance ({form.percentage}%)</label>
                    <input type="range" min={0} max={100} value={form.percentage} onChange={e => set('percentage', e.target.value)}
                        className="w-full accent-indigo-500" />
                </div>
                <div>
                    <label className="block text-[10px] text-slate-500 mb-1">URL de imagen (opcional)</label>
                    <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…"
                        className={cn(inputClass, 'h-8 text-xs')} />
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 h-8 text-xs text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    Cancelar
                </button>
                <button type="submit" disabled={saving}
                    className="flex-1 h-8 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Publicar
                </button>
            </div>
        </form>
    )
}

// ─── Lot Documents Modal ──────────────────────────────────────────────────────

function LotDocumentsModal({ lot, onClose }: { lot: LotRow; onClose: () => void }) {
    const [tab, setTab] = React.useState<'docs' | 'prices'>('docs')
    const [docs, setDocs] = React.useState<LotDocument[]>([])
    const [history, setHistory] = React.useState<PriceEntry[]>([])
    const [currentPrice, setCurrentPrice] = React.useState(lot.precioLista)
    const [loading, setLoading] = React.useState(true)
    const [form, setForm] = React.useState({ name: '', type: 'OTRO', fileUrl: '' })
    const [saving, setSaving] = React.useState(false)
    const [showForm, setShowForm] = React.useState(false)

    const { data: session } = useSession()
    const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes((session?.user as any)?.role)

    const fetchDocs = async () => {
        const [dRes, pRes] = await Promise.all([
            fetch(`/api/lots/${lot.id}/documents`),
            fetch(`/api/lots/${lot.id}/price-history`),
        ])
        const dData = await dRes.json()
        const pData = await pRes.json()
        if (dData.success) setDocs(dData.documents)
        if (pData.success) { setHistory(pData.history); setCurrentPrice(pData.currentPrice) }
        setLoading(false)
    }

    React.useEffect(() => { fetchDocs() }, [])

    const handleAddDoc = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch(`/api/lots/${lot.id}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) { setForm({ name: '', type: 'OTRO', fileUrl: '' }); setShowForm(false); fetchDocs() }
        } finally { setSaving(false) }
    }

    const handleDeleteDoc = async (docId: string) => {
        await fetch(`/api/lots/${lot.id}/documents?docId=${docId}`, { method: 'DELETE' })
        setDocs(prev => prev.filter(d => d.id !== docId))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Lote {lot.code}</h3>
                        <p className="text-[11px] text-slate-500">{lot.etapa || 'Sin etapa'} · {fmt(currentPrice)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/8 shrink-0">
                    {[
                        { key: 'docs', label: 'Documentos' },
                        { key: 'prices', label: 'Historial de precios' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)}
                            className={cn(
                                'flex-1 py-2.5 text-xs font-medium transition-colors',
                                tab === t.key ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                            )}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        </div>
                    ) : tab === 'docs' ? (
                        <div className="space-y-3">
                            {docs.length === 0 && !showForm && (
                                <p className="text-center text-xs text-slate-500 py-6">No hay documentos adjuntos.</p>
                            )}

                            {docs.map(doc => {
                                const meta = DOC_TYPES[doc.type] || DOC_TYPES.OTRO
                                const DocIcon = meta.icon
                                return (
                                    <div key={doc.id}
                                        className="flex items-center gap-3 px-3 py-2.5 bg-white/3 border border-white/6 rounded-xl group">
                                        <DocIcon className={cn('w-4 h-4 shrink-0', meta.color)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                                            <p className="text-[10px] text-slate-500">{meta.label} · {fmtDate(doc.createdAt)} · {doc.uploadedBy.name}</p>
                                        </div>
                                        <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                                            className="p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                                            <Link2 className="w-3.5 h-3.5" />
                                        </a>
                                        {canEdit && (
                                            <button onClick={() => handleDeleteDoc(doc.id)}
                                                className="p-1 rounded-md hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}

                            {canEdit && !showForm && (
                                <button onClick={() => setShowForm(true)}
                                    className="w-full flex items-center justify-center gap-1.5 h-9 text-xs text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 border border-dashed border-white/10 rounded-xl transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Agregar documento
                                </button>
                            )}

                            {showForm && canEdit && (
                                <form onSubmit={handleAddDoc} className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Nombre</label>
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                                                placeholder="ej. Plano de ubicación"
                                                className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Tipo</label>
                                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                                className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 outline-none">
                                                {Object.entries(DOC_TYPES).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">URL del archivo <span className="text-rose-400">*</span></label>
                                        <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} required
                                            placeholder="https://drive.google.com/… o cualquier URL pública"
                                            className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setShowForm(false)}
                                            className="flex-1 h-8 text-xs text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={saving}
                                            className="flex-1 h-8 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                            Guardar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        // Price history tab
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[11px] text-slate-500">Precio actual</span>
                                <span className="text-sm font-semibold text-emerald-400">{fmt(currentPrice)}</span>
                            </div>

                            {history.length === 0 ? (
                                <p className="text-center text-xs text-slate-500 py-6">Sin cambios de precio registrados.</p>
                            ) : (
                                history.slice().reverse().map((entry, i) => {
                                    const up = entry.newPrice !== null && entry.oldPrice !== null && entry.newPrice > entry.oldPrice
                                    const down = entry.newPrice !== null && entry.oldPrice !== null && entry.newPrice < entry.oldPrice
                                    return (
                                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-white/3 border border-white/6 rounded-xl">
                                            <div className={cn(
                                                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                                up ? 'bg-emerald-500/15' : down ? 'bg-rose-500/15' : 'bg-slate-500/15'
                                            )}>
                                                {up ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                                                    : down ? <TrendingDown className="w-3 h-3 text-rose-400" />
                                                        : <Clock className="w-3 h-3 text-slate-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-1.5">
                                                    {entry.oldPrice !== null && (
                                                        <span className="text-xs text-slate-500 line-through">{fmt(entry.oldPrice)}</span>
                                                    )}
                                                    {entry.newPrice !== null && (
                                                        <span className={cn('text-xs font-semibold', up ? 'text-emerald-400' : down ? 'text-rose-400' : 'text-white')}>
                                                            {fmt(entry.newPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-600">
                                                    {fmtDate(entry.date)} · {entry.changedBy}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const projectId = params.id as string
    const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes((session?.user as any)?.role)

    const [project, setProject] = React.useState<ProjectData | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Form state
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [isActive, setIsActive] = React.useState(true)
    const [maxCuotas, setMaxCuotas] = React.useState('')
    const [minInicial, setMinInicial] = React.useState('')
    const [sheetsId, setSheetsId] = React.useState('')
    const [n8nWebhookUrl, setN8nWebhookUrl] = React.useState('')

    // Progress updates
    const [updates, setUpdates] = React.useState<ProjectUpdate[]>([])
    const [updatesLoading, setUpdatesLoading] = React.useState(true)

    // Lots
    const [lots, setLots] = React.useState<LotRow[]>([])
    const [lotsExpanded, setLotsExpanded] = React.useState(false)
    const [selectedLot, setSelectedLot] = React.useState<LotRow | null>(null)

    const fetchProject = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [projRes, lotsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch(`/api/lots?projectId=${projectId}`),
            ])
            const projData = await projRes.json()
            if (projData.success) {
                const found = projData.projects.find((p: ProjectData) => p.id === projectId)
                if (!found) { router.push('/admin/projects'); return }
                setProject(found)
                setName(found.name || '')
                setDescription(found.description || '')
                setIsActive(found.isActive ?? true)
                setMaxCuotas(String(found.maxCuotas || 60))
                setMinInicial(String(found.minInicial || 0))
                setSheetsId(found.sheetsId || '')
                setN8nWebhookUrl(found.n8nWebhookUrl || '')
            }
            const lotsData = await lotsRes.json()
            if (lotsData.success) {
                setLots(lotsData.lots)
                setProject(prev => prev ? {
                    ...prev,
                    stats: {
                        total: lotsData.lots.length,
                        libre: lotsData.lots.filter((l: LotRow) => l.estado === 'LIBRE').length,
                        separado: lotsData.lots.filter((l: LotRow) => l.estado === 'SEPARADO').length,
                        vendido: lotsData.lots.filter((l: LotRow) => l.estado === 'VENDIDO').length,
                        noDisponible: lotsData.lots.filter((l: LotRow) => l.estado === 'NO_DISPONIBLE').length,
                    }
                } : prev)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [projectId, router])

    const fetchUpdates = React.useCallback(async () => {
        setUpdatesLoading(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/updates`)
            const data = await res.json()
            if (data.success) setUpdates(data.updates)
        } finally {
            setUpdatesLoading(false)
        }
    }, [projectId])

    React.useEffect(() => {
        fetchProject()
        fetchUpdates()
    }, [fetchProject, fetchUpdates])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        try {
            const res = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: projectId, name,
                    description: description || null,
                    isActive,
                    maxCuotas: parseInt(maxCuotas) || 60,
                    minInicial: parseFloat(minInicial) || 0,
                    sheetsId: sheetsId || null,
                    n8nWebhookUrl: n8nWebhookUrl || null,
                })
            })
            const data = await res.json()
            setSaveStatus(data.success ? 'success' : 'error')
            if (data.success) setTimeout(() => setSaveStatus('idle'), 3000)
        } catch {
            setSaveStatus('error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projectName', name)
            formData.append('projectId', projectId)
            const res = await fetch('/api/admin/maps/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.success) setProject(prev => prev ? { ...prev, mapImageUrl: data.url } : prev)
        } catch (e) {
            console.error(e)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const deleteUpdate = async (id: string) => {
        await fetch(`/api/projects/${projectId}/updates?updateId=${id}`, { method: 'DELETE' })
        setUpdates(prev => prev.filter(u => u.id !== id))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
        )
    }

    if (!project) return null

    const stats = project.stats
    const latestPct = updates[0]?.percentage ?? 0

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 h-12 flex items-center justify-between px-4 bg-slate-950/95 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Link href="/admin/projects" className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Proyectos
                    </Link>
                    <div className="h-3.5 w-px bg-white/10" />
                    <span className="text-xs font-medium text-white truncate max-w-[200px]">{project.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${project.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {project.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {saveStatus === 'success' && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="flex items-center gap-1 text-[11px] text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" /> Error al guardar
                        </span>
                    )}
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-1.5 h-8 px-3 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors">
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Guardar
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

                {/* Stats row */}
                {stats && (
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-white' },
                            { label: 'Libres', value: stats.libre, color: 'text-emerald-400' },
                            { label: 'Separados', value: stats.separado, color: 'text-amber-400' },
                            { label: 'Vendidos', value: stats.vendido, color: 'text-rose-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-slate-900/50 border border-white/6 rounded-xl p-4 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick links */}
                <div className="flex gap-2 flex-wrap">
                    <Link href={`/projects/${projectId}`}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                        <Map className="w-3.5 h-3.5" /> Ver plano interactivo
                        <ExternalLink className="w-3 h-3 text-slate-600" />
                    </Link>
                    <Link href={`/admin/lots/map?projectId=${projectId}`}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                        <Database className="w-3.5 h-3.5" /> Editor de lotes
                        <ExternalLink className="w-3 h-3 text-slate-600" />
                    </Link>
                </div>

                {/* ── AVANCE DE OBRA ─────────────────────────────────────────── */}
                <Section title="Avance de obra" icon={Activity}
                    action={canEdit ? <AddUpdateForm projectId={projectId} onAdded={fetchUpdates} /> : undefined}>
                    {/* Current % */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-slate-500">Progreso actual</span>
                            <span className="text-sm font-bold text-white">{latestPct}%</span>
                        </div>
                        <ProgressBar pct={latestPct} />
                    </div>

                    {/* Timeline */}
                    {updatesLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        </div>
                    ) : updates.length === 0 ? (
                        <p className="text-center text-xs text-slate-600 py-4">Sin actualizaciones aún. Agrega la primera.</p>
                    ) : (
                        <div className="space-y-3">
                            {updates.map((u, i) => (
                                <div key={u.id} className="flex gap-3 group">
                                    {/* Timeline line */}
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            'w-2.5 h-2.5 rounded-full mt-1 shrink-0 border-2',
                                            i === 0 ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600 bg-slate-800'
                                        )} />
                                        {i < updates.length - 1 && <div className="w-px flex-1 bg-white/6 mt-1" />}
                                    </div>

                                    <div className="flex-1 pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-white">{u.title}</p>
                                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                                                        {u.percentage}%
                                                    </span>
                                                </div>
                                                {u.description && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{u.description}</p>
                                                )}
                                                <p className="text-[10px] text-slate-600 mt-1">{fmtDate(u.createdAt)} · {u.author.name}</p>
                                            </div>
                                            {canEdit && (
                                                <button onClick={() => deleteUpdate(u.id)}
                                                    className="p-1 rounded-md hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {u.imageUrl && (
                                            <a href={u.imageUrl} target="_blank" rel="noreferrer">
                                                <img
                                                    src={u.imageUrl}
                                                    alt={u.title}
                                                    className="mt-2 rounded-lg w-full max-h-48 object-cover border border-white/8 hover:border-white/20 transition-colors"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── DOCUMENTOS POR LOTE ───────────────────────────────────── */}
                <Section title="Documentos y precios por lote" icon={FileText}
                    action={
                        <button onClick={() => setLotsExpanded(e => !e)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                            {lotsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {lotsExpanded ? 'Contraer' : 'Ver lotes'}
                        </button>
                    }>
                    {!lotsExpanded ? (
                        <p className="text-xs text-slate-500">
                            {lots.length} lotes en este proyecto. Expande para gestionar documentos e historial de precios por lote.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {lots.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">No hay lotes importados.</p>
                            ) : (
                                lots.map(lot => (
                                    <div key={lot.id}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/3 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs text-white">{lot.code}</span>
                                            {lot.etapa && <span className="text-[10px] text-slate-500">{lot.etapa}</span>}
                                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                                lot.estado === 'LIBRE' ? 'bg-emerald-400/10 text-emerald-400' :
                                                lot.estado === 'SEPARADO' ? 'bg-amber-400/10 text-amber-400' :
                                                lot.estado === 'VENDIDO' ? 'bg-rose-400/10 text-rose-400' :
                                                'bg-slate-400/10 text-slate-400'
                                            )}>
                                                {lot.estado === 'LIBRE' ? 'Libre' : lot.estado === 'SEPARADO' ? 'Sep.' : lot.estado === 'VENDIDO' ? 'Vend.' : 'N/D'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-emerald-400">{fmt(lot.precioLista)}</span>
                                            <button onClick={() => setSelectedLot(lot)}
                                                className="flex items-center gap-1 px-2.5 h-6 text-[10px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                                <Pencil className="w-2.5 h-2.5" /> Docs / Precios
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </Section>

                {/* ── SETTINGS (existing) ───────────────────────────────────── */}
                <Section title="Información general" icon={Settings}>
                    <div className="space-y-4">
                        <Field label="Nombre del proyecto">
                            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" />
                        </Field>
                        <Field label="Descripción">
                            <textarea className={`${inputClass} h-20 py-2 resize-none`}
                                value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción opcional..." />
                        </Field>
                        <div className="flex items-center justify-between py-2 px-3 bg-white/3 border border-white/6 rounded-lg">
                            <div>
                                <p className="text-xs text-slate-300 font-medium">Proyecto activo</p>
                                <p className="text-[11px] text-slate-500">Los asesores pueden acceder y cotizar</p>
                            </div>
                            <button onClick={() => setIsActive(!isActive)}
                                className={`relative rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                style={{ height: 22, width: 40 }}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </Section>

                <Section title="Configuración comercial" icon={BarChart3}>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Máx. cuotas">
                            <input className={inputClass} type="number" min={1} max={360} value={maxCuotas} onChange={e => setMaxCuotas(e.target.value)} placeholder="60" />
                        </Field>
                        <Field label="Inicial mínimo (%)">
                            <input className={inputClass} type="number" min={0} max={100} step={0.5} value={minInicial} onChange={e => setMinInicial(e.target.value)} placeholder="10" />
                        </Field>
                    </div>
                </Section>

                <Section title="Plano del proyecto" icon={Map}>
                    <div className="space-y-3">
                        {project.mapImageUrl ? (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/15 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-emerald-400 font-medium">Plano cargado</p>
                                    <p className="text-[11px] text-slate-500 truncate">{project.mapImageUrl}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                <p className="text-xs text-amber-400">Sin plano — sube un archivo SVG, PNG o JPG</p>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" className="hidden" onChange={handleMapUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 border-dashed rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-50 transition-colors w-full justify-center">
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {isUploading ? 'Subiendo...' : project.mapImageUrl ? 'Reemplazar plano' : 'Subir plano'}
                        </button>
                        <p className="text-[10px] text-slate-600">Máx. 15MB · SVG recomendado para mejor calidad</p>
                    </div>
                </Section>

                <Section title="Integraciones" icon={Webhook}>
                    <div className="space-y-4">
                        <Field label="Google Sheets ID">
                            <input className={inputClass} value={sheetsId} onChange={e => setSheetsId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
                        </Field>
                        <Field label="n8n Webhook URL">
                            <input className={inputClass} value={n8nWebhookUrl} onChange={e => setN8nWebhookUrl(e.target.value)} placeholder="https://n8n.tudominio.com/webhook/..." />
                        </Field>
                    </div>
                </Section>

                {/* Danger zone */}
                <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <h2 className="text-sm font-medium text-rose-400">Zona de peligro</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Eliminar el proyecto borrará también todos sus lotes y cotizaciones. Esta acción es irreversible.</p>
                    <Link href="/admin/projects">
                        <button className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            Ir a la lista para eliminar
                        </button>
                    </Link>
                </div>
            </div>

            {/* Lot documents / price history modal */}
            {selectedLot && (
                <LotDocumentsModal lot={selectedLot} onClose={() => setSelectedLot(null)} />
            )}
        </div>
    )
}
