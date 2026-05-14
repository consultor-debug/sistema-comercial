'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
    LayoutDashboard, 
    Map as MapIcon, 
    BarChart3, 
    Users, 
    Settings, 
    LogOut,
    Building2,
    Database,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proyectos', href: '/admin/projects', icon: MapIcon },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Negocios', href: '/admin/tenants', icon: Building2 },
    { name: 'Clientes', href: '/admin/clients', icon: Users },
    { name: 'Lotes', href: '/admin/lots', icon: Database },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-white/5 z-50 flex-col">
            {/* Logo */}
            <div className="px-6 py-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-slate-950" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-white leading-none">
                            Sistema <span className="text-slate-400">Comercial</span>
                        </h1>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                isActive 
                                    ? "bg-white/5 text-white font-medium" 
                                    : "text-slate-500 hover:text-white hover:bg-white/[0.02]"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-600")} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
                <Link 
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-lg transition-colors text-sm"
                >
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                </Link>
                <Link 
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-lg transition-colors text-sm"
                >
                    <Shield className="w-4 h-4" />
                    <span>Panel Admin</span>
                </Link>
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors w-full text-left text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    )
}
