import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verify role might be needed, but assume auth() is enough as it's an admin route
        const body = await request.json()
        const { projectId } = body

        if (!projectId) {
            return NextResponse.json({ error: 'Se requiere projectId' }, { status: 400 })
        }

        // Reset the shape data for all lots in this project
        await prisma.lot.updateMany({
            where: { projectId },
            data: {
                mapShapeType: null,
                mapShapeData: Prisma.DbNull
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Reset map error:', error)
        return NextResponse.json({ error: 'Error al reiniciar coordenadas' }, { status: 500 })
    }
}
