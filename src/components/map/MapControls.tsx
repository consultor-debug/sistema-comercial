'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
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
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 flex flex-col gap-2 md:gap-3 z-40">
            <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col glass-strong border border-white/10 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl"
            >
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= maxZoom}
                    className="p-2.5 md:p-3.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 active:scale-90"
                    title="Acercar"
                >
                    <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="h-px bg-white/10 mx-2 md:mx-3" />
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= minZoom}
                    className="p-2.5 md:p-3.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 active:scale-90"
                    title="Alejar"
                >
                    <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </motion.div>

            <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={onReset}
                className="p-2.5 md:p-3.5 glass-strong border border-white/10 rounded-xl md:rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-xl active:scale-90"
                title="Restablecer"
            >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
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
        <div className="flex flex-col gap-3">
            {/* Manzana filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest shrink-0 ml-1">MZ</span>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => onManzanaChange('all')}
                        className={cn(
                            'px-4 py-1.5 text-xs font-bold rounded-xl transition-all border shrink-0',
                            selectedManzana === 'all'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'glass-strong border-white/5 text-slate-400 hover:border-white/20'
                        )}
                    >
                        Todas
                    </button>
                    {manzanas.map(m => (
                        <button
                            key={m}
                            onClick={() => onManzanaChange(m)}
                            className={cn(
                                'px-4 py-1.5 text-xs font-bold rounded-xl transition-all border shrink-0',
                                selectedManzana === m
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                    : 'glass-strong border-white/5 text-slate-400 hover:border-white/20'
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Etapa filter */}
            {etapas.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest shrink-0 ml-1">ET</span>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => onEtapaChange('all')}
                            className={cn(
                                'px-4 py-1.5 text-xs font-bold rounded-xl transition-all border shrink-0',
                                selectedEtapa === 'all'
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                    : 'glass-strong border-white/5 text-slate-400 hover:border-white/20'
                            )}
                        >
                            Todas
                        </button>
                        {etapas.map(e => (
                            <button
                                key={e}
                                onClick={() => onEtapaChange(e)}
                                className={cn(
                                    'px-4 py-1.5 text-xs font-bold rounded-xl transition-all border shrink-0',
                                    selectedEtapa === e
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                        : 'glass-strong border-white/5 text-slate-400 hover:border-white/20'
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
        { label: 'Libre', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', count: counts.libre },
        { label: 'Separado', color: 'bg-amber-500', shadow: 'shadow-amber-500/20', count: counts.separado },
        { label: 'Vendido', color: 'bg-rose-500', shadow: 'shadow-rose-500/20', count: counts.vendido },
        { label: 'Bloqueado', color: 'bg-slate-500', shadow: 'shadow-slate-500/20', count: counts.noDisponible }
    ]

    return (
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 items-center p-2 md:p-3 glass-strong border border-white/10 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-sm md:max-w-none mx-auto">
            {items.map(item => (
                <div key={item.label} className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 rounded-lg md:rounded-xl border border-white/5">
                    <span className={cn('w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-lg shrink-0', item.color, item.shadow)} />
                    <span className="text-[9px] md:text-[11px] font-bold text-slate-300 uppercase tracking-tight">{item.label}</span>
                    <span className="text-[9px] md:text-[11px] font-black text-white/50">{item.count}</span>
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
        <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2 md:py-3 glass-strong border border-white/10 rounded-xl md:rounded-2xl shadow-2xl">
            <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</span>
                <span className="text-base md:text-xl font-black text-white leading-none">{total}</span>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/10" />
            <div className="flex gap-2 md:gap-4">
                <div className="flex flex-col">
                    <span className="text-[8px] md:text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">Libres</span>
                    <span className="text-sm md:text-lg font-black text-emerald-400 leading-none">{libre}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] md:text-[9px] font-black text-amber-500/60 uppercase tracking-[0.2em]">Sep.</span>
                    <span className="text-sm md:text-lg font-black text-amber-400 leading-none">{separado}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] md:text-[9px] font-black text-rose-500/60 uppercase tracking-[0.2em]">Vend.</span>
                    <span className="text-sm md:text-lg font-black text-rose-400 leading-none">{vendido}</span>
                </div>
            </div>
        </div>
    )
}
