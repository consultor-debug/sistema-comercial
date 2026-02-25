'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'

export async function getUsers() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'

    const users = await prisma.user.findMany({
        where: isSuperAdmin ? {} : { tenantId: session.user.tenantId },
        orderBy: { createdAt: 'desc' },
        include: {
            tenant: {
                select: {
                    name: true,
                    projects: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    })

    return users
}

export async function getSessionInfo() {
    const session = await auth()
    if (!session?.user) return null

    const tenants = (session.user as any).role === 'SUPER_ADMIN'
        ? await prisma.tenant.findMany({ select: { id: true, name: true } })
        : []

    return {
        role: (session.user as any).role,
        tenantId: session.user.tenantId,
        availableTenants: tenants
    }
}

export async function upsertUser(data: any) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'
    const targetTenantId = isSuperAdmin ? (data.tenantId || session.user.tenantId) : session.user.tenantId

    if (!targetTenantId) {
        return { success: false, error: 'Se requiere un Tenant' }
    }

    try {
        if (data.id) {
            // Update
            const updateData: any = {
                name: data.name,
                email: data.email,
                role: data.role,
            }

            if (isSuperAdmin && data.tenantId) {
                updateData.tenantId = data.tenantId
            }

            if (data.password) {
                updateData.passwordHash = await hashPassword(data.password)
            }

            await prisma.user.update({
                where: { id: data.id },
                data: updateData
            })
        } else {
            // Create
            if (!data.password) {
                return { success: false, error: 'Se requiere contraseña para nuevos usuarios' }
            }

            await prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    tenantId: targetTenantId,
                    passwordHash: await hashPassword(data.password),
                    isActive: true
                }
            })
        }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: 'El correo electrónico ya está en uso' }
        }
        console.error('Upsert user error:', error)
        return { success: false, error: 'Error al procesar el usuario' }
    }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session.user.tenantId) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        // SUPER_ADMIN can toggle any user; regular admins scoped to their tenant
        const whereClause: any = { id: userId }
        if (!isSuperAdmin) {
            whereClause.tenantId = session.user.tenantId
        }

        await prisma.user.update({
            where: whereClause,
            data: { isActive: !currentStatus }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (_error) {
        return { success: false, error: 'Error al cambiar estado' }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session.user.tenantId) {
        return { success: false, error: 'No autorizado' }
    }

    // Un usuario no debería eliminarse a sí mismo
    if ((session.user as any).id === userId) {
        return { success: false, error: 'No puedes eliminarte a ti mismo' }
    }

    try {
        // SUPER_ADMIN can delete any user; regular admins scoped to their tenant
        const whereClause: any = { id: userId }
        if (!isSuperAdmin) {
            whereClause.tenantId = session.user.tenantId
        }

        await prisma.user.delete({
            where: whereClause
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Delete user error:', error)
        return { success: false, error: 'Error al eliminar usuario' }
    }
}
