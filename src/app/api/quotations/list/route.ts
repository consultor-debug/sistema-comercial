import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/quotations/list
// Returns quotations for the current tenant, most recent first.
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        const user = session.user as { id: string; role: string; tenantId?: string }
        const isSuperAdmin = user.role === 'SUPER_ADMIN'

        const where: Record<string, unknown> = {}
        if (!isSuperAdmin) {
            if (!user.tenantId) {
                return NextResponse.json({ success: true, quotations: [] })
            }
            where.tenantId = user.tenantId
        }

        const quotations = await prisma.quotation.findMany({
            where,
            select: {
                id: true,
                codigo: true,
                clienteDni: true,
                clienteNombres: true,
                clienteApellidos: true,
                clienteEmail: true,
                precioFinal: true,
                createdAt: true,
                lot: { select: { code: true } },
                project: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, quotations })
    } catch (error) {
        console.error('[quotations/list]', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
