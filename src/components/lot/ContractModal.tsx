'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { validateDNI } from '@/lib/utils'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { LotStatus } from '@prisma/client'
import {
    X, Loader2, FileText, Search, CheckCircle2, AlertCircle, User, Phone, Mail, MapPin,
    ChevronDown
} from 'lucide-react'

interface Lot {
    id: string
    code: string
    manzana: string
    loteNumero: number
    areaM2: number
    precioLista: number
    estado: LotStatus
}

interface ClientData {
    dni: string
    nombres: string
    apellidos: string
    phone: string
    email: string
    domicilio: string
}

interface FinancialData {
    precioTotal: number
    montoSeparacion?: number
    inicial?: number
    cuotas?: number
    cuotaMensual?: number
    cronograma?: Array<{ numero: number; fecha: string; monto: number }>
}

interface ContractModalProps {
    lot: Lot
    tipo: 'SEPARACION' | 'COMPRAVENTA'
    onClose: () => void
    onSuccess: (newStatus: LotStatus) => void
}

export const ContractModal: React.FC<ContractModalProps> = ({
    lot, tipo, onClose, onSuccess
}) => {
    const esSeparacion = tipo === 'SEPARACION'

    // Client state
    const [dni, setDni] = React.useState('')
    const [nombres, setNombres] = React.useState('')
    const [apellidos, setApellidos] = React.useState('')
    const [phone, setPhone] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [domicilio, setDomicilio] = React.useState('')
    const [dniLoading, setDniLoading] = React.useState(false)
    const [dniValidated, setDniValidated] = React.useState(false)
    const [dniError, setDniError] = React.useState<string | null>(null)

    // Financial state
    const [precioTotal, setPrecioTotal] = React.useState(lot.precioLista)
    const [montoSeparacion, setMontoSeparacion] = React.useState(1000)
    const [inicial, setInicial] = React.useState(Math.round(lot.precioLista * 0.2))
    const [cuotas, setCuotas] = React.useState(18)
    const [tasaAnual, setTasaAnual] = React.useState(12)
    const [showCronograma, setShowCronograma] = React.useState(false)

    const [isGenerating, setIsGenerating] = React.useState(false)
    const autoValidatedRef = React.useRef(false)

    const quotation = esSeparacion ? null : calculateQuotation({
        precioLista: precioTotal,
        descuento: 0,
        inicial,
        cuotas,
        fechaInicio: new Date().toISOString().split('T')[0],
        interestRate: tasaAnual,
    })

    const validateDniFromApi = async (dniValue: string) => {
        if (!validateDNI(dniValue)) return
        setDniLoading(true)
        setDniError(null)
        setDniValidated(false)
        try {
            const res = await fetch('/api/clients/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: dniValue })
            })
            const data = await res.json()
            if (data.success && data.client) {
                setNombres(data.client.nombres)
                setApellidos(data.client.apellidos)
                setDniValidated(true)
            } else {
                setDniError(data.error || 'DNI no encontrado')
            }
        } catch {
            setDniError('Error de conexión')
        } finally {
            setDniLoading(false)
        }
    }

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 8)
        setDni(value)
        setDniValidated(false)
        setDniError(null)
        setNombres('')
        setApellidos('')
        autoValidatedRef.current = false
        if (value.length === 8 && !autoValidatedRef.current) {
            autoValidatedRef.current = true
            validateDniFromApi(value)
        }
    }

    const canGenerate = dniValidated && nombres && apellidos && phone && email && (
        esSeparacion ? montoSeparacion > 0 : (inicial > 0 && cuotas > 0)
    )

    const handleGenerate = async () => {
        if (!canGenerate) return
        setIsGenerating(true)
        try {
            const clienteData: ClientData = { dni, nombres, apellidos, phone, email, domicilio }
            const financialData: FinancialData = esSeparacion
                ? { precioTotal, montoSeparacion }
                : {
                    precioTotal,
                    inicial,
                    cuotas,
                    cuotaMensual: quotation?.cuotaMensual,
                    cronograma: quotation?.cronograma,
                }

            const res = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotId: lot.id, tipo, clienteData, financialData })
            })
            const result = await res.json()
            if (!res.ok || !result.success) throw new Error(result.error || 'Error al generar')

            // Download the DOCX from base64
            const byteArray = Uint8Array.from(atob(result.docxBase64), c => c.charCodeAt(0))
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `contrato-${result.codigo}.docx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            // Update lot status
            const newStatus: LotStatus = esSeparacion ? 'SEPARADO' : 'VENDIDO'
            await fetch(`/api/lots/${lot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus, motivo: `Contrato ${tipo} generado - ${result.codigo}` })
            })

            toast.success(`Contrato generado y descargado — Lote ${lot.code} → ${esSeparacion ? 'Separado' : 'Vendido'}`)
            onSuccess(newStatus)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al generar contrato')
        } finally {
            setIsGenerating(false)
        }
    }

    const dniState = dniLoading ? 'loading' : dniValidated ? 'success' : dniError ? 'error' : 'idle'

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                            <FileText className={cn('w-4 h-4', esSeparacion ? 'text-amber-400' : 'text-emerald-400')} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                {esSeparacion ? 'Minuta de Separación' : 'Contrato de Compraventa'}
                            </h2>
                            <p className="text-[11px] text-slate-500">Lote {lot.code} — Mza. {lot.manzana}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white rounded transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-6">

                    {/* Client section */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Datos del Comprador</p>

                        {/* DNI */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">DNI *</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="12345678"
                                        value={dni}
                                        onChange={handleDniChange}
                                        maxLength={8}
                                        className={cn(
                                            'w-full h-10 bg-white/5 border rounded-lg px-3 pr-9 text-sm text-white placeholder:text-slate-700 outline-none transition-all focus:ring-1 focus:bg-white/[0.07]',
                                            dniState === 'success' && 'border-emerald-500/40 focus:ring-emerald-500/30',
                                            dniState === 'error' && 'border-rose-500/40 focus:ring-rose-500/30',
                                            (dniState === 'idle' || dniState === 'loading') && 'border-white/8 focus:ring-white/20',
                                        )}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {dniState === 'loading' && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
                                        {dniState === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        {dniState === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                                    </div>
                                </div>
                                {dniState !== 'loading' && !dniValidated && (
                                    <button
                                        onClick={() => { autoValidatedRef.current = true; validateDniFromApi(dni) }}
                                        disabled={!validateDNI(dni)}
                                        className="h-10 px-3 bg-white/5 border border-white/8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            {dniState === 'success' && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-lg">
                                    <User className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="text-xs font-medium text-emerald-400">{nombres} {apellidos}</span>
                                </div>
                            )}
                            {dniState === 'error' && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-500/8 border border-rose-500/15 rounded-lg">
                                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span className="text-[10px] text-rose-400">{dniError}</span>
                                </div>
                            )}
                        </div>

                        {/* Nombres + Apellidos (manual if no RENIEC) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Nombres *</label>
                                <input
                                    type="text"
                                    value={nombres}
                                    onChange={e => setNombres(e.target.value)}
                                    placeholder="Juan Carlos"
                                    className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Apellidos *</label>
                                <input
                                    type="text"
                                    value={apellidos}
                                    onChange={e => setApellidos(e.target.value)}
                                    placeholder="García López"
                                    className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone + Email */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Teléfono *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+51 900 000 000"
                                        className="w-full h-10 bg-white/5 border border-white/8 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="cliente@email.com"
                                        className="w-full h-10 bg-white/5 border border-white/8 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Domicilio */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Domicilio</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                                <input
                                    type="text"
                                    value={domicilio}
                                    onChange={e => setDomicilio(e.target.value)}
                                    placeholder="Av. Los Pinos 123, Trujillo"
                                    className="w-full h-10 bg-white/5 border border-white/8 rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial section */}
                    <div className="space-y-4 border-t border-white/5 pt-5">
                        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                            {esSeparacion ? 'Datos de Separación' : 'Datos Financieros'}
                        </p>

                        {/* Precio total */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Precio Total (S/)</label>
                            <input
                                type="number"
                                value={precioTotal}
                                onChange={e => setPrecioTotal(parseFloat(e.target.value) || 0)}
                                className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>

                        {esSeparacion ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Monto de Separación (S/) *</label>
                                <input
                                    type="number"
                                    value={montoSeparacion}
                                    onChange={e => setMontoSeparacion(parseFloat(e.target.value) || 0)}
                                    className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <p className="text-[10px] text-slate-600">Este monto será descontado del precio total al formalizar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Inicial (S/) *</label>
                                        <input
                                            type="number"
                                            value={inicial}
                                            onChange={e => setInicial(parseFloat(e.target.value) || 0)}
                                            className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cuotas *</label>
                                        <input
                                            type="number"
                                            value={cuotas}
                                            min={1}
                                            max={60}
                                            onChange={e => setCuotas(parseInt(e.target.value) || 1)}
                                            className="w-full h-10 bg-white/5 border border-white/8 rounded-lg px-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tasa Anual</label>
                                        <span className="text-xs text-white font-medium">{tasaAnual}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={18} step={0.5}
                                        value={tasaAnual}
                                        onChange={e => setTasaAnual(Number(e.target.value))}
                                        className="w-full h-1 rounded-full cursor-pointer accent-emerald-400"
                                    />
                                </div>

                                {quotation && (
                                    <div className="bg-slate-800 border border-white/5 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Cuota mensual estimada</span>
                                            <span className="text-xl font-bold text-white">{formatCurrency(quotation.cuotaMensual)}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Saldo: {formatCurrency(quotation.saldo)} · {cuotas} cuotas
                                            {tasaAnual > 0 ? ` · ${tasaAnual}% anual` : ' · sin interés'}
                                        </p>
                                        <button
                                            onClick={() => setShowCronograma(v => !v)}
                                            className="text-[11px] text-emerald-400 hover:text-emerald-300 mt-2 flex items-center gap-1 transition-colors"
                                        >
                                            {showCronograma ? 'Ocultar' : 'Ver'} cronograma
                                            <ChevronDown className={cn('w-3 h-3 transition-transform', showCronograma && 'rotate-180')} />
                                        </button>
                                        {showCronograma && quotation.cronograma && (
                                            <div className="mt-2 max-h-36 overflow-y-auto no-scrollbar space-y-1 border-t border-white/5 pt-2">
                                                {quotation.cronograma.map(c => (
                                                    <div key={c.numero} className="flex justify-between text-[11px]">
                                                        <span className="text-slate-500">#{String(c.numero).padStart(2, '0')} — {c.fecha}</span>
                                                        <span className="text-white font-medium">{formatCurrency(c.monto)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/8 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        className={cn(
                            'flex-1 h-10 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                            esSeparacion
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/20'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20'
                        )}
                    >
                        {isGenerating
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
                            : <><FileText className="w-4 h-4" />Generar Contrato DOCX</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
