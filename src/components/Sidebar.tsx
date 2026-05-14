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
        <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-64 glass-strong rounded-3xl z-50 flex-col shadow-2xl shadow-cyan-900/10">
            {/* Logo */}
            <div className="p-8">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                            Sistema<br />
                            <span className="text-cyan-400 font-black">Comercial</span>
                        </h1>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                isActive 
                                    ? "bg-cyan-500/10 text-cyan-400" 
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3 z-10">
                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-300")} />
                                <span className={cn("text-sm transition-all", isActive ? "font-semibold" : "font-medium")}>{item.name}</span>
                            </div>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                />
                            )}
                            
                            <ChevronRight className={cn(
                                "w-4 h-4 transition-all duration-300",
                                isActive ? "text-cyan-400 opacity-100" : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                            )} />
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / User */}
            <div className="p-4 mt-auto">
                <div className="flex flex-col gap-1 p-2 rounded-2xl bg-white/5 border border-white/5">
                    <Link 
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="text-xs font-medium">Configuración</span>
                    </Link>
                    <Link 
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium">Panel Admin</span>
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
