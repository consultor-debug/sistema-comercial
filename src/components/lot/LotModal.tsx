'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Quoter } from './Quoter'
import { ClientValidator } from './ClientValidator'
import { LOT_STATUS_LABELS } from '@/lib/utils'
import { LotStatus } from '@prisma/client'
import {
    MapPin, Square, Layers, Grid3X3, User,
    FileText, Lock, ChevronRight, CheckCircle2,
    Ruler, Settings
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
            const err = error as { message?: string };
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
            <ModalHeader className="flex items-center justify-between pr-12 pb-6 border-b border-white/10">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Identificador de Lote</span>
                        <ModalTitle className="text-3xl font-black text-white leading-none">Lote {lot.code}</ModalTitle>
                    </div>
                    <StatusBadge status={lot.estado} size="lg" className="h-8 px-4 text-xs font-black" />
                </div>
            </ModalHeader>

            <ModalBody className="space-y-8 py-8">
                <AnimatePresence mode="wait">
                    {sendSuccess ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 glass-strong border border-emerald-500/30 rounded-[2.5rem] text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
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
                                <SpecCard icon={Grid3X3} label="Manzana" value={lot.manzana} color="blue" />
                                <SpecCard icon={MapPin} label="Número" value={lot.loteNumero} color="indigo" />
                                <SpecCard icon={Square} label="Área Total" value={`${lot.areaM2} m²`} color="emerald" />
                                <SpecCard icon={Layers} label="Etapa" value={lot.etapa || '1'} color="purple" />
                            </div>

                            {/* Dimensions Section */}
                            <Card className="border-white/5 bg-slate-900/40 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
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
                                </CardContent>
                            </Card>

                            {/* Asesor info for occupied lots */}
                            {!isLibre && lot.asesor && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                    <User className="w-6 h-6 text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Asesor a Cargo</p>
                                                    <p className="font-bold text-white text-lg leading-tight">{lot.asesor.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-slate-400">{lot.asesor.email}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Interactive Quoter Section */}
                            {canQuote ? (
                                <div className="space-y-8">
                                    <Quoter
                                        precioLista={lot.precioLista}
                                        descuentoMax={lot.descuentoMax}
                                        maxCuotas={projectSettings.maxCuotas}
                                        minInicial={projectSettings.minInicial}
                                        onQuotationCalculated={setQuotation}
                                    />
                                    
                                    <AnimatePresence>
                                        {quotation && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
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
                                <div className="p-10 text-center glass-strong border border-white/5 rounded-[2.5rem]">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                                        <Lock className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Venta Restringida</h4>
                                    <p className="text-slate-400 font-medium">
                                        Este lote se encuentra en estado <span className="text-white font-bold">{LOT_STATUS_LABELS[lot.estado]}</span>.
                                    </p>
                                </div>
                            )}

                            {/* Administrative Actions */}
                            <div className="pt-8 border-t border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Settings className="w-4 h-4 text-slate-500" />
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestión de Inventario</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
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

            <ModalFooter className="border-t border-white/10 pt-6">
                <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white font-bold">
                    Cerrar Ventana
                </Button>

                {canQuote && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={handleDownloadPdf}
                            disabled={!canSend || isDownloading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 h-12 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center gap-3 transition-all disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    GENERAR COTIZACIÓN PRO
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
    color: 'blue' | 'indigo' | 'emerald' | 'purple'
}

function SpecCard({ icon: Icon, label, value, color }: SpecCardProps) {
    const variants = {
        blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400',
        indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400',
        emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400',
        purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-400',
    }

    return (
        <div className={cn("p-4 rounded-2xl border bg-gradient-to-br", variants[color as keyof typeof variants])}>
            <div className="flex items-center gap-2 mb-2 opacity-60">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xl font-black text-white leading-none">{value}</p>
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


