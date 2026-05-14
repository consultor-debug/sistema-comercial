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

// Types for the dashboard data
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
            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

    // Close selector on outside click
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
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Cargando Sistema Comercial...</p>
                </motion.div>
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

            <main className="pl-72 pr-8 min-h-screen">
                {/* Top Header - Floating Glass Style */}
                <header className="h-20 sticky top-4 z-30 flex items-center justify-between px-8 glass-strong rounded-3xl mt-4 mb-8 shadow-2xl shadow-cyan-900/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hoy</span>
                            <span className="text-xs font-semibold text-slate-200 capitalize">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Multi-project selector */}
                        {data?.allProjects && data.allProjects.length > 0 && (
                            <div className="relative" ref={selectorRef}>
                                <button
                                    onClick={() => setSelectorOpen(o => !o)}
                                    className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:border-cyan-500/30 hover:bg-white/10 transition-all group"
                                >
                                    <Filter className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <span>
                                        {selectedProjectIds.length === 0
                                            ? 'Todos los proyectos'
                                            : `${selectedProjectIds.length} proyecto${selectedProjectIds.length > 1 ? 's' : ''}`}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${selectorOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {selectorOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                            className="absolute right-0 top-full mt-3 w-72 glass-strong rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
                                        >
                                            <button
                                                onClick={selectAll}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${selectedProjectIds.length === 0 ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <span>Todos los proyectos</span>
                                                {selectedProjectIds.length === 0 && <Check className="w-4 h-4" />}
                                            </button>
                                            <div className="h-px bg-white/5 my-2" />
                                            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                                                {data.allProjects.map(p => {
                                                    const isSelected = selectedProjectIds.includes(p.id)
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => toggleProject(p.id)}
                                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${isSelected ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-bold">{p.name}</span>
                                                                {p.tenant?.name && (
                                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                                                        <Globe className="w-2.5 h-2.5" />{p.tenant.name}
                                                                    </span>
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

                        <div className="h-8 w-px bg-white/5" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-white leading-none">{data.user.name}</p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Administrador</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
                                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-xs font-black text-white">
                                    {data.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                    {/* Welcome Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="h-px w-8 bg-cyan-500/50" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Resumen Comercial</span>
                            </div>
                            <h2 className="text-5xl font-bold text-white tracking-tight mb-2">
                                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{data.user.name.split(' ')[0]}</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg">
                                Aquí tienes el rendimiento de tus proyectos para hoy.
                            </p>
                        </div>
                        <Link href="/admin/projects/new">
                            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xl shadow-cyan-500/20 px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                Nuevo Proyecto
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Total Lotes" 
                            value={data.stats.totalLots} 
                            icon={Map} 
                            color="cyan"
                            delay={0.1}
                        />
                        <StatCard 
                            title="Lotes Vendidos" 
                            value={data.stats.vendido} 
                            icon={TrendingUp} 
                            color="rose"
                            delay={0.2}
                        />
                        <StatCard 
                            title="Cotizaciones Hoy" 
                            value={data.stats.quotationsToday} 
                            icon={FileText} 
                            color="emerald"
                            delay={0.3}
                        />
                        <StatCard 
                            title="Tasa de Cierre" 
                            value={`${Math.round((data.stats.vendido / (data.stats.totalLots || 1)) * 100)}%`} 
                            icon={Users} 
                            color="amber"
                            delay={0.4}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Visual Inventory */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="lg:col-span-4"
                        >
                            <Card className="h-full glass-card border-none rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                        Estado de Inventario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="py-4">
                                        <StatsChart data={chartData} />
                                    </div>
                                    <div className="space-y-4 mt-6">
                                        {chartData.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                                                    <span className="text-sm text-slate-300 font-bold group-hover:text-white transition-colors">{item.name}</span>
                                                </div>
                                                <span className="text-lg font-black text-white">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-8"
                        >
                            <Card className="h-full glass-card border-none rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                        Cotizaciones Recientes
                                    </CardTitle>
                                    <Link href="/quotations">
                                        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl px-4">
                                            Ver Todas <ExternalLink className="w-3 h-3 ml-2" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {data.recentQuotations.map((q, i) => (
                                            <motion.div 
                                                key={q.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + i * 0.1 }}
                                                className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-black text-slate-400 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all shadow-inner">
                                                        {q.lot.code}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-white leading-tight mb-1">
                                                            {q.clienteNombres} {q.clienteApellidos}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-slate-500 font-bold uppercase tracking-tighter border border-white/5">
                                                                {q.codigo}
                                                            </span>
                                                            <span className="text-[10px] text-slate-600 font-bold">
                                                                {new Date(q.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-emerald-400 mb-1">
                                                        {formatCurrency(q.precioFinal)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded-full inline-block">
                                                        {q.cuotas} CUOTAS
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {data.recentQuotations.length === 0 && (
                                        <div className="p-24 text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                                                <FileText className="w-10 h-10" />
                                            </div>
                                            <p className="text-slate-500 font-bold text-lg">No hay actividad reciente.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Active Projects */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                                Proyectos Activos
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.projects.map((project, i) => (
                                <ProjectCard key={project.id} project={project} delay={0.8 + i * 0.1} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, delay }: any) {
    const colorMap = {
        cyan: 'from-cyan-400 to-blue-500 shadow-cyan-500/20 text-cyan-400',
        rose: 'from-rose-400 to-red-500 shadow-rose-500/20 text-rose-400',
        emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/20 text-emerald-400',
        amber: 'from-amber-400 to-orange-500 shadow-amber-500/20 text-amber-400'
    }

    const colorKey = color as keyof typeof colorMap;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", damping: 15 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 rounded-[2.5rem] glass-card border-none relative overflow-hidden group"
        >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${colorMap[colorKey]} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-2xl`} />
            
            <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl bg-slate-900 border border-white/5 ${colorMap[colorKey].split(' ')[3]} shadow-lg`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</span>
                    <Badge variant="neutral" className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0 text-[10px] font-bold">Online</Badge>
                </div>
            </div>
            
            <h4 className="text-4xl font-bold text-white mb-2 tracking-tight">{value}</h4>
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        </motion.div>
    )
}

function ProjectCard({ project, delay }: any) {
    const percentSold = project.stats.total > 0 ? Math.round((project.stats.vendido / project.stats.total) * 100) : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", damping: 20 }}
            whileHover={{ y: -8 }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Card className="relative border-none bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] overflow-hidden border hover:ring-1 hover:ring-cyan-500/30 transition-all duration-500">
                <CardContent className="p-10">
                    <div className="flex items-start justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                <Building2 className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight mb-2">{project.name}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md text-[10px] font-black text-emerald-400 uppercase tracking-tighter border border-emerald-500/20">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                        Activo
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.stats.total} LOTES TOTALES</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black text-white leading-none">{percentSold}%</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Vendido</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-10">
                        <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 text-center group/item hover:bg-white/[0.05] transition-colors">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Libres</p>
                            <p className="text-2xl font-bold text-emerald-400">{project.stats.libre}</p>
                        </div>
                        <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 text-center group/item hover:bg-white/[0.05] transition-colors">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Sep.</p>
                            <p className="text-2xl font-bold text-amber-400">{project.stats.separado}</p>
                        </div>
                        <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 text-center group/item hover:bg-white/[0.05] transition-colors">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Vend.</p>
                            <p className="text-2xl font-bold text-rose-400">{project.stats.vendido}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-10">
                        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentSold}%` }}
                                transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full relative shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                            >
                                <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-[45deg] animate-pulse" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href={`/projects/${project.id}`} className="flex-[4]">
                            <Button className="w-full bg-white text-slate-950 hover:bg-cyan-400 transition-colors font-bold rounded-2xl py-6 text-base group/btn">
                                <Map className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform" />
                                PLANO INTERACTIVO
                            </Button>
                        </Link>
                        <Link href={`/admin/projects/${project.id}`} className="flex-1">
                            <Button variant="outline" className="w-full h-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
                                <Settings className="w-5 h-5 text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
    )
}

