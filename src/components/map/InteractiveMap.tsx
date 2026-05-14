'use client'

import * as React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/utils'
import { LotMarker } from './LotMarker'
import { MapControls, MapFilters, MapLegend, MapStats } from './MapControls'
import { Lot } from '@prisma/client'
import { Maximize2, Minimize2, Download } from 'lucide-react'

interface InteractiveMapProps {
    projectId: string
    projectName: string
    mapImageUrl: string
    lots: Lot[]
    onLotClick: (lot: Lot) => void
    selectedLotId?: string | null
    className?: string
}

/**
 * Normalized coordinate system: all lot coordinates are stored as 0-1 fractions.
 * We always use a 1000x1000 SVG viewBox so that markers have consistent sizing.
 */
const VIEW_SIZE = 1000

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
    const imageRef = React.useRef<HTMLImageElement>(null)
    const [zoom, setZoom] = React.useState(1)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)

    // Filters
    const [selectedManzana, setSelectedManzana] = React.useState<string | 'all'>('all')
    const [selectedEtapa, setSelectedEtapa] = React.useState<string | 'all'>('all')

    const manzanas = React.useMemo(() =>
        [...new Set(lots.map(l => l.manzana))].sort(),
        [lots]
    )

    const etapas = React.useMemo(() =>
        [...new Set(lots.filter(l => l.etapa).map(l => l.etapa!))].sort(),
        [lots]
    )

    const filteredLots = React.useMemo(() => {
        return lots.filter(lot => {
            if (selectedManzana !== 'all' && lot.manzana !== selectedManzana) return false
            if (selectedEtapa !== 'all' && lot.etapa !== selectedEtapa) return false
            return true
        })
    }, [lots, selectedManzana, selectedEtapa])

    const counts = React.useMemo(() => ({
        libre: filteredLots.filter(l => l.estado === 'LIBRE').length,
        separado: filteredLots.filter(l => l.estado === 'SEPARADO').length,
        vendido: filteredLots.filter(l => l.estado === 'VENDIDO').length,
        noDisponible: filteredLots.filter(l => l.estado === 'NO_DISPONIBLE').length
    }), [filteredLots])

    const handleFullscreen = async () => {
        if (!containerRef.current) return
        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                await containerRef.current.requestFullscreen()
            }
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
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative flex flex-col bg-slate-950 overflow-hidden transition-all duration-300',
                isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-xl border border-white/5',
                className
            )}
        >
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-30 p-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10">
                        <h2 className="text-xs font-semibold text-white">{projectName}</h2>
                    </div>
                    <div className="hidden sm:block">
                        <MapStats
                            total={filteredLots.length}
                            libre={counts.libre}
                            separado={counts.separado}
                            vendido={counts.vendido}
                        />
                    </div>
                </div>

                <div className="flex gap-1.5 pointer-events-auto">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/70 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                        title="Descargar PDF"
                    >
                        {isDownloading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/70 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isFullscreen ? "Salir" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="absolute top-12 inset-x-0 z-30 px-3 pointer-events-none">
                <div className="pointer-events-auto">
                    <MapFilters
                        manzanas={manzanas}
                        etapas={etapas}
                        selectedManzana={selectedManzana}
                        selectedEtapa={selectedEtapa}
                        onManzanaChange={setSelectedManzana}
                        onEtapaChange={setSelectedEtapa}
                    />
                </div>
            </div>

            {/* Map */}
            <div className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden">
                <TransformWrapper
                    initialScale={1}
                    minScale={0.3}
                    maxScale={5}
                    centerOnInit
                    onTransformed={(ref) => setZoom(ref.state.scale)}
                    doubleClick={{ disabled: false }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            <TransformComponent
                                wrapperStyle={{ width: '100%', height: '100%' }}
                                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <div className="relative inline-flex items-center justify-center p-2 w-full h-full">
                                    {mapImageUrl && (
                                        <div className="relative w-full max-w-full">
                                            <img
                                                ref={imageRef}
                                                src={mapImageUrl}
                                                alt={projectName}
                                                className="w-full h-auto block select-none pointer-events-none"
                                                draggable={false}
                                                onLoad={() => setImageLoaded(true)}
                                            />
                                            
                                            {/* SVG overlay — fixed 1000x1000 coordinate system */}
                                            {imageLoaded && (
                                                <svg
                                                    className="absolute inset-0 w-full h-full"
                                                    viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
                                                    preserveAspectRatio="none"
                                                    style={{ zIndex: 10 }}
                                                >
                                                    {filteredLots.map(lot => (
                                                        <LotMarker
                                                            key={lot.id}
                                                            lot={lot}
                                                            onClick={() => onLotClick(lot)}
                                                            isSelected={selectedLotId === lot.id}
                                                            imageSize={{ width: VIEW_SIZE, height: VIEW_SIZE }}
                                                        />
                                                    ))}
                                                </svg>
                                            )}
                                        </div>
                                    )}
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
            <div className="absolute bottom-0 inset-x-0 z-30 p-3 pointer-events-none flex justify-center">
                <div className="pointer-events-auto">
                    <MapLegend counts={counts} />
                </div>
            </div>
        </div>
    )
}
