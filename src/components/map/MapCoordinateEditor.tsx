'use client'

import * as React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MapControls } from './MapControls'
import { Check, Crosshair, Save, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface Lot {
    id: string
    code: string
    manzana: string
    loteNumero: number
    mapShapeType: string | null
    mapShapeData: {
        x?: number
        y?: number
        radius?: number
    } | null
    estado: string
}

interface MapCoordinateEditorProps {
    mapImageUrl: string
    lots: Lot[]
    onSave: (lotId: string, data: { x: number; y: number; radius: number }) => Promise<void>
}

export function MapCoordinateEditor({ mapImageUrl, lots, onSave }: MapCoordinateEditorProps) {
    const [selectedLotId, setSelectedLotId] = React.useState<string | null>(null)
    const [zoom, setZoom] = React.useState(1)
    const [isSaving, setIsSaving] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')

    const imageRef = React.useRef<HTMLImageElement>(null)

    // Local state for lot coordinates before saving
    const [tempCoords, setTempCoords] = React.useState<Record<string, { x: number; y: number; radius: number }>>({})
    const [markerRadius, setMarkerRadius] = React.useState(22)

    const filteredLots = lots.filter(l =>
        l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.manzana.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectedLotId || !imageRef.current) return

        const img = imageRef.current
        const rect = img.getBoundingClientRect()

        // Coordenadas relativas a la imagen renderizada (considerando el zoom del TransformWrapper)
        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom

        // Coordenadas normalizadas (0 a 1) respecto al tamaño actual de la imagen en el editor
        // Pero para máxima precisión, usamos el tamaño natural de la imagen como base
        const xNorm = x / img.clientWidth
        const yNorm = y / img.clientHeight

        setTempCoords(prev => ({
            ...prev,
            [selectedLotId]: { x: xNorm, y: yNorm, radius: markerRadius }
        }))
    }

    const handleSave = async () => {
        if (!selectedLotId || !tempCoords[selectedLotId]) return

        setIsSaving(true)
        try {
            // Guardamos las coordenadas normalizadas
            await onSave(selectedLotId, tempCoords[selectedLotId])
            // Clear temp coord after save success
            const newTemp = { ...tempCoords }
            delete newTemp[selectedLotId]
            setTempCoords(newTemp)
        } catch (error) {
            console.error('Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const selectedLot = lots.find(l => l.id === selectedLotId)
    const currentCoords = selectedLotId ? (tempCoords[selectedLotId] || (selectedLot?.mapShapeData as { x: number; y: number; radius: number })) : null

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-[600px] lg:h-[800px]">
            {/* Sidebar: Control Panel & Lot List */}
            <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl max-h-[500px] lg:max-h-full">
                {/* Active Selection & Controls */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-blue-400" />
                            Control de Lotes
                        </h3>
                        {selectedLotId && currentCoords && (
                            <Button
                                onClick={handleSave}
                                isLoading={isSaving}
                                size="sm"
                                className="h-8 px-3"
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Guardar
                            </Button>
                        )}
                    </div>

                    {selectedLotId ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                <div className="text-xs text-blue-400 font-medium mb-1">EDITANDO</div>
                                <div className="text-white font-bold text-lg">{selectedLot?.code}</div>
                                <div className="text-xs text-slate-400 truncate">Mz. {selectedLot?.manzana} - Lote {selectedLot?.loteNumero}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Tamaño</span>
                                    <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{markerRadius}px</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={markerRadius}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            setMarkerRadius(val)
                                            if (selectedLotId && tempCoords[selectedLotId]) {
                                                setTempCoords(prev => ({
                                                    ...prev,
                                                    [selectedLotId]: { ...prev[selectedLotId], radius: val }
                                                }))
                                            }
                                        }}
                                        className="flex-1 accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <Input
                                        type="number"
                                        value={markerRadius}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0
                                            setMarkerRadius(val)
                                            if (selectedLotId && tempCoords[selectedLotId]) {
                                                setTempCoords(prev => ({
                                                    ...prev,
                                                    [selectedLotId]: { ...prev[selectedLotId], radius: val }
                                                }))
                                            }
                                        }}
                                        className="w-14 h-7 text-center text-xs bg-slate-950 border-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700/50 dashed rounded-xl p-4 text-center">
                            <p className="text-slate-500 text-xs">Selecciona un lote para posicionarlo en el plano</p>
                        </div>
                    )}
                </div>

                <div className="p-3 border-b border-slate-700/50 bg-slate-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
                        <Input
                            placeholder="Filtrar por código o mz..."
                            className="pl-8 h-8 text-xs bg-slate-800/50 border-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-2 space-y-0.5">
                    {filteredLots.map(lot => {
                        const hasCoords = lot.mapShapeData || tempCoords[lot.id]
                        const isSelected = lot.id === selectedLotId

                        return (
                            <button
                                key={lot.id}
                                onClick={() => {
                                    setSelectedLotId(lot.id)
                                    const coords = tempCoords[lot.id] || (lot.mapShapeData as any)
                                    if (coords && coords.radius) {
                                        setMarkerRadius(coords.radius)
                                    }
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${isSelected
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">{lot.code}</span>
                                    <span className="text-xs opacity-70">Mz. {lot.manzana} - Lote {lot.loteNumero}</span>
                                </div>
                                {hasCoords && (
                                    <Badge variant="success" size="sm" className={isSelected ? 'bg-white/20 text-white border-transparent' : ''}>
                                        <Check className="w-3 h-3 mr-1" />
                                        Mapeado
                                    </Badge>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Area: Map Editor */}
            <div className="lg:col-span-9 flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden relative h-[500px] lg:h-full">
                {/* Map Tools Overlay */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    {!selectedLotId && (
                        <div className="glass-strong px-4 py-2 rounded-xl border border-slate-700/50 text-slate-400 text-sm pointer-events-auto">
                            ← Selecciona un lote de la lista
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair">
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.1}
                        maxScale={5}
                        centerOnInit
                        limitToBounds={false}
                        panning={{ velocityDisabled: false }}
                        onTransformed={(ref) => setZoom(ref.state.scale)}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <TransformComponent
                                    wrapperStyle={{ width: '100%', height: '100%' }}
                                    contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <div
                                        className="relative inline-flex items-center justify-center bg-slate-900/20"
                                        onClick={handleMapClick}
                                    >
                                        <img
                                            ref={imageRef}
                                            src={mapImageUrl}
                                            alt="Map"
                                            className="max-w-none shadow-2xl block"
                                            style={{ minWidth: '800px' }}
                                            draggable={false}
                                        />

                                        {/* Render already mapped lots as indicators using a single SVG overlay */}
                                        <svg
                                            className="absolute inset-0 pointer-events-none"
                                            style={{ width: '100%', height: '100%', zIndex: 10, overflow: 'visible' }}
                                        >
                                            {imageRef.current && lots.map(lot => {
                                                const coords = tempCoords[lot.id] || (lot.mapShapeData as { x: number; y: number; radius: number })
                                                if (!coords) return null

                                                const isSelected = lot.id === selectedLotId
                                                const radius = coords.radius || 22

                                                // Convert normalized coordinates back to pixels for rendering
                                                // If x > 1, it's probably old absolute data, we handle it as 1:1 for now
                                                const isNormalized = coords.x <= 1 && coords.y <= 1
                                                const renderX = isNormalized ? coords.x * imageRef.current!.clientWidth : coords.x
                                                const renderY = isNormalized ? coords.y * imageRef.current!.clientHeight : coords.y

                                                const statusColors: Record<string, string> = {
                                                    LIBRE: '#10B981',
                                                    SEPARADO: '#F59E0B',
                                                    VENDIDO: '#EF4444',
                                                    NO_DISPONIBLE: '#64748B'
                                                }
                                                const color = statusColors[lot.estado] || '#10B981'

                                                return (
                                                    <g key={lot.id} className="transition-opacity duration-300" style={{ opacity: !selectedLotId || isSelected ? 1 : 0.2 }}>
                                                        {isSelected && (
                                                            <circle
                                                                cx={renderX}
                                                                cy={renderY}
                                                                r={radius + 6}
                                                                fill="none"
                                                                stroke="#3B82F6"
                                                                strokeWidth={2}
                                                            />
                                                        )}
                                                        <circle
                                                            cx={renderX}
                                                            cy={renderY}
                                                            r={radius}
                                                            fill={color}
                                                            fillOpacity={isSelected ? 0.4 : 0.2}
                                                            stroke={isSelected ? '#fff' : color}
                                                            strokeWidth={isSelected ? 2 : 1}
                                                        />
                                                        <text
                                                            x={renderX}
                                                            y={renderY}
                                                            textAnchor="middle"
                                                            dominantBaseline="central"
                                                            fill="#fff"
                                                            fontSize={radius * 0.7}
                                                            fontWeight="bold"
                                                            className="pointer-events-none select-none"
                                                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                        >
                                                            {lot.code}
                                                        </text>
                                                    </g>
                                                )
                                            })}
                                        </svg>
                                    </div>
                                </TransformComponent>
                                <MapControls
                                    zoom={zoom}
                                    onZoomIn={() => zoomIn()}
                                    onZoomOut={() => zoomOut()}
                                    onReset={() => resetTransform()}
                                    onFullscreen={() => { }}
                                />
                            </>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        </div>
    )
}
