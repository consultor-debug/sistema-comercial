'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { Calculator, Calendar } from 'lucide-react'

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
        <div className="space-y-4">
            {/* Price Summary */}
            <Card variant="glass" className="border-slate-700/50 bg-slate-800/40 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Calculator className="w-16 h-16 rotate-12" />
                </div>
                
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Calculator className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Cotizador Financiero
                        </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 shadow-inner">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Precio Lista</p>
                            <p className="text-xl font-black text-white">{formatCurrency(precioLista)}</p>
                        </div>
                        <div className="text-center p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 shadow-inner">
                            <p className="text-[10px] text-amber-500/70 uppercase font-bold tracking-tighter mb-1">Descuento</p>
                            <p className="text-xl font-black text-amber-500">-{formatCurrency(descuento)}</p>
                        </div>
                        <div className="text-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-inner shadow-emerald-900/10">
                            <p className="text-[10px] text-emerald-500/70 uppercase font-bold tracking-tighter mb-1">Precio Final</p>
                            <p className="text-xl font-black text-emerald-400">{formatCurrency(precioFinal)}</p>
                        </div>
                    </div>

                    {/* Input fields */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <Input
                                type="number"
                                label="Descuento (S/)"
                                placeholder="0.00"
                                value={descuento || ''}
                                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                disabled={disabled}
                                leftIcon={<span className="text-xs font-bold text-slate-500">S/</span>}
                                error={descuento > descuentoMax ? 'Excede monto límite' : undefined}
                            />
                            <p className="text-[10px] text-slate-500 px-1">
                                Máximo: <span className="text-slate-400 font-medium">{formatCurrency(descuentoMax)}</span>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Input
                                type="number"
                                label="Inicial (S/)"
                                placeholder="0.00"
                                value={inicial || ''}
                                onChange={(e) => setInicial(parseFloat(e.target.value) || 0)}
                                disabled={disabled}
                                leftIcon={<span className="text-xs font-bold text-slate-500">S/</span>}
                                error={inicial > 0 && inicial < minInicial ? 'El monto es menor al mínimo' : undefined}
                            />
                            {minInicial > 0 && (
                                <p className="text-[10px] text-slate-500 px-1">
                                    Mínimo: <span className="text-slate-400 font-medium">{formatCurrency(minInicial)}</span>
                                </p>
                            )}
                        </div>

                        <Input
                            type="number"
                            label="N° Cuotas"
                            placeholder="12"
                            value={cuotas || ''}
                            onChange={(e) => setCuotas(parseInt(e.target.value) || 0)}
                            disabled={disabled}
                            leftIcon={<Calculator className="w-4 h-4 text-slate-500" />}
                            error={cuotas < 1 || cuotas > maxCuotas ? 'Plazo inválido' : undefined}
                        />

                        <Input
                            type="date"
                            label="Fecha Inicio"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            disabled={disabled}
                            leftIcon={<Calendar className="w-4 h-4 text-slate-500" />}
                        />
                    </div>

                    {/* Saldo and cuota mensual preview */}
                    {cuotas > 0 && saldo > 0 && quotation && (
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-700/50">
                            <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-700/30">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Saldo Financiar</p>
                                <p className="text-xl font-bold text-white/90">{formatCurrency(saldo)}</p>
                            </div>
                            <div className="p-4 cursor-pointer hover:bg-blue-600/10 hover:border-blue-500/50 transition-all bg-blue-600/5 rounded-2xl border border-blue-600/30 group relative"
                                onClick={() => setShowCronograma(!showCronograma)}>
                                <p className="text-[10px] text-blue-500/80 uppercase font-black tracking-widest mb-1">Cuota Mensual</p>
                                <p className="text-2xl font-black text-blue-400 leading-tight">
                                    {formatCurrency(quotation.cuotaMensual)}
                                </p>
                                <div className="absolute top-2 right-2 text-blue-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <p className="text-[8px] text-blue-500/60 mt-1 font-bold">VER CRONOGRAMA ➔</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Cronograma de pagos */}
            {quotation && showCronograma && (
                <Card variant="bordered" className="border-blue-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                                Cronograma de Pagos
                            </h4>
                            <button
                                className="text-xs text-slate-400 hover:text-white"
                                onClick={() => setShowCronograma(false)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="text-slate-400 border-b border-slate-700">
                                    <tr>
                                        <th className="text-left py-2">N°</th>
                                        <th className="text-left py-2">Fecha</th>
                                        <th className="text-right py-2">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    {quotation.cronograma.map((cuota) => (
                                        <tr key={cuota.numero} className="border-b border-slate-800">
                                            <td className="py-2">{cuota.numero}</td>
                                            <td className="py-2">{formatDate(cuota.fecha)}</td>
                                            <td className="py-2 text-right font-medium">
                                                {formatCurrency(cuota.monto)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-semibold text-white border-t border-slate-600">
                                    <tr>
                                        <td className="py-3" colSpan={2}>Total a Pagar</td>
                                        <td className="py-3 text-right text-emerald-400">
                                            {formatCurrency(quotation.inicial + quotation.cronograma.reduce((sum, c) => sum + c.monto, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
