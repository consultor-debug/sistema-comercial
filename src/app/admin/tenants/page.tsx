'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Loader2,
    ChevronLeft,
    Power,
    Globe,
    Users,
    Layout,
    Trash2
} from 'lucide-react'
import { getTenants, toggleTenantStatus, deleteTenant } from './actions'
import { TenantModal } from '@/components/admin/TenantModal'
import Link from 'next/link'

export default function TenantsPage() {
    const [tenants, setTenants] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedTenant, setSelectedTenant] = React.useState<any | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    const fetchTenants = async () => {
        setIsLoading(true)
        try {
            const data = await getTenants()
            setTenants(data)
        } catch (error) {
            console.error('Error fetching tenants:', error)
        }
        setIsLoading(false)
    }

    React.useEffect(() => {
        fetchTenants()
    }, [])

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
        const result = await toggleTenantStatus(tenantId, currentStatus)
        if (result.success) {
            fetchTenants()
        }
    }

    const handleDelete = async (tenantId: string, name: string) => {
        if (window.confirm(`¿Estás seguro de eliminar el negocio "${name}"? Esta acción no se puede deshacer y eliminará todos los proyectos y usuarios asociados.`)) {
            const result = await deleteTenant(tenantId)
            if (result.success) {
                fetchTenants()
            } else {
                alert(result.error)
            }
        }
    }

    if (isLoading && tenants.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-5xl">
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Volver al Panel</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30">
                            <Building2 className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Gestión de Negocios</h1>
                            <p className="text-slate-400">Control centralizado de empresas en el sistema</p>
                        </div>
                    </div>

                    <Button onClick={() => { setSelectedTenant(null); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Negocio
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-700/50">
                <CardHeader className="border-b border-slate-800 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre o slug..."
                            className="pl-10 bg-slate-800/50 border-slate-700"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/30">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Negocio</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estadísticas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {tenant.logoUrl ? (
                                                    <img src={tenant.logoUrl} alt="" className="w-8 h-8 rounded bg-white p-0.5 object-contain" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                                                        {tenant.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white">{tenant.name}</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: tenant.primaryColor }}
                                                        />
                                                        <span className="text-[10px] text-slate-500 font-mono">{tenant.primaryColor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Globe className="w-3.5 h-3.5" />
                                                <span className="text-sm">{tenant.slug}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Layout className="w-3 h-3" />
                                                    <span>{tenant._count.projects} Proyectos</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Users className="w-3 h-3" />
                                                    <span>{tenant._count.users} Usuarios</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={tenant.isActive ? 'success' : 'neutral'}
                                                size="sm"
                                            >
                                                {tenant.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedTenant(tenant); setIsModalOpen(true); }}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                                                    className={`h-8 w-8 p-0 ${tenant.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                                                >
                                                    <Power className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Eliminar Negocio"
                                                    onClick={() => handleDelete(tenant.id, tenant.name)}
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-500"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTenants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron negocios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <TenantModal
                isOpen={isModalOpen}
                tenant={selectedTenant}
                onClose={() => { setIsModalOpen(false); fetchTenants(); }}
            />
        </div>
    )
}
