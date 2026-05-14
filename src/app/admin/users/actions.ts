'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function getUsers() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const isSuperAdmin = (session.user as { role?: string }).role === 'SUPER_ADMIN'

    const users = await prisma.user.findMany({
        where: isSuperAdmin ? {} : { 
            OR: [
                { tenantId: session.user.tenantId },
                { assignedTenantIds: { has: session.user.tenantId } }
            ]
        },
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

    return users.map(u => ({
        ...u,
        assignedProjectIds: (u as any).assignedProjectIds || []
    }))
}

export async function getSessionInfo() {
    const session = await auth()
    if (!session?.user) return null

    const tenants = (session.user as { role?: string }).role === 'SUPER_ADMIN'
        ? await prisma.tenant.findMany({ 
            select: { 
                id: true, 
                name: true,
                projects: {
                    select: { id: true, name: true }
                }
            } 
        })
        : await prisma.tenant.findMany({
            where: { id: session.user.tenantId || undefined },
            select: { 
                id: true, 
                name: true,
                projects: {
                    select: { id: true, name: true }
                }
            }
        })

    return {
        role: (session.user as { role?: string }).role,
        tenantId: session.user.tenantId,
        availableTenants: tenants
    }
}

export async function upsertUser(data: { 
    id?: string; 
    name: string; 
    email: string; 
    role: UserRole; 
    password?: string; 
    tenantIds?: string[];
    projectIds?: string[];
}) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    const isSuperAdmin = (session.user as { role?: string }).role === 'SUPER_ADMIN'
    
    // Si no es superadmin, solo puede crear usuarios en su propio tenant
    const finalTenantIds = isSuperAdmin ? (data.tenantIds || []) : [session.user.tenantId].filter(Boolean) as string[]

    if (finalTenantIds.length === 0) {
        return { success: false, error: 'Se requiere al menos una Empresa' }
    }

    const primaryTenantId = finalTenantIds[0]

    try {
        if (data.id) {
            // Update
            const updateData: Record<string, unknown> = {
                name: data.name,
                email: data.email,
                role: data.role,
                assignedTenantIds: finalTenantIds,
                assignedProjectIds: data.projectIds || []
            }

            if (isSuperAdmin) {
                updateData.tenantId = primaryTenantId
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
                    tenantId: primaryTenantId,
                    assignedTenantIds: finalTenantIds,
                    assignedProjectIds: data.projectIds || [],
                    passwordHash: await hashPassword(data.password),
                    isActive: true
                }
            })
        }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        const err = error as { code?: string };
        if (err.code === 'P2002') {
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

    const isSuperAdmin = (session.user as { role?: string }).role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session.user.tenantId) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        // SUPER_ADMIN can toggle any user; regular admins scoped to their tenant
        const whereClause: { id: string; tenantId?: string } = { id: userId }
        if (!isSuperAdmin) {
            whereClause.tenantId = session.user.tenantId || undefined
        }

        await prisma.user.update({
            where: whereClause,
            data: { isActive: !currentStatus }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch {
        return { success: false, error: 'Error al cambiar estado' }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    const isSuperAdmin = (session.user as { role?: string }).role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session.user.tenantId) {
        return { success: false, error: 'No autorizado' }
    }

    // Un usuario no debería eliminarse a sí mismo
    if ((session.user as { id?: string }).id === userId) {
        return { success: false, error: 'No puedes eliminarte a ti mismo' }
    }

    try {
        // SUPER_ADMIN can delete any user; regular admins scoped to their tenant
        const whereClause: { id: string; tenantId?: string } = { id: userId }
        if (!isSuperAdmin) {
            whereClause.tenantId = session.user.tenantId || undefined
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
