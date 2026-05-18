'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
    Activity,
    Loader2,
    ChevronLeft,
    Clock,
    User as UserIcon,
    Box,
    Trophy,
    FileText,
    Wifi,
    WifiOff
} from 'lucide-react'
import { getAuditLogs, getAdvisorRanking } from './actions'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface AuditLogEntry {
    id: string
    campo: string
    valorAnterior: string | null
    valorNuevo: string | null
    createdAt: Date
    user: { name: string }
    lot: { code: string }
}

interface AdvisorRankEntry {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    lastActiveAt: Date | string | null
    quotationCount: number
}

function formatRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return 'Nunca'
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 2) return 'Ahora mismo'
    if (mins < 60) return `hace ${mins}m`
    if (hours < 24) return `hace ${hours}h`
    if (days === 1) return 'ayer'
    if (days < 7) return `hace ${days}d`
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getOnlineStatus(lastActiveAt: Date | string | null | undefined): 'online' | 'recent' | 'away' | 'offline' | 'never' {
    if (!lastActiveAt) return 'never'
    const diff = Date.now() - new Date(lastActiveAt).getTime()
    if (diff < 5 * 60_000) return 'online'
    if (diff < 30 * 60_000) return 'recent'
    if (diff < 24 * 3_600_000) return 'away'
    return 'offline'
}

export default function LogsPage() {
    const [logs, setLogs] = React.useState<AuditLogEntry[]>([])
    const [ranking, setRanking] = React.useState<AdvisorRankEntry[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsData, rankingData] = await Promise.all([
                    getAuditLogs(),
                    getAdvisorRanking()
                ])
                setLogs(logsData)
                setRanking(rankingData)
            } catch (error) {
                console.error('Fetch logs error:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

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
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                        <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Historial de Auditoría</h1>
                        <p className="text-slate-400">Seguimiento de cambios y acciones críticas en el sistema</p>
                    </div>
                </div>
            </div>

            {/* Advisor Ranking */}
            <Card className="bg-slate-900 border-slate-700/50 mb-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <CardTitle className="text-lg">Ranking de Asesores</CardTitle>
                    </div>
                    <CardDescription>Actividad y cotizaciones por asesor</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/30">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Asesor</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Última actividad</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cotizaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {ranking.map((advisor, idx) => {
                                    const status = getOnlineStatus(advisor.lastActiveAt)
                                    const maxCount = ranking[0]?.quotationCount || 1
                                    const barWidth = Math.round((advisor.quotationCount / maxCount) * 100)
                                    const statusConfig: Record<string, { dot: string; label: string; text: string }> = {
                                        online: { dot: 'bg-emerald-400 animate-pulse shadow-emerald-400/50 shadow-sm', label: 'En línea', text: 'text-emerald-400' },
                                        recent: { dot: 'bg-emerald-500/70', label: 'Reciente', text: 'text-emerald-500' },
                                        away: { dot: 'bg-amber-400', label: 'Inactivo', text: 'text-amber-400' },
                                        offline: { dot: 'bg-slate-600', label: 'Desconectado', text: 'text-slate-500' },
                                        never: { dot: 'bg-slate-700', label: 'Sin actividad', text: 'text-slate-600' },
                                    }
                                    const sc = statusConfig[status]
                                    const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600']
                                    return (
                                        <tr key={advisor.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-bold ${medalColors[idx] ?? 'text-slate-500'}`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-300">
                                                            {advisor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${sc.dot}`} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-white truncate text-sm">{advisor.name}</span>
                                                        <span className="text-xs text-slate-500 truncate">{advisor.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {(status === 'online' || status === 'recent') ? (
                                                        <Wifi className={`w-3.5 h-3.5 ${sc.text}`} />
                                                    ) : (
                                                        <WifiOff className={`w-3.5 h-3.5 ${sc.text}`} />
                                                    )}
                                                    <span className={`text-xs font-medium ${sc.text}`}>{sc.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                                                    <span className={`text-xs ${status === 'online' ? 'text-emerald-400 font-medium' : status === 'never' ? 'text-slate-600 italic' : 'text-slate-400'}`}>
                                                        {formatRelativeTime(advisor.lastActiveAt)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="hidden sm:flex items-center w-24">
                                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                                            <div
                                                                className="h-1.5 rounded-full bg-blue-500/70"
                                                                style={{ width: `${barWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="text-sm font-bold text-white">{advisor.quotationCount}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {ranking.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic text-sm">
                                            No hay asesores registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-lg">Acciones Recientes</CardTitle>
                    <CardDescription>Registro cronológico de modificaciones</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl border border-slate-800 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                        <Box className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="neutral" className="text-[10px] uppercase">
                                                {log.campo}
                                            </Badge>
                                            <span className="text-sm font-medium text-white">
                                                Lote {log.lot.code}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" />
                                                {log.user.name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800 self-start md:self-center">
                                    <span className="text-xs px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">
                                        {log.valorAnterior}
                                    </span>
                                    <div className="w-4 h-px bg-slate-700 pointer-events-none" />
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                                        {log.valorNuevo}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="py-20 text-center">
                                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 italic">No se han registrado acciones aún.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
