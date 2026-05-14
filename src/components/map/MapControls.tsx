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
    onZoomIn,
    onZoomOut,
    onReset,
    zoom,
    minZoom = 0.3,
    maxZoom = 5
}) => {
    return (
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 flex flex-col gap-1.5 z-40">
            <div className="flex flex-col bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= maxZoom}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                    title="Acercar"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-px bg-white/5 mx-2" />
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= minZoom}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                    title="Alejar"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
            </div>

            <button
                onClick={onReset}
                className="p-2.5 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Restablecer"
            >
                <RotateCcw className="w-4 h-4" />
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
    manzanas,
    etapas,
    selectedManzana,
    selectedEtapa,
    onManzanaChange,
    onEtapaChange
}) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider shrink-0">Mz</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => onManzanaChange('all')}
                        className={cn(
                            'px-3 py-1 text-xs rounded-md transition-colors border shrink-0',
                            selectedManzana === 'all'
                                ? 'bg-white text-slate-950 border-white'
                                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                        )}
                    >
                        Todas
                    </button>
                    {manzanas.map(m => (
                        <button
                            key={m}
                            onClick={() => onManzanaChange(m)}
                            className={cn(
                                'px-3 py-1 text-xs rounded-md transition-colors border shrink-0',
                                selectedManzana === m
                                    ? 'bg-white text-slate-950 border-white'
                                    : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {etapas.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider shrink-0">Et</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onEtapaChange('all')}
                            className={cn(
                                'px-3 py-1 text-xs rounded-md transition-colors border shrink-0',
                                selectedEtapa === 'all'
                                    ? 'bg-white text-slate-950 border-white'
                                    : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                            )}
                        >
                            Todas
                        </button>
                        {etapas.map(e => (
                            <button
                                key={e}
                                onClick={() => onEtapaChange(e)}
                                className={cn(
                                    'px-3 py-1 text-xs rounded-md transition-colors border shrink-0',
                                    selectedEtapa === e
                                        ? 'bg-white text-slate-950 border-white'
                                        : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                                )}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface MapLegendProps {
    counts: {
        libre: number
        separado: number
        vendido: number
        noDisponible: number
    }
}

export const MapLegend: React.FC<MapLegendProps> = ({ counts }) => {
    const items = [
        { label: 'Libre', color: 'bg-emerald-500', count: counts.libre },
        { label: 'Separado', color: 'bg-amber-500', count: counts.separado },
        { label: 'Vendido', color: 'bg-rose-500', count: counts.vendido },
        { label: 'Bloqueado', color: 'bg-slate-500', count: counts.noDisponible }
    ]

    return (
        <div className="flex gap-1.5 items-center p-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg">
            {items.map(item => (
                <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
                    <span className={cn('w-2 h-2 rounded-full', item.color)} />
                    <span className="text-[10px] text-slate-400">{item.label}</span>
                    <span className="text-[10px] font-medium text-white">{item.count}</span>
                </div>
            ))}
        </div>
    )
}

interface MapStatsProps {
    total: number
    libre: number
    separado: number
    vendido: number
}

export const MapStats: React.FC<MapStatsProps> = ({ total, libre, separado, vendido }) => {
    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg">
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase">Total</span>
                <span className="text-lg font-semibold text-white leading-none">{total}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex gap-3">
                <div className="flex flex-col">
                    <span className="text-[9px] text-emerald-500/70 uppercase">Libres</span>
                    <span className="text-sm font-semibold text-emerald-400 leading-none">{libre}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-amber-500/70 uppercase">Sep.</span>
                    <span className="text-sm font-semibold text-amber-400 leading-none">{separado}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-rose-500/70 uppercase">Vend.</span>
                    <span className="text-sm font-semibold text-rose-400 leading-none">{vendido}</span>
                </div>
            </div>
        </div>
    )
}
