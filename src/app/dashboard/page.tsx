'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Building2, Map, FileText, TrendingUp, 
    Plus, Calendar, Users, ExternalLink,
    ChevronDown, Check, Globe, Filter, Settings
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-0">
                {/* Header */}
                <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="capitalize">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Project selector */}
                        {data?.allProjects && data.allProjects.length > 0 && (
                            <div className="relative" ref={selectorRef}>
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
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-medium">{p.name}</span>
                                                                {p.tenant?.name && (
                                                                    <span className="text-[10px] text-slate-500">{p.tenant.name}</span>
                                                                )}
                                                            </div>
                                                            {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="h-6 w-px bg-white/5" />

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">{data.user.name}</span>
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-400">
                                {data.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto py-8 space-y-8">
                    {/* Welcome */}
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-semibold text-white tracking-tight mb-1">
                                Hola, {data.user.name.split(' ')[0]}
                            </h2>
                            <p className="text-slate-500 text-sm">Resumen de tus proyectos para hoy.</p>
                        </div>
                        <Link href="/admin/projects/new">
                            <Button className="bg-white text-slate-950 hover:bg-slate-100 font-medium rounded-lg px-4 py-2 text-sm">
                                <Plus className="w-4 h-4 mr-1.5" />
                                Nuevo Proyecto
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Lotes Totales" value={data.stats.totalLots} icon={Map} />
                        <StatCard title="Vendidos" value={data.stats.vendido} icon={TrendingUp} />
                        <StatCard title="Cotizaciones Hoy" value={data.stats.quotationsToday} icon={FileText} />
                        <StatCard title="Tasa de Cierre" value={`${Math.round((data.stats.vendido / (data.stats.totalLots || 1)) * 100)}%`} icon={Users} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Chart */}
                        <div className="md:col-span-4">
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 h-full">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">Inventario</h3>
                                <StatsChart data={chartData} />
                                <div className="space-y-2 mt-6">
                                    {chartData.map(item => (
                                        <div key={item.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-sm text-slate-400">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-white">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="md:col-span-8">
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden h-full">
                                <div className="flex items-center justify-between p-6 border-b border-white/5">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cotizaciones Recientes</h3>
                                    <Link href="/quotations" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                                        Ver todas <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {data.recentQuotations.map((q) => (
                                        <div key={q.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-400">
                                                    {q.lot.code}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {q.clienteNombres} {q.clienteApellidos}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-500">{q.codigo}</span>
                                                        <span className="text-xs text-slate-600">·</span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(q.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
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

                    {/* Projects */}
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

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:bg-slate-900/80 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <h4 className="text-2xl font-semibold text-white tracking-tight">{value}</h4>
            <p className="text-xs text-slate-500 mt-1">{title}</p>
        </div>
    )
}

function ProjectCard({ project }: { project: any }) {
    const percentSold = project.stats.total > 0 ? Math.round((project.stats.vendido / project.stats.total) * 100) : 0

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-xs text-slate-500">{project.stats.total} lotes</span>
                    </div>
                </div>
                <span className="text-2xl font-semibold text-white">{percentSold}%</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center py-2 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Libres</p>
                    <p className="text-lg font-semibold text-emerald-400">{project.stats.libre}</p>
                </div>
                <div className="text-center py-2 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Sep.</p>
                    <p className="text-lg font-semibold text-amber-400">{project.stats.separado}</p>
                </div>
                <div className="text-center py-2 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Vend.</p>
                    <p className="text-lg font-semibold text-rose-400">{project.stats.vendido}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
                <div 
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${percentSold}%` }}
                />
            </div>

            <div className="flex gap-3">
                <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-medium rounded-lg text-sm py-2.5">
                        <Map className="w-4 h-4 mr-2" />
                        Plano Interactivo
                    </Button>
                </Link>
                <Link href={`/admin/projects/${project.id}`}>
                    <Button variant="outline" className="rounded-lg border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5">
                        <Settings className="w-4 h-4 text-slate-400" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
