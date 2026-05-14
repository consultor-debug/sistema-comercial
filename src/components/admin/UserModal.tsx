'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { upsertUser } from '@/app/admin/users/actions'
import { UserRole } from '@prisma/client'
import {
    User as UserIcon,
    Mail,
    Lock,
    ShieldCheck,
    Building2,
    XCircle,
    Map as MapIcon
} from 'lucide-react'

interface UserModalProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        tenantId?: string | null;
        assignedTenantIds?: string[];
        assignedProjectIds?: string[];
    } | null
    isOpen: boolean
    sessionInfo?: {
        role?: string;
        tenantId?: string | null;
        availableTenants: Array<{ 
            id: string; 
            name: string;
            projects: Array<{ id: string; name: string }>;
        }>;
    } | null
    onClose: () => void
}

export function UserModal({ user, isOpen, sessionInfo, onClose }: UserModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        role: 'ASESOR',
        tenantIds: [] as string[],
        projectIds: [] as string[]
    })

    const isSuperAdmin = sessionInfo?.role === 'SUPER_ADMIN'

    React.useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Don't show password
                role: user.role,
                tenantIds: user.assignedTenantIds && user.assignedTenantIds.length > 0 
                    ? user.assignedTenantIds 
                    : user.tenantId ? [user.tenantId] : [],
                projectIds: user.assignedProjectIds || []
            })
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'ASESOR',
                tenantIds: sessionInfo?.tenantId ? [sessionInfo.tenantId] : [],
                projectIds: []
            })
        }
        setError(null)
    }, [user, isOpen, sessionInfo])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const data = { ...formData, id: user?.id, role: formData.role as UserRole }
            const result = await upsertUser(data)

            if (result.success) {
                onClose()
            } else {
                setError(result.error || 'Ocurrió un error')
            }
        } catch {
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="relative p-6 pt-10 bg-slate-900">
                        {/* Decorative background blur */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-white">
                                        {user ? 'Actualizar Perfil' : 'Registro de Usuario'}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 text-sm mt-0.5">
                                        {user ? 'Modifica los permisos y datos básicos del usuario.' : 'Crea un nuevo acceso seguro para un colaborador.'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5">
                            {error && (
                                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-in fade-in slide-in-from-top-2">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid gap-5">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <UserIcon className="w-3 h-3 text-blue-500" /> Correo o Nombre
                                    </label>
                                    <div className="group relative">
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ej. Juan Pérez"
                                            className="bg-slate-800/40 border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="w-3 h-3 text-blue-500" /> Email Institucional
                                    </label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="juan@empresa.com"
                                        className="bg-slate-800/40 border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11"
                                        required
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lock className="w-3 h-3 text-blue-500" /> {user ? 'Actualizar Contraseña' : 'Clave de Acceso'}
                                    </label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={user ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"}
                                        className="bg-slate-800/40 border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-blue-400 placeholder:text-slate-600"
                                        required={!user}
                                    />
                                </div>

                                <div className="space-y-4">
                                    {/* Role Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3 h-3 text-blue-500" /> Nivel de Acceso
                                        </label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                        >
                                            <SelectTrigger className="h-11 bg-slate-800/40 border-slate-700/50 rounded-xl text-slate-200">
                                                <SelectValue>
                                                    {formData.role === 'ASESOR' && '📝 Asesor Comercial'}
                                                    {formData.role === 'ADMIN' && '🛡️ Administrador'}
                                                    {formData.role === 'LECTOR' && '👁️ Solo Lectura'}
                                                    {formData.role === 'SUPER_ADMIN' && '👑 Súper Admin'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
                                                <SelectItem value="ASESOR">📝 Asesor Comercial</SelectItem>
                                                <SelectItem value="ADMIN">🛡️ Administrador</SelectItem>
                                                <SelectItem value="LECTOR">👁️ Solo Lectura</SelectItem>
                                                {isSuperAdmin && <SelectItem value="SUPER_ADMIN">👑 Súper Admin</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Tenant Selection (SuperAdmin only) - MULTI SELECT */}
                                    {isSuperAdmin && (
                                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 bg-slate-800/20 p-4 rounded-2xl border border-slate-800/50">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Building2 className="w-3 h-3 text-emerald-500" /> Empresas Asignadas
                                            </label>
                                            
                                            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                {sessionInfo?.availableTenants.map(t => (
                                                    <div 
                                                        key={t.id}
                                                        onClick={() => {
                                                            const current = formData.tenantIds || []
                                                            const next = current.includes(t.id)
                                                                ? current.filter(id => id !== t.id)
                                                                : [...current, t.id]
                                                            setFormData({ ...formData, tenantIds: next })
                                                        }}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                                                            (formData.tenantIds || []).includes(t.id)
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                            (formData.tenantIds || []).includes(t.id)
                                                                ? 'bg-emerald-500 border-emerald-500'
                                                                : 'border-slate-600 group-hover:border-slate-500'
                                                        }`}>
                                                            {(formData.tenantIds || []).includes(t.id) && (
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                    <path d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium">{t.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {(formData.tenantIds || []).length === 0 && (
                                                <p className="text-[10px] text-rose-400 font-medium">Debes seleccionar al menos una empresa.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Project Selection */}
                                    {formData.tenantIds.length > 0 && (
                                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 bg-slate-800/20 p-4 rounded-2xl border border-slate-800/50">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <MapIcon className="w-3 h-3 text-blue-500" /> Proyectos Específicos
                                            </label>
                                            
                                            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                {sessionInfo?.availableTenants
                                                    .filter(t => formData.tenantIds.includes(t.id))
                                                    .flatMap(t => t.projects.map(p => ({ ...p, tenantName: t.name })))
                                                    .map(p => (
                                                        <div 
                                                            key={p.id}
                                                            onClick={() => {
                                                                const current = formData.projectIds || []
                                                                const next = current.includes(p.id)
                                                                    ? current.filter(id => id !== p.id)
                                                                    : [...current, p.id]
                                                                setFormData({ ...formData, projectIds: next })
                                                            }}
                                                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                                                                (formData.projectIds || []).includes(p.id)
                                                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                                            }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                                (formData.projectIds || []).includes(p.id)
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'border-slate-600 group-hover:border-slate-500'
                                                            }`}>
                                                                {(formData.projectIds || []).includes(p.id) && (
                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                        <path d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{p.name}</span>
                                                                <span className="text-[10px] text-slate-500">{p.tenantName}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                            
                                            {formData.projectIds.length === 0 && (
                                                <p className="text-[10px] text-slate-500 font-medium italic">Si no seleccionas proyectos, tendrá acceso a todos los de las empresas elegidas.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-10 flex sm:justify-end gap-3 pt-6 border-t border-slate-800/50">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl px-6 h-11"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 h-11 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {user ? 'Guardar Cambios' : 'Confirmar Registro'}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
