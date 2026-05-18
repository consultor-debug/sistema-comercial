import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// New simplified format (10 columns):
// manzana, lote, etapa, tipologia, area_m2, frente_m, fondo_m, lado_der_m, lado_izq_m, precio_lista
type LotImportRow = {
    manzana: string
    loteNumero: number
    etapa?: string
    tipologia?: string
    areaM2: number
    frenteM?: number
    fondoM?: number
    ladoDerM?: number
    ladoIzqM?: number
    precioLista: number
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        const { role } = session.user as { role: string }
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Sin permisos para importar lotes' }, { status: 403 })
        }

        const body = await request.json()
        const { lots, projectId } = body as { lots: LotImportRow[], projectId: string }

        if (!projectId) {
            return NextResponse.json({ success: false, error: 'projectId es requerido' }, { status: 400 })
        }

        if (!lots || !Array.isArray(lots) || lots.length === 0) {
            return NextResponse.json({ success: false, error: 'No hay lotes para importar' }, { status: 400 })
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ success: false, error: 'Proyecto no encontrado' }, { status: 404 })
        }

        const results = { created: 0, updated: 0, errors: [] as string[] }

        for (const lot of lots) {
            try {
                if (!lot.manzana || !lot.loteNumero) {
                    results.errors.push(`Fila inválida: manzana y lote son requeridos`)
                    continue
                }

                const code = `${lot.manzana}-${String(lot.loteNumero).padStart(2, '0')}`

                const existing = await prisma.lot.findUnique({
                    where: { projectId_code: { projectId, code } }
                })

                if (existing) {
                    await prisma.lot.update({
                        where: { id: existing.id },
                        data: {
                            manzana: lot.manzana,
                            loteNumero: lot.loteNumero,
                            ...(lot.etapa !== undefined && { etapa: lot.etapa }),
                            ...(lot.tipologia !== undefined && { tipologia: lot.tipologia }),
                            areaM2: lot.areaM2 || 0,
                            ...(lot.frenteM !== undefined && { frenteM: lot.frenteM }),
                            ...(lot.fondoM !== undefined && { fondoM: lot.fondoM }),
                            ...(lot.ladoDerM !== undefined && { ladoDerM: lot.ladoDerM }),
                            ...(lot.ladoIzqM !== undefined && { ladoIzqM: lot.ladoIzqM }),
                            precioLista: lot.precioLista || 0,
                        }
                    })
                    results.updated++
                } else {
                    await prisma.lot.create({
                        data: {
                            projectId,
                            code,
                            manzana: lot.manzana,
                            loteNumero: lot.loteNumero,
                            etapa: lot.etapa || '',
                            tipologia: lot.tipologia || 'Lote Residencial',
                            areaM2: lot.areaM2 || 0,
                            frenteM: lot.frenteM || 0,
                            fondoM: lot.fondoM || 0,
                            ladoDerM: lot.ladoDerM || 0,
                            ladoIzqM: lot.ladoIzqM || 0,
                            precioLista: lot.precioLista || 0,
                            estado: 'LIBRE',
                            mapShapeType: 'circle',
                            mapShapeData: {}
                        }
                    })
                    results.created++
                }
            } catch (err) {
                results.errors.push(`Error en lote ${lot.manzana}-${lot.loteNumero}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({ success: true, projectId, results })
    } catch (error) {
        console.error('Lot import error:', error)
        return NextResponse.json({ success: false, error: 'Error al importar lotes' }, { status: 500 })
    }
}
