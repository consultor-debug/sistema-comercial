'use client'

import * as React from 'react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ClientValidator } from './ClientValidator'
import { cn, LOT_STATUS_LABELS, formatCurrency } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { LotStatus } from '@prisma/client'
import {
    X, MapPin, Square, Layers, Grid3X3, User,
    FileText, Lock, ChevronRight, ChevronDown, ChevronUp,
    Ruler, Loader2, Calendar, CreditCard
} from 'lucide-react'

interface Lot {
    id: string
    code: string
    manzana: string
    loteNumero: number
    areaM2: number
    tipologia: string | null
    etapa: string | null
    frenteM: number | null
    fondoM: number | null
    ladoDerM: number | null
    ladoIzqM: number | null
    precioLista: number
    descuentoMax: number
    estado: LotStatus
    asesorId: string | null
    asesor?: {
        name: string
        email: string
    } | null
}

interface ValidatedClient {
    dni: string
    nombres: string
    apellidos: string
    nombreCompleto: string
}

interface QuotationResult {
    precioLista: number
    descuento: number
    precioFinal: number
    inicial: number
    saldo: number
    cuotas: number
    cuotaMensual: number
    fechaInicio: string
    cronograma: Array<{ numero: number; fecha: string; monto: number }>
}

interface LotPanelProps {
    lot: Lot | null
    onClose: () => void
    projectSettings?: {
        maxCuotas?: number
        minInicial?: number
    }
    onUpdate?: () => void
}

