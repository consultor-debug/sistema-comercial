import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    const userId = (session.user as any).id
    const body = await req.json()
    const { montoPagado, metodoPago, numOperacion, fechaPago } = body
    
    if (!montoPagado || !metodoPago || !numOperacion) {
        return NextResponse.json({ error: 'Faltan campos: montoPagado, metodoPago, numOperacion' }, { status: 400 })
    }
    
    const cuota = await prisma.cuota.findUnique({ where: { id } })
    if (!cuota) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    
    const montoF = parseFloat(montoPagado)
    const esCompleto = montoF >= cuota.monto * 0.99
    
    const updated = await prisma.cuota.update({
        where: { id },
        data: {
            montoPagado: montoF,
            metodoPago,
            numOperacion,
            fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
            estado: esCompleto ? 'PAGADO' : 'PARCIAL',
            registradoPorId: userId,
            registradoEl: new Date(),
        }
    })
    
    return NextResponse.json({ ok: true, cuota: updated })
}
