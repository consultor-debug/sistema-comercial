'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ClientValidator } from './ClientValidator'
import { cn, LOT_STATUS_LABELS, formatCurrency } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { LotStatus } from '@prisma/client'
import {
    X, FileText, Lock, Loader2, AlertTriangle, ChevronDown, KeyRound
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
    asesor?: { name: string; email: string } | null
}

interface ValidatedClient {
    dni: string
    nombres: string
    apellidos: string
    nombreCompleto: string
}

interface LotPanelProps {
    lot: Lot | null
    onClose: () => void
    projectSettings?: { maxCuotas?: number; minInicial?: number }
    onUpdate?: () => void
}

const BASE_PLAZO_OPTIONS = [6, 9, 12, 15, 18]

function ConfirmDialog({
    status, lotCode, onConfirm, onCancel, isLoading
}: {
    status: LotStatus; lotCode: string; onConfirm: () => void; onCancel: () => void; isLoading: boolean
}) {
    const labels: Record<string, { label: string; color: string; desc: string }> = {
        VENDIDO: { label: 'Vendido', color: 'text-rose-400', desc: 'Esta acción marcará el lote como vendido definitivamente.' },
        SEPARADO: { label: 'Separado', color: 'text-amber-400', desc: 'El lote quedará reservado y no podrá cotizarse.' },
        LIBRE: { label: 'Libre', color: 'text-emerald-400', desc: 'El lote volverá a estar disponible.' },
    }
    const cfg = labels[status]
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-1">Confirmar cambio de estado</h3>
                        <p className="text-xs text-slate-400">
                            Lote <span className="text-white font-medium">{lotCode}</span>{' '}→{' '}
                            <span className={cn('font-medium', cfg?.color)}>{cfg?.label}</span>
                        </p>
                        {cfg?.desc && <p className="text-[11px] text-slate-500 mt-1">{cfg.desc}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} disabled={isLoading}
                        className="flex-1 h-9 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} disabled={isLoading}
                        className={cn(
                            'flex-1 h-9 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center',
                            status === 'VENDIDO' && 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30',
                            status === 'SEPARADO' && 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
                            status === 'LIBRE' && 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
                        )}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `Marcar como ${cfg?.label}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export const LotPanel: React.FC<LotPanelProps> = ({ lot, onClose, projectSettings = {}, onUpdate }) => {
    const [client, setClient] = React.useState<ValidatedClient | null>(null)
    const [updatingStatus, setUpdatingStatus] = React.useState<LotStatus | null>(null)
    const [confirmStatus, setConfirmStatus] = React.useState<LotStatus | null>(null)
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [showCronograma, setShowCronograma] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<'contado' | 'financiamiento'>('financiamiento')

    const [enganchePct, setEnganchePct] = React.useState(20)
    const [cuotas, setCuotas] = React.useState(18)
    const [tasaAnual, setTasaAnual] = React.useState(12)
    const [unlocked24, setUnlocked24] = React.useState(false)
    const [show24Input, setShow24Input] = React.useState(false)
    const [pw24, setPw24] = React.useState('')
    const [pw24Error, setPw24Error] = React.useState(false)

    const maxCuotas = projectSettings.maxCuotas ?? 60

    React.useEffect(() => {
        setClient(null)
        setIsDownloading(false)
        setShowCronograma(false)
        setConfirmStatus(null)
        setEnganchePct(20)
        setCuotas(18)
        setTasaAnual(12)
        setActiveTab('financiamiento')
        setUnlocked24(false)
        setShow24Input(false)
        setPw24('')
        setPw24Error(false)
    }, [lot?.id, maxCuotas])

    if (!lot) return null

    const isLibre = lot.estado === 'LIBRE'
    const precioM2 = lot.areaM2 > 0 ? Math.round(lot.precioLista / lot.areaM2) : 0
    const engancheAmount = Math.round(lot.precioLista * enganchePct / 100)
    const inicialMinimo = 3500
    const inicialBelowMin = engancheAmount < inicialMinimo
    const canUse36 = lot.manzana.toUpperCase() === 'A' || lot.manzana.toUpperCase() === 'L'

    const plazoOptions = [
        ...BASE_PLAZO_OPTIONS.filter(n => n <= maxCuotas),
        24,
        ...(canUse36 && 36 <= maxCuotas ? [36] : []),
    ]

    const handle24Click = () => {
        if (unlocked24) { setCuotas(24); return }
        setShow24Input(v => !v)
        setPw24('')
        setPw24Error(false)
    }

    const handlePw24Submit = () => {
        if (pw24 === 'napoles') {
            setUnlocked24(true)
            setShow24Input(false)
            setCuotas(24)
            setPw24Error(false)
        } else {
            setPw24Error(true)
        }
    }

    const quotation = (() => {
        if (!isLibre) return null
        return calculateQuotation({
            precioLista: lot.precioLista,
            descuento: 0,
            inicial: engancheAmount,
            cuotas,
            fechaInicio: new Date().toISOString().split('T')[0],
            interestRate: activeTab === 'financiamiento' ? tasaAnual : 0,
        })
    })()

    const canSend = isLibre && quotation && client && !inicialBelowMin

    const handleDownloadPdf = async () => {
        if (!canSend || !quotation || !client) return
        setIsDownloading(true)
        try {
            const response = await fetch('/api/quotations/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotId: lot.id, quotation: { ...quotation, descuento: 0, inicial: engancheAmount }, client })
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok || !result.success) throw new Error(result.error || 'Error')
            window.open(`/api/quotations/download?id=${result.quotationId}`, '_blank')
            toast.success('Cotización generada correctamente')
        } catch {
            toast.error('No se pudo generar la cotización')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleConfirmStatusChange = async () => {
        if (!confirmStatus) return
        setUpdatingStatus(confirmStatus)
        const targetStatus = confirmStatus
        setConfirmStatus(null)
        try {
            const response = await fetch(`/api/lots/${lot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: targetStatus, motivo: 'Actualización rápida' })
            })
            const data = await response.json()
            if (data.success) {
                toast.success(`Lote ${lot.code} → ${LOT_STATUS_LABELS[targetStatus]}`)
                onUpdate?.()
            } else {
                toast.error('No se pudo actualizar el estado')
            }
        } catch {
            toast.error('Error de conexión')
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
        <>
            {confirmStatus && (
                <ConfirmDialog status={confirmStatus} lotCode={lot.code}
                    onConfirm={handleConfirmStatusChange} onCancel={() => setConfirmStatus(null)}
                    isLoading={!!updatingStatus} />
            )}

            <div className="h-full flex flex-col bg-slate-950 overflow-hidden">

                {/* ── Header ── */}
                <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-1">
                                Lote {lot.code}
                            </p>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                Manzana {lot.manzana} · {lot.loteNumero}
                            </h2>
                            {lot.tipologia && (
                                <p className="text-xs text-slate-500 mt-0.5">{lot.tipologia}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            <StatusBadge status={lot.estado} size="sm" />
                            <button onClick={onClose}
                                className="p-1 text-slate-500 hover:text-white rounded transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Body (scrollable) ── */}
                <div className="flex-1 overflow-y-auto no-scrollbar">

                    {/* Specs grid */}
                    <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                        <SpecCell label="Superficie" value={`${lot.areaM2}`} unit="m²" />
                        <SpecCell label="Frente" value={lot.frenteM ? `${lot.frenteM}` : '—'} unit={lot.frenteM ? 'm' : ''} />
                        <SpecCell label="Fondo" value={lot.fondoM ? `${lot.fondoM}` : '—'} unit={lot.fondoM ? 'm' : ''} />
                    </div>

                    {/* Price block */}
                    <div className="px-5 py-5 border-b border-white/5">
                        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-2">
                            Precio total
                        </p>
                        <p className="text-3xl font-bold text-white tracking-tight">
                            {formatCurrency(lot.precioLista)}
                        </p>
                        {precioM2 > 0 && (
                            <p className="text-xs text-slate-500 mt-1">{formatCurrency(precioM2)} / m²</p>
                        )}
                    </div>

                    {isLibre ? (
                        <div className="px-5 py-5 space-y-5">

                            {/* Payment tabs */}
                            <div className="flex border border-white/10 rounded-xl overflow-hidden">
                                {(['contado', 'financiamiento'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            'flex-1 py-2.5 text-sm font-medium transition-colors capitalize',
                                            activeTab === tab
                                                ? 'bg-white text-slate-950'
                                                : 'text-slate-400 hover:text-white'
                                        )}>
                                        {tab === 'contado' ? 'Contado' : 'Financiamiento'}
                                    </button>
                                ))}
                            </div>

                            {/* Contado */}
                            {activeTab === 'contado' && (
                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">Pago único al contado</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(lot.precioLista)}</p>
                                </div>
                            )}

                            {/* Financiamiento sliders */}
                            {activeTab === 'financiamiento' && (
                                <div className="space-y-6">

                                    {/* Inicial */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-300">Inicial</span>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    min={1} max={99}
                                                    value={enganchePct}
                                                    onChange={e => {
                                                        const v = Math.min(99, Math.max(1, parseInt(e.target.value) || 1))
                                                        setEnganchePct(v)
                                                    }}
                                                    className="w-12 h-7 bg-white/5 border border-white/10 rounded-md text-xs text-center text-white outline-none focus:ring-1 focus:ring-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className={cn(
                                                    'text-sm font-semibold',
                                                    inicialBelowMin ? 'text-rose-400' : 'text-white'
                                                )}>
                                                    % · {formatCurrency(engancheAmount)}
                                                </span>
                                            </div>
                                        </div>
                                        <input type="range" min={1} max={99} step={1}
                                            value={enganchePct}
                                            onChange={e => setEnganchePct(Number(e.target.value))}
                                            className="w-full h-1 rounded-full cursor-pointer accent-emerald-400"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
                                            <span>1%</span><span>50%</span><span>99%</span>
                                        </div>
                                        {inicialBelowMin && (
                                            <p className="text-[10px] text-rose-400 mt-1.5">
                                                Mínimo S/ 3,500 de inicial
                                            </p>
                                        )}
                                    </div>

                                    {/* Plazo */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-300">Plazo</span>
                                            <span className="text-sm font-semibold text-white">{cuotas} meses</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {plazoOptions.map(n => {
                                                const is24 = n === 24
                                                const locked = is24 && !unlocked24
                                                return (
                                                    <button key={n} onClick={() => is24 ? handle24Click() : setCuotas(n)}
                                                        className={cn(
                                                            'flex-1 min-w-[40px] py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1',
                                                            cuotas === n && !locked
                                                                ? 'bg-white text-slate-950 border-white'
                                                                : locked
                                                                    ? 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400'
                                                                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                                        )}>
                                                        {n}
                                                        {locked && <Lock className="w-2.5 h-2.5" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {/* 24-month password unlock */}
                                        {show24Input && (
                                            <div className="mt-2 flex gap-2 animate-in fade-in duration-150">
                                                <div className="relative flex-1">
                                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                                    <input
                                                        type="password"
                                                        placeholder="Clave de acceso"
                                                        value={pw24}
                                                        onChange={e => { setPw24(e.target.value); setPw24Error(false) }}
                                                        onKeyDown={e => e.key === 'Enter' && handlePw24Submit()}
                                                        className={cn(
                                                            'w-full h-9 bg-white/5 border rounded-lg pl-8 pr-3 text-xs text-white placeholder:text-slate-700 outline-none focus:ring-1 transition-all',
                                                            pw24Error
                                                                ? 'border-rose-500/40 focus:ring-rose-500/30'
                                                                : 'border-white/10 focus:ring-white/20'
                                                        )}
                                                    />
                                                </div>
                                                <button onClick={handlePw24Submit}
                                                    className="h-9 px-3 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                        {pw24Error && (
                                            <p className="text-[10px] text-rose-400 mt-1">Clave incorrecta</p>
                                        )}
                                    </div>

                                    {/* Tasa de interés anual */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-300">Tasa de interés anual</span>
                                            <span className="text-sm font-semibold text-white">{tasaAnual.toFixed(1)}%</span>
                                        </div>
                                        <input type="range" min={0} max={18} step={0.5}
                                            value={tasaAnual}
                                            onChange={e => setTasaAnual(Number(e.target.value))}
                                            className="w-full h-1 rounded-full cursor-pointer accent-emerald-400"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
                                            <span>0%</span><span>9%</span><span>18%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mensualidad estimada */}
                            {quotation && (
                                <div className="bg-slate-900 border border-white/8 rounded-xl p-5">
                                    <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-1">
                                        {activeTab === 'financiamiento' ? 'Mensualidad estimada' : 'Total a pagar'}
                                    </p>
                                    <p className="text-3xl font-bold text-white tracking-tight">
                                        {activeTab === 'financiamiento'
                                            ? formatCurrency(quotation.cuotaMensual)
                                            : formatCurrency(lot.precioLista)}
                                    </p>
                                    {activeTab === 'financiamiento' && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            por {cuotas} meses
                                            {tasaAnual > 0 ? ` · ${tasaAnual}% interés anual` : ' · sin interés'}
                                        </p>
                                    )}
                                    {activeTab === 'financiamiento' && (
                                        <button
                                            onClick={() => setShowCronograma(!showCronograma)}
                                            className="text-[11px] text-emerald-400 hover:text-emerald-300 mt-3 flex items-center gap-1 transition-colors">
                                            {showCronograma ? 'Ocultar' : 'Ver'} cronograma
                                            <ChevronDown className={cn('w-3 h-3 transition-transform', showCronograma && 'rotate-180')} />
                                        </button>
                                    )}
                                    {showCronograma && quotation.cronograma && (
                                        <div className="mt-3 max-h-44 overflow-y-auto no-scrollbar border-t border-white/5 pt-3 space-y-1">
                                            {quotation.cronograma.map(c => (
                                                <div key={c.numero} className="flex justify-between text-[11px]">
                                                    <span className="text-slate-500">#{c.numero.toString().padStart(2, '0')} — {c.fecha}</span>
                                                    <span className="text-white font-medium">{formatCurrency(c.monto)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Client section */}
                            {quotation && (
                                <div className="border-t border-white/5 pt-5">
                                    <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-3">
                                        Datos del cliente
                                    </p>
                                    <ClientValidator onValidated={setClient} disabled={false} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-5 py-12 text-center">
                            <Lock className="w-7 h-7 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">
                                Este lote está{' '}
                                <span className="text-white font-medium">{LOT_STATUS_LABELS[lot.estado]}</span>
                            </p>
                        </div>
                    )}

                    {/* Status actions */}
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-3">
                            Cambiar estado
                        </p>
                        <div className="flex gap-2">
                            {statusActions.map(status => (
                                <button key={status} onClick={() => setConfirmStatus(status)}
                                    disabled={!!updatingStatus}
                                    className={cn(
                                        'flex-1 py-2 px-2 text-[11px] font-medium rounded-lg border transition-colors',
                                        statusColors[status]
                                    )}>
                                    {updatingStatus === status
                                        ? <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                        : LOT_STATUS_LABELS[status]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Footer CTA ── */}
                {isLibre && (
                    <div className="shrink-0 px-5 py-4 border-t border-white/5">
                        <Button onClick={handleDownloadPdf}
                            disabled={!canSend || isDownloading}
                            className="w-full bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-xl py-3 text-sm disabled:opacity-30">
                            {isDownloading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><FileText className="w-4 h-4 mr-2" />Generar Cotización PDF</>}
                        </Button>
                        {!canSend && quotation && (
                            <p className="text-[11px] text-center mt-2 text-slate-600">
                                {inicialBelowMin
                                    ? 'El inicial mínimo es S/ 3,500'
                                    : 'Completa los datos del cliente para continuar'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

function SpecCell({ label, value, unit }: { label: string; value: string; unit: string }) {
    return (
        <div className="px-4 py-4 text-center">
            <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase mb-1.5">{label}</p>
            <p className="text-lg font-bold text-white leading-none">
                {value}
                {unit && <span className="text-xs text-slate-500 font-normal ml-1">{unit}</span>}
            </p>
        </div>
    )
}
