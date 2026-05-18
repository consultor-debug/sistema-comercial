'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    LayoutDashboard,
    Map as MapIcon,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Building2,
    Database,
    Shield,
    UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions'
import { ThemeToggle } from '@/components/ThemeToggle'

// ─── Nav items by role ────────────────────────────────────────────────────────

type NavItem = { name: string; href: string; icon: React.ElementType }

const NAV_ASESOR: NavItem[] = [
    { name: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
    { name: 'Proyectos',   href: '/admin/projects',   icon: MapIcon },
    { name: 'Clientes',    href: '/admin/clients',    icon: UserCheck },
]

const NAV_ADMIN: NavItem[] = [
    { name: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
    { name: 'Proyectos',   href: '/admin/projects',   icon: MapIcon },
    { name: 'Reportes',    href: '/admin/reports',    icon: BarChart3 },
    { name: 'Usuarios',    href: '/admin/users',      icon: Users },
    { name: 'Clientes',    href: '/admin/clients',    icon: UserCheck },
    { name: 'Lotes',       href: '/admin/lots',       icon: Database },
]

const NAV_SUPER_ADMIN: NavItem[] = [
    { name: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
    { name: 'Proyectos',   href: '/admin/projects',   icon: MapIcon },
    { name: 'Reportes',    href: '/admin/reports',    icon: BarChart3 },
    { name: 'Usuarios',    href: '/admin/users',      icon: Users },
    { name: 'Negocios',    href: '/admin/tenants',    icon: Building2 },
    { name: 'Clientes',    href: '/admin/clients',    icon: UserCheck },
    { name: 'Lotes',       href: '/admin/lots',       icon: Database },
]

const MOBILE_NAV_ASESOR: NavItem[] = [
    { name: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { name: 'Proyectos',  href: '/admin/projects',   icon: MapIcon },
    { name: 'Clientes',   href: '/admin/clients',    icon: UserCheck },
]

const MOBILE_NAV_ADMIN: NavItem[] = [
    { name: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { name: 'Proyectos',  href: '/admin/projects',   icon: MapIcon },
    { name: 'Reportes',   href: '/admin/reports',    icon: BarChart3 },
    { name: 'Lotes',      href: '/admin/lots',       icon: Database },
]

function getNavItems(role?: string): { main: NavItem[]; mobile: NavItem[] } {
    if (role === 'SUPER_ADMIN') return { main: NAV_SUPER_ADMIN, mobile: MOBILE_NAV_ADMIN }
    if (role === 'ADMIN')       return { main: NAV_ADMIN,       mobile: MOBILE_NAV_ADMIN }
    return { main: NAV_ASESOR, mobile: MOBILE_NAV_ASESOR }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const role = (session?.user as any)?.role as string | undefined
    const { main: navItems, mobile: mobileNavItems } = getNavItems(role)

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-52 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 z-50 flex-col">
                {/* Logo */}
                <div className="px-4 py-5">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 text-white dark:text-slate-950" />
                        </div>
                        <h1 className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                            Sistema <span className="text-slate-400">Comercial</span>
                        </h1>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors",
                                    isActive
                                        ? "bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-medium"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-3.5 h-3.5 shrink-0",
                                    isActive ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-600"
                                )} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-slate-200 dark:border-white/5 space-y-0.5">
                    {isAdmin && (
                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-md transition-colors text-xs"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configuración</span>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs",
                                pathname === '/admin'
                                    ? "bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-medium"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                            )}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Panel Admin</span>
                        </Link>
                    )}

                    {/* Theme toggle */}
                    <ThemeToggle />

                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors w-full text-left text-xs"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* ── Mobile bottom nav ── */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-white/8">
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
                                    isActive ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
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
                        <LogOut className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600">Salir</span>
                    </button>
                </div>
            </nav>
        </>
    )
}
