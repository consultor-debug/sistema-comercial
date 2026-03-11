import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type LotImportData = {
    id: string
    manzana: string
    loteNumero: number
    tipologia: string
    frente: number
    ladoDerecho: number
    ladoIzquierdo: number
    fondo: number
    area: number
    etapa: string
    precioContado: number
    precioFinanciado: number
    precioFinal: number
    estado: 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
    fechaSeparacion?: string
    fechaCierre?: string
    tipoFinanciamiento?: string
    asesor?: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lots, projectId } = body as { lots: LotImportData[], projectId?: string }

        if (!lots || !Array.isArray(lots) || lots.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No hay lotes para importar' },
                { status: 400 }
            )
        }

        // Get or create default project
        let project = projectId
            ? await prisma.project.findUnique({ where: { id: projectId } })
            : null

        if (!project) {
            // Get or create default tenant first
            let tenant = await prisma.tenant.findFirst({
                where: { slug: 'default' }
            })

            if (!tenant) {
                tenant = await prisma.tenant.create({
                    data: {
                        name: 'Mi Inmobiliaria',
                        slug: 'default',
                        isActive: true
                    }
                })
            }

            project = await prisma.project.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Proyecto Importado',
                    description: 'Proyecto creado automáticamente al importar lotes',
                    maxCuotas: 60,
                    minInicial: 1000,
                    isActive: true
                }
            })
        }

        // Import lots with upsert
        const results = {
            created: 0,
            updated: 0,
            errors: [] as string[]
        }

        for (const lot of lots) {
            try {
                const code = lot.id || `${lot.manzana}-${lot.loteNumero}`

                await prisma.lot.upsert({
                    where: {
                        projectId_code: {
                            projectId: project.id,
                            code
                        }
                    },
                    update: {
                        manzana: lot.manzana,
                        loteNumero: lot.loteNumero,
                        tipologia: lot.tipologia || 'Lote Residencial',
                        areaM2: lot.area || 0,
                        etapa: lot.etapa || '1ERA ETAPA',
                        frenteM: lot.frente || 0,
                        fondoM: lot.fondo || 0,
                        ladoDerM: lot.ladoDerecho || 0,
                        ladoIzqM: lot.ladoIzquierdo || 0,
                        precioLista: lot.precioFinal || lot.precioContado || 0,
                        descuentoMax: Math.abs((lot.precioFinal || 0) - (lot.precioContado || 0)),
                        estado: lot.estado,
                        updatedAt: new Date()
                    },
                    create: {
                        projectId: project.id,
                        code,
                        manzana: lot.manzana,
                        loteNumero: lot.loteNumero,
                        tipologia: lot.tipologia || 'Lote Residencial',
                        areaM2: lot.area || 0,
                        etapa: lot.etapa || '1ERA ETAPA',
                        frenteM: lot.frente || 0,
                        fondoM: lot.fondo || 0,
                        ladoDerM: lot.ladoDerecho || 0,
                        ladoIzqM: lot.ladoIzquierdo || 0,
                        precioLista: lot.precioFinal || lot.precioContado || 0,
                        descuentoMax: Math.abs((lot.precioFinal || 0) - (lot.precioContado || 0)),
                        estado: lot.estado,
                        mapShapeType: 'circle',
                        mapShapeData: {}
                    }
                })
                results.created++
            } catch (error) {
                results.errors.push(`Error en lote ${lot.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            projectId: project.id,
            results
        })
    } catch (error) {
        console.error('Lot import error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al importar lotes' },
            { status: 500 }
        )
    }
}
