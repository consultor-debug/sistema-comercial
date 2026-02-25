'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getTenantSettings(targetTenantId?: string) {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'
    let tenantId = targetTenantId || (session.user as { tenantId?: string })?.tenantId

    // For SUPER_ADMIN without a tenantId, get the first available tenant
    if (!tenantId && isSuperAdmin) {
        const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
        tenantId = firstTenant?.id
    }

    if (!tenantId) {
        return null
    }

    try {
        const tenant = await (prisma.tenant as any).findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPassword: true,
                smtpFrom: true,
                reniecUrl: true,
                reniecToken: true,
                paypalClientId: true,
                paypalSecret: true,
                n8nWebhookUrl: true,
            }
        })

        return tenant
    } catch (error) {
        console.error('Get settings error:', error)
        return null
    }
}

export async function updateTenantSettings(data: Record<string, string | number | null>) {
    const session = await auth()
    const tenantId = (session?.user as { tenantId?: string })?.tenantId
    if (!tenantId) {
        return { success: false, error: 'No se encontró tenant asociado' }
    }

    try {
        await (prisma.tenant as any).update({
            where: { id: tenantId },
            data: {
                smtpHost: data.smtpHost || null,
                smtpPort: data.smtpPort ? parseInt(data.smtpPort.toString()) : null,
                smtpUser: data.smtpUser || null,
                smtpPassword: data.smtpPassword || null,
                smtpFrom: data.smtpFrom || null,
                reniecUrl: data.reniecUrl || null,
                reniecToken: data.reniecToken || null,
                paypalClientId: data.paypalClientId || null,
                paypalSecret: data.paypalSecret || null,
                n8nWebhookUrl: data.n8nWebhookUrl || null,
            }
        })

        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        console.error('Update settings error:', error)
        return { success: false, error: 'Error al actualizar configuración' }
    }
}