export const LotPanel: React.FC<LotPanelProps> = ({
    lot,
    onClose,
    projectSettings = {},
    onUpdate
}) => {
    const [quotation, setQuotation] = React.useState<QuotationResult | null>(null)
    const [client, setClient] = React.useState<ValidatedClient | null>(null)
    const [updatingStatus, setUpdatingStatus] = React.useState<LotStatus | null>(null)
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [showCronograma, setShowCronograma] = React.useState(false)

    // Quoter state
    const [descuento, setDescuento] = React.useState(0)
    const [inicial, setInicial] = React.useState(0)
    const [cuotas, setCuotas] = React.useState(12)
    const [fechaInicio, setFechaInicio] = React.useState(
        new Date().toISOString().split('T')[0]
    )

    const maxCuotas = projectSettings.maxCuotas ?? 60
    const minInicial = projectSettings.minInicial ?? 0

    // Reset state when lot changes
    React.useEffect(() => {
        setQuotation(null)
        setClient(null)
        setIsDownloading(false)
        setShowCronograma(false)
        setDescuento(0)
        setInicial(0)
        setCuotas(12)
    }, [lot?.id])

    // Live calculation
    React.useEffect(() => {
        if (!lot) return
        if (descuento > lot.descuentoMax || inicial < minInicial || cuotas < 1 || cuotas > maxCuotas) {
            setQuotation(null)
            return
        }
        const result = calculateQuotation({
            precioLista: lot.precioLista,
            descuento,
            inicial,
            cuotas,
            fechaInicio
        })
        setQuotation(result)
    }, [lot, descuento, inicial, cuotas, fechaInicio, minInicial, maxCuotas])

    if (!lot) return null

    const isLibre = lot.estado === 'LIBRE'
    const canQuote = isLibre
    const canSend = isLibre && quotation && client

    const precioFinal = Math.max(0, lot.precioLista - descuento)
    const saldo = Math.max(0, precioFinal - inicial)

    const handleDownloadPdf = async () => {
        if (!canSend || !quotation || !client) return
        setIsDownloading(true)
        try {
            const response = await fetch('/api/quotations/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotId: lot.id, quotation, client })
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok || !result.success) throw new Error(result.error || 'Error')
            const pdfUrl = `/api/quotations/download?id=${result.quotationId}`
            window.open(pdfUrl, '_blank')
        } catch (error) {
            console.error('Download error:', error)
        } finally {
            setIsDownloading(false)
        }
    }

    const handleChangeStatus = async (newStatus: LotStatus) => {
        setUpdatingStatus(newStatus)
        try {
            const response = await fetch(`/api/lots/${lot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus, motivo: 'Actualización rápida' })
            })
            const data = await response.json()
            if (data.success && onUpdate) onUpdate()
        } catch {
            console.error('Error updating status')
        } finally {
            setUpdatingStatus(null)
        }
    }

    const statusActions = (['LIBRE', 'SEPARADO', 'VENDIDO'] as LotStatus[]).filter(s => s !== lot.estado)
    const statusColors: Record<string, string> = {
        LIBRE: 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10',
        SEPARADO: 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10',
        VENDIDO: 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10',
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 border-l border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div>
                        <h2 className="text-sm font-semibold text-white leading-tight">Lote {lot.code}</h2>
                        <span className="text-[10px] text-slate-500">Mz {lot.manzana} · {lot.areaM2} m²</span>
                    </div>
                    <StatusBadge status={lot.estado} size="sm" />
                </div>
                <button onClick={onClose} className="p-1 text-slate-500 hover:text-white rounded transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="p-4 space-y-4">
                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-2">
                        <SpecItem icon={Grid3X3} label="Manzana" value={lot.manzana} />
                        <SpecItem icon={MapPin} label="Lote" value={lot.loteNumero} />
                        <SpecItem icon={Square} label="Área" value={`${lot.areaM2} m²`} />
                        <SpecItem icon={Layers} label="Etapa" value={lot.etapa || '1'} />
                    </div>

                    {/* Dimensions */}
                    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Ruler className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Medidas</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <DimItem label="Fr" value={lot.frenteM} />
                            <DimItem label="Fo" value={lot.fondoM} />
                            <DimItem label="LD" value={lot.ladoDerM} />
                            <DimItem label="LI" value={lot.ladoIzqM} />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Precio Lista</span>
                            <span className="text-sm font-bold text-white">{formatCurrency(lot.precioLista)}</span>
                        </div>
                        {descuento > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-emerald-400">Precio Final</span>
                                <span className="text-sm font-bold text-emerald-400">{formatCurrency(precioFinal)}</span>
                            </div>
                        )}
                    </div>

                    {/* Asesor */}
                    {lot.asesor && (
                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-white">{lot.asesor.name}</p>
                                <p className="text-[10px] text-slate-500">{lot.asesor.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Quoter Section */}
                    {canQuote ? (
                        <>
                            <div className="border-t border-white/5 pt-4">
                                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Cotizador</h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Descuento</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={descuento || ''}
                                            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                            className="bg-white/5 border-white/5 h-9 text-sm rounded-lg"
                                            leftIcon={<span className="text-[10px] text-slate-600 ml-2">S/</span>}
                                            error={descuento > lot.descuentoMax ? `Máx: ${formatCurrency(lot.descuentoMax)}` : undefined}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Cuota Inicial</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={inicial || ''}
                                            onChange={(e) => setInicial(parseFloat(e.target.value) || 0)}
                                            className="bg-white/5 border-white/5 h-9 text-sm rounded-lg"
                                            leftIcon={<span className="text-[10px] text-slate-600 ml-2">S/</span>}
                                            error={inicial > 0 && inicial < minInicial ? `Mín: ${formatCurrency(minInicial)}` : undefined}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Cuotas</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={cuotas || ''}
                                                onChange={(e) => setCuotas(parseInt(e.target.value) || 0)}
                                                className="bg-white/5 border-white/5 h-9 text-sm rounded-lg text-center flex-1"
                                                error={cuotas > maxCuotas ? `Máx: ${maxCuotas}` : undefined}
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <button onClick={() => setCuotas(Math.min(maxCuotas, cuotas + 6))} className="p-0.5 text-slate-500 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                                                <button onClick={() => setCuotas(Math.max(1, cuotas - 6))} className="p-0.5 text-slate-500 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Fecha Inicio</label>
                                        <Input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="bg-white/5 border-white/5 h-9 text-sm rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Result */}
                            {quotation && (
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Cuota Mensual</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(quotation.cuotaMensual)}</p>
                                    <p className="text-[10px] text-slate-500">Saldo: {formatCurrency(saldo)} · {cuotas} meses · 0% interés</p>
                                    
                                    <button 
                                        onClick={() => setShowCronograma(!showCronograma)}
                                        className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-2 flex items-center gap-1"
                                    >
                                        {showCronograma ? 'Ocultar' : 'Ver'} cronograma
                                        <ChevronDown className={cn("w-3 h-3 transition-transform", showCronograma && "rotate-180")} />
                                    </button>

                                    {showCronograma && quotation.cronograma && (
                                        <div className="mt-2 max-h-40 overflow-y-auto no-scrollbar border-t border-white/5 pt-2">
                                            <div className="space-y-1">
                                                {quotation.cronograma.map(c => (
                                                    <div key={c.numero} className="flex justify-between text-[10px]">
                                                        <span className="text-slate-500">#{c.numero.toString().padStart(2, '0')} — {c.fecha}</span>
                                                        <span className="text-white font-medium">{formatCurrency(c.monto)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Client Validation */}
                            {quotation && (
                                <div className="border-t border-white/5 pt-4">
                                    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Cliente</h3>
                                    <ClientValidator onValidated={setClient} disabled={!quotation} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-6 text-center border-t border-white/5 pt-8">
                            <Lock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">
                                Este lote está <span className="text-white font-medium">{LOT_STATUS_LABELS[lot.estado]}</span>
                            </p>
                        </div>
                    )}

                    {/* Admin Actions */}
                    <div className="border-t border-white/5 pt-4">
                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Estado</h3>
                        <div className="flex gap-2">
                            {statusActions.map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleChangeStatus(status)}
                                    disabled={!!updatingStatus}
                                    className={cn(
                                        "flex-1 py-1.5 px-2 text-[10px] font-medium rounded-md border transition-colors",
                                        statusColors[status]
                                    )}
                                >
                                    {updatingStatus === status ? (
                                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                    ) : (
                                        status
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {canQuote && (
                <div className="shrink-0 p-4 border-t border-white/5">
                    <Button
                        onClick={handleDownloadPdf}
                        disabled={!canSend || isDownloading}
                        className="w-full bg-white text-slate-950 hover:bg-slate-100 font-medium rounded-lg py-2.5 text-xs disabled:opacity-30"
                    >
                        {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <FileText className="w-3.5 h-3.5 mr-2" />
                                Generar Cotización
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

function SpecItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
    return (
        <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-slate-600" />
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-semibold text-white">{value}</p>
        </div>
    )
}

function DimItem({ label, value }: { label: string; value: number | null }) {
    return (
        <div className="text-center">
            <span className="text-[9px] text-slate-600 block">{label}</span>
            <span className="text-xs font-semibold text-white">{value ? `${value}m` : '-'}</span>
        </div>
    )
}
