import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { LotStatus } from '@prisma/client'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role: userRole, tenantId: userTenantId, assignedTenantIds, assignedProjectIds } = session.user as any
        const allowedTenantIds = [userTenantId, ...(assignedTenantIds || [])].filter(Boolean)

        let where: any = {}
        
        if (userRole !== 'SUPER_ADMIN') {
            const conditions: any[] = [{ tenantId: { in: allowedTenantIds } }]
            
            // Si tiene proyectos específicos asignados, solo esos
            if (assignedProjectIds && assignedProjectIds.length > 0) {
                conditions.push({ id: { in: assignedProjectIds } })
            }
            
            where = { AND: conditions }
            
            if (userRole === 'ASESOR') {
                where.isActive = true
            }
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                tenant: {
                    select: {
                        name: true,
                        slug: true,
                        logoUrl: true
                    }
                },
                lots: {
                    select: {
                        estado: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        const projectsWithStats = projects.map(project => {
            const stats = {
                total: project.lots.length,
                libre: project.lots.filter(l => l.estado === LotStatus.LIBRE).length,
                separado: project.lots.filter(l => l.estado === LotStatus.SEPARADO).length,
                vendido: project.lots.filter(l => l.estado === LotStatus.VENDIDO).length,
                noDisponible: project.lots.filter(l => l.estado === LotStatus.NO_DISPONIBLE).length
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { lots, ...projectData } = project

            return {
                ...projectData,
                stats
            }
        })

        return NextResponse.json({
            success: true,
            projects: projectsWithStats
        })
    } catch (error) {
        console.error('Projects fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener proyectos' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role: userRole, tenantId: userTenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [userTenantId, ...(assignedTenantIds || [])].filter(Boolean)
        const body = await request.json()
        const { name, description, maxCuotas, minInicial, tenantId: bodyTenantId } = body

        if (!name) {
            return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
        }

        // If super admin, use bodyTenantId. Otherwise, ensure bodyTenantId is within allowed tenants or use primary.
        let tenantId = userRole === 'SUPER_ADMIN' ? bodyTenantId : userTenantId
        if (userRole !== 'SUPER_ADMIN' && bodyTenantId && allowedTenantIds.includes(bodyTenantId)) {
            tenantId = bodyTenantId
        }

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID es requerido' }, { status: 400 })
        }

        const project = await prisma.project.create({
            data: {
                tenantId,
                name,
                description,
                maxCuotas: maxCuotas || 60,
                minInicial: minInicial || 0,
                sheetsId: body.sheetsId || null,
                n8nWebhookUrl: body.n8nWebhookUrl || null,
                isActive: true
            }
        })

        return NextResponse.json({ success: true, project })
    } catch (error) {
        console.error('Project creation error:', error)
        return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
    }
}
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role: userRole, tenantId: userTenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [userTenantId, ...(assignedTenantIds || [])].filter(Boolean)
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID de proyecto es requerido' }, { status: 400 })
        }

        // Verify project exists and belongs to tenant (or user is SUPER_ADMIN)
        const where = userRole === 'SUPER_ADMIN' ? { id } : { id, tenantId: { in: allowedTenantIds } }
        const project = await prisma.project.findFirst({
            where
        })

        if (!project) {
            return NextResponse.json({ error: 'Proyecto no encontrado o no tienes permisos' }, { status: 404 })
        }

        // Delete project (cascades to lots, quotations, etc. thanks to schema)
        await prisma.project.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Proyecto eliminado correctamente' })
    } catch (error) {
        console.error('Project deletion error:', error)
        return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role: userRole, tenantId: userTenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [userTenantId, ...(assignedTenantIds || [])].filter(Boolean)
        const body = await request.json()
        const { id, name, description, maxCuotas, minInicial, isActive, tenantId: bodyTenantId } = body

        if (!id) {
            return NextResponse.json({ error: 'ID de proyecto es requerido' }, { status: 400 })
        }

        // Verify project exists and belongs to tenant (or user is SUPER_ADMIN)
        const where = userRole === 'SUPER_ADMIN' ? { id } : { id, tenantId: { in: allowedTenantIds } }
        const existingProject = await prisma.project.findFirst({
            where
        })

        if (!existingProject) {
            return NextResponse.json({ error: 'Proyecto no encontrado o no tienes permisos' }, { status: 404 })
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined,
                tenantId: userRole === 'SUPER_ADMIN' && bodyTenantId ? bodyTenantId : undefined,
                maxCuotas: maxCuotas !== undefined ? (maxCuotas ? parseInt(maxCuotas.toString()) : 0) : undefined,
                minInicial: minInicial !== undefined ? (minInicial ? parseFloat(minInicial.toString()) : 0) : undefined,
                sheetsId: body.sheetsId !== undefined ? body.sheetsId : undefined,
                n8nWebhookUrl: body.n8nWebhookUrl !== undefined ? body.n8nWebhookUrl : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        })

        return NextResponse.json({ success: true, project })
    } catch (error) {
        console.error('Project update error:', error)
        return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 })
    }
}
