import { NextRequest, NextResponse } from 'next/server'
import { validateDNIWithReniec, parseReniecToClient } from '@/lib/reniec'
import { validateDNI } from '@/lib/utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { dni } = body

        if (!dni || !validateDNI(dni)) {
            return NextResponse.json(
                { success: false, error: 'DNI inválido. Debe tener 8 dígitos.' },
                { status: 400 }
            )
        }

        const reniecResponse = await validateDNIWithReniec(dni)

        if (!reniecResponse.success) {
            return NextResponse.json(
                { success: false, error: reniecResponse.error || 'No se pudo validar el DNI' },
                { status: 400 }
            )
        }

        const client = parseReniecToClient(reniecResponse)

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Error al procesar datos de RENIEC' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            client
        })
    } catch (error) {
        console.error('RENIEC validation error:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
