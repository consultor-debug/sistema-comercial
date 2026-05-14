'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { 
    Calculator, 
    Calendar, 
    CheckCircle2, 
    ChevronDown, 
    ChevronUp, 
    Download, 
    Share2, 
    Smartphone,
    CreditCard,
    TrendingDown,
    ArrowRight
} from 'lucide-react'

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

interface QuoterProps {
    precioLista: number
    descuentoMax: number
    maxCuotas?: number
    minInicial?: number
    disabled?: boolean
    onQuotationCalculated: (result: QuotationResult | null) => void
}

export const Quoter: React.FC<QuoterProps> = ({
    precioLista,
    descuentoMax,
    maxCuotas = 60,
    minInicial = 0,
    disabled = false,
    onQuotationCalculated
}) => {
    const [descuento, setDescuento] = React.useState(0)
    const [inicial, setInicial] = React.useState(0)
    const [cuotas, setCuotas] = React.useState(12)
    const [fechaInicio, setFechaInicio] = React.useState(
        new Date().toISOString().split('T')[0]
    )
    const [quotation, setQuotation] = React.useState<QuotationResult | null>(null)
    const [showCronograma, setShowCronograma] = React.useState(false)

    // Calculate price final
    const precioFinal = Math.max(0, precioLista - descuento)
    const saldo = Math.max(0, precioFinal - inicial)

    // Live Auto-Calculation Effect
    React.useEffect(() => {
        if (descuento > descuentoMax || inicial < minInicial || cuotas < 1 || cuotas > maxCuotas) {
            setQuotation(null)
            onQuotationCalculated(null)
            return
        }

        const result = calculateQuotation({
            precioLista,
            descuento,
            inicial,
            cuotas,
            fechaInicio
        })

        setQuotation(result)
        onQuotationCalculated(result)
    }, [precioLista, descuento, inicial, cuotas, fechaInicio, descuentoMax, minInicial, maxCuotas, onQuotationCalculated])

    return (
        <div className="space-y-6">
            {/* Main Quoter Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="glass-card border border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
                    
                    <div className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                                    <Calculator className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                                        Cotizador Inteligente
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-0.5">Financiamiento Directo Premium</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Visual Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <SummaryBox 
                                label="Precio Lista" 
                                value={formatCurrency(precioLista)} 
                                color="slate"
                            />
                            <SummaryBox 
                                label="Beneficio (Desc.)" 
                                value={`-${formatCurrency(descuento)}`} 
                                color="cyan"
                                icon={TrendingDown}
                            />
                            <SummaryBox 
                                label="Inversión Final" 
                                value={formatCurrency(precioFinal)} 
                                color="blue"
                                icon={CheckCircle2}
                                highlight
                            />
                        </div>

                        {/* Input Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descuento Aplicado</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={descuento || ''}
                                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        className="bg-white/5 border-white/5 focus:border-cyan-500/30 transition-all text-xl font-bold h-14 rounded-2xl shadow-inner"
                                        leftIcon={<span className="text-sm font-black text-slate-600 ml-4">S/</span>}
                                        error={descuento > descuentoMax ? 'Excede límite' : undefined}
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">LÍMITE: {formatCurrency(descuentoMax)}</span>
                                        <span className="text-[10px] text-cyan-400 font-black tracking-widest">{( (descuento/precioLista)*100 ).toFixed(1)}% OFF</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cuota Inicial</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={inicial || ''}
                                        onChange={(e) => setInicial(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        className="bg-white/5 border-white/5 focus:border-cyan-500/30 transition-all text-xl font-bold h-14 rounded-2xl shadow-inner"
                                        leftIcon={<span className="text-sm font-black text-slate-600 ml-4">S/</span>}
                                        error={inicial > 0 && inicial < minInicial ? 'Menor al mínimo' : undefined}
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold px-1 uppercase tracking-widest">MÍNIMO REQUERIDO: {formatCurrency(minInicial)}</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Plazo de Financiamiento</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                value={cuotas || ''}
                                                onChange={(e) => setCuotas(parseInt(e.target.value) || 0)}
                                                disabled={disabled}
                                                className="bg-white/5 border-white/5 focus:border-cyan-500/30 transition-all text-xl font-bold h-14 text-center rounded-2xl shadow-inner"
                                                error={cuotas < 1 || cuotas > maxCuotas ? 'Plazo inválido' : undefined}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => setCuotas(Math.min(maxCuotas, cuotas + 12))} className="p-2 hover:bg-cyan-500/10 rounded-xl text-slate-400 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/20"><ChevronUp size={18}/></button>
                                            <button onClick={() => setCuotas(Math.max(1, cuotas - 12))} className="p-2 hover:bg-cyan-500/10 rounded-xl text-slate-400 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/20"><ChevronDown size={18}/></button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold px-1 uppercase tracking-widest">MÁXIMO: {maxCuotas} MESES</span>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Fecha de Inicio</label>
                                    <Input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        disabled={disabled}
                                        className="bg-white/5 border-white/5 focus:border-cyan-500/30 transition-all font-bold h-14 rounded-2xl shadow-inner"
                                        leftIcon={<Calendar className="w-5 h-5 text-slate-600 ml-4" />}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <AnimatePresence>
                            {quotation && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="mt-14 pt-10 border-t border-white/5"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-cyan-500/5 rounded-[2.5rem] border border-cyan-500/20 relative overflow-hidden group shadow-xl">
                                            <div className="absolute right-6 top-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors">
                                                <CreditCard size={60} />
                                            </div>
                                            <p className="text-[10px] text-cyan-500/70 uppercase font-black tracking-[0.3em] mb-3">Cuota Mensual Estimada</p>
                                            <p className="text-5xl font-black text-white tracking-tighter shadow-cyan-500/20">
                                                {formatCurrency(quotation.cuotaMensual)}
                                            </p>
                                            <div className="mt-6 flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Financiamiento Directo Antigravity</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <div className="flex-1 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col justify-center shadow-xl">
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">Saldo a Financiar</p>
                                                <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(saldo)}</p>
                                            </div>
                                            <Button 
                                                onClick={() => setShowCronograma(!showCronograma)}
                                                className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-widest shadow-2xl shadow-cyan-900/40 border border-cyan-400/20 transition-all"
                                            >
                                                <span className="text-xs">{showCronograma ? 'Ocultar Cronograma' : 'Ver Cronograma Completo'}</span>
                                                <ArrowRight className="w-5 h-5 ml-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Share via WhatsApp Mockup */}
                                    <div className="mt-10 flex items-center justify-center">
                                        <button className="flex items-center gap-3 text-[10px] font-black text-slate-500 hover:text-cyan-400 transition-all uppercase tracking-[0.2em] px-6 py-2 rounded-full hover:bg-cyan-500/5">
                                            <Smartphone size={16} />
                                            <span>Enviar propuesta por WhatsApp</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Cronograma de pagos Premium */}
            <AnimatePresence>
                {quotation && showCronograma && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card border border-white/5 bg-slate-900/40 rounded-[2.5rem] overflow-hidden shadow-2xl mt-8">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                                        Plan de Pagos Detallado
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                        {quotation.cuotas} CUOTAS FIJAS DE {formatCurrency(quotation.cuotaMensual)}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowCronograma(false)} className="text-slate-500 hover:text-white rounded-xl hover:bg-white/5">
                                    Cerrar
                                </Button>
                            </div>
                            
                            <div className="max-h-[500px] overflow-y-auto premium-scrollbar px-2">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 z-20">
                                        <tr>
                                            <th className="text-left p-6">#</th>
                                            <th className="text-left p-6">Fecha de Vencimiento</th>
                                            <th className="text-right p-6">Monto Cuota</th>
                                            <th className="text-right p-6">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {quotation.cronograma.map((cuota) => (
                                            <tr key={cuota.numero} className="hover:bg-cyan-500/5 transition-all group">
                                                <td className="p-6 text-xs font-black text-slate-500 group-hover:text-cyan-400">{cuota.numero.toString().padStart(2, '0')}</td>
                                                <td className="p-6 text-xs font-bold text-slate-300 group-hover:text-white">{formatDate(cuota.fecha)}</td>
                                                <td className="p-6 text-right text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                                                    {formatCurrency(cuota.monto)}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg group-hover:bg-cyan-500/10 group-hover:text-cyan-500 transition-all">Pendiente</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-8 bg-white/5 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Financiar</span>
                                        <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(quotation.saldo)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1 block">Tasa de Interés</span>
                                        <span className="text-xl font-black text-emerald-400">0% TCEA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

interface SummaryBoxProps {
    label: string
    value: string
    color: 'slate' | 'cyan' | 'blue'
    icon?: React.ElementType
    highlight?: boolean
}

function SummaryBox({ label, value, color, icon: Icon, highlight }: SummaryBoxProps) {
    const colorClasses = {
        slate: "text-slate-500",
        cyan: "text-cyan-400",
        blue: "text-blue-400"
    }

    return (
        <div className={cn(
            "p-6 rounded-[2rem] border transition-all duration-500 backdrop-blur-sm",
            highlight 
                ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 shadow-xl shadow-cyan-500/5" 
                : "bg-white/5 border-white/5 hover:border-white/10"
        )}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                {Icon && <Icon className={cn("w-4 h-4", colorClasses[color as keyof typeof colorClasses])} />}
            </div>
            <p className={cn(
                "text-2xl font-black tracking-tight",
                highlight ? "text-white" : colorClasses[color as keyof typeof colorClasses]
            )}>
                {value}
            </p>
        </div>
    )
}

