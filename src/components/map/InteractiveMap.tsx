'use client'

import * as React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/utils'
import { LotMarker } from './LotMarker'
import { MapControls, MapFilters, MapLegend, MapStats } from './MapControls'
import { Lot } from '@prisma/client'

interface InteractiveMapProps {
    projectId: string
    projectName: string
    mapImageUrl: string
    lots: Lot[]
    onLotClick: (lot: Lot) => void
    selectedLotId?: string | null
    className?: string
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
    projectId,
    projectName,
    mapImageUrl,
    lots,
    onLotClick,
    selectedLotId,
    className
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [zoom, setZoom] = React.useState(1)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [isDownloading, setIsDownloading] = React.useState(false)

    // Filters
    const [selectedManzana, setSelectedManzana] = React.useState<string | 'all'>('all')
    const [selectedEtapa, setSelectedEtapa] = React.useState<string | 'all'>('all')

    // Get unique manzanas and etapas
    const manzanas = React.useMemo(() =>
        [...new Set(lots.map(l => l.manzana))].sort(),
        [lots]
    )

    const etapas = React.useMemo(() =>
        [...new Set(lots.filter(l => l.etapa).map(l => l.etapa!))].sort(),
        [lots]
    )

    // Filter lots
    const filteredLots = React.useMemo(() => {
        return lots.filter(lot => {
            if (selectedManzana !== 'all' && lot.manzana !== selectedManzana) return false
            if (selectedEtapa !== 'all' && lot.etapa !== selectedEtapa) return false
            return true
        })
    }, [lots, selectedManzana, selectedEtapa])

    // Calculate counts
    const counts = React.useMemo(() => ({
        libre: filteredLots.filter(l => l.estado === 'LIBRE').length,
        separado: filteredLots.filter(l => l.estado === 'SEPARADO').length,
        vendido: filteredLots.filter(l => l.estado === 'VENDIDO').length,
        noDisponible: filteredLots.filter(l => l.estado === 'NO_DISPONIBLE').length
    }), [filteredLots])

    // Fullscreen toggle
    const handleFullscreen = async () => {
        if (!containerRef.current) return

        if (!isFullscreen) {
            await containerRef.current.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
            }
            setIsFullscreen(false)
        }
    }

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const handleDownloadPdf = async () => {
        setIsDownloading(true)
        try {
            const response = await fetch(`/api/projects/${projectId}/map/download`)
            if (!response.ok) throw new Error('Error al generar PDF')
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Plano-${projectName.replace(/\s+/g, '-')}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download error:', error)
            alert('No se pudo descargar el plano en este momento.')
        } finally {
            setIsDownloading(false)
        }
    }

    // Fullscreen toggle unchanged

    return (
        <div
            ref={containerRef}
            className={cn(
                'flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50',
                isFullscreen && 'rounded-none',
                className
            )}
        >
            {/* Header */}
            <div className="px-4 py-3 lg:px-6 lg:py-4 border-b border-slate-700/50 bg-slate-800/50">
                <h2 className="text-lg lg:text-xl font-semibold text-white">{projectName}</h2>
            </div>

            {/* Stats */}
            <MapStats
                total={filteredLots.length}
                libre={counts.libre}
                separado={counts.separado}
                vendido={counts.vendido}
            />

            {/* Filters */}
            <MapFilters
                manzanas={manzanas}
                etapas={etapas}
                selectedManzana={selectedManzana}
                selectedEtapa={selectedEtapa}
                onManzanaChange={setSelectedManzana}
                onEtapaChange={setSelectedEtapa}
            />

            {/* Map area */}
            <div className="relative flex-1 min-h-[500px] bg-slate-950">
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={3}
                    centerOnInit
                    onTransformed={(ref) => setZoom(ref.state.scale)}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            <TransformComponent
                                wrapperStyle={{ width: '100%', height: '100%' }}
                                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <div className="relative inline-flex items-center justify-center">
                                    {/* Background map image */}
                                    {mapImageUrl && (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={mapImageUrl}
                                                alt={projectName}
                                                className="max-w-none shadow-2xl block"
                                                style={{ minWidth: '800px' }}
                                                draggable={false}
                                            />
                                        </>
                                    )}

                                    {/* SVG overlay for lot markers */}
                                    <svg
                                        className="absolute inset-0 pointer-events-none w-full h-full"
                                        style={{ pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
                                    >
                                        <g style={{ pointerEvents: 'auto' }}>
                                            {filteredLots.map(lot => (
                                                <LotMarker
                                                    key={lot.id}
                                                    lot={lot}
                                                    onClick={() => onLotClick(lot)}
                                                    isSelected={selectedLotId === lot.id}
                                                    scale={zoom}
                                                />
                                            ))}
                                        </g>
                                    </svg>
                                </div>
                            </TransformComponent>

                            <MapControls
                                zoom={zoom}
                                onZoomIn={() => zoomIn()}
                                onZoomOut={() => zoomOut()}
                                onReset={() => resetTransform()}
                                onFullscreen={handleFullscreen}
                                onDownloadPdf={handleDownloadPdf}
                                isDownloading={isDownloading}
                            />
                        </>
                    )}
                </TransformWrapper>
            </div>

            {/* Legend */}
            <MapLegend counts={counts} />
        </div>
    )
}
