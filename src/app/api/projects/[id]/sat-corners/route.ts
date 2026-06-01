import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const { satCorners } = await req.json()

    await prisma.project.update({
        where: { id },
        data: { satCorners },
    })

    return NextResponse.json({ ok: true })
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const project = await prisma.project.findUnique({
        where: { id },
        select: { satCorners: true },
    })
    return NextResponse.json({ satCorners: project?.satCorners ?? null })
}
