'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Loader2, Palette, Settings2 } from 'lucide-react'
import { upsertTenant } from '@/app/admin/tenants/actions'

interface TenantModalProps {
    isOpen: boolean
    onClose: () => void
    tenant: {
        id: string
        name: string
        slug: string
        logoUrl?: string | null
        primaryColor?: string | null
        maxCuotas?: number | null
        interestRate?: number | null
        minInicial?: number | null
    } | null
}

export function TenantModal({ isOpen, onClose, tenant }: TenantModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState({
        name: '',
        slug: '',
        logoUrl: '',
        primaryColor: '#3B82F6',
        maxCuotas: 18,
        interestRate: 12,
        minInicial: 3500,
    })

    React.useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
                slug: tenant.slug || '',
                logoUrl: tenant.logoUrl || '',
                primaryColor: tenant.primaryColor || '#3B82F6',
                maxCuotas: tenant.maxCuotas ?? 18,
                interestRate: tenant.interestRate ?? 12,
                minInicial: tenant.minInicial ?? 3500,
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                logoUrl: '',
                primaryColor: '#3B82F6',
                maxCuotas: 18,
                interestRate: 12,
                minInicial: 3500,
            })
        }
        setError(null)
    }, [tenant, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const result = await upsertTenant({
            ...formData,
            id: tenant?.id
        })

        setIsLoading(false)
        if (result.success) {
            onClose()
        } else {
            setError(result.error || 'Ocurrió un error inesperado')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (parseFloat(value) || 0) : value
        }))

        // Auto-generate slug from name if creating new
        if (name === 'name' && !tenant) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
            }))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{tenant ? 'Editar Negocio' : 'Nuevo Negocio'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">

                        {/* ── Identidad ── */}
                        <div className="space-y-1 pb-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Palette className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Identidad</span>
                            </div>

                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nombre del Negocio</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Inmobiliaria Norte"
                                        required
                                        className="bg-slate-800 border-slate-700"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="slug">Slug (URL)</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder="ej-inmobiliaria-norte"
                                        required
                                        className="bg-slate-800 border-slate-700"
                                    />
                                    <p className="text-[10px] text-slate-500">
                                        Identificador único en el sistema.
                                    </p>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="logoUrl">URL Logo (opcional)</Label>
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        value={formData.logoUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="bg-slate-800 border-slate-700"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="primaryColor">Color Principal</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="primaryColor"
                                            name="primaryColor"
                                            type="color"
                                            value={formData.primaryColor}
                                            onChange={handleChange}
                                            className="w-12 h-10 p-1 bg-slate-800 border-slate-700 cursor-pointer"
                                        />
                                        <Input
                                            value={formData.primaryColor}
                                            onChange={handleChange}
                                            name="primaryColor"
                                            className="flex-1 bg-slate-800 border-slate-700 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Configuración Comercial ── */}
                        <div className="border-t border-white/5 pt-4 space-y-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Configuración Comercial</span>
                            </div>
                            <p className="text-[10px] text-slate-600 mb-3">
                                Parámetros por defecto que se aplican a los proyectos de este negocio.
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="maxCuotas" className="text-xs">Máx. Cuotas</Label>
                                    <div className="relative">
                                        <Input
                                            id="maxCuotas"
                                            name="maxCuotas"
                                            type="number"
                                            min={1}
                                            max={120}
                                            value={formData.maxCuotas}
                                            onChange={handleChange}
                                            className="bg-slate-800 border-slate-700 pr-10 text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                                            meses
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-600">Plazo máximo</p>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="interestRate" className="text-xs">Tasa Anual</Label>
                                    <div className="relative">
                                        <Input
                                            id="interestRate"
                                            name="interestRate"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.5}
                                            value={formData.interestRate}
                                            onChange={handleChange}
                                            className="bg-slate-800 border-slate-700 pr-6 text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                                            %
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-600">Interés anual</p>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="minInicial" className="text-xs">Inicial Mín.</Label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                                            S/
                                        </span>
                                        <Input
                                            id="minInicial"
                                            name="minInicial"
                                            type="number"
                                            min={0}
                                            step={100}
                                            value={formData.minInicial}
                                            onChange={handleChange}
                                            className="bg-slate-800 border-slate-700 pl-7 text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-600">Monto mínimo</p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {tenant ? 'Guardar Cambios' : 'Crear Negocio'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
