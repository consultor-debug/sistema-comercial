'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validateDNI } from '@/lib/utils'
import { CheckCircle, AlertCircle, User, Mail } from 'lucide-react'

interface ValidatedClient {
    dni: string
    nombres: string
    apellidos: string
    nombreCompleto: string
}

interface ClientValidatorProps {
    onValidated: (client: ValidatedClient | null) => void
    disabled?: boolean
}

export const ClientValidator: React.FC<ClientValidatorProps> = ({
    onValidated,
    disabled = false
}) => {
    const [dni, setDni] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [validatedClient, setValidatedClient] = React.useState<ValidatedClient | null>(null)
    const [isValidating, setIsValidating] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Validate DNI with RENIEC
    const handleValidateDNI = async () => {
        if (!validateDNI(dni)) {
            setError('El DNI debe tener 8 dígitos')
            return
        }

        setIsValidating(true)
        setError(null)
        setValidatedClient(null)

        try {
            const response = await fetch('/api/clients/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni })
            })

            const data = await response.json()

            if (data.success) {
                setValidatedClient(data.client)
            } else {
                setError(data.error || 'No se pudo validar el DNI')
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.')
        } finally {
            setIsValidating(false)
        }
    }

    // Check if all fields are valid - Only require DNI validation and something in email
    React.useEffect(() => {
        if (validatedClient && email.trim().length > 0) {
            onValidated({
                ...validatedClient,
                dni,
            })
        } else {
            onValidated(null)
        }
    }, [validatedClient, email, dni, onValidated])

    const isComplete = validatedClient && email.trim().length > 0

    return (
        <Card variant="bordered" className="border-slate-700 bg-slate-800/20">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Datos del Cliente
                    </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DNI Column */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Input
                                    label="DNI"
                                    placeholder="12345678"
                                    value={dni}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                                        setDni(value)
                                        setValidatedClient(null)
                                        setError(null)
                                    }}
                                    disabled={disabled}
                                    error={error && !validatedClient ? error : undefined}
                                />
                            </div>
                            <div className="pt-7">
                                <Button
                                    onClick={handleValidateDNI}
                                    disabled={disabled || !validateDNI(dni) || isValidating}
                                    isLoading={isValidating}
                                    className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                                >
                                    Validar
                                </Button>
                            </div>
                        </div>

                        {/* Validated client info */}
                        {validatedClient && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-emerald-400 uppercase">Validado</p>
                                    <p className="text-sm font-semibold text-white">{validatedClient.nombreCompleto}</p>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && !isValidating && (
                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p className="text-xs font-medium">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Email Column */}
                    <div className="space-y-4">
                        <Input
                            type="email"
                            label="Correo Electrónico"
                            placeholder="cliente@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                            leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
                        />
                        
                        {/* Status indicator */}
                        {!isComplete && (
                            <div className="flex items-center gap-2 p-3 bg-slate-500/5 rounded-xl border border-slate-700/50">
                                <AlertCircle className="w-4 h-4 text-slate-500" />
                                <p className="text-[11px] text-slate-400 uppercase tracking-tight font-medium">
                                    Complete DNI y Correo para el PDF
                                </p>
                            </div>
                        )}
                        
                        {isComplete && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <p className="text-[11px] text-emerald-400 uppercase tracking-tight font-medium">
                                    Listo para generar cotización
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

