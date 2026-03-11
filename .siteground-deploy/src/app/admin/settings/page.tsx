'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChevronLeft, Mail, ShieldCheck, CreditCard, Save, Loader2, Settings as SettingsIcon, AlertCircle, Share2 } from 'lucide-react'
import { getTenantSettings, updateTenantSettings } from './actions'
import Link from 'next/link'

type Tab = 'email' | 'reniec' | 'paypal' | 'n8n'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = React.useState<Tab>('email')
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [settings, setSettings] = React.useState<Record<string, string | number | boolean | Date | null> | null>(null)
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getTenantSettings()
                setSettings(data as unknown as Record<string, string | number | boolean | Date | null>)
            } catch (error) {
                console.error('Fetch settings error:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        try {
            if (!settings) return
            const result = await updateTenantSettings(settings as Record<string, string | number | null>)
            if (result.success) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Error al guardar' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Error inesperado' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (field: string, value: string | number | boolean | Date | null) => {
        setSettings((prev) => prev ? ({ ...prev, [field]: value }) as Record<string, string | number | boolean | Date | null> : { [field]: value })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Volver al Dashboard</span>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                        <SettingsIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
                        <p className="text-slate-400">Gestiona las integraciones y ajustes globales de tu inmobiliaria</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                    {message.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <TabButton
                        active={activeTab === 'email'}
                        icon={<Mail className="w-4 h-4" />}
                        label="Correo (SMTP)"
                        onClick={() => setActiveTab('email')}
                    />
                    <TabButton
                        active={activeTab === 'reniec'}
                        icon={<ShieldCheck className="w-4 h-4" />}
                        label="RENIEC DNI"
                        onClick={() => setActiveTab('reniec')}
                    />
                    <TabButton
                        active={activeTab === 'paypal'}
                        icon={<CreditCard className="w-4 h-4" />}
                        label="Pagos (PayPal)"
                        onClick={() => setActiveTab('paypal')}
                    />
                    <TabButton
                        active={activeTab === 'n8n'}
                        icon={<Share2 className="w-4 h-4" />}
                        label="Automatización (n8n)"
                        onClick={() => setActiveTab('n8n')}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <form onSubmit={handleSave} className="space-y-6">
                        {activeTab === 'email' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Configuración de Correo</CardTitle>
                                    <CardDescription>Ajustes de servidor SMTP para envío de cotizaciones</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Host SMTP</label>
                                            <Input
                                                value={(settings?.smtpHost || '') as string | number}
                                                onChange={(e) => handleChange('smtpHost', e.target.value)}
                                                placeholder="smtp.gmail.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puerto</label>
                                            <Input
                                                type="number"
                                                value={(settings?.smtpPort || '') as string | number}
                                                onChange={(e) => handleChange('smtpPort', e.target.value)}
                                                placeholder="587"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                                        <Input
                                            value={(settings?.smtpUser || '') as string | number}
                                            onChange={(e) => handleChange('smtpUser', e.target.value)}
                                            placeholder="ejemplo@gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña de Aplicación</label>
                                        <Input
                                            type="password"
                                            value={(settings?.smtpPassword || '') as string | number}
                                            onChange={(e) => handleChange('smtpPassword', e.target.value)}
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remitente (Email)</label>
                                        <Input
                                            value={(settings?.smtpFrom || '') as string | number}
                                            onChange={(e) => handleChange('smtpFrom', e.target.value)}
                                            placeholder="Inmobiliaria <noreply@empresa.com>"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'reniec' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Integración con RENIEC</CardTitle>
                                    <CardDescription>Configuración para validación automática de DNI mediante apidni.com</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">API URL</label>
                                        <Input
                                            value={(settings?.reniecUrl || '') as string | number}
                                            onChange={(e) => handleChange('reniecUrl', e.target.value)}
                                            placeholder="https://apidni.com/api/v2/dni"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bearer Token</label>
                                        <Input
                                            type="password"
                                            value={(settings?.reniecToken || '') as string | number}
                                            onChange={(e) => handleChange('reniecToken', e.target.value)}
                                            placeholder="Tu token de API"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'paypal' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Configuración de PayPal</CardTitle>
                                    <CardDescription>Para recibir pagos de separaciones en línea</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client ID</label>
                                        <Input
                                            value={(settings?.paypalClientId || '') as string | number}
                                            onChange={(e) => handleChange('paypalClientId', e.target.value)}
                                            placeholder="PayPal Client ID"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secret Key</label>
                                        <Input
                                            type="password"
                                            value={(settings?.paypalSecret || '') as string | number}
                                            onChange={(e) => handleChange('paypalSecret', e.target.value)}
                                            placeholder="PayPal Secret"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'n8n' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Automatización con n8n</CardTitle>
                                    <CardDescription>Configura el webhook global para integraciones de n8n</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webhook URL Global</label>
                                        <Input
                                            value={(settings?.n8nWebhookUrl || '') as string | number}
                                            onChange={(e) => handleChange('n8nWebhookUrl', e.target.value)}
                                            placeholder="https://tu-instancia.n8n.cloud/webhook/..."
                                        />
                                        <p className="text-[10px] text-slate-500 italic">
                                            Este webhook recibirá eventos de cotizaciones y actualizaciones de estado.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 border border-slate-700/50 text-slate-400 hover:bg-slate-800'
                }`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}
