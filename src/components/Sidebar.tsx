'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
    LayoutDashboard, 
    Map as MapIcon, 
    BarChart3, 
    Users, 
    Settings, 
    LogOut,
    Building2,
    ChevronRight,
    Shield,
    Database
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
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 glass-strong border-r border-slate-700/50 z-50 flex-col">
            {/* Logo */}
            <div className="p-6 mb-4">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-tighter uppercase leading-none">
                            Sistema<br />
                            <span className="text-blue-400">Comercial</span>
                        </h1>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive 
                                    ? "bg-blue-500/10 text-blue-400" 
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <div className="flex items-center gap-3 z-10">
                                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300")} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </div>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                />
                            )}
                            
                            <ChevronRight className={cn(
                                "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                isActive ? "text-blue-400" : "text-slate-600"
                            )} />
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-slate-700/50">
                <div className="flex flex-col gap-2">
                    <Link 
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-medium">Configuración</span>
                    </Link>
                    <Link 
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
                    >
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">Panel Admin</span>
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors w-full text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
