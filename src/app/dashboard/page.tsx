import * as React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Building2, Map, FileText, TrendingUp,
    Clock, ArrowRight, Settings, LogOut
} from 'lucide-react'
import { logout } from '@/lib/actions'
import { LotStatus } from '@prisma/client'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const { name, tenantId, role } = session.user

    // Fetch Projects
    // If Super Admin without tenant, maybe show something else or first tenant?
    // For now, let's assume we fetch projects associated with the tenantId.
    const projects = await prisma.project.findMany({
        where: tenantId ? { tenantId } : {},
        include: {
            lots: {
                select: {
                    estado: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    const formattedProjects = projects.map(p => {
        const stats = {
            total: p.lots.length,
            libre: p.lots.filter(l => l.estado === LotStatus.LIBRE).length,
            separado: p.lots.filter(l => l.estado === LotStatus.SEPARADO).length,
            vendido: p.lots.filter(l => l.estado === LotStatus.VENDIDO).length,
        }
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            stats,
            updatedAt: p.updatedAt
        }
    })

    // Fetch Recent Quotations
    const recentQuotations = await prisma.quotation.findMany({
        where: tenantId ? { tenantId } : {},
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            lot: {
                select: { code: true }
            }
        }
    })

    // Global Stats
    const totalLots = formattedProjects.reduce((acc, p) => acc + p.stats.total, 0)
    const totalLibre = formattedProjects.reduce((acc, p) => acc + p.stats.libre, 0)
    const totalSeparado = formattedProjects.reduce((acc, p) => acc + p.stats.separado, 0)
    const totalVendido = formattedProjects.reduce((acc, p) => acc + p.stats.vendido, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const quotationsToday = await prisma.quotation.count({
        where: {
            tenantId: tenantId || undefined,
            createdAt: { gte: today }
        }
    })

    return (
        <div className="min-h-screen bg-grid">
            {/* Header */}
            <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Sistema Comercial</h1>
                                <p className="text-xs text-slate-400">Dashboard</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {role === 'SUPER_ADMIN' && (
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm">
                                        <Settings className="w-4 h-4" />
                                        <span>Admin Panel</span>
                                    </Button>
                                </Link>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                    {name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                </div>
                                <span className="text-sm text-white">{name}</span>
                            </div>
                            <form action={logout}>
                                <Button variant="ghost" size="icon" type="submit">
                                    <LogOut className="w-5 h-5 text-slate-400" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Bienvenido, {name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-slate-400">
                        Aquí tienes un resumen de tus proyectos y actividad reciente.
                    </p>
                </div>

                {/* Projects */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Mis Proyectos</h3>
                        {role !== 'LECTOR' && (
                            <Link href="/admin/projects/new">
                                <Button size="sm" variant="outline">
                                    + Nuevo Proyecto
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {formattedProjects.length > 0 ? (
                            formattedProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        ) : (
                            <Card className="md:col-span-2 py-10 text-center border-dashed border-slate-700">
                                <CardContent>
                                    <p className="text-slate-500">No hay proyectos activos para mostrar.</p>
                                    {role !== 'LECTOR' && (
                                        <Link href="/admin/projects/new" className="mt-4 inline-block">
                                            <Button variant="outline" size="sm">Empezar ahora</Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </section>

                {/* Quick stats and recent activity */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Global stats */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Resumen Global
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StatRow label="Total Lotes" value={totalLots.toString()} />
                            <StatRow label="Disponibles" value={totalLibre.toString()} color="emerald" />
                            <StatRow label="Separados" value={totalSeparado.toString()} color="amber" />
                            <StatRow label="Vendidos" value={totalVendido.toString()} color="rose" />
                            <StatRow label="Cotizaciones Hoy" value={quotationsToday.toString()} color="blue" />
                        </CardContent>
                    </Card>

                    {/* Recent quotations */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" />
                                Cotizaciones Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentQuotations.length > 0 ? (
                                <div className="space-y-3">
                                    {recentQuotations.map(q => (
                                        <div
                                            key={q.id}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge variant="neutral" size="sm">{q.codigo}</Badge>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Lote {q.lot.code}</p>
                                                    <p className="text-xs text-slate-400">{q.clienteNombres} {q.clienteApellidos}</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-emerald-400">
                                                S/ {q.precioFinal.toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                    <Link href="/quotations" className="block w-full mt-4">
                                        <Button variant="ghost" className="w-full">
                                            Ver todas las cotizaciones
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-slate-800/20 rounded-xl">
                                    <p className="text-sm text-slate-500">No hay cotizaciones recientes.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

// Project card component
function ProjectCard({ project }: {
    project: {
        id: string,
        name: string,
        description: string | null,
        stats: { total: number, libre: number, separado: number, vendido: number },
        updatedAt: Date
    }
}) {
    const { stats } = project
    const percentSold = stats.total > 0 ? Math.round((stats.vendido / stats.total) * 100) : 0

    return (
        <Card className="card-hover">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
                        <p className="text-sm text-slate-400 line-clamp-1">{project.description}</p>
                    </div>
                    <Badge variant="success">{percentSold}% vendido</Badge>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    <MiniStat label="Total" value={stats.total} />
                    <MiniStat label="Libre" value={stats.libre} color="emerald" />
                    <MiniStat label="Separado" value={stats.separado} color="amber" />
                    <MiniStat label="Vendido" value={stats.vendido} color="rose" />
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                        style={{ width: `${percentSold}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>Actualizado recientemente</span>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                        <Button size="sm">
                            <Map className="w-4 h-4" />
                            Ver Plano
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

// Mini stat component
function MiniStat({
    label,
    value,
    color
}: {
    label: string
    value: number
    color?: 'emerald' | 'amber' | 'rose' | 'blue'
}) {
    const colorClasses = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400',
        blue: 'text-blue-400'
    }

    return (
        <div className="text-center">
            <p className={`text-lg font-bold ${color ? colorClasses[color] : 'text-white'}`}>
                {value}
            </p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    )
}

// Stat row component
function StatRow({
    label,
    value,
    color
}: {
    label: string
    value: string
    color?: 'emerald' | 'amber' | 'rose' | 'blue'
}) {
    const colorClasses = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400',
        blue: 'text-blue-400'
    }

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{label}</span>
            <span className={`font-semibold ${color ? colorClasses[color] : 'text-white'}`}>
                {value}
            </span>
        </div>
    )
}
