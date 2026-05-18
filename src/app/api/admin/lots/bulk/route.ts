import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { LotStatus } from '@prisma/client'

// SUPER_ADMIN only — bulk operations on lots
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { role } = session.user as any
    if (role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Solo SUPER_ADMIN puede realizar operaciones masivas' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, action, payload } = body as {
        ids: string[]
        action: 'price' | 'status' | 'delete'
        payload?: { price?: number; percentChange?: number; estado?: string }
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'Se requieren IDs de lotes' }, { status: 400 })
    }

    if (!action) {
        return NextResponse.json({ error: 'Se requiere una acción' }, { status: 400 })
    }

    try {
        let affected = 0

        if (action === 'delete') {
            // Cannot delete VENDIDO lots
            const result = await prisma.lot.deleteMany({
                where: {
                    id: { in: ids },
                    estado: { not: LotStatus.VENDIDO },
                },
            })
            affected = result.count

        } else if (action === 'status' && payload?.estado) {
            const validStatuses = ['LIBRE', 'SEPARADO', 'VENDIDO', 'NO_DISPONIBLE']
            if (!validStatuses.includes(payload.estado)) {
                return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
            }
            const result = await prisma.lot.updateMany({
                where: { id: { in: ids } },
                data: { estado: payload.estado as LotStatus },
            })
            affected = result.count

        } else if (action === 'price') {
            if (payload?.price !== undefined) {
                // Set fixed price
                const newPrice = Number(payload.price)
                if (isNaN(newPrice) || newPrice <= 0) {
                    return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
                }
                const result = await prisma.lot.updateMany({
                    where: { id: { in: ids } },
                    data: { precioLista: newPrice },
                })
                affected = result.count

            } else if (payload?.percentChange !== undefined) {
                // Percentage change — must do individually (Prisma doesn't support relative updates)
                const pct = Number(payload.percentChange)
                if (isNaN(pct)) {
                    return NextResponse.json({ error: 'Porcentaje inválido' }, { status: 400 })
                }
                const lotsToUpdate = await prisma.lot.findMany({
                    where: { id: { in: ids } },
                    select: { id: true, precioLista: true },
                })
                await prisma.$transaction(
                    lotsToUpdate.map(l =>
                        prisma.lot.update({
                            where: { id: l.id },
                            data: { precioLista: Math.round(l.precioLista * (1 + pct / 100)) },
                        })
                    )
                )
                affected = lotsToUpdate.length
            } else {
                return NextResponse.json({ error: 'Se requiere precio o porcentaje' }, { status: 400 })
            }

        } else {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
        }

        return NextResponse.json({ success: true, affected })
    } catch (error) {
        console.error('Bulk operation error:', error)
        return NextResponse.json({ success: false, error: 'Error en operación masiva' }, { status: 500 })
    }
}
