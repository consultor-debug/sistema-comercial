import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/lots/[id]/documents
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const docs = await prisma.lotDocument.findMany({
        where: { lotId: id },
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, documents: docs })
}

// POST /api/lots/[id]/documents
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { role } = session.user as any
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { name, type, fileUrl } = await req.json()
    if (!name || !fileUrl) {
        return NextResponse.json({ error: 'Nombre y URL son requeridos' }, { status: 400 })
    }

    const validTypes = ['PLANO', 'ESCRITURA', 'CONTRATO', 'FOTO', 'OTRO']
    const docType = validTypes.includes(type) ? type : 'OTRO'

    const doc = await prisma.lotDocument.create({
        data: {
            lotId: id,
            name,
            type: docType,
            fileUrl,
            uploadedById: (session.user as any).id,
        },
        include: { uploadedBy: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, document: doc }, { status: 201 })
}

// DELETE /api/lots/[id]/documents?docId=xxx
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { role } = session.user as any
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const docId = new URL(req.url).searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'docId requerido' }, { status: 400 })

    await prisma.lotDocument.deleteMany({
        where: { id: docId, lotId: id },
    })

    return NextResponse.json({ success: true })
}
