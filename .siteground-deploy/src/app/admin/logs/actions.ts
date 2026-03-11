'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function getAuditLogs(limit = 50) {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const isSuperAdmin = (session.user as { role?: string; tenantId?: string }).role === 'SUPER_ADMIN'
    const tenantId = (session.user as { tenantId?: string }).tenantId

    if (!isSuperAdmin && !tenantId) {
        throw new Error('No tenant associated')
    }

    // SUPER_ADMIN sees all logs, others scoped to their tenant
    const whereClause = isSuperAdmin && !tenantId ? {} : { tenantId: tenantId! }

    return await prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            user: { select: { name: true } },
            lot: { select: { code: true } }
        }
    })
}
