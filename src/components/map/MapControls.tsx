'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, FileText, Loader2 } from 'lucide-react'

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
    onFullscreen,
    onDownloadPdf,
    isDownloading = false,
    zoom,
    minZoom = 0.5,
    maxZoom = 3
}) => {
    return (
        <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 flex flex-col gap-2 z-20">
            <div className="flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= maxZoom}
                    className="p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Acercar"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-px bg-slate-700/50 mx-2" />
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= minZoom}
                    className="p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Alejar"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
            </div>

            <button
                onClick={onReset}
                className="p-2.5 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors shadow-xl"
                title="Restablecer"
            >
                <RotateCcw className="w-4 h-4" />
            </button>

            <button
                onClick={onFullscreen}
                className="p-2.5 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors shadow-xl"
                title="Pantalla completa"
            >
                <Maximize2 className="w-4 h-4" />
            </button>

            {onDownloadPdf && (
                <button
                    onClick={onDownloadPdf}
                    disabled={isDownloading}
                    className="p-2.5 bg-blue-600/80 backdrop-blur-md border border-blue-500/50 rounded-xl text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 group overflow-hidden"
                    title="Descargar Plano PDF"
                >
                    {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover:block transition-all duration-300">Descargar Plano</span>
                        </div>
                    )}
                </button>
            )}
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 px-4 lg:px-6 py-4 bg-slate-900/40 border-b border-slate-800">
            {/* Manzana filter */}
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Manzana</span>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => onManzanaChange('all')}
                        className={cn(
                            'px-3 py-1 text-xs rounded-full transition-all border',
                            selectedManzana === 'all'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                        )}
                    >
                        Todas
                    </button>
                    {manzanas.map(m => (
                        <button
                            key={m}
                            onClick={() => onManzanaChange(m)}
                            className={cn(
                                'px-3 py-1 text-xs rounded-full transition-all border',
                                selectedManzana === m
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Etapa filter */}
            {etapas.length > 0 && (
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Etapa</span>
                    <div className="flex flex-wrap gap-1">
                        <button
                            onClick={() => onEtapaChange('all')}
                            className={cn(
                                'px-3 py-1 text-xs rounded-full transition-all border',
                                selectedEtapa === 'all'
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                            )}
                        >
                            Todas
                        </button>
                        {etapas.map(e => (
                            <button
                                key={e}
                                onClick={() => onEtapaChange(e)}
                                className={cn(
                                    'px-3 py-1 text-xs rounded-full transition-all border',
                                    selectedEtapa === e
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
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
        { label: 'No Disponible', color: 'bg-slate-500', count: counts.noDisponible }
    ]

    return (
        <div className="flex flex-wrap gap-4 p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
            {items.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <span className={cn('w-4 h-4 rounded-full', item.color)} />
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Badge variant="neutral" size="sm">{item.count}</Badge>
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
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 px-4 lg:px-6 py-3 bg-slate-900/20">
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                <span className="text-lg font-bold text-white leading-none">{total}</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Libres</span>
                <span className="text-lg font-bold text-emerald-400 leading-none">{libre}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">Separados</span>
                <span className="text-lg font-bold text-amber-400 leading-none">{separado}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest">Vendidos</span>
                <span className="text-lg font-bold text-rose-400 leading-none">{vendido}</span>
            </div>
        </div>
    )
}
