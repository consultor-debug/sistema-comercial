import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/projects/[id]/updates
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const updates = await prisma.projectUpdate.findMany({
        where: { projectId: params.id },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, updates })
}

// POST /api/projects/[id]/updates
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { role } = session.user as any
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { title, description, percentage, imageUrl } = await req.json()
    if (!title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

    const update = await prisma.projectUpdate.create({
        data: {
            projectId: params.id,
            title,
            description: description || null,
            percentage: Math.min(100, Math.max(0, Number(percentage) || 0)),
            imageUrl: imageUrl || null,
            authorId: (session.user as any).id,
        },
        include: { author: { select: { name: true } } },
    })

    // Also update project's updatedAt so dashboard reflects activity
    await prisma.project.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true, update }, { status: 201 })
}

// DELETE /api/projects/[id]/updates?updateId=xxx
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { role } = session.user as any
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const updateId = new URL(req.url).searchParams.get('updateId')
    if (!updateId) return NextResponse.json({ error: 'updateId requerido' }, { status: 400 })

    await prisma.projectUpdate.deleteMany({
        where: { id: updateId, projectId: params.id },
    })

    return NextResponse.json({ success: true })
}
