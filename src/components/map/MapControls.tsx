'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface MapControlsProps {
    onZoomIn: () => void
    onZoomOut: () => void
    onReset: () => void
    onFullscreen: () => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    zoom: number
    minZoom?: number
    maxZoom?: number
}

export const MapControls: React.FC<MapControlsProps> = ({
    onZoomIn, onZoomOut, onReset, zoom, minZoom = 0.3, maxZoom = 5
}) => {
    const pct = Math.round(zoom * 100)
    return (
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-40">
            {/* Zoom + / - */}
            <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= maxZoom}
                    className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-30"
                    title="Acercar"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-px bg-gray-100 mx-2" />
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= minZoom}
                    className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-30"
                    title="Alejar"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
            </div>

            {/* Reset + porcentaje */}
            <button
                onClick={onReset}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                title="Restablecer"
            >
                <RotateCcw className="w-3 h-3" />
                {pct}%
            </button>
        </div>
    )
}

interface MapFiltersProps {
    manzanas: string[]
    etapas: string[]
    selectedManzana: string | 'all'
    selectedEtapa: string | 'all'
    onManzanaChange: (value: string | 'all') => void
    onEtapaChange: (value: string | 'all') => void
}

export const MapFilters: React.FC<MapFiltersProps> = ({
    manzanas, etapas, selectedManzana, selectedEtapa, onManzanaChange, onEtapaChange
}) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider shrink-0">Mz</span>
                <div className="flex gap-1">
                    {['all', ...manzanas].map(m => (
                        <button key={m} onClick={() => onManzanaChange(m as string | 'all')}
                            className={cn('px-3 py-1 text-xs rounded-md border transition-colors shrink-0',
                                selectedManzana === m
                                    ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            )}
                        >{m === 'all' ? 'Todas' : m}</button>
                    ))}
                </div>
            </div>
            {etapas.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider shrink-0">Et</span>
                    <div className="flex gap-1">
                        {['all', ...etapas].map(e => (
                            <button key={e} onClick={() => onEtapaChange(e as string | 'all')}
                                className={cn('px-3 py-1 text-xs rounded-md border transition-colors shrink-0',
                                    selectedEtapa === e
                                        ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                        : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                )}
                            >{e === 'all' ? 'Todas' : e}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface MapLegendProps {
    counts: { libre: number; separado: number; vendido: number; noDisponible: number }
    total?: number
}

export const MapLegend: React.FC<MapLegendProps> = ({ counts, total }) => {
    // Colores estilo Mattika — pasteles con borde
    const items = [
        { label: 'Disponible', dot: 'bg-blue-400 border-blue-600',  text: 'text-blue-700',  count: counts.libre },
        { label: 'Separado',   dot: 'bg-amber-200 border-amber-500',text: 'text-amber-700', count: counts.separado },
        { label: 'Vendido',    dot: 'bg-gray-300 border-gray-500',  text: 'text-gray-600',  count: counts.vendido },
        { label: 'Bloqueado',  dot: 'bg-slate-700 border-slate-900',text: 'text-slate-500', count: counts.noDisponible },
    ]
    return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm">
            {total !== undefined && (
                <>
                    <div className="flex items-center gap-1 px-1.5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                        <span className="text-xs font-bold text-gray-800">{total}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                </>
            )}
            {items.map((item, i) => (
                <React.Fragment key={item.label}>
                    {i > 0 && <div className="w-px h-3 bg-gray-200 mx-0.5" />}
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg">
                        <span className={cn('w-2.5 h-2.5 rounded-sm border shrink-0', item.dot)} />
                        <span className="text-[10px] text-gray-500 hidden sm:inline">{item.label}</span>
                        <span className={cn('text-[11px] font-bold', item.text)}>{item.count}</span>
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
}

interface MapStatsProps {
    total: number; libre: number; separado: number; vendido: number
}

export const MapStats: React.FC<MapStatsProps> = ({ total, libre, separado, vendido }) => {
    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase">Total</span>
                <span className="text-lg font-semibold text-gray-900 leading-none">{total}</span>
            </div>
            <div className="w-px h-6 bg-gray-100" />
            <div className="flex gap-3">
                <div className="flex flex-col">
                    <span className="text-[9px] text-blue-400 uppercase">Libres</span>
                    <span className="text-sm font-semibold text-blue-600 leading-none">{libre}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-amber-500 uppercase">Sep.</span>
                    <span className="text-sm font-semibold text-amber-600 leading-none">{separado}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 uppercase">Vend.</span>
                    <span className="text-sm font-semibold text-gray-500 leading-none">{vendido}</span>
                </div>
            </div>
        </div>
    )
}
