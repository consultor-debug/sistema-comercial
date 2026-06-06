import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// POST /api/separaciones
// Process 1: Quick lot reservation — only requires fechaLimite + montoSeparacion.
// Client data is filled later in Process 2 (generate document).
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id: string; role: string; tenantId?: string }
    if (!user.tenantId && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin tenant asignado' }, { status: 400 })
    }

    const body = await req.json()
    const { lotId, fechaLimite, montoSeparacion } = body

    if (!lotId || !fechaLimite) {
        return NextResponse.json({ error: 'lotId y fechaLimite son obligatorios' }, { status: 400 })
    }

    // Verify lot is LIBRE
    const lot = await prisma.lot.findUnique({
        where: { id: lotId },
        select: { id: true, estado: true, precioLista: true },
    })
    if (!lot) return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    if (lot.estado !== 'LIBRE') {
        return NextResponse.json({ error: 'El lote no está disponible' }, { status: 409 })
    }

    const tenantId = user.tenantId!

    // Generate code
    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
    const count = await prisma.contract.count({ where: { tenantId } })
    const codigo = `SP-${fecha}-${String(count + 1).padStart(4, '0')}`

    const [contrato] = await prisma.$transaction([
        prisma.contract.create({
            data: {
                codigo,
                tenantId,
                lotId,
                userId: user.id,
                tipo: 'SEPARACION',
                estado: 'ACTIVO',
                // Client data is placeholder until Process 2
                clienteDni: 'PENDIENTE',
                clienteNombres: 'Pendiente',
                clienteApellidos: 'Documento',
                clienteEmail: '',
                precioTotal: lot.precioLista,
                montoSeparacion: montoSeparacion ?? null,
                datos: {
                    fechaLimite,
                    montoSeparacion: montoSeparacion ?? null,
                    pendienteDocumento: true,
                },
            },
        }),
        prisma.lot.update({
            where: { id: lotId },
            data: { estado: 'SEPARADO' },
        }),
    ])

    return NextResponse.json({ ok: true, contrato })
}
