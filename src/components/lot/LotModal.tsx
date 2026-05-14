'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Quoter } from './Quoter'
import { ClientValidator } from './ClientValidator'
import { cn, LOT_STATUS_LABELS } from '@/lib/utils'
import { LotStatus } from '@prisma/client'
import {
    MapPin, Square, Layers, Grid3X3, User,
    FileText, Lock, ChevronRight, CheckCircle2,
    Ruler, Settings, Loader2
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

interface LotModalProps {
    lot: Lot | null
    isOpen: boolean
    onClose: () => void
    projectSettings?: {
        maxCuotas?: number
        minInicial?: number
    }
    onUpdate?: () => void
}

export const LotModal: React.FC<LotModalProps> = ({
    lot,
    isOpen,
    onClose,
    projectSettings = {},
    onUpdate
}) => {
    const [quotation, setQuotation] = React.useState<QuotationResult | null>(null)
    const [client, setClient] = React.useState<ValidatedClient | null>(null)
    const [updatingStatus, setUpdatingStatus] = React.useState<LotStatus | null>(null)
    const [sendSuccess, setSendSuccess] = React.useState(false)
    const [isDownloading, setIsDownloading] = React.useState(false)

    // Reset state when modal opens/closes or lot changes
    React.useEffect(() => {
        setQuotation(null)
        setClient(null)
        setSendSuccess(false)
        setIsDownloading(false)
    }, [lot?.id, isOpen])

    if (!lot) return null

    const isLibre = lot.estado === 'LIBRE'
    const canQuote = isLibre
    const canSend = isLibre && quotation && client

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

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error de servidor')
            }

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
                body: JSON.stringify({ estado: newStatus, motivo: 'Actualización rápida desde el mapa' })
            })

            const data = await response.json()
            if (data.success) {
                if (onUpdate) onUpdate()
            }
        } catch {
            console.error('Error updating status')
        } finally {
            setUpdatingStatus(null)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalHeader className="flex items-center justify-between pr-12 pb-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Identificador de Lote</span>
                        <ModalTitle className="text-3xl font-black text-white leading-none tracking-tighter">Lote {lot.code}</ModalTitle>
                    </div>
                    <StatusBadge status={lot.estado} size="lg" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest shadow-lg" />
                </div>
            </ModalHeader>

            <ModalBody className="space-y-8 py-8 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {sendSuccess ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 glass-strong border border-cyan-500/30 rounded-[2.5rem] text-center"
                        >
                            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/10 border border-cyan-500/30">
                                <CheckCircle2 className="w-10 h-10 text-cyan-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">¡Cotización Generada!</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto">
                                Se ha generado el documento PDF con todos los detalles financieros.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Lot specs grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SpecCard icon={Grid3X3} label="Manzana" value={lot.manzana} color="cyan" />
                                <SpecCard icon={MapPin} label="Número" value={lot.loteNumero} color="blue" />
                                <SpecCard icon={Square} label="Área Total" value={`${lot.areaM2} m²`} color="indigo" />
                                <SpecCard icon={Layers} label="Etapa" value={lot.etapa || '1'} color="slate" />
                            </div>

                            {/* Dimensions Section */}
                            <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                                            <Ruler className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Medidas Perimétricas</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <DimensionItem label="Frente" value={lot.frenteM} />
                                        <DimensionItem label="Fondo" value={lot.fondoM} />
                                        <DimensionItem label="Lado Derecho" value={lot.ladoDerM} />
                                        <DimensionItem label="Lado Izquierdo" value={lot.ladoIzqM} />
                                    </div>
                                </div>
                            </div>

                            {/* Asesor info for occupied lots */}
                            {!isLibre && lot.asesor && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="glass-card border border-cyan-500/20 bg-cyan-500/5 rounded-3xl overflow-hidden">
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                    <User className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-cyan-500/70 uppercase tracking-widest">Asesor a Cargo</p>
                                                    <p className="font-bold text-white text-lg leading-tight">{lot.asesor.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-slate-400">{lot.asesor.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Interactive Quoter Section */}
                            {canQuote ? (
                                <div className="space-y-8">
                                    <div className="glass-card border border-white/5 rounded-[2.5rem] p-1 shadow-2xl">
                                        <Quoter
                                            precioLista={lot.precioLista}
                                            descuentoMax={lot.descuentoMax}
                                            maxCuotas={projectSettings.maxCuotas}
                                            minInicial={projectSettings.minInicial}
                                            onQuotationCalculated={setQuotation}
                                        />
                                    </div>
                                    
                                    <AnimatePresence>
                                        {quotation && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="glass-card border border-white/5 rounded-[2.5rem] p-1 shadow-2xl"
                                            >
                                                <ClientValidator
                                                    onValidated={setClient}
                                                    disabled={!quotation}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="p-12 text-center glass-strong border border-white/5 rounded-[3rem] shadow-2xl shadow-black/50">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                                        <Lock className="w-10 h-10 text-slate-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Venta Restringida</h4>
                                    <p className="text-slate-400 font-medium max-w-xs mx-auto">
                                        Este lote se encuentra en estado <span className="text-white font-bold">{LOT_STATUS_LABELS[lot.estado]}</span>.
                                    </p>
                                </div>
                            )}

                            {/* Administrative Actions */}
                            <div className="pt-8 border-t border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <Settings className="w-4 h-4 text-slate-500" />
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestión de Inventario</h4>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <AdminAction 
                                        status="LIBRE" 
                                        activeStatus={lot.estado} 
                                        isLoading={updatingStatus === 'LIBRE'} 
                                        onClick={() => handleChangeStatus('LIBRE')} 
                                    />
                                    <AdminAction 
                                        status="SEPARADO" 
                                        activeStatus={lot.estado} 
                                        isLoading={updatingStatus === 'SEPARADO'} 
                                        onClick={() => handleChangeStatus('SEPARADO')} 
                                    />
                                    <AdminAction 
                                        status="VENDIDO" 
                                        activeStatus={lot.estado} 
                                        isLoading={updatingStatus === 'VENDIDO'} 
                                        onClick={() => handleChangeStatus('VENDIDO')} 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalBody>

            <ModalFooter className="border-t border-white/5 pt-8 px-8 pb-8 gap-4">
                <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest px-8 rounded-2xl hover:bg-white/5 transition-all">
                    Cerrar
                </Button>

                {canQuote && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button
                            onClick={handleDownloadPdf}
                            disabled={!canSend || isDownloading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest px-10 h-14 rounded-2xl shadow-2xl shadow-cyan-900/40 flex items-center justify-center gap-3 border border-cyan-400/20 transition-all disabled:opacity-30"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    <span>Generar Cotización Premium</span>
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}
            </ModalFooter>
        </Modal>
    )
}

interface SpecCardProps {
    icon: React.ElementType
    label: string
    value: string | number
    color: 'cyan' | 'blue' | 'indigo' | 'slate'
}

function SpecCard({ icon: Icon, label, value, color }: SpecCardProps) {
    const variants = {
        cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400 shadow-cyan-500/5',
        blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400 shadow-blue-500/5',
        indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400 shadow-indigo-500/5',
        slate: 'from-slate-500/10 to-transparent border-slate-500/20 text-slate-400 shadow-slate-500/5',
    }

    return (
        <div className={cn("p-5 rounded-3xl border bg-gradient-to-br shadow-xl backdrop-blur-sm", variants[color as keyof typeof variants])}>
            <div className="flex items-center gap-2 mb-2.5 opacity-60">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xl font-black text-white leading-none tracking-tight">{value}</p>
        </div>
    )
}

function DimensionItem({ label, value }: { label: string; value: number | null }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">{value || '-'}</span>
                {value && <span className="text-[10px] font-bold text-slate-500">ML</span>}
            </div>
        </div>
    )
}

interface AdminActionProps {
    status: LotStatus
    activeStatus: LotStatus
    isLoading: boolean
    onClick: () => void
}

function AdminAction({ status, activeStatus, isLoading, onClick }: AdminActionProps) {
    const colors = {
        LIBRE: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
        SEPARADO: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
        VENDIDO: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
    }

    if (status === activeStatus) return null

    return (
        <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl border h-9 px-4 text-[10px] font-black uppercase tracking-widest", colors[status as keyof typeof colors])}
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
            Marcar {status}
        </Button>
    )
}


