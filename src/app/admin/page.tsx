'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
    Database, Map, Users, Settings,
    BarChart3, Shield, ArrowRight, Building2, Globe, Activity, Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/Sidebar'

type CardColor = 'emerald' | 'purple' | 'blue' | 'amber' | 'slate' | 'pink' | 'rose'

interface AdminCardDef {
    title: string
    description: string
    icon: React.ElementType
    href: string
    color: CardColor
    badge: string
    roles: ('ADMIN' | 'SUPER_ADMIN')[]
}

const CARDS: AdminCardDef[] = [
    {
        title: 'Proyectos',
        description: 'Gestionar proyectos, subir planos, avance de obra y documentos',
        icon: Building2,
        href: '/admin/projects',
        color: 'blue',
        badge: 'Proyectos',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Lotes',
        description: 'Importar, editar precios y gestionar el inventario de lotes',
        icon: Database,
        href: '/admin/lots',
        color: 'emerald',
        badge: 'Inventario',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Editor de Mapa',
        description: 'Posicionar lotes visualmente sobre el plano del proyecto',
        icon: Pencil,
        href: '/admin/lots/map/editor',
        color: 'pink',
        badge: 'Coordenadas',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Usuarios',
        description: 'Gestionar asesores, permisos y accesos al sistema',
        icon: Users,
        href: '/admin/users',
        color: 'blue',
        badge: 'Equipo',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Reportes',
        description: 'Estadísticas de ventas, cotizaciones y conversión',
        icon: BarChart3,
        href: '/admin/reports',
        color: 'amber',
        badge: 'Ventas',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Auditoría',
        description: 'Historial de cambios de estado, precios y acciones',
        icon: Activity,
        href: '/admin/logs',
        color: 'slate',
        badge: 'Seguridad',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
        title: 'Configuración',
        description: 'SMTP, RENIEC, integración n8n, webhooks y ajustes globales',
        icon: Settings,
        href: '/admin/settings',
        color: 'slate',
        badge: 'Sistema',
        roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    // SUPER_ADMIN only
    {
        title: 'Negocios',
        description: 'Administrar empresas e inquilinos del sistema',
        icon: Globe,
        href: '/admin/tenants',
        color: 'rose',
        badge: 'Multi-tenant',
        roles: ['SUPER_ADMIN'],
    },
]

const COLOR: Record<CardColor, { icon: string; border: string; bg: string }> = {
    emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/8' },
    purple:  { icon: 'text-purple-400',  border: 'border-purple-500/25',  bg: 'bg-purple-500/8'  },
    blue:    { icon: 'text-blue-400',    border: 'border-blue-500/25',    bg: 'bg-blue-500/8'    },
    amber:   { icon: 'text-amber-400',   border: 'border-amber-500/25',   bg: 'bg-amber-500/8'   },
    slate:   { icon: 'text-slate-400',   border: 'border-slate-500/25',   bg: 'bg-slate-500/8'   },
    pink:    { icon: 'text-pink-400',    border: 'border-pink-500/25',    bg: 'bg-pink-500/8'    },
    rose:    { icon: 'text-rose-400',    border: 'border-rose-500/25',    bg: 'bg-rose-500/8'    },
}

export default function AdminPage() {
    const { data: session } = useSession()
    const role = (session?.user as any)?.role as 'ADMIN' | 'SUPER_ADMIN' | undefined
    const name = session?.user?.name?.split(' ')[0] ?? 'Admin'

    const visibleCards = CARDS.filter(c => role && c.roles.includes(role))

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            <div className="flex-1 md:pl-52 flex flex-col min-h-screen">
                <header className="shrink-0 border-b border-white/5 bg-slate-950 z-40">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
                                <Shield className="w-4 h-4 text-rose-400" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-white">Panel de Administración</h1>
                                <p className="text-[11px] text-slate-500">
                                    {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            Ir al Dashboard
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </header>

                <main className="flex-1 px-4 md:px-6 py-6 max-w-4xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white mb-1">Bienvenido, {name}</h2>
                        <p className="text-sm text-slate-500">
                            Gestiona el sistema desde aquí. Solo ves lo que corresponde a tu rol.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visibleCards.map(card => {
                            const c = COLOR[card.color]
                            return (
                                <Link key={card.href} href={card.href}
                                    className="group relative bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-xl p-5 transition-all duration-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
                                            <card.icon className={cn('w-5 h-5', c.icon)} />
                                        </div>
                                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full font-medium">
                                            {card.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">{card.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                                </Link>
                            )
                        })}
                    </div>

                    {role === 'SUPER_ADMIN' && (
                        <div className="mt-8 bg-white/3 border border-white/8 rounded-xl p-5">
                            <h3 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">🚀 Primeros pasos</h3>
                            <ol className="space-y-2 text-xs text-slate-400">
                                <li>1. Crea un <strong className="text-white">Negocio</strong> en Negocios y asígnale su slug único</li>
                                <li>2. Crea un <strong className="text-white">Proyecto</strong> → sube el plano desde su página de detalle</li>
                                <li>3. <strong className="text-white">Importa tus lotes</strong> con el CSV desde el Administrador de Lotes</li>
                                <li>4. Configura las <strong className="text-white">coordenadas del mapa</strong> en el Editor de Mapa</li>
                                <li>5. Crea <strong className="text-white">usuarios asesores</strong> y asígnalos al proyecto</li>
                            </ol>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
