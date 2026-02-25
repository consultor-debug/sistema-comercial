'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Database, Map, Users, Settings,
    BarChart3, Shield, ArrowRight, Building2, Globe, Activity
} from 'lucide-react'

const ADMIN_SECTIONS: {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: 'emerald' | 'purple' | 'blue' | 'amber' | 'slate' | 'pink';
    badge: string;
}[] = [
        {
            title: 'Importar Lotes',
            description: 'Cargar inventario desde CSV o Google Sheets',
            icon: <Database className="w-6 h-6" />,
            href: '/admin/lots',
            color: 'emerald',
            badge: 'Datos'
        },
        {
            title: 'Subir Imagen',
            description: 'Subir archivo SVG o PNG del plano',
            icon: <Map className="w-6 h-6" />,
            href: '/admin/lots/map',
            color: 'purple',
            badge: 'Mapa'
        },
        {
            title: 'Editor de Mapa',
            description: 'Posicionar lotes visualmente sobre el plano',
            icon: <Shield className="w-6 h-6 shadow-lg shadow-pink-500/20" />,
            href: '/admin/lots/map/editor',
            color: 'pink',
            badge: 'Interactivo'
        },
        {
            title: 'Usuarios',
            description: 'Gestionar asesores y permisos',
            icon: <Users className="w-6 h-6" />,
            href: '/admin/users',
            color: 'blue',
            badge: 'Equipo'
        },
        {
            title: 'Reportes',
            description: 'Ver estadísticas y cotizaciones',
            icon: <BarChart3 className="w-6 h-6" />,
            href: '/admin/reports',
            color: 'amber',
            badge: 'Ventas'
        },
        {
            title: 'Configuración',
            description: 'SMTP, RENIEC, PayPal y más',
            icon: <Settings className="w-6 h-6" />,
            href: '/admin/settings',
            color: 'slate',
            badge: 'Sistema'
        },
        {
            title: 'Proyectos',
            description: 'Gestionar y eliminar proyectos',
            icon: <Building2 className="w-6 h-6" />,
            href: '/admin/projects',
            color: 'purple',
            badge: 'Gestión'
        },
        {
            title: 'Negocios',
            description: 'Administrar empresas e inquilinos',
            icon: <Globe className="w-6 h-6" />,
            href: '/admin/tenants',
            color: 'blue',
            badge: 'SaaS'
        },
        {
            title: 'Auditoría',
            description: 'Ver historial de cambios del sistema',
            icon: <Activity className="w-6 h-6" />,
            href: '/admin/logs',
            color: 'slate',
            badge: 'Seguridad'
        }
    ]

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-grid">
            {/* Header */}
            <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
                                <p className="text-xs text-slate-400">Super Admin</p>
                            </div>
                        </div>

                        <Link href="/dashboard">
                            <Button variant="outline">
                                Ir al Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-4xl">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Bienvenido, Super Admin 🛡️
                    </h2>
                    <p className="text-slate-400">
                        Desde aquí puedes configurar el sistema, gestionar proyectos, importar lotes y usuarios.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    {ADMIN_SECTIONS.map((section) => (
                        <AdminCard key={section.href} {...section} />
                    ))}
                </div>

                {/* Help */}
                <Card className="mt-8">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-white mb-3">🚀 Primeros pasos</h3>
                        <ol className="space-y-2 text-sm text-slate-400">
                            <li>1. <strong className="text-white">Importa tus lotes</strong> desde Google Sheets o un archivo CSV</li>
                            <li>2. <strong className="text-white">Sube el plano</strong> en formato SVG o PNG de alta calidad</li>
                            <li>3. <strong className="text-white">Configura las coordenadas</strong> de cada lote en el mapa</li>
                            <li>4. <strong className="text-white">Crea usuarios</strong> para tus asesores de ventas</li>
                        </ol>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

function AdminCard({
    title,
    description,
    icon,
    href,
    color,
    badge
}: {
    title: string
    description: string
    icon: React.ReactNode
    href: string
    color: 'emerald' | 'purple' | 'blue' | 'amber' | 'slate' | 'pink'
    badge: string
}) {
    const colorClasses = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
    }

    const isDisabled = badge === 'Próximo'

    const content = (
        <Card className={`card-hover ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
                        {icon}
                    </div>
                    <Badge variant="neutral" size="sm">{badge}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400">{description}</p>
            </CardContent>
        </Card>
    )

    if (isDisabled) {
        return content
    }

    return <Link href={href}>{content}</Link>
}
