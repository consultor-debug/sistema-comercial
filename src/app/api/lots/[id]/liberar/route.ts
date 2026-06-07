import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { createAuditLog } from '@/lib/audit'

// POST /api/lots/[id]/liberar
// Libera un lote SEPARADO: cancela el contrato de separación y lo vuelve a LIBRE.
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = session.user as { id: string; role: string; tenantId?: string }
        const body = await req.json().catch(() => ({}))
        const motivo: string = body.motivo ?? 'Liberación manual'

        // Verificar lote
        const lot = await prisma.lot.findUnique({
            where: { id },
            include: { project: { include: { tenant: true } } },
        })
        if (!lot) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }
        if (lot.estado !== 'SEPARADO') {
            return NextResponse.json(
                { error: `El lote está en estado ${lot.estado}, no se puede liberar` },
                { status: 409 }
            )
        }

        // Cancelar contratos de separación activos para este lote
        await prisma.contract.updateMany({
            where: {
                lotId: id,
                tipo: 'SEPARACION',
                estado: 'ACTIVO',
            },
            data: {
                estado: 'CANCELADO',
                datos: { motivoCancelacion: motivo, canceladoEn: new Date().toISOString() },
            },
        })

        // Liberar lote
        await prisma.lot.update({
            where: { id },
            data: { estado: 'LIBRE' },
        })

        // Audit log
        await createAuditLog({
            tenantId: lot.project.tenantId,
            userId: user.id,
            lotId: id,
            campo: 'estado',
            valorAnterior: 'SEPARADO',
            valorNuevo: 'LIBRE',
            motivo,
        })

        return NextResponse.json({ ok: true, message: 'Lote liberado exitosamente' })
    } catch (error) {
        console.error('Liberar lot error:', error)
        return NextResponse.json({ error: 'Error al liberar lote' }, { status: 500 })
    }
}
