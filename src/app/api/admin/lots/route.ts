import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = session.user as { role: string; tenantId?: string; assignedProjectIds?: string[] }

        const where: any = {}
        if (user.role !== 'SUPER_ADMIN') {
            // Filter by tenant's projects
            where.project = { tenantId: user.tenantId }
            if (user.role === 'ASESOR' && user.assignedProjectIds?.length) {
                where.projectId = { in: user.assignedProjectIds }
            }
        }

        const lots = await prisma.lot.findMany({
            where,
            select: {
                id: true,
                code: true,
                manzana: true,
                loteNumero: true,
                areaM2: true,
                precioLista: true,
                estado: true,
                project: { select: { id: true, name: true } },
                asesor: { select: { name: true } },
            },
            orderBy: [{ project: { name: 'asc' } }, { manzana: 'asc' }, { loteNumero: 'asc' }],
        })

        return NextResponse.json({ success: true, lots })
    } catch (error) {
        console.error('Error fetching lots:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
