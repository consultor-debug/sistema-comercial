'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
    BarChart3,
    TrendingUp,
    Box,
    FileText,
    Activity,
    Loader2,
    ChevronLeft,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getReportsData } from './actions'
import Link from 'next/link'

export default function ReportsPage() {
    const [data, setData] = React.useState<any>(null) // Keep any for data structure shortcut for now
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getReportsData()
                setData(res)
            } catch (error) {
                console.error('Fetch reports error:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleExportCSV = () => {
        if (!data) return

        const headers = ["Estado", "Cantidad", "Porcentaje (%)"]
        const rows = data.inventory.map((item: any) => [
            item.status,
            item.count,
            ((item.count / totalLots) * 100).toFixed(2)
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    const totalLots = data?.inventory.reduce((acc: number, item: any) => acc + item.count, 0) || 0
    const salesCount = data?.inventory.find((i: any) => i.status === 'VENDIDO')?.count || 0
    const salesPercentage = totalLots > 0 ? ((salesCount / totalLots) * 100).toFixed(1) : 0

    return (
        <div className="container mx-auto px-6 py-8 max-w-6xl">
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Volver al Dashboard</span>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                        <BarChart3 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reportes y Estadísticas</h1>
                        <p className="text-slate-400">Análisis detallado de tu inventario y rendimiento comercial</p>
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-fit">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Inventario (CSV)
                </Button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Lotes"
                    value={totalLots}
                    icon={<Box className="w-5 h-5 text-blue-400" />}
                    description="Inventario total"
                />
                <MetricCard
                    title="Avance de Ventas"
                    value={`${salesPercentage}%`}
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                    description={`${salesCount} lotes vendidos`}
                />
                <MetricCard
                    title="Cotizaciones"
                    value={data?.totalQuotations || 0}
                    icon={<FileText className="w-5 h-5 text-purple-400" />}
                    description="Generadas históricamente"
                />
                <MetricCard
                    title="Proyectos"
                    value={data?.projects.length || 0}
                    icon={<Activity className="w-5 h-5 text-rose-400" />}
                    description="Activos en el sistema"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inventory Breakdown */}
                <Card className="lg:col-span-5 bg-slate-900 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Distribución de Inventario</CardTitle>
                        <CardDescription>Estado actual de todos los lotes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {data?.inventory.map((item: any) => (
                            <div key={item.status} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 capitalize">{item.status.toLowerCase().replace('_', ' ')}</span>
                                    <span className="text-white font-medium">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                                        style={{ width: `${(item.count / totalLots) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-7 bg-slate-900 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                        <CardDescription>Últimas 10 cotizaciones generadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentActivity.map((act: any) => (
                                <div key={act.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                                            {act.lot.manzana}{act.lot.loteNumero}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{act.clienteNombres} {act.clienteApellidos}</p>
                                            <p className="text-xs text-slate-500">Asesor: {act.user.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">S/ {act.precioFinal.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(act.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {data?.recentActivity.length === 0 && (
                                <div className="py-12 text-center text-slate-500 text-sm italic">
                                    Sin actividad reciente.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
    return (
        <Card className="bg-slate-900 border-slate-700/50 card-hover">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        {icon}
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </CardContent>
        </Card>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'LIBRE': return 'bg-emerald-500'
        case 'SEPARADO': return 'bg-amber-500'
        case 'VENDIDO': return 'bg-rose-500'
        case 'NO_DISPONIBLE': return 'bg-slate-500'
        default: return 'bg-blue-500'
    }
}
