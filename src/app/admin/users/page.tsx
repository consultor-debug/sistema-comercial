'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
    Users as UsersIcon,
    UserPlus,
    Search,
    UserCheck,
    UserX,
    Edit2,
    Loader2,
    ChevronLeft,
    Trash2,
    Building2
} from 'lucide-react'
import { getUsers, toggleUserStatus, deleteUser, getSessionInfo } from './actions'
import { UserModal } from '@/components/admin/UserModal'
import Link from 'next/link'

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    tenantId: string | null;
    assignedTenantIds: string[];
    tenant?: {
        name: string;
        projects: {
            id: string;
            name: string;
        }[];
    } | null;
}

interface SessionInfo {
    role?: string;
    tenantId?: string | null;
    availableTenants: { 
        id: string; 
        name: string;
        projects: { id: string; name: string }[];
    }[];
}

export default function UsersPage() {
    const [users, setUsers] = React.useState<UserData[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [sessionInfo, setSessionInfo] = React.useState<SessionInfo | null>(null)

    const fetchUsers = async () => {
        setIsLoading(true)
        const data = await getUsers()
        setUsers(data)
        setIsLoading(false)
    }

    React.useEffect(() => {
        fetchUsers()
        getSessionInfo().then(setSessionInfo)
    }, [])

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        const result = await toggleUserStatus(userId, currentStatus)
        if (result.success) {
            fetchUsers()
        }
    }

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
            return
        }

        const result = await deleteUser(userId)
        if (result.success) {
            fetchUsers()
        } else {
            alert(result.error || 'Error al eliminar usuario')
        }
    }

    if (isLoading && users.length === 0) {
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
                    <span className="text-sm font-medium">Volver al Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <UsersIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
                            <p className="text-slate-400">Administra los permisos y accesos de tu equipo</p>
                        </div>
                    </div>

                    <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-700/50">
                <CardHeader className="border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre o correo..."
                            className="pl-10 bg-slate-800/50 border-slate-700"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/30">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proyectos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-white">{user.name}</span>
                                                <span className="text-xs text-slate-400">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-500" />
                                                <span className="text-sm text-slate-300">{user.tenant?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {user.tenant?.projects && user.tenant.projects.length > 0 ? (
                                                    user.tenant.projects.slice(0, 2).map((p: { id: string; name: string }) => (
                                                        <Badge key={p.id} variant="neutral" size="sm" className="bg-slate-800 text-[10px] py-0 h-5">
                                                            {p.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">Sin proyectos</span>
                                                )}
                                                {user.tenant?.projects && user.tenant.projects.length > 2 && (
                                                    <Badge variant="neutral" size="sm" className="bg-slate-800 text-[10px] py-0 h-5">
                                                        +{user.tenant.projects.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={user.role === 'ADMIN' ? 'default' : user.role === 'SUPER_ADMIN' ? 'warning' : 'neutral'}
                                                size="sm"
                                            >
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={user.isActive ? 'success' : 'danger'}
                                                size="sm"
                                            >
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                    className={`h-8 w-8 p-0 ${user.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                                                    title={user.isActive ? 'Desactivar' : 'Activar'}
                                                >
                                                    {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <UserModal
                isOpen={isModalOpen}
                user={selectedUser}
                sessionInfo={sessionInfo}
                onClose={() => { setIsModalOpen(false); fetchUsers(); }}
            />
        </div>
    )
}
