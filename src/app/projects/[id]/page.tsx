'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/map'
import { LotPanel } from '@/components/lot/LotPanel'
import { Sidebar } from '@/components/Sidebar'
import { ArrowLeft, Loader2, X, Search } from 'lucide-react'
import { Lot } from '@prisma/client'
import { cn } from '@/lib/utils'

interface ProjectData {
    id: string
    name: string
    description: string | null
    mapImageUrl: string | null
    maxCuotas: number
    minInicial: number
}

type StatusFilter = 'ALL' | 'LIBRE' | 'SEPARADO' | 'VENDIDO'

export default function ProjectPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = React.useState<ProjectData | null>(null)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL')

    const fetchProjectData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [projRes, lotsRes] = await Promise.all([
                fetch(`/api/projects`),
                fetch(`/api/lots?projectId=${params.id}`)
            ])
            const projData = await projRes.json()
            if (projData.success) {
                const found = projData.projects.find((p: ProjectData) => p.id === params.id)
                if (found) setProject(found)
                else { router.push('/dashboard'); return }
            }
            const lotsData = await lotsRes.json()
            if (lotsData.success) setLots(lotsData.lots)
        } catch (error) {
            console.error('Error fetching project data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [params.id, router])

    React.useEffect(() => {
        if (params.id) fetchProjectData()
    }, [params.id, fetchProjectData])

    const handleUpdate = React.useCallback(async () => {
        setSelectedLot(null)
        const lotsRes = await fetch(`/api/lots?projectId=${params.id}`)
        const lotsData = await lotsRes.json()
        if (lotsData.success) setLots(lotsData.lots)
    }, [params.id])

    const stats = React.useMemo(() => ({
        total: lots.length,
        libre: lots.filter(l => l.estado === 'LIBRE').length,
        separado: lots.filter(l => l.estado === 'SEPARADO').length,
        vendido: lots.filter(l => l.estado === 'VENDIDO').length,
    }), [lots])

    const filteredLots = React.useMemo(() => {
        return lots.filter(lot => {
            const q = search.trim().toLowerCase()
            const matchSearch = !q ||
                lot.code.toLowerCase().includes(q) ||
                lot.manzana.toLowerCase().includes(q)
            const matchStatus = statusFilter === 'ALL' || lot.estado === statusFilter
            return matchSearch && matchStatus
        })
    }, [lots, search, statusFilter])

    const filterTabs: { key: StatusFilter; label: string; count: number; color: string }[] = [
        { key: 'ALL',      label: 'Todos',       count: stats.total,    color: '' },
        { key: 'LIBRE',    label: 'Disponibles', count: stats.libre,    color: 'text-emerald-400' },
        { key: 'SEPARADO', label: 'Apartados',   count: stats.separado, color: 'text-amber-400' },
        { key: 'VENDIDO',  label: 'Vendidos',    count: stats.vendido,  color: 'text-rose-400' },
    ]

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                    <p className="text-xs text-slate-500">Cargando plano...</p>
                </div>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            <div className="flex-1 md:pl-52 flex flex-col min-h-screen">

                {/* ── Header: project identity + live stats ── */}
                <header className="shrink-0 border-b border-white/5 bg-slate-950 z-40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link href="/dashboard"
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors shrink-0">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Panel</span>
                            </Link>
                            <div className="h-4 w-px bg-white/10 shrink-0" />
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold text-white truncate">{project.name}</h1>
                                {project.description && (
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                            <StatPill value={stats.libre}    label="Disponibles" color="text-emerald-400" dot="bg-emerald-400" />
                            <div className="h-4 w-px bg-white/10" />
                            <StatPill value={stats.separado} label="Apartados"   color="text-amber-400"   dot="bg-amber-400" />
                            <div className="h-4 w-px bg-white/10" />
                            <StatPill value={stats.vendido}  label="Vendidos"    color="text-rose-400"    dot="bg-rose-400" />
                        </div>
                    </div>
                </header>

                {/* ── Body ── */}
                <div className="flex-1 flex min-h-0 relative">

                    {/* Left: search + filters + map + legend */}
                    <div className={cn(
                        'flex flex-col min-w-0 transition-all duration-300',
                        selectedLot ? 'hidden md:flex flex-1' : 'flex-1'
                    )}>
                        {/* Search + filter tabs */}
                        <div className="px-3 pt-3 pb-2 space-y-2 shrink-0 border-b border-white/5 bg-slate-950">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar lote o manzana (ej. A-03 o B)…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 h-9 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                {filterTabs.map(tab => (
                                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                                            statusFilter === tab.key
                                                ? 'bg-white text-slate-950'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}>
                                        {tab.label}
                                        <span className={cn(
                                            'text-[10px] font-semibold',
                                            statusFilter === tab.key
                                                ? 'text-slate-500'
                                                : (tab.color || 'text-slate-500')
                                        )}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                                <span className="ml-auto text-[11px] text-slate-600 shrink-0 pr-1">
                                    {filteredLots.length} de {stats.total} lotes
                                </span>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="flex-1 relative">
                            <InteractiveMap
                                projectId={project.id}
                                projectName={project.name}
                                mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                                lots={filteredLots}
                                onLotClick={(lot) => setSelectedLot(lot)}
                                selectedLotId={selectedLot?.id}
                                className="absolute inset-0"
                            />
                        </div>

                        {/* Legend */}
                        <div className="shrink-0 flex items-center gap-5 px-4 py-2.5 border-t border-white/5 bg-slate-950/90 backdrop-blur-sm overflow-x-auto no-scrollbar">
                            <LegendItem dot="bg-emerald-500" label="Disponible" count={stats.libre} />
                            <LegendItem dot="bg-amber-500"  label="Apartado"   count={stats.separado} />
                            <LegendItem dot="bg-rose-500"   label="Vendido"    count={stats.vendido} />
                        </div>
                    </div>

                    {/* Right panel — desktop side column */}
                    {selectedLot && (
                        <>
                            <div className="hidden md:block w-80 lg:w-96 shrink-0 border-l border-white/5 animate-in slide-in-from-right duration-200">
                                <LotPanel
                                    lot={selectedLot}
                                    onClose={() => setSelectedLot(null)}
                                    onUpdate={handleUpdate}
                                    projectSettings={{ maxCuotas: project.maxCuotas, minInicial: project.minInicial }}
                                />
                            </div>

                            {/* Mobile: full-screen overlay */}
                            <div className="md:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-right duration-200 pb-16">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
                                    <button onClick={() => setSelectedLot(null)}
                                        className="p-1.5 rounded-md bg-white/5 text-slate-400 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs text-slate-400">Volver al plano</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <LotPanel
                                        lot={selectedLot}
                                        onClose={() => setSelectedLot(null)}
                                        onUpdate={handleUpdate}
                                        projectSettings={{ maxCuotas: project.maxCuotas, minInicial: project.minInicial }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatPill({ value, label, color, dot }: {
    value: number; label: string; color: string; dot: string
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={cn('text-xl font-bold tracking-tight', color)}>{value}</span>
            <div>
                <div className={cn('w-1.5 h-1.5 rounded-full mb-0.5', dot)} />
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 leading-none">{label}</p>
            </div>
        </div>
    )
}

function LegendItem({ dot, label, count }: { dot: string; label: string; count: number }) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
            <span className="text-[11px] text-slate-500">{label}</span>
            <span className="text-[11px] text-slate-600">({count})</span>
        </div>
    )
}
