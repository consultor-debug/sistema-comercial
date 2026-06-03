import { NextRequest, NextResponse } from 'next/server'
import { validateDNIWithReniec, parseReniecToClient } from '@/lib/reniec'
import { validateDNI } from '@/lib/utils'

async function handleDNI(dni: string) {
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
        // flat fields para compatibilidad con el frontend
        nombres:   client.nombres,
        apellidos: client.apellidos,
        client,
    })
}

// GET /api/clients/validate?dni=12345678
export async function GET(request: NextRequest) {
    try {
        const dni = request.nextUrl.searchParams.get('dni') ?? ''
        return await handleDNI(dni)
    } catch (error) {
        console.error('RENIEC validation error:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}

// POST /api/clients/validate  { "dni": "12345678" }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        return await handleDNI(body?.dni ?? '')
    } catch (error) {
        console.error('RENIEC validation error:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}
