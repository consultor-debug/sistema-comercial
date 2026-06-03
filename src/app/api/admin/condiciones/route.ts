import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// GET — obtener condiciones del tenant actual
export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const tenantId = (session.user as any).tenantId
    if (!tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })
    
    let condiciones = await prisma.tenantCondiciones.findUnique({ where: { tenantId } })
    
    if (!condiciones) {
        // Crear con defaults si no existe
        condiciones = await prisma.tenantCondiciones.create({
            data: { tenantId }
        })
    }
    
    return NextResponse.json({ ok: true, condiciones })
}

// PUT — actualizar condiciones
export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const role = (session.user as any).role
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    
    const tenantId = (session.user as any).tenantId
    if (!tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })
    
    const body = await req.json()
    
    const condiciones = await prisma.tenantCondiciones.upsert({
        where: { tenantId },
        create: { tenantId, ...body },
        update: body,
    })
    
    return NextResponse.json({ ok: true, condiciones })
}
