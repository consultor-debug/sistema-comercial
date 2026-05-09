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
                <Card variant="glass" className="border-slate-700/50 bg-slate-800/40 overflow-hidden relative">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                    
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                                    <Calculator className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">
                                        Cotizador Inteligente
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Financiamiento Directo</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Visual Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            <SummaryBox 
                                label="Precio Lista" 
                                value={formatCurrency(precioLista)} 
                                color="slate"
                            />
                            <SummaryBox 
                                label="Ahorro (Desc.)" 
                                value={`-${formatCurrency(descuento)}`} 
                                color="amber"
                                icon={TrendingDown}
                            />
                            <SummaryBox 
                                label="Inversión Final" 
                                value={formatCurrency(precioFinal)} 
                                color="emerald"
                                icon={CheckCircle2}
                                highlight
                            />
                        </div>

                        {/* Input Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descuento Especial</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={descuento || ''}
                                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 transition-all text-lg font-bold h-12"
                                        leftIcon={<span className="text-sm font-black text-slate-600 ml-2">S/</span>}
                                        error={descuento > descuentoMax ? 'Excede límite' : undefined}
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-slate-500 font-bold">LÍMITE: {formatCurrency(descuentoMax)}</span>
                                        <span className="text-[10px] text-blue-500 font-bold">{( (descuento/precioLista)*100 ).toFixed(1)}% OFF</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cuota Inicial</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={inicial || ''}
                                        onChange={(e) => setInicial(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 transition-all text-lg font-bold h-12"
                                        leftIcon={<span className="text-sm font-black text-slate-600 ml-2">S/</span>}
                                        error={inicial > 0 && inicial < minInicial ? 'Menor al mínimo' : undefined}
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold px-1 uppercase">MÍNIMO REQUERIDO: {formatCurrency(minInicial)}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Plazo (Meses)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                value={cuotas || ''}
                                                onChange={(e) => setCuotas(parseInt(e.target.value) || 0)}
                                                disabled={disabled}
                                                className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 transition-all text-lg font-bold h-12 text-center"
                                                error={cuotas < 1 || cuotas > maxCuotas ? 'Plazo inválido' : undefined}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => setCuotas(Math.min(maxCuotas, cuotas + 12))} className="p-1 hover:bg-slate-700 rounded text-slate-400"><ChevronUp size={16}/></button>
                                            <button onClick={() => setCuotas(Math.max(1, cuotas - 12))} className="p-1 hover:bg-slate-700 rounded text-slate-400"><ChevronDown size={16}/></button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold px-1 uppercase">MÁXIMO: {maxCuotas} MESES</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                                    <Input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        disabled={disabled}
                                        className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 transition-all font-bold h-12"
                                        leftIcon={<Calendar className="w-4 h-4 text-slate-600 ml-2" />}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <AnimatePresence>
                            {quotation && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-12 pt-8 border-t border-slate-700/50"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-700/50 relative overflow-hidden group">
                                            <div className="absolute right-4 top-4 text-slate-800 group-hover:text-slate-700 transition-colors">
                                                <CreditCard size={40} />
                                            </div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">Cuota Mensual Estimada</p>
                                            <p className="text-4xl font-black text-blue-400 tracking-tighter">
                                                {formatCurrency(quotation.cuotaMensual)}
                                            </p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Financiamiento Directo sin Intereses</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div className="flex-1 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 flex flex-col justify-center">
                                                <p className="text-[10px] text-emerald-500/70 uppercase font-black tracking-widest mb-1">Saldo a Financiar</p>
                                                <p className="text-2xl font-black text-white">{formatCurrency(saldo)}</p>
                                            </div>
                                            <Button 
                                                onClick={() => setShowCronograma(!showCronograma)}
                                                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
                                            >
                                                {showCronograma ? 'Ocultar Cronograma' : 'Ver Cronograma Completo'}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Share via WhatsApp Mockup */}
                                    <div className="mt-6 flex items-center justify-center">
                                        <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">
                                            <Smartphone size={14} />
                                            Enviar propuesta por WhatsApp
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Cronograma de pagos Premium */}
            <AnimatePresence>
                {quotation && showCronograma && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Card variant="bordered" className="border-slate-700/50 bg-slate-800/20 backdrop-blur-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/40">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">
                                        Plan de Pagos Detallado
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                        {quotation.cuotas} CUOTAS DE {formatCurrency(quotation.cuotaMensual)}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowCronograma(false)} className="text-slate-400">
                                    Cerrar
                                </Button>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto premium-scrollbar">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
                                        <tr>
                                            <th className="text-left p-4">#</th>
                                            <th className="text-left p-4">Fecha de Pago</th>
                                            <th className="text-right p-4">Monto de Cuota</th>
                                            <th className="text-right p-4">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {quotation.cronograma.map((cuota) => (
                                            <tr key={cuota.numero} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 text-xs font-bold text-slate-400">{cuota.numero.toString().padStart(2, '0')}</td>
                                                <td className="p-4 text-xs font-medium text-slate-200">{formatDate(cuota.fecha)}</td>
                                                <td className="p-4 text-right text-xs font-black text-white group-hover:text-blue-400 transition-colors">
                                                    {formatCurrency(cuota.monto)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter bg-slate-900 px-2 py-1 rounded-md">Pendiente</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-6 bg-slate-900/50 border-t border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Financiamiento</span>
                                    <span className="text-2xl font-black text-white">{formatCurrency(quotation.saldo)}</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function SummaryBox({ label, value, color, icon: Icon, highlight }: any) {
    const colorClasses = {
        slate: "text-slate-400",
        amber: "text-amber-500",
        emerald: "text-emerald-400",
        blue: "text-blue-400"
    }

    return (
        <div className={`p-5 rounded-2xl border transition-all ${highlight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/30 border-slate-700/30'}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                {Icon && <Icon className={`w-3.5 h-3.5 ${colorClasses[color as keyof typeof colorClasses]}`} />}
            </div>
            <p className={`text-xl font-black tracking-tight ${highlight ? 'text-white' : colorClasses[color as keyof typeof colorClasses] || 'text-white'}`}>
                {value}
            </p>
        </div>
    )
}

