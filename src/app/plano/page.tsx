import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// Redirige automáticamente al plano del primer proyecto activo del tenant
export default async function PlanoRedirect() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const user = session.user as { tenantId?: string; role?: string }

    const where: Record<string, unknown> = {}
    if (user.role !== 'SUPER_ADMIN' && user.tenantId) {
        where.tenantId = user.tenantId
    }

    const project = await prisma.project.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
    })

    if (project) redirect(`/projects/${project.id}`)
    else redirect('/admin/projects')
}
