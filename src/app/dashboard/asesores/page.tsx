'use client'

import React from 'react'
import { UserCheck } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

interface Asesor {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    lotesAsignados: number
    contratosGenerados: number
    createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
    ASESOR: 'Asesor',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
    LECTOR: 'Lector',
}

export default function AsesoresPage() {
    const [asesores, setAsesores] = React.useState<Asesor[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/admin/users')
            .then(r => r.json())
            .then(d => {
                const users = d.users || d.data || []
                setAsesores(users)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                <header className="h-14 sticky top-0 z-30 flex items-center gap-2 text-sm text-slate-400 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <UserCheck className="w-4 h-4" />
                    <span>Asesores</span>
                </header>

                <div className="max-w-5xl mx-auto py-8 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Asesores</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Usuarios del sistema y sus métricas</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : asesores.length === 0 ? (
                        <div className="text-center py-20">
                            <UserCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay asesores registrados</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {asesores.map(a => (
                                <div key={a.id} className="bg-slate-900 border border-white/8 rounded-2xl p-5 flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                        {a.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                                a.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                                                a.role === 'ADMIN' ? 'bg-sky-500/10 text-sky-400' :
                                                'bg-slate-500/10 text-slate-400'
                                            )}>
                                                {ROLE_LABELS[a.role] || a.role}
                                            </span>
                                            {!a.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Inactivo</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{a.email}</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                                        <div>
                                            <p className="text-[10px] text-slate-500 mb-0.5">Lotes asignados</p>
                                            <p className="text-sm font-semibold text-white">{a.lotesAsignados ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 mb-0.5">Contratos</p>
                                            <p className="text-sm font-semibold text-white">{a.contratosGenerados ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 mb-0.5">Registrado</p>
                                            <p className="text-xs text-slate-400">{fmtDate(a.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
