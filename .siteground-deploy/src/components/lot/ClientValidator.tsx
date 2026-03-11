'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validateDNI, validateEmail } from '@/lib/utils'
import { CheckCircle, AlertCircle, Loader2, User } from 'lucide-react'

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
    const [fechaNac, setFechaNac] = React.useState('')
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
        } catch (err) {
            setError('Error de conexión. Intente nuevamente.')
        } finally {
            setIsValidating(false)
        }
    }

    // Check if all fields are valid
    React.useEffect(() => {
        if (validatedClient && validateEmail(email) && fechaNac) {
            onValidated({
                ...validatedClient,
                dni,
            })
        } else {
            onValidated(null)
        }
    }, [validatedClient, email, fechaNac, dni, onValidated])

    const isComplete = validatedClient && validateEmail(email) && fechaNac

    return (
        <Card variant="bordered" className="border-slate-600">
            <CardContent className="p-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Datos del Cliente
                </h4>

                {/* DNI Input with validate button */}
                <div className="flex gap-2">
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
                            leftIcon={<User className="w-4 h-4" />}
                        />
                    </div>
                    <div className="pt-7">
                        <Button
                            onClick={handleValidateDNI}
                            disabled={disabled || !validateDNI(dni) || isValidating}
                            isLoading={isValidating}
                            size="default"
                        >
                            Validar
                        </Button>
                    </div>
                </div>

                {/* Validated client info */}
                {validatedClient && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-emerald-400">Cliente validado</p>
                            <p className="text-sm text-slate-300">{validatedClient.nombreCompleto}</p>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && !isValidating && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        <p className="text-sm text-rose-400">{error}</p>
                    </div>
                )}

                {/* Additional fields */}
                <Input
                    type="email"
                    label="Correo Electrónico"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={disabled}
                    error={email && !validateEmail(email) ? 'Email inválido' : undefined}
                />

                <Input
                    type="date"
                    label="Fecha de Nacimiento"
                    value={fechaNac}
                    onChange={(e) => setFechaNac(e.target.value)}
                    disabled={disabled}
                />

                {/* Completion indicator */}
                <div className={`p-2 rounded-lg text-sm text-center ${isComplete
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                    {isComplete
                        ? '✓ Datos completos - Puede enviar la cotización'
                        : 'Complete todos los campos para habilitar el envío'
                    }
                </div>
            </CardContent>
        </Card>
    )
}
