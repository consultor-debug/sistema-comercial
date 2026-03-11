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
import { Loader2 } from 'lucide-react'
import { upsertTenant } from '@/app/admin/tenants/actions'

interface TenantModalProps {
    isOpen: boolean
    onClose: () => void
    tenant: { id: string; name: string; slug: string; logoUrl?: string | null; primaryColor?: string | null } | null
}

export function TenantModal({ isOpen, onClose, tenant }: TenantModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState({
        name: '',
        slug: '',
        logoUrl: '',
        primaryColor: '#3B82F6',
    })

    React.useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
                slug: tenant.slug || '',
                logoUrl: tenant.logoUrl || '',
                primaryColor: tenant.primaryColor || '#3B82F6',
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                logoUrl: '',
                primaryColor: '#3B82F6',
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
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{tenant ? 'Editar Negocio' : 'Nuevo Negocio'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
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

                        <div className="grid gap-2">
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
                                Se usará para identificar al negocio en el sistema.
                            </p>
                        </div>

                        <div className="grid gap-2">
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

                        <div className="grid gap-2">
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
