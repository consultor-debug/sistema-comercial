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

const mobileNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proyectos', href: '/admin/projects', icon: MapIcon },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
    { name: 'Config.', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-52 bg-slate-950 border-r border-white/5 z-50 flex-col">
                {/* Logo */}
                <div className="px-4 py-5">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 text-slate-950" />
                        </div>
                        <h1 className="text-xs font-semibold text-white leading-none">
                            Sistema <span className="text-slate-400">Comercial</span>
                        </h1>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors",
                                    isActive
                                        ? "bg-white/5 text-white font-medium"
                                        : "text-slate-500 hover:text-white hover:bg-white/[0.02]"
                                )}
                            >
                                <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-600")} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-white/5">
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-md transition-colors text-xs"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Configuración</span>
                    </Link>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-md transition-colors text-xs"
                    >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Panel Admin</span>
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-rose-400 rounded-md transition-colors w-full text-left text-xs"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-white/8">
                <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]"
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-white" : "text-slate-600"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-white" : "text-slate-600"
                                )}>
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                    <button
                        onClick={() => logout()}
                        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[60px]"
                    >
                        <LogOut className="w-5 h-5 text-slate-600" />
                        <span className="text-[10px] font-medium text-slate-600">Salir</span>
                    </button>
                </div>
            </nav>
        </>
    )
}
