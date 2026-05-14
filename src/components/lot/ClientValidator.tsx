'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { validateDNI } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Loader2, User, Mail, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    const autoValidatedRef = React.useRef(false)

    const handleValidateDNI = React.useCallback(async (dniValue: string) => {
        if (!validateDNI(dniValue)) return
        setIsValidating(true)
        setError(null)
        setValidatedClient(null)
        try {
            const response = await fetch('/api/clients/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: dniValue })
            })
            const data = await response.json()
            if (data.success) {
                setValidatedClient(data.client)
            } else {
                setError(data.error || 'DNI no encontrado en RENIEC')
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.')
        } finally {
            setIsValidating(false)
        }
    }, [])

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 8)
        setDni(value)
        setValidatedClient(null)
        setError(null)
        autoValidatedRef.current = false
        // Auto-validate when 8 digits entered
        if (value.length === 8 && !autoValidatedRef.current) {
            autoValidatedRef.current = true
            handleValidateDNI(value)
        }
    }

    const handleManualValidate = () => {
        autoValidatedRef.current = true
        handleValidateDNI(dni)
    }

    React.useEffect(() => {
        if (validatedClient && email.trim().length > 3) {
            onValidated({ ...validatedClient, dni })
        } else {
            onValidated(null)
        }
    }, [validatedClient, email, dni, onValidated])

    const dniState = isValidating ? 'loading' : validatedClient ? 'success' : error ? 'error' : 'idle'
    const isReady = validatedClient && email.trim().length > 3

    return (
        <div className="space-y-3">
            {/* DNI input */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">DNI del Cliente</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="12345678"
                            value={dni}
                            onChange={handleDniChange}
                            disabled={disabled || isValidating}
                            maxLength={8}
                            className={cn(
                                "w-full h-10 bg-white/5 border rounded-lg px-3 pr-9 text-sm text-white placeholder:text-slate-700 outline-none transition-all",
                                "focus:ring-1 focus:bg-white/[0.07]",
                                dniState === 'success' && "border-emerald-500/40 focus:ring-emerald-500/30",
                                dniState === 'error' && "border-rose-500/40 focus:ring-rose-500/30",
                                dniState === 'idle' || dniState === 'loading' ? "border-white/8 focus:ring-white/20" : "",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        />
                        {/* Status icon inside input */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {dniState === 'loading' && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
                            {dniState === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {dniState === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                    </div>
                    {/* Manual validate button — only when not auto-validating */}
                    {dniState !== 'loading' && !validatedClient && (
                        <button
                            onClick={handleManualValidate}
                            disabled={disabled || !validateDNI(dni) || isValidating}
                            className="h-10 px-3 bg-white/5 border border-white/8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Buscar en RENIEC"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Feedback row */}
                {dniState === 'loading' && (
                    <p className="text-[10px] text-slate-500">Consultando RENIEC...</p>
                )}
                {dniState === 'success' && validatedClient && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-lg">
                        <User className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-emerald-400 truncate">{validatedClient.nombreCompleto}</span>
                    </div>
                )}
                {dniState === 'error' && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-500/8 border border-rose-500/15 rounded-lg">
                        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="text-[10px] text-rose-400">{error}</span>
                    </div>
                )}
                {dniState === 'idle' && dni.length > 0 && dni.length < 8 && (
                    <p className="text-[10px] text-slate-600">{8 - dni.length} dígitos restantes — se validará automáticamente</p>
                )}
            </div>

            {/* Email input — only show after DNI validated */}
            {validatedClient && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Correo del Cliente</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                        <input
                            type="email"
                            placeholder="cliente@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                            className="w-full h-10 bg-white/5 border border-white/8 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.07] disabled:opacity-50 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Ready indicator */}
            {isReady && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/3 border border-white/6 rounded-lg animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-slate-400">Listo para generar cotización</span>
                </div>
            )}
        </div>
    )
}
