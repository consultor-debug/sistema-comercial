import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const manzana = searchParams.get('manzana')
        const etapa = searchParams.get('etapa')
        const estado = searchParams.get('estado')

        if (!projectId) {
            return NextResponse.json(
                { success: false, error: 'projectId es requerido' },
                { status: 400 }
            )
        }

        // Verify the project belongs to the user's allowed tenants (unless SUPER_ADMIN)
        const { role, tenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [tenantId, ...(assignedTenantIds || [])].filter(Boolean)
        const isSuperAdmin = role === 'SUPER_ADMIN'
        
        if (!isSuperAdmin) {
            const project = await prisma.project.findFirst({
                where: { id: projectId, tenantId: { in: allowedTenantIds } }
            })
            if (!project) {
                return NextResponse.json(
                    { success: false, error: 'Proyecto no encontrado o sin acceso' },
                    { status: 404 }
                )
            }
        }

        const where: Record<string, unknown> = { projectId }

        if (manzana) where.manzana = manzana
        if (etapa) where.etapa = etapa
        if (estado) where.estado = estado

        const lots = await prisma.lot.findMany({
            where,
            include: {
                asesor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { manzana: 'asc' },
                { loteNumero: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            lots
        })
    } catch (error) {
        console.error('Lots fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener lotes' },
            { status: 500 }
        )
    }
}

