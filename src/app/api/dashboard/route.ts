import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { LotStatus } from '@prisma/client'

export async function GET() {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { tenantId } = session.user

    try {
        // Fetch Projects with lot counts
        const projects = await prisma.project.findMany({
            where: tenantId ? { tenantId } : {},
            include: {
                lots: {
                    select: {
                        estado: true
                    }
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
                stats,
                updatedAt: p.updatedAt
            }
        })

        // Fetch Recent Quotations
        const recentQuotations = await prisma.quotation.findMany({
            where: tenantId ? { tenantId } : {},
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
        const quotationsToday = await prisma.quotation.count({
            where: {
                tenantId: tenantId || undefined,
                createdAt: { gte: today }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    name: session.user.name,
                    role: session.user.role
                },
                projects: formattedProjects,
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
