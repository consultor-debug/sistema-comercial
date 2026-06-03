import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    const contrato = await prisma.contract.findUnique({
        where: { id },
        include: {
            lot: true,
            user: { select: { name: true, email: true } },
            cuotas: { orderBy: { numero: 'asc' } },
        }
    })
    
    if (!contrato) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, contrato })
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    const body = await req.json()
    
    const contrato = await prisma.contract.update({
        where: { id },
        data: body
    })
    
    return NextResponse.json({ ok: true, contrato })
}
