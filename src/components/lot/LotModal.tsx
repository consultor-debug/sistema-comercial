'use client'

import * as React from 'react'
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
    Send, FileText, Lock
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
}

export const LotModal: React.FC<LotModalProps> = ({
    lot,
    isOpen,
    onClose,
    projectSettings = {}
}) => {
    const [quotation, setQuotation] = React.useState<QuotationResult | null>(null)
    const [client, setClient] = React.useState<ValidatedClient | null>(null)
    const [isSending, setIsSending] = React.useState(false)
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

    const handleSendQuotation = async () => {
        if (!canSend || !quotation || !client) return

        setIsSending(true)

        try {
            const response = await fetch('/api/quotations/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotId: lot.id,
                    quotation,
                    client
                })
            })

            const data = await response.json()

            if (data.success) {
                setSendSuccess(true)
                // Show success for 2 seconds then close
                setTimeout(() => {
                    onClose()
                }, 2000)
            } else {
                alert(data.error || 'Error al enviar la cotización')
            }
        } catch {
            alert('Error de conexión. Intente nuevamente.')
        } finally {
            setIsSending(false)
        }
    }

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

            // Abrir en el navegador directamente usando el Endpoint GET
            // El backend le pondrá el nombre correcto al archivo: Cotizacion_LOTE.pdf
            const pdfUrl = `/api/quotations/download?id=${result.quotationId}`
            window.open(pdfUrl, '_blank')
        } catch (error: any) {
            console.error('Download error:', error)
            alert(error.message || 'Error al visualizar PDF.')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalHeader className="flex items-center justify-between pr-12">
                <div className="flex items-center gap-4">
                    <ModalTitle>Lote {lot.code}</ModalTitle>
                    <StatusBadge status={lot.estado} size="lg" />
                </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
                {/* Success message */}
                {sendSuccess && (
                    <div className="p-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
                        <div className="text-4xl mb-2">✓</div>
                        <h3 className="text-xl font-semibold text-emerald-400 mb-1">
                            ¡Cotización Enviada!
                        </h3>
                        <p className="text-slate-300">
                            Se ha generado el PDF y enviado al correo del cliente.
                        </p>
                    </div>
                )}

                {!sendSuccess && (
                    <>
                        {/* Lot info cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <InfoCard
                                icon={<Grid3X3 className="w-4 h-4" />}
                                label="Manzana"
                                value={lot.manzana}
                            />
                            <InfoCard
                                icon={<MapPin className="w-4 h-4" />}
                                label="Lote N°"
                                value={lot.loteNumero.toString()}
                            />
                            <InfoCard
                                icon={<Square className="w-4 h-4" />}
                                label="Área"
                                value={`${lot.areaM2} m²`}
                            />
                            <InfoCard
                                icon={<Layers className="w-4 h-4" />}
                                label="Tipología"
                                value={lot.tipologia || '-'}
                            />
                            <InfoCard
                                icon={<FileText className="w-4 h-4" />}
                                label="Etapa"
                                value={lot.etapa || '-'}
                            />
                        </div>

                        {/* Asesor info if lot is not LIBRE */}
                        {!isLibre && lot.asesor && (
                            <Card variant="bordered" className="border-amber-500/30 bg-amber-500/5">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <User className="w-5 h-5 text-amber-400" />
                                    <div>
                                        <p className="text-sm text-amber-400">Asesor Responsable</p>
                                        <p className="font-medium text-white">{lot.asesor.name}</p>
                                        <p className="text-sm text-slate-400">{lot.asesor.email}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Dimensions */}
                        <Card variant="glass">
                            <CardContent className="p-4">
                                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                                    Dimensiones
                                </h4>
                                <div className="grid grid-cols-4 gap-4">
                                    <DimensionCard label="Frente" value={lot.frenteM} />
                                    <DimensionCard label="Fondo" value={lot.fondoM} />
                                    <DimensionCard label="Lado Der." value={lot.ladoDerM} />
                                    <DimensionCard label="Lado Izq." value={lot.ladoIzqM} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quoter section - only for LIBRE lots */}
                        {canQuote ? (
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Quoter
                                        precioLista={lot.precioLista}
                                        descuentoMax={lot.descuentoMax}
                                        maxCuotas={projectSettings.maxCuotas}
                                        minInicial={projectSettings.minInicial}
                                        onQuotationCalculated={setQuotation}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <ClientValidator
                                        onValidated={setClient}
                                        disabled={!quotation}
                                    />
                                </div>
                            </div>
                        ) : (
                            <Card variant="bordered" className="border-slate-600">
                                <CardContent className="p-6 text-center">
                                    <Lock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                                    <h4 className="text-lg font-medium text-slate-300 mb-2">
                                        Cotización no disponible
                                    </h4>
                                    <p className="text-slate-400">
                                        Este lote está {LOT_STATUS_LABELS[lot.estado].toLowerCase()} y no se puede cotizar.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </ModalBody>

            {!sendSuccess && (
                <ModalFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>

                    {canQuote && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleDownloadPdf}
                                disabled={!canSend || isDownloading || isSending}
                                isLoading={isDownloading}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Descargar PDF
                            </Button>

                            <Button
                                variant="success"
                                onClick={handleSendQuotation}
                                disabled={!canSend || isSending || isDownloading}
                                isLoading={isSending}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Cotización
                            </Button>
                        </div>
                    )}
                </ModalFooter>
            )}
        </Modal>
    )
}

// Helper components
const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
    icon, label, value
}) => (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            {icon}
            <span className="text-xs">{label}</span>
        </div>
        <p className="font-semibold text-white">{value}</p>
    </div>
)

const DimensionCard: React.FC<{ label: string; value: number | null }> = ({
    label, value
}) => (
    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="font-semibold text-white">
            {value ? `${value} m` : '-'}
        </p>
    </div>
)
