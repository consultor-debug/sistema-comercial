'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { InteractiveMap } from '@/components/map'
import { LotPanel } from '@/components/lot/LotPanel'
import { Sidebar } from '@/components/Sidebar'
import { Loader2, Search, Map, Satellite, Download, Edit2 } from 'lucide-react'
import { Lot } from '@prisma/client'
import { cn } from '@/lib/utils'

const SatelliteMap = dynamic(
    () => import('@/components/map/SatelliteMap').then(m => m.SatelliteMap),
    { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center bg-white"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div> }
)

interface SatCorners { tl: {lat:number;lng:number}; tr: {lat:number;lng:number}; br: {lat:number;lng:number}; bl: {lat:number;lng:number} }

interface ProjectData {
    id: string; name: string; description: string | null
    mapImageUrl: string | null; maxCuotas: number; minInicial: number; interestRate: number
    satCorners?: SatCorners | null
}

type StatusFilter = 'ALL' | 'LIBRE' | 'SEPARADO' | 'VENDIDO'
type MapView = '2d' | 'satelite'

// ── Colores de chips según Mattika ───────────────────────────
const CHIP_STYLES: Record<string, { active: string; dot: string }> = {
    ALL:      { active: 'bg-blue-600 text-white border-blue-600', dot: '' },
    LIBRE:    { active: 'bg-blue-50 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
    SEPARADO: { active: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
    VENDIDO:  { active: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
}

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

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [projRes, lotsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch(`/api/lots?projectId=${params.id}`),
            ])
            const projData = await projRes.json()
            if (projData.success) {
                const found = projData.projects.find((p: ProjectData) => p.id === params.id)
                if (found) { setProject(found); setSatCorners(found.satCorners ?? null) }
                else { router.push('/dashboard'); return }
            }
            const lotsData = await lotsRes.json()
            if (lotsData.success) setLots(lotsData.lots)

            // Detectar rol (no crítico)
            fetch('/api/auth/session').then(r => r.json()).then(s => {
                setIsAdmin(s?.user?.role === 'SUPER_ADMIN' || s?.user?.role === 'ADMIN')
            }).catch(() => {})
        } catch { /* silence */ } finally { setIsLoading(false) }
    }, [params.id, router])

    React.useEffect(() => { if (params.id) fetchData() }, [params.id, fetchData])

    const handleUpdate = React.useCallback(async () => {
        setSelectedLot(null)
        const r = await fetch(`/api/lots?projectId=${params.id}`)
        const d = await r.json()
        if (d.success) setLots(d.lots)
    }, [params.id])

    const stats = React.useMemo(() => ({
        total:    lots.length,
        libre:    lots.filter(l => l.estado === 'LIBRE').length,
        separado: lots.filter(l => l.estado === 'SEPARADO').length,
        vendido:  lots.filter(l => l.estado === 'VENDIDO').length,
    }), [lots])

    const filteredLots = React.useMemo(() => {
        return lots.filter(lot => {
            const q = search.trim().toLowerCase().replace(/[\s-]/g, '')
            const hay = `${lot.code} ${lot.manzana}${lot.loteNumero} manzana${lot.manzana}`.toLowerCase().replace(/[\s-]/g, '')
            const matchSearch = !q || hay.includes(q)
            const matchStatus = statusFilter === 'ALL' || lot.estado === statusFilter
            return matchSearch && matchStatus
        })
    }, [lots, search, statusFilter])

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-400">Cargando plano...</p>
            </div>
        </div>
    )
    if (!project) return null

    const tabs: { key: StatusFilter; label: string; count: number }[] = [
        { key: 'ALL',      label: 'Todos',       count: stats.total },
        { key: 'LIBRE',    label: 'Disponibles', count: stats.libre },
        { key: 'SEPARADO', label: 'Separados',   count: stats.separado },
        { key: 'VENDIDO',  label: 'Vendidos',    count: stats.vendido },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className="flex-1 md:pl-52 flex flex-col min-h-screen">

                {/* ── Cabecera estilo Mattika ── */}
                <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-5 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Plano del proyecto</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                <span className="text-gray-700 font-medium">{project.name}</span>
                                {project.description && (
                                    <> · <span className="text-blue-600 font-medium">{project.description}</span></>
                                )}
                                {' · '}
                                <span>{stats.total} lotes</span>
                                {' · '}
                                <span>{stats.libre} disponibles</span>
                            </p>
                        </div>

                        {/* Botones de vista */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setMapView('2d')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                                        mapView === '2d'
                                            ? 'bg-white text-gray-900'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    <Map className="w-3.5 h-3.5" /> Plano
                                </button>
                                <div className="w-px bg-gray-200" />
                                <button
                                    onClick={() => setMapView('satelite')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                                        mapView === 'satelite'
                                            ? 'bg-white text-gray-900'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    <Satellite className="w-3.5 h-3.5" /> Satélite
                                </button>
                            </div>

                            {mapView === '2d' && isAdmin && (
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" /> Editar polígonos
                                </button>
                            )}

                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Exportar plano
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Barra de filtros ── */}
                <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-3 shrink-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Lote A-03, manzana C..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-3 h-8 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all w-48"
                            />
                        </div>

                        {/* Chips de estado */}
                        <div className="flex items-center gap-1.5">
                            {tabs.map(tab => {
                                const style = CHIP_STYLES[tab.key]
                                const isActive = statusFilter === tab.key
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm font-medium transition-colors',
                                            isActive
                                                ? style.active
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        )}
                                    >
                                        {tab.key !== 'ALL' && style.dot && (
                                            <span className={cn('w-2 h-2 rounded-sm border border-current/30', style.dot, !isActive && 'opacity-60')} />
                                        )}
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={cn(
                                                'text-xs font-semibold',
                                                isActive && tab.key !== 'ALL' ? 'opacity-90' : 'text-gray-400'
                                            )}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <span className="ml-auto text-xs text-gray-400 hidden lg:block">
                            Click + arrastra para mover · scroll para zoom
                        </span>
                    </div>
                </div>

                {/* ── Contenido principal: plano izquierda + panel derecha ── */}
                <div className="flex-1 flex min-h-0 p-4 gap-4">

                    {/* Plano — posicionamiento relativo para que el mapa use absolute inset-0 */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative min-h-[400px]">
                        {mapView === '2d' ? (
                            <InteractiveMap
                                projectId={project.id}
                                projectName={project.name}
                                mapImageUrl={project.mapImageUrl || ''}
                                lots={filteredLots}
                                onLotClick={setSelectedLot}
                                selectedLotId={selectedLot?.id}
                                className="absolute inset-0"
                            />
                        ) : (
                            <SatelliteMap
                                projectId={project.id}
                                projectName={project.name}
                                mapImageUrl={project.mapImageUrl || ''}
                                lots={filteredLots}
                                onLotClick={setSelectedLot}
                                selectedLotId={selectedLot?.id}
                                satCorners={satCorners}
                                onSatCornersChange={setSatCorners}
                                isAdmin={isAdmin}
                                className="absolute inset-0"
                            />
                        )}
                    </div>

                    {/* Panel lateral — siempre visible, como en Mattika */}
                    <div className="w-80 xl:w-96 shrink-0 flex flex-col">
                        {selectedLot ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
                                <LotPanel
                                    lot={selectedLot}
                                    onClose={() => setSelectedLot(null)}
                                    onUpdate={handleUpdate}
                                    projectSettings={{
                                        maxCuotas: project.maxCuotas,
                                        minInicial: project.minInicial,
                                        interestRate: project.interestRate,
                                    }}
                                />
                            </div>
                        ) : (
                            <EmptyPanel stats={stats} />
                        )}
                    </div>
                </div>

                {/* Mobile: bottom sheet para lote seleccionado */}
                {selectedLot && (
                    <div className="md:hidden fixed inset-0 z-[60]">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLot(null)} />
                        <div className="absolute inset-x-0 bottom-0 h-[88vh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className="w-10 h-1 bg-gray-300 rounded-full" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <LotPanel
                                    lot={selectedLot}
                                    onClose={() => setSelectedLot(null)}
                                    onUpdate={handleUpdate}
                                    projectSettings={{
                                        maxCuotas: project.maxCuotas,
                                        minInicial: project.minInicial,
                                        interestRate: project.interestRate,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function EmptyPanel({ stats }: { stats: { libre: number; separado: number; vendido: number; total: number } }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resumen del proyecto</h3>

            <div className="space-y-3">
                <StatRow label="Disponibles" value={stats.libre} color="bg-blue-500" pct={stats.total ? stats.libre/stats.total*100 : 0} />
                <StatRow label="Separados"   value={stats.separado} color="bg-amber-500" pct={stats.total ? stats.separado/stats.total*100 : 0} />
                <StatRow label="Vendidos"    value={stats.vendido} color="bg-slate-400" pct={stats.total ? stats.vendido/stats.total*100 : 0} />
            </div>

            <div className="mt-2 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-500 font-medium mb-1">Para comenzar</p>
                <p className="text-sm text-blue-700">Haz clic en cualquier lote del plano para ver sus detalles y simular el financiamiento.</p>
            </div>
        </div>
    )
}

function StatRow({ label, value, color, pct }: { label: string; value: number; color: string; pct: number }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-sm', color)} />
                    <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
