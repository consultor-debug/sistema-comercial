import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generateQuotationCode } from '@/lib/auth'
import { generatePdfBuffer } from '@/lib/pdf'
import { QuotationPdf } from '@/components/pdf/QuotationPdf'
import React from 'react'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lotId, quotation, client } = body

        if (!lotId || !quotation || !client) {
            return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 })
        }

        const lot = await prisma.lot.findUnique({
            where: { id: lotId },
            include: { project: { include: { tenant: true } } }
        })

        if (!lot) {
            return NextResponse.json({ success: false, error: 'Lote no encontrado' }, { status: 404 })
        }

        if (lot.estado !== 'LIBRE') {
            return NextResponse.json({ success: false, error: 'El lote no está disponible para cotizar' }, { status: 400 })
        }

        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const userId = (session.user as { id: string }).id
        const codigo = generateQuotationCode()

        const newQuotation = await prisma.quotation.create({
            data: {
                codigo,
                tenantId: lot.project.tenantId,
                projectId: lot.projectId,
                lotId: lot.id,
                userId,
                estadoLoteAlEnviar: lot.estado,
                clienteDni: client.dni,
                clienteNombres: client.nombres,
                clienteApellidos: client.apellidos,
                clienteEmail: client.email || '',
                precioLista: quotation.precioLista,
                descuento: quotation.descuento,
                precioFinal: quotation.precioFinal,
                inicial: quotation.inicial,
                cuotas: quotation.cuotas,
                fechaInicio: new Date(quotation.fechaInicio),
                cronograma: quotation.cronograma,
                emailStatus: 'PENDING'
            }
        })

        // Generación de PDF delegada a endpoint GET

        // El POST ahora solo crea el registro y devuelve el ID
        return NextResponse.json({ success: true, quotationId: newQuotation.id })
    } catch (error) {
        console.error('Error creating quotation:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (!id) return new Response('ID de cotización requerido', { status: 400 })

        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                tenant: true,
                project: true,
                lot: true
            }
        })

        if (!quotation) return new Response('Cotización no encontrada', { status: 404 })

        const now = quotation.createdAt
        const vigencia = new Date(now)
        vigencia.setDate(vigencia.getDate() + 3)

        // Recuperar cronograma (ahora sabemos que es un array)
        const crono = Array.isArray(quotation.cronograma) ? quotation.cronograma : []
        const cuotaMensual = crono.length > 0 ? (crono[0] as unknown as { monto: number }).monto : (quotation.cuotas > 0 ? (quotation.precioFinal - quotation.inicial) / quotation.cuotas : 0)

        const pdfData = {
            codigo: quotation.codigo,
            date: {
                fechaEmision: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                horaEmision: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
                fechaVigencia: vigencia.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            },
            tenant: {
                name: quotation.tenant.name,
                logoUrl: quotation.tenant.logoUrl || undefined
            },
            project: {
                name: quotation.project.name
            },
            lot: {
                code: quotation.lot.code,
                manzana: quotation.lot.manzana,
                loteNumero: quotation.lot.loteNumero,
                areaM2: quotation.lot.areaM2,
                precioLista: quotation.lot.precioLista,
                tipologia: quotation.lot.tipologia,
                etapa: quotation.lot.etapa,
                frenteM: quotation.lot.frenteM,
                fondoM: quotation.lot.fondoM,
                ladoDerM: quotation.lot.ladoDerM,
                ladoIzqM: quotation.lot.ladoIzqM
            },
            client: {
                dni: quotation.clienteDni,
                nombreCompleto: `${quotation.clienteNombres} ${quotation.clienteApellidos}`,
                email: quotation.clienteEmail
            },
            financial: {
                precioLista: quotation.precioLista,
                descuento: quotation.descuento,
                precioFinal: quotation.precioFinal,
                inicial: quotation.inicial,
                cuotas: quotation.cuotas,
                cuotaMensual: Number(cuotaMensual),
                cronograma: quotation.cronograma as unknown as Array<{ numero: number; fecha: string; monto: number }>
            }
        }

        const pdfBuffer = await generatePdfBuffer(<QuotationPdf data={pdfData} />)

        return new Response(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                // inline permite verlo en web, con el filename listo para la hora de guardar.
                'Content-Disposition': `inline; filename="Cotizacion_${quotation.codigo}.pdf"`,
                'Content-Length': pdfBuffer.length.toString()
            },
        })
    } catch (error) {
        console.error('Error downloading quotation PDF:', error)
        return new Response('Error interno del servidor', { status: 500 })
    }
}
