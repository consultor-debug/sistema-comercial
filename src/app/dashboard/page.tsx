'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Map, FileText, TrendingUp,
    Plus, Calendar, Users, ExternalLink,
    ChevronDown, Check, Filter, Settings
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface ProjectOption { id: string; name: string; tenant?: { name: string } | null }
interface DashboardData {
    user: { name: string; role: string }
    projects: any[]
    allProjects: ProjectOption[]
    recentQuotations: any[]
    stats: {
        totalLots: number
        libre: number
        separado: number
        vendido: number
        quotationsToday: number
    }
}

export default function DashboardPage() {
    const [data, setData] = React.useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([])
    const [selectorOpen, setSelectorOpen] = React.useState(false)
    const selectorRef = React.useRef<HTMLDivElement>(null)

    const fetchDashboardData = React.useCallback(async (ids: string[] = []) => {
        setIsLoading(true)
        try {
            const qs = ids.length > 0 ? `?projectIds=${ids.join(',')}` : ''
            const response = await fetch(`/api/dashboard${qs}`)
            const result = await response.json()
            if (result.success) setData(result.data)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

    React.useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
                setSelectorOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const toggleProject = (id: string) => {
        const next = selectedProjectIds.includes(id)
            ? selectedProjectIds.filter(p => p !== id)
            : [...selectedProjectIds, id]
        setSelectedProjectIds(next)
        fetchDashboardData(next)
    }

    const selectAll = () => {
        setSelectedProjectIds([])
        fetchDashboardData([])
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    const chartData = [
        { name: 'Libre', value: data.stats.libre, color: '#10b981' },
        { name: 'Separado', value: data.stats.separado, color: '#f59e0b' },
        { name: 'Vendido', value: data.stats.vendido, color: '#ef4444' },
    ]

    const initials = data.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-0">

                {/* ── Header ── */}
                <header className="h-14 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5">

                    {/* Date — always visible */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="capitalize hidden sm:inline">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <span className="capitalize sm:hidden">
                            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Project selector — hidden on mobile, shown md+ */}
                        {data?.allProjects && data.allProjects.length > 0 && (
                            <div className="relative hidden md:block" ref={selectorRef}>
                                <button
                                    onClick={() => setSelectorOpen(o => !o)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                                >
                                    <Filter className="w-3 h-3" />
                                    <span>
                                        {selectedProjectIds.length === 0
                                            ? 'Todos'
                                            : `${selectedProjectIds.length} proyecto${selectedProjectIds.length > 1 ? 's' : ''}`}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {selectorOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                        >
                                            <button
                                                onClick={selectAll}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedProjectIds.length === 0 ? 'bg-white/5 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                            >
                                                <span>Todos los proyectos</span>
                                                {selectedProjectIds.length === 0 && <Check className="w-4 h-4" />}
                                            </button>
                                            <div className="border-t border-white/5" />
                                            <div className="max-h-48 overflow-y-auto">
                                                {data.allProjects.map(p => {
                                                    const isSelected = selectedProjectIds.includes(p.id)
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => toggleProject(p.id)}
                                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isSelected ? 'bg-white/5 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                                        >
                                                            <div className="flex flex-col items-start min-w-0">
                                                                <span className="font-medium truncate">{p.name}</span>
                                                                {p.tenant?.name && (
                                                                    <span className="text-[10px] text-slate-500 truncate">{p.tenant.name}</span>
                                                                )}
                                                            </div>
                                                            {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="hidden md:block h-6 w-px bg-white/5" />

                        {/* User — name hidden on mobile */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium hidden md:inline">{data.user.name}</span>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-300">
                                {initials}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto py-6 md:py-8 space-y-6 md:space-y-8">

                    {/* ── Welcome ── */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-1">
                                Hola, {data.user.name.split(' ')[0]}
                            </h2>
                            <p className="text-slate-500 text-sm">Resumen de tus proyectos para hoy.</p>
                        </div>
                        <Link href="/admin/projects/new" className="shrink-0">
                            <Button className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-100 font-medium rounded-lg px-4 py-2 text-sm">
                                <Plus className="w-4 h-4 mr-1.5" />
                                Nuevo Proyecto
                            </Button>
                        </Link>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <StatCard
                            title="Lotes Totales"
                            value={data.stats.totalLots}
                            icon={Map}
                            accent="blue"
                        />
                        <StatCard
                            title="Vendidos"
                            value={data.stats.vendido}
                            icon={TrendingUp}
                            accent="green"
                            sub={`${Math.round((data.stats.vendido / (data.stats.totalLots || 1)) * 100)}% del total`}
                        />
                        <StatCard
                            title="Cotizaciones Hoy"
                            value={data.stats.quotationsToday}
                            icon={FileText}
                            accent="amber"
                        />
                        <StatCard
                            title="Tasa de Cierre"
                            value={`${Math.round((data.stats.vendido / (data.stats.totalLots || 1)) * 100)}%`}
                            icon={Users}
                            accent="purple"
                            sub={`${data.stats.libre} libres`}
                        />
                    </div>

                    {/* ── Chart + Quotations ── */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

                        {/* Inventory chart */}
                        <div className="md:col-span-4">
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-5 h-full">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5">Inventario</h3>
                                <StatsChart data={chartData} />
                                <div className="space-y-1 mt-5">
                                    {chartData.map(item => (
                                        <div key={item.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="text-sm text-slate-400">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-white">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent quotations */}
                        <div className="md:col-span-8">
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden h-full">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cotizaciones Recientes</h3>
                                    <Link href="/quotations" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 shrink-0 ml-2">
                                        Ver todas <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {data.recentQuotations.map((q) => (
                                        <div key={q.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors min-w-0">
                                            {/* Lot badge */}
                                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-400 shrink-0">
                                                {q.lot.code}
                                            </div>
                                            {/* Client info — truncated */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {q.clienteNombres} {q.clienteApellidos}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs text-slate-500 truncate">{q.codigo}</span>
                                                    <span className="text-xs text-slate-600 shrink-0">·</span>
                                                    <span className="text-xs text-slate-500 shrink-0">
                                                        {new Date(q.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Amount */}
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(q.precioFinal)}</p>
                                                <p className="text-xs text-slate-500">{q.cuotas} cuotas</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {data.recentQuotations.length === 0 && (
                                    <div className="py-16 text-center">
                                        <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">No hay actividad reciente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Active Projects ── */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                            Proyectos Activos
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

// ── Accent config ──
const ACCENT = {
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   value: 'text-blue-100' },
    green:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', value: 'text-emerald-100' },
    amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: 'text-amber-400',  value: 'text-amber-100' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', value: 'text-purple-100' },
}

function StatCard({
    title, value, icon: Icon, accent, sub,
}: {
    title: string
    value: string | number
    icon: any
    accent: keyof typeof ACCENT
    sub?: string
}) {
    const a = ACCENT[accent]
    return (
        <div className={`${a.bg} border ${a.border} rounded-xl p-4 md:p-5 transition-colors hover:brightness-110`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${a.icon}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <h4 className={`text-2xl font-semibold tracking-tight ${a.value}`}>{value}</h4>
            <p className="text-xs text-slate-500 mt-1">{title}</p>
            {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
    )
}

function ProjectCard({ project }: { project: any }) {
    const percentSold = project.stats.total > 0 ? Math.round((project.stats.vendido / project.stats.total) * 100) : 0

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-5 gap-3 min-w-0">
                <div className="min-w-0">
                    <h4 className="text-base font-semibold text-white mb-1 truncate">{project.name}</h4>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                        <span className="text-xs text-slate-500">{project.stats.total} lotes</span>
                    </div>
                </div>
                <span className="text-2xl font-semibold text-white shrink-0">{percentSold}%</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="text-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <p className="text-[10px] text-slate-500 mb-0.5">Libres</p>
                    <p className="text-base font-semibold text-emerald-400">{project.stats.libre}</p>
                </div>
                <div className="text-center py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                    <p className="text-[10px] text-slate-500 mb-0.5">Sep.</p>
                    <p className="text-base font-semibold text-amber-400">{project.stats.separado}</p>
                </div>
                <div className="text-center py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                    <p className="text-[10px] text-slate-500 mb-0.5">Vend.</p>
                    <p className="text-base font-semibold text-rose-400">{project.stats.vendido}</p>
                </div>
            </div>

            {/* Progress bar with color gradient */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${percentSold}%` }}
                />
            </div>

            <div className="flex gap-2">
                <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-medium rounded-lg text-sm py-2">
                        <Map className="w-4 h-4 mr-1.5 shrink-0" />
                        <span className="truncate">Plano Interactivo</span>
                    </Button>
                </Link>
                <Link href={`/admin/projects/${project.id}`} className="shrink-0">
                    <Button variant="outline" className="rounded-lg border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2">
                        <Settings className="w-4 h-4 text-slate-400" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
