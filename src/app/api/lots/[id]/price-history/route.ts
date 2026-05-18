import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/lots/[id]/price-history
// Returns price change entries from AuditLog (campo = 'precioLista')
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { role } = session.user as any
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Get lot to know the initial price (createdAt)
    const lot = await prisma.lot.findUnique({
        where: { id: params.id },
        select: { precioLista: true, createdAt: true, code: true },
    })

    if (!lot) return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })

    const logs = await prisma.auditLog.findMany({
        where: { lotId: params.id, campo: 'precioLista' },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true } } },
    })

    // Build a price series: [{ date, price, changedBy }]
    const history = logs.map(l => ({
        date: l.createdAt,
        oldPrice: l.valorAnterior ? parseFloat(l.valorAnterior) : null,
        newPrice: l.valorNuevo ? parseFloat(l.valorNuevo) : null,
        changedBy: l.user.name,
    }))

    return NextResponse.json({
        success: true,
        currentPrice: lot.precioLista,
        lotCode: lot.code,
        history,
    })
}
