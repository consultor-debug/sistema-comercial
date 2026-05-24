import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = session.user as { id: string; role: string; tenantId?: string }
        const tipo = request.nextUrl.searchParams.get('tipo')

        const where: Record<string, unknown> = {}

        if (user.role !== 'SUPER_ADMIN') {
            where.tenantId = user.tenantId
        }
        if (tipo) {
            where.tipo = tipo
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                lot: { select: { code: true, manzana: true, loteNumero: true, project: { select: { name: true } } } },
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, contracts })
    } catch (error) {
        console.error('Error fetching contracts:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
