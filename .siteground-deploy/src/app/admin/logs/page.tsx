'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
    Activity,
    Loader2,
    ChevronLeft,
    Clock,
    User as UserIcon,
    Box
} from 'lucide-react'
import { getAuditLogs } from './actions'
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

export default function LogsPage() {
    const [logs, setLogs] = React.useState<AuditLogEntry[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getAuditLogs()
                setLogs(data)
            } catch (error) {
                console.error('Fetch logs error:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchLogs()
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
