'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getTenants() {
    const session = await auth()
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') {
        throw new Error('No autorizado')
    }

    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    projects: true,
                    users: true
                }
            }
        }
    })

    return tenants
}

export async function upsertTenant(data: { id?: string; name: string; slug: string; logoUrl?: string | null; primaryColor?: string | null }) {
    const session = await auth()
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'No autorizado' }
    }

    try {
        if (data.id) {
            // Update
            await prisma.tenant.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    slug: data.slug,
                    logoUrl: data.logoUrl || null,
                    primaryColor: data.primaryColor || '#3B82F6',
                }
            })
        } else {
            // Create
            await prisma.tenant.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    logoUrl: data.logoUrl || null,
                    primaryColor: data.primaryColor || '#3B82F6',
                    isActive: true
                }
            })
        }

        revalidatePath('/admin/tenants')
        return { success: true }
    } catch (error) {
        const err = error as { code?: string };
        if (err.code === 'P2002') {
            return { success: false, error: 'El slug ya está en uso' }
        }
        console.error('Upsert tenant error:', error)
        return { success: false, error: 'Error al procesar el negocio' }
    }
}

export async function toggleTenantStatus(tenantId: string, currentStatus: boolean) {
    const session = await auth()
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'No autorizado' }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive: !currentStatus }
        })

        revalidatePath('/admin/tenants')
        return { success: true }
    } catch (error) {
        console.error('Toggle tenant status error:', error)
        return { success: false, error: 'Error al cambiar estado' }
    }
}

export async function deleteTenant(tenantId: string) {
    const session = await auth()
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'No autorizado' }
    }

    try {
        await prisma.tenant.delete({
            where: { id: tenantId }
        })

        revalidatePath('/admin/tenants')
        return { success: true }
    } catch (error) {
        console.error('Delete tenant error:', error)
        return { success: false, error: 'Error al eliminar el negocio' }
    }
}
