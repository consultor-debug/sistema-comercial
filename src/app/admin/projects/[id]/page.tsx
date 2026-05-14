'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Save, Loader2, Map, Database,
    Settings, Globe, Webhook, BarChart3, Upload,
    CheckCircle2, AlertCircle, Trash2, ExternalLink
} from 'lucide-react'

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

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="bg-slate-900/50 border border-white/6 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-300">{title}</h2>
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

const inputClass = "w-full h-9 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.07] transition-all"

export default function ProjectSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

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

    const fetchProject = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [projRes, lotsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch(`/api/lots?projectId=${projectId}`)
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
                const lots = lotsData.lots
                setProject(prev => prev ? {
                    ...prev,
                    stats: {
                        total: lots.length,
                        libre: lots.filter((l: { estado: string }) => l.estado === 'LIBRE').length,
                        separado: lots.filter((l: { estado: string }) => l.estado === 'SEPARADO').length,
                        vendido: lots.filter((l: { estado: string }) => l.estado === 'VENDIDO').length,
                        noDisponible: lots.filter((l: { estado: string }) => l.estado === 'NO_DISPONIBLE').length,
                    }
                } : prev)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [projectId, router])

    React.useEffect(() => { fetchProject() }, [fetchProject])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        try {
            const res = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: projectId,
                    name,
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
            if (data.success) {
                setProject(prev => prev ? { ...prev, mapImageUrl: data.url } : prev)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
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
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 h-8 px-3 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors"
                    >
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
                <div className="flex gap-2">
                    <Link href={`/projects/${projectId}`} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                        <Map className="w-3.5 h-3.5" /> Ver plano interactivo
                        <ExternalLink className="w-3 h-3 text-slate-600" />
                    </Link>
                    <Link href={`/admin/lots/map?projectId=${projectId}`} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                        <Database className="w-3.5 h-3.5" /> Editor de lotes
                        <ExternalLink className="w-3 h-3 text-slate-600" />
                    </Link>
                </div>

                {/* General info */}
                <Section title="Información general" icon={Settings}>
                    <div className="space-y-4">
                        <Field label="Nombre del proyecto">
                            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" />
                        </Field>
                        <Field label="Descripción">
                            <textarea
                                className={`${inputClass} h-20 py-2 resize-none`}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descripción opcional..."
                            />
                        </Field>
                        <div className="flex items-center justify-between py-2 px-3 bg-white/3 border border-white/6 rounded-lg">
                            <div>
                                <p className="text-xs text-slate-300 font-medium">Proyecto activo</p>
                                <p className="text-[11px] text-slate-500">Los asesores pueden acceder y cotizar</p>
                            </div>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`relative w-10 h-5.5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                style={{ height: 22, width: 40 }}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </Section>

                {/* Commercial settings */}
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

                {/* Map image */}
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
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 border-dashed rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-50 transition-colors w-full justify-center"
                        >
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {isUploading ? 'Subiendo...' : project.mapImageUrl ? 'Reemplazar plano' : 'Subir plano'}
                        </button>
                        <p className="text-[10px] text-slate-600">Máx. 15MB · SVG recomendado para mejor calidad</p>
                    </div>
                </Section>

                {/* Integrations */}
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
                        <button
                            className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
                            onClick={() => {/* handled in projects list */}}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Ir a la lista para eliminar
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    )
}
