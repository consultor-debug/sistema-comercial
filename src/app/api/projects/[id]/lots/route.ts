import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const lots = await prisma.lot.findMany({
            where: { projectId: params.id },
            select: {
                id: true,
                code: true,
                manzana: true,
                loteNumero: true,
                areaM2: true,
                precioLista: true,
                estado: true,
            },
            orderBy: [{ manzana: 'asc' }, { loteNumero: 'asc' }],
        })

        return NextResponse.json({ success: true, lots })
    } catch (error) {
        console.error('Error fetching lots for project:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
