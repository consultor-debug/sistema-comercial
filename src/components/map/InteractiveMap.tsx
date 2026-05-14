'use client'

import * as React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { motion, AnimatePresence } from 'framer-motion'
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
    const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 })

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

    // Track actual rendered image size for correct marker positioning
    React.useEffect(() => {
        const img = imageRef.current
        if (!img) return
        const update = () => setImageSize({ width: img.clientWidth, height: img.clientHeight })
        update()
        const observer = new ResizeObserver(update)
        observer.observe(img)
        return () => observer.disconnect()
    }, [mapImageUrl])

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
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative flex flex-col bg-slate-950/80 backdrop-blur-xl overflow-hidden transition-all duration-500',
                isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl',
                className
            )}
        >
            {/* Header Overlay */}
            <div className="absolute top-0 inset-x-0 z-30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pointer-events-none">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="glass-strong px-4 py-2 rounded-xl border border-white/10 shadow-lg"
                    >
                        <h2 className="text-sm md:text-base font-bold text-white tracking-tight">{projectName}</h2>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="hidden sm:block"
                    >
                        <MapStats
                            total={filteredLots.length}
                            libre={counts.libre}
                            separado={counts.separado}
                            vendido={counts.vendido}
                        />
                    </motion.div>
                </div>

                <div className="flex gap-2 pointer-events-auto shrink-0">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="glass-strong p-2.5 rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        title="Descargar PDF"
                    >
                        {isDownloading ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Download className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="glass-strong p-2.5 rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                </div>
            </div>

            {/* Filters Overlay */}
            <div className="absolute top-16 md:top-20 inset-x-0 z-30 px-4 pointer-events-none">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pointer-events-auto"
                >
                    <MapFilters
                        manzanas={manzanas}
                        etapas={etapas}
                        selectedManzana={selectedManzana}
                        selectedEtapa={selectedEtapa}
                        onManzanaChange={setSelectedManzana}
                        onEtapaChange={setSelectedEtapa}
                    />
                </motion.div>
            </div>

            {/* Map area */}
            <div className="relative flex-1 bg-transparent cursor-grab active:cursor-grabbing overflow-hidden">
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
                                <div className="relative inline-flex items-center justify-center p-4 md:p-10 w-full h-full">
                                    {/* Background map image */}
                                    {mapImageUrl && (
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="relative w-full max-w-5xl"
                                        >
                                            <img
                                                ref={imageRef}
                                                src={mapImageUrl}
                                                alt={projectName}
                                                className="w-full h-auto drop-shadow-2xl rounded-lg block select-none pointer-events-none"
                                                draggable={false}
                                                onLoad={() => {
                                                    if (imageRef.current) {
                                                        setImageSize({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight })
                                                    }
                                                }}
                                            />
                                            
                                            {/* SVG overlay for lot markers — same size as the image */}
                                            {imageSize.width > 0 && (
                                                <svg
                                                    className="absolute inset-0 w-full h-full"
                                                    viewBox="0 0 1000 1000"
                                                    style={{ zIndex: 10, overflow: 'visible' }}
                                                >
                                                    <AnimatePresence>
                                                        {filteredLots.map(lot => (
                                                            <LotMarker
                                                                key={lot.id}
                                                                lot={lot}
                                                                onClick={() => onLotClick(lot)}
                                                                isSelected={selectedLotId === lot.id}
                                                                imageSize={{ width: 1000, height: 1000 }}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                </svg>
                                            )}
                                        </motion.div>
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

            {/* Legend Footer */}
            <div className="absolute bottom-0 inset-x-0 z-30 p-4 pointer-events-none flex justify-start md:justify-center">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="pointer-events-auto"
                >
                    <MapLegend counts={counts} />
                </motion.div>
            </div>
        </motion.div>
    )
}
