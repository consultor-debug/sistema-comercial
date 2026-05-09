'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Building2, Map, FileText, TrendingUp, 
    Clock, ArrowRight, Settings, Plus,
    Calendar, Users, DollarSign, ExternalLink
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

// Types for the dashboard data
interface DashboardData {
    user: {
        name: string
        role: string
    }
    projects: any[]
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

    React.useEffect(() => {
        async function fetchDashboardData() {
            try {
                const response = await fetch('/api/dashboard')
                const result = await response.json()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

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

            <main className="pl-64 min-h-screen bg-grid">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-700/50 glass-strong sticky top-0 z-30 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Sistema Online</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-blue-500/20 border border-white/10">
                            {data.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Welcome Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end justify-between"
                    >
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                                Hola, <span className="gradient-text">{data.user.name.split(' ')[0]}</span> 👋
                            </h2>
                            <p className="text-slate-400 font-medium">
                                Bienvenido de nuevo. Aquí tienes el resumen comercial de hoy.
                            </p>
                        </div>
                        <Link href="/admin/projects/new">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-6">
                                <Plus className="w-4 h-4 mr-2" />
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
                            color="blue"
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Visual Inventory */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="lg:col-span-1"
                        >
                            <Card className="h-full border-slate-700/50 bg-slate-800/40 glass">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                        Estado de Inventario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <StatsChart data={chartData} />
                                    <div className="space-y-3 mt-4">
                                        {chartData.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-sm text-slate-300 font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-white">{item.value}</span>
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
                            className="lg:col-span-2"
                        >
                            <Card className="h-full border-slate-700/50 bg-slate-800/40 glass overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50 pb-4">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                        Cotizaciones Recientes
                                    </CardTitle>
                                    <Link href="/quotations">
                                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                            Ver Todas <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-700/50">
                                        {data.recentQuotations.map((q, i) => (
                                            <motion.div 
                                                key={q.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + i * 0.1 }}
                                                className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors">
                                                        {q.lot.code}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight">
                                                            {q.clienteNombres} {q.clienteApellidos}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                                            {new Date(q.createdAt).toLocaleDateString()} • {q.codigo}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-emerald-400">
                                                        {formatCurrency(q.precioFinal)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-bold">
                                                        {q.cuotas} CUOTAS
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {data.recentQuotations.length === 0 && (
                                        <div className="p-20 text-center">
                                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No hay actividad reciente.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Active Projects */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Proyectos Activos
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20 text-blue-400',
        rose: 'from-rose-500 to-red-600 shadow-rose-500/20 text-rose-400',
        emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20 text-emerald-400',
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/20 text-amber-400'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 glass-strong relative overflow-hidden group"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} opacity-5 group-hover:opacity-10 transition-opacity rounded-full`} />
            
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-slate-900 border border-slate-700 ${colorMap[color as keyof typeof colorMap].split(' ')[3]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <Badge variant="neutral" className="bg-slate-900/50 text-slate-400 border-slate-700/50">Hoy</Badge>
            </div>
            
            <h4 className="text-2xl font-black text-white mb-1">{value}</h4>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        </motion.div>
    )
}

function ProjectCard({ project, delay }: any) {
    const percentSold = project.stats.total > 0 ? Math.round((project.stats.vendido / project.stats.total) * 100) : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5 }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <Card className="relative border-slate-700/50 bg-slate-800/40 glass-strong rounded-[2rem] overflow-hidden overflow-visible border hover:border-blue-500/50 transition-all">
                <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <Building2 className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight">{project.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activo • {project.stats.total} LOTES</p>
                                </div>
                            </div>
                        </div>
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-black py-1 px-3">
                            {percentSold}% VENDIDO
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-700/30 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">LIBRE</p>
                            <p className="text-lg font-black text-emerald-400">{project.stats.libre}</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-700/30 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">SEP</p>
                            <p className="text-lg font-black text-amber-400">{project.stats.separado}</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-700/30 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">VEN</p>
                            <p className="text-lg font-black text-rose-400">{project.stats.vendido}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            <span>Progreso de Ventas</span>
                            <span className="text-blue-400">{percentSold}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 p-[2px]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentSold}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full relative"
                            >
                                <div className="absolute top-0 right-0 w-4 h-full bg-white/20 blur-[2px]" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/projects/${project.id}`} className="flex-1">
                            <Button className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black rounded-xl">
                                <Map className="w-4 h-4 mr-2" />
                                PLANO INTERACTIVO
                            </Button>
                        </Link>
                        <Button variant="outline" size="icon" className="rounded-xl border-slate-700 hover:bg-slate-800">
                            <Settings className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

