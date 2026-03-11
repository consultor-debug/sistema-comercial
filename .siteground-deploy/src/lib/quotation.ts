interface PaymentScheduleItem {
    numero: number
    fecha: string
    monto: number
}

interface QuotationResult {
    precioLista: number
    descuento: number
    precioFinal: number
    inicial: number
    saldo: number
    cuotas: number
    cuotaMensual: number
    fechaInicio: string
    cronograma: PaymentScheduleItem[]
}

interface CalculateQuotationParams {
    precioLista: number
    descuento: number
    inicial: number
    cuotas: number
    fechaInicio: Date | string
    interestRate?: number // Annual interest rate (0 = no interest)
}

export function calculateQuotation(params: CalculateQuotationParams): QuotationResult {
    const { precioLista, descuento, inicial, cuotas, fechaInicio, interestRate = 0 } = params

    // Calculate final price
    const precioFinal = Math.max(0, precioLista - descuento)
    const saldo = Math.max(0, precioFinal - inicial)

    // Calculate monthly payment
    let cuotaMensual: number

    if (interestRate > 0 && cuotas > 0) {
        // With interest - use amortization formula
        const monthlyRate = interestRate / 12 / 100
        cuotaMensual = saldo * (monthlyRate * Math.pow(1 + monthlyRate, cuotas)) /
            (Math.pow(1 + monthlyRate, cuotas) - 1)
    } else {
        // Without interest - simple division
        cuotaMensual = cuotas > 0 ? saldo / cuotas : 0
    }

    // Generate payment schedule
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio
    const cronograma: PaymentScheduleItem[] = []

    for (let i = 1; i <= cuotas; i++) {
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + i)

        cronograma.push({
            numero: i,
            fecha: paymentDate.toISOString().split('T')[0],
            monto: Math.round(cuotaMensual * 100) / 100
        })
    }

    return {
        precioLista,
        descuento,
        precioFinal,
        inicial,
        saldo,
        cuotas,
        cuotaMensual: Math.round(cuotaMensual * 100) / 100,
        fechaInicio: typeof fechaInicio === 'string' ? fechaInicio : fechaInicio.toISOString().split('T')[0],
        cronograma
    }
}

export function validateQuotationParams(
    params: Partial<CalculateQuotationParams>,
    constraints: {
        maxCuotas?: number
        minInicial?: number
        maxDescuento?: number
    } = {}
): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (params.precioLista === undefined || params.precioLista <= 0) {
        errors.push('El precio de lista debe ser mayor a 0')
    }

    if (params.descuento !== undefined && params.descuento < 0) {
        errors.push('El descuento no puede ser negativo')
    }

    if (params.descuento !== undefined && params.precioLista !== undefined && params.descuento > params.precioLista) {
        errors.push('El descuento no puede ser mayor al precio de lista')
    }

    if (constraints.maxDescuento !== undefined && params.descuento !== undefined && params.descuento > constraints.maxDescuento) {
        errors.push(`El descuento máximo permitido es S/ ${constraints.maxDescuento.toFixed(2)}`)
    }

    if (params.inicial !== undefined && params.inicial < 0) {
        errors.push('La cuota inicial no puede ser negativa')
    }

    if (constraints.minInicial !== undefined && params.inicial !== undefined && params.inicial < constraints.minInicial) {
        errors.push(`La cuota inicial mínima es S/ ${constraints.minInicial.toFixed(2)}`)
    }

    if (params.cuotas !== undefined && (params.cuotas < 1 || !Number.isInteger(params.cuotas))) {
        errors.push('El número de cuotas debe ser un entero mayor a 0')
    }

    if (constraints.maxCuotas !== undefined && params.cuotas !== undefined && params.cuotas > constraints.maxCuotas) {
        errors.push(`El número máximo de cuotas es ${constraints.maxCuotas}`)
    }

    if (!params.fechaInicio) {
        errors.push('La fecha de inicio es obligatoria')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}
