'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Building2, ArrowLeft, Save, Info, Globe } from 'lucide-react'
import { getSessionInfo } from '../../users/actions'

export default function NewProjectPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        tenantId: '',
        maxCuotas: 60,
        minInicial: 0,
        sheetsId: '',
        n8nWebhookUrl: ''
    })
    const [sessionInfo, setSessionInfo] = React.useState<{ tenantId?: string | null; role?: string; availableTenants?: { id: string; name: string }[] } | null>(null)

    React.useEffect(() => {
        const fetchSession = async () => {
            const info = await getSessionInfo()
            setSessionInfo(info)
            if (info?.tenantId) {
                setFormData((prev) => ({ ...prev, tenantId: info.tenantId || '' }))
            }
        }
        fetchSession()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                router.push('/admin')
            } else {
                alert('Error al crear proyecto')
            }
        } catch {
            alert('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-grid">
            <header className="glass-strong border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                            Admin
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold text-white">Nuevo Proyecto</h1>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-2xl">
                <Card variant="glass">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Detalles del Proyecto</h2>
                                <p className="text-sm text-slate-400">Configura los datos base de tu nuevo desarrollo inmobiliario.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Nombre del Proyecto"
                                placeholder="Ej: Condominio Los Olivos"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Descripción</label>
                                <textarea
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                                    placeholder="Describe brevemente el proyecto..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {sessionInfo?.role === 'SUPER_ADMIN' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-300">Empresa (Tenant)</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <select
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                            value={formData.tenantId}
                                            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccione una empresa</option>
                                            {sessionInfo.availableTenants?.map((t: { id: string; name: string }) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Máximo de Cuotas"
                                    value={formData.maxCuotas}
                                    onChange={(e) => setFormData({ ...formData, maxCuotas: parseInt(e.target.value) || 0 })}
                                    hint="Meses máximos de financiamiento"
                                />
                                <Input
                                    type="number"
                                    label="Inicial Mínima (S/)"
                                    value={formData.minInicial}
                                    onChange={(e) => setFormData({ ...formData, minInicial: parseFloat(e.target.value) || 0 })}
                                    hint="Monto mínimo para separar"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Google Sheet ID</label>
                                <Input
                                    placeholder="1bxtoP3mjCIHJMQa_x5qRD1sTP-0_JDKyftwA3h-WfKM"
                                    value={formData.sheetsId}
                                    onChange={(e) => setFormData({ ...formData, sheetsId: e.target.value })}
                                    hint="El ID de la hoja de cálculo para sincronizar datos"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">n8n Webhook URL</label>
                                <Input
                                    placeholder="https://su-n8n.host/webhook/..."
                                    value={formData.n8nWebhookUrl}
                                    onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                                    hint="URL para notificaciones de cambios de estado"
                                />
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-300/80 leading-relaxed">
                                    Una vez creado, podrás ir a la sección de &quot;Importar Lotes&quot; para cargar el inventario y a &quot;Subir Imagen&quot; para configurar el plano interactivo.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={isLoading}
                                >
                                    <Save className="w-4 h-4" />
                                    Crear Proyecto
                                </Button>
                                <Link href="/admin" className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        Cancelar
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
