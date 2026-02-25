'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function getReportsData() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'
    const tenantId = session.user.tenantId

    if (!isSuperAdmin && !tenantId) {
        throw new Error('No tenant associated')
    }

    // Build tenant filter: SUPER_ADMIN sees all, others scoped to tenant
    const tenantFilter = isSuperAdmin && !tenantId ? {} : { tenantId: tenantId! }
    const lotTenantFilter = isSuperAdmin && !tenantId ? {} : { project: { tenantId: tenantId! } }

    // 1. Inventory Summary
    const inventory = await prisma.lot.groupBy({
        by: ['estado'],
        where: lotTenantFilter,
        _count: { _all: true }
    })

    // 2. Quotation Stats
    const totalQuotations = await prisma.quotation.count({
        where: tenantFilter
    })

    // 3. Project-wise metrics
    const projects = await prisma.project.findMany({
        where: isSuperAdmin && !tenantId ? {} : { tenantId: tenantId! },
        include: {
            _count: {
                select: { lots: true, quotations: true }
            }
        }
    })

    // 4. Recent sales/separations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await prisma.quotation.findMany({
        where: {
            ...tenantFilter,
            createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            lot: { select: { code: true, manzana: true, loteNumero: true } },
            user: { select: { name: true } }
        }
    })

    return {
        inventory: inventory.map(item => ({
            status: item.estado,
            count: item._count._all
        })),
        totalQuotations,
        projects,
        recentActivity
    }
}
