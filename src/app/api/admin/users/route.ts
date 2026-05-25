import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = session.user as { role: string; tenantId?: string }

        const where: any = {}
        if (user.role !== 'SUPER_ADMIN') {
            where.tenantId = user.tenantId
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedLots: true,
                        contracts: true,
                    }
                }
            },
            orderBy: { name: 'asc' },
        })

        const mapped = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
            lotesAsignados: u._count.assignedLots,
            contratosGenerados: u._count.contracts,
        }))

        return NextResponse.json({ success: true, users: mapped })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
