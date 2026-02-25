'use client'

import * as React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/utils'
import { LotMarker } from './LotMarker'
import { MapControls, MapFilters, MapLegend, MapStats } from './MapControls'
import { LotStatus } from '@prisma/client'

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
    mapShapeType: string | null
    mapShapeData: unknown
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface InteractiveMapProps {
    projectName: string
    mapImageUrl: string
    lots: Lot[]
    onLotClick: (lot: Lot) => void
    selectedLotId?: string | null
    className?: string
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
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
            await document.exitFullscreen()
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
                                <div className="relative min-w-[300px] min-h-[300px] lg:min-w-[1200px] lg:min-h-[800px] flex items-center justify-center">
                                    {/* Background map image */}
                                    {mapImageUrl && (
                                        <img
                                            src={mapImageUrl}
                                            alt={projectName}
                                            className="max-w-none shadow-2xl"
                                            draggable={false}
                                        />
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
