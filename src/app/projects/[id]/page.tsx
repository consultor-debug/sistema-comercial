'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { InteractiveMap } from '@/components/map'
import { LotPanel } from '@/components/lot/LotPanel'
import { Sidebar } from '@/components/Sidebar'
import { ArrowLeft, Loader2, Search, Map, Satellite } from 'lucide-react'
import { Lot } from '@prisma/client'
import { cn } from '@/lib/utils'

// SatelliteMap requiere Leaflet que solo funciona en cliente
const SatelliteMap = dynamic(
    () => import('@/components/map/SatelliteMap').then(m => m.SatelliteMap),
    { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center bg-slate-950"><Loader2 className="w-5 h-5 text-slate-600 animate-spin" /></div> }
)

interface SatCorners {
    tl: { lat: number; lng: number }
    tr: { lat: number; lng: number }
    br: { lat: number; lng: number }
    bl: { lat: number; lng: number }
}

interface ProjectData {
    id: string
    name: string
    description: string | null
    mapImageUrl: string | null
    maxCuotas: number
    minInicial: number
    interestRate: number
    satCorners?: SatCorners | null
}

type StatusFilter = 'ALL' | 'LIBRE' | 'SEPARADO' | 'VENDIDO'
type MapView = '2d' | 'satelite'

export default function ProjectPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = React.useState<ProjectData | null>(null)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL')
    const [mapView, setMapView] = React.useState<MapView>('2d')
    const [satCorners, setSatCorners] = React.useState<SatCorners | null>(null)
    const [isAdmin, setIsAdmin] = React.useState(false)

    const fetchProjectData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [projRes, lotsRes, sessionRes] = await Promise.all([
                fetch(`/api/projects`),
                fetch(`/api/lots?projectId=${params.id}`),
                fetch(`/api/auth/session`)
            ])
            const projData = await projRes.json()
            if (projData.success) {
                const found = projData.projects.find((p: ProjectData) => p.id === params.id)
                if (found) {
                    setProject(found)
                    setSatCorners(found.satCorners ?? null)
                } else {
                    router.push('/dashboard')
                    return
                }
            }
            const lotsData = await lotsRes.json()
            if (lotsData.success) setLots(lotsData.lots)

            try {
                const sess = await sessionRes.json()
                setIsAdmin(sess?.user?.role === 'SUPER_ADMIN' || sess?.user?.role === 'ADMIN')
            } catch { /* no crítico */ }
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
        { key: 'SEPARADO', label: 'Separados',    count: stats.separado, color: 'text-amber-400' },
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

                {/* ── Header ── */}
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
                            <StatPill value={stats.separado} label="Separados"   color="text-amber-400"   dot="bg-amber-400" />
                            <div className="h-4 w-px bg-white/10" />
                            <StatPill value={stats.vendido}  label="Vendidos"    color="text-rose-400"    dot="bg-rose-400" />
                        </div>
                    </div>
                </header>

                {/* ── Body ── */}
                <div className="flex-1 flex min-h-0 relative">

                    {/* Left: map area */}
                    <div className={cn(
                        'flex flex-col min-w-0 transition-all duration-300',
                        selectedLot ? 'hidden md:flex flex-1' : 'flex-1'
                    )}>
                        {/* Search + filters + view toggle */}
                        <div className="px-3 pt-3 pb-2 space-y-2 shrink-0 border-b border-white/5 bg-slate-950">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar lote o manzana (ej. A-03 o B)…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 h-9 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-colors"
                                    />
                                </div>

                                {/* Toggle 2D / Satélite */}
                                <div className="flex items-center bg-white/5 border border-white/8 rounded-lg p-0.5 shrink-0">
                                    <button
                                        onClick={() => setMapView('2d')}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-colors',
                                            mapView === '2d'
                                                ? 'bg-white text-slate-900'
                                                : 'text-slate-400 hover:text-white'
                                        )}
                                    >
                                        <Map className="w-3 h-3" />
                                        <span className="hidden sm:inline">Plano</span>
                                    </button>
                                    <button
                                        onClick={() => setMapView('satelite')}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-colors',
                                            mapView === 'satelite'
                                                ? 'bg-white text-slate-900'
                                                : 'text-slate-400 hover:text-white'
                                        )}
                                    >
                                        <Satellite className="w-3 h-3" />
                                        <span className="hidden sm:inline">Satélite</span>
                                    </button>
                                </div>
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

                        {/* Map — 2D o Satélite */}
                        <div className="flex-1 relative flex flex-col">
                            {mapView === '2d' ? (
                                <InteractiveMap
                                    projectId={project.id}
                                    projectName={project.name}
                                    mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                                    lots={filteredLots}
                                    onLotClick={(lot) => setSelectedLot(lot)}
                                    selectedLotId={selectedLot?.id}
                                    className="absolute inset-0"
                                />
                            ) : (
                                <SatelliteMap
                                    projectId={project.id}
                                    projectName={project.name}
                                    mapImageUrl={project.mapImageUrl || ''}
                                    lots={filteredLots}
                                    onLotClick={(lot) => setSelectedLot(lot)}
                                    selectedLotId={selectedLot?.id}
                                    satCorners={satCorners}
                                    onSatCornersChange={setSatCorners}
                                    isAdmin={isAdmin}
                                    className="absolute inset-0"
                                />
                            )}
                        </div>

                        {/* Legend — solo en vista 2D */}
                        {mapView === '2d' && (
                            <div className="shrink-0 flex items-center gap-4 px-4 py-2.5 border-t border-white/5 bg-slate-950/90 backdrop-blur-sm overflow-x-auto no-scrollbar">
                                <LegendItem dot="bg-emerald-500" label="Disponible" count={stats.libre}     countColor="text-emerald-400" />
                                <div className="w-px h-4 bg-white/10 shrink-0" />
                                <LegendItem dot="bg-amber-500"  label="Separado"   count={stats.separado}  countColor="text-amber-400" />
                                <div className="w-px h-4 bg-white/10 shrink-0" />
                                <LegendItem dot="bg-rose-500"   label="Vendido"    count={stats.vendido}   countColor="text-rose-400" />
                                <div className="ml-auto shrink-0 text-[11px] text-slate-500">
                                    {stats.total} lotes totales
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel lateral — lote seleccionado */}
                    {selectedLot && (
                        <>
                            <div className="hidden md:block w-80 lg:w-96 shrink-0 border-l border-white/5 animate-in slide-in-from-right duration-200">
                                <LotPanel
                                    lot={selectedLot}
                                    onClose={() => setSelectedLot(null)}
                                    onUpdate={handleUpdate}
                                    projectSettings={{ maxCuotas: project.maxCuotas, minInicial: project.minInicial, interestRate: project.interestRate }}
                                />
                            </div>

                            {/* Mobile: bottom sheet */}
                            <div className="md:hidden fixed inset-0 z-[60]">
                                <div
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setSelectedLot(null)}
                                />
                                <div className="absolute inset-x-0 bottom-0 h-[90vh] flex flex-col bg-slate-950 border-t border-white/10 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
                                    <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                                        <div className="w-10 h-1 bg-white/20 rounded-full" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <LotPanel
                                            lot={selectedLot}
                                            onClose={() => setSelectedLot(null)}
                                            onUpdate={handleUpdate}
                                            projectSettings={{ maxCuotas: project.maxCuotas, minInicial: project.minInicial, interestRate: project.interestRate }}
                                        />
                                    </div>
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

function LegendItem({ dot, label, count, countColor = 'text-white' }: {
    dot: string; label: string; count: number; countColor?: string
}) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dot)} />
            <span className="text-xs text-slate-400">{label}</span>
            <span className={cn('text-xs font-bold', countColor)}>{count}</span>
        </div>
    )
}
