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
    Activity,
    FileText,
    Calendar,
    Layers,
    MapPinned,
    DollarSign,
    SlidersHorizontal,
    ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions'
import { ThemeToggle } from '@/components/ThemeToggle'

// ─── Nav items by role ────────────────────────────────────────────────────────

type NavItem = { name: string; href: string; icon: React.ElementType }
type NavGroup = { label: string; items: NavItem[] }

const GROUPS_ASESOR: NavGroup[] = [
    {
        label: 'Comercial',
        items: [
            { name: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
            { name: 'Contratos',   href: '/contratos',   icon: ClipboardList },
            { name: 'Pagos',       href: '/pagos',       icon: DollarSign },
            { name: 'Clientes',    href: '/clientes',    icon: UserCheck },
        ],
    },
    {
        label: 'Proyectos',
        items: [
            { name: 'Proyectos',   href: '/admin/projects', icon: MapIcon },
            { name: 'Plano',       href: '/admin/lots/map', icon: MapPinned },
        ],
    },
]

const GROUPS_ADMIN: NavGroup[] = [
    {
        label: 'Comercial',
        items: [
            { name: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
            { name: 'Contratos',   href: '/contratos',   icon: ClipboardList },
            { name: 'Pagos',       href: '/pagos',       icon: DollarSign },
            { name: 'Clientes',    href: '/clientes',    icon: UserCheck },
            { name: 'Reportes',    href: '/admin/reports', icon: BarChart3 },
        ],
    },
    {
        label: 'Proyectos',
        items: [
            { name: 'Proyectos',   href: '/admin/projects', icon: MapIcon },
            { name: 'Plano',       href: '/admin/lots/map', icon: MapPinned },
            { name: 'Lotes',       href: '/admin/lots',     icon: Database },
        ],
    },
    {
        label: 'Configuración',
        items: [
            { name: 'Condiciones', href: '/admin/condiciones', icon: SlidersHorizontal },
            { name: 'Usuarios',    href: '/admin/users',       icon: Users },
            { name: 'Auditoría',   href: '/admin/logs',        icon: Activity },
        ],
    },
]

const GROUPS_SUPER_ADMIN: NavGroup[] = [
    {
        label: 'Comercial',
        items: [
            { name: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
            { name: 'Contratos',   href: '/contratos',   icon: ClipboardList },
            { name: 'Pagos',       href: '/pagos',       icon: DollarSign },
            { name: 'Clientes',    href: '/clientes',    icon: UserCheck },
            { name: 'Reportes',    href: '/admin/reports', icon: BarChart3 },
        ],
    },
    {
        label: 'Proyectos',
        items: [
            { name: 'Proyectos',   href: '/admin/projects', icon: MapIcon },
            { name: 'Plano',       href: '/admin/lots/map', icon: MapPinned },
            { name: 'Lotes',       href: '/admin/lots',     icon: Database },
        ],
    },
    {
        label: 'Configuración',
        items: [
            { name: 'Condiciones', href: '/admin/condiciones', icon: SlidersHorizontal },
            { name: 'Usuarios',    href: '/admin/users',       icon: Users },
            { name: 'Negocios',    href: '/admin/tenants',     icon: Building2 },
            { name: 'Auditoría',   href: '/admin/logs',        icon: Activity },
        ],
    },
]

const MOBILE_NAV_ASESOR: NavItem[] = [
    { name: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
    { name: 'Contratos',  href: '/dashboard/contratos', icon: FileText },
    { name: 'Plano',      href: '/admin/lots/map',      icon: MapPinned },
    { name: 'Clientes',   href: '/dashboard/clientes',  icon: UserCheck },
]

const MOBILE_NAV_ADMIN: NavItem[] = [
    { name: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
    { name: 'Contratos',  href: '/dashboard/contratos', icon: FileText },
    { name: 'Plano',      href: '/admin/lots/map',      icon: MapPinned },
    { name: 'Usuarios',   href: '/admin/users',         icon: Users },
]

function getNavGroups(role?: string): { groups: NavGroup[]; mobile: NavItem[] } {
    if (role === 'SUPER_ADMIN') return { groups: GROUPS_SUPER_ADMIN, mobile: MOBILE_NAV_ADMIN }
    if (role === 'ADMIN')       return { groups: GROUPS_ADMIN,       mobile: MOBILE_NAV_ADMIN }
    return { groups: GROUPS_ASESOR, mobile: MOBILE_NAV_ASESOR }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const role = (session?.user as any)?.role as string | undefined
    const { groups, mobile: mobileNavItems } = getNavGroups(role)

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
                <nav className="flex-1 px-2 overflow-y-auto space-y-4 pb-2">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
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
                            </div>
                        </div>
                    ))}
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
