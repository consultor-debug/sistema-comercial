import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { LotStatus } from '@prisma/client'

export async function GET(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { tenantId, role } = session.user
    const isSuperAdmin = role === 'SUPER_ADMIN'

    // Parse optional project filter from query params
    const { searchParams } = new URL(request.url)
    const projectIdsParam = searchParams.get('projectIds')
    const selectedIds = projectIdsParam ? projectIdsParam.split(',').filter(Boolean) : []

    try {
        // Build project filter:
        // - SUPER_ADMIN: all projects (or subset if projectIds provided)
        // - Others: only their tenant's projects
        let projectWhere: Record<string, unknown> = {}
        if (selectedIds.length > 0) {
            projectWhere = { id: { in: selectedIds } }
        } else if (!isSuperAdmin && tenantId) {
            projectWhere = { tenantId }
        }

        // Fetch Projects with lot counts
        const projects = await prisma.project.findMany({
            where: projectWhere,
            include: {
                lots: {
                    select: {
                        estado: true
                    }
                },
                tenant: {
                    select: { name: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        const formattedProjects = projects.map(p => {
            const stats = {
                total: p.lots.length,
                libre: p.lots.filter(l => l.estado === LotStatus.LIBRE).length,
                separado: p.lots.filter(l => l.estado === LotStatus.SEPARADO).length,
                vendido: p.lots.filter(l => l.estado === LotStatus.VENDIDO).length,
            }
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                tenantName: p.tenant?.name ?? null,
                stats,
                updatedAt: p.updatedAt
            }
        })

        // All projects list for the selector UI (only for SUPER_ADMIN)
        const allProjects = isSuperAdmin
            ? await prisma.project.findMany({
                select: { id: true, name: true, tenant: { select: { name: true } } },
                orderBy: { name: 'asc' }
            })
            : []

        // Fetch Recent Quotations
        const quotationsWhere: Record<string, unknown> = {}
        if (selectedIds.length > 0) {
            const lotsInProjects = await prisma.lot.findMany({
                where: { projectId: { in: selectedIds } },
                select: { id: true }
            })
            quotationsWhere.lotId = { in: lotsInProjects.map(l => l.id) }
        } else if (!isSuperAdmin && tenantId) {
            quotationsWhere.tenantId = tenantId
        }

        const recentQuotations = await prisma.quotation.findMany({
            where: quotationsWhere,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                lot: {
                    select: { code: true }
                }
            }
        })

        // Global Stats
        const totalLots = formattedProjects.reduce((acc, p) => acc + p.stats.total, 0)
        const totalLibre = formattedProjects.reduce((acc, p) => acc + p.stats.libre, 0)
        const totalSeparado = formattedProjects.reduce((acc, p) => acc + p.stats.separado, 0)
        const totalVendido = formattedProjects.reduce((acc, p) => acc + p.stats.vendido, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayWhere: Record<string, unknown> = { createdAt: { gte: today } }
        if (selectedIds.length > 0) {
            const lotsInProjects = await prisma.lot.findMany({
                where: { projectId: { in: selectedIds } },
                select: { id: true }
            })
            todayWhere.lotId = { in: lotsInProjects.map(l => l.id) }
        } else if (!isSuperAdmin && tenantId) {
            todayWhere.tenantId = tenantId
        }

        const quotationsToday = await prisma.quotation.count({ where: todayWhere })

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    name: session.user.name,
                    role: session.user.role
                },
                projects: formattedProjects,
                allProjects,
                recentQuotations,
                stats: {
                    totalLots,
                    libre: totalLibre,
                    separado: totalSeparado,
                    vendido: totalVendido,
                    quotationsToday
                }
            }
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}
