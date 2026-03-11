'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateQuotation } from '@/lib/quotation'
import { Calculator, Calendar, DollarSign, CreditCard } from 'lucide-react'

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
            <Card variant="glass">
                <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
                        Cotizador Financiero
                    </h4>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-400">Precio Lista</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(precioLista)}</p>
                        </div>
                        <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                            <p className="text-xs text-amber-400">Descuento</p>
                            <p className="text-lg font-bold text-amber-400">-{formatCurrency(descuento)}</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                            <p className="text-xs text-emerald-400">Precio Final</p>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(precioFinal)}</p>
                        </div>
                    </div>

                    {/* Input fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Descuento (S/)"
                            placeholder="0.00"
                            value={descuento || ''}
                            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                            leftIcon={<DollarSign className="w-4 h-4" />}
                            hint={`Máximo: ${formatCurrency(descuentoMax)}`}
                            error={descuento > descuentoMax ? 'Excede monto límite' : undefined}
                        />

                        <Input
                            type="number"
                            label="Inicial (S/)"
                            placeholder="0.00"
                            value={inicial || ''}
                            onChange={(e) => setInicial(parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                            leftIcon={<CreditCard className="w-4 h-4" />}
                            hint={minInicial > 0 ? `Mínimo: ${formatCurrency(minInicial)}` : undefined}
                            error={inicial > 0 && inicial < minInicial ? 'El monto es menor al mínimo' : undefined}
                        />

                        <Input
                            type="number"
                            label="Cuotas"
                            placeholder="12"
                            value={cuotas || ''}
                            onChange={(e) => setCuotas(parseInt(e.target.value) || 0)}
                            disabled={disabled}
                            leftIcon={<Calculator className="w-4 h-4" />}
                            hint={`Máximo: ${maxCuotas} meses`}
                            error={cuotas < 1 || cuotas > maxCuotas ? 'Plazo inválido' : undefined}
                        />

                        <Input
                            type="date"
                            label="Fecha de Inicio"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            disabled={disabled}
                            leftIcon={<Calendar className="w-4 h-4" />}
                        />
                    </div>

                    {/* Saldo and cuota mensual preview */}
                    {cuotas > 0 && saldo > 0 && quotation && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                <p className="text-xs text-slate-400">Saldo a Financiar</p>
                                <p className="text-lg font-semibold text-white">{formatCurrency(saldo)}</p>
                            </div>
                            <div className="text-center p-3 cursor-pointer hover:bg-blue-500/20 transition-all bg-blue-500/10 rounded-lg border border-blue-500/30 relative group"
                                onClick={() => setShowCronograma(!showCronograma)}>
                                <p className="text-xs text-blue-400">Cuota Mensual (Haz clic para ver cronograma)</p>
                                <p className="text-lg font-semibold text-blue-400">
                                    {formatCurrency(quotation.cuotaMensual)}
                                </p>
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
