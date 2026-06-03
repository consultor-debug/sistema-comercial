import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(req.url)
    const contractId = searchParams.get('contractId')
    const estado = searchParams.get('estado')
    
    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (contractId) where.contractId = contractId
    if (estado) where.estado = estado
    
    const cuotas = await prisma.cuota.findMany({
        where,
        include: {
            contract: {
                select: {
                    codigo: true,
                    clienteNombres: true,
                    clienteApellidos: true,
                    clienteDni: true,
                    lot: { select: { code: true, manzana: true } }
                }
            },
            registradoPor: { select: { name: true } }
        },
        orderBy: [{ fechaVenc: 'asc' }]
    })
    
    // Auto-marcar vencidas
    const now = new Date()
    const vencidas = cuotas.filter(c => c.estado === 'PENDIENTE' && c.fechaVenc < now)
    if (vencidas.length > 0) {
        await prisma.cuota.updateMany({
            where: { id: { in: vencidas.map(v => v.id) } },
            data: { estado: 'VENCIDO' }
        })
        vencidas.forEach(v => { v.estado = 'VENCIDO' })
    }
    
    return NextResponse.json({ ok: true, cuotas })
}
