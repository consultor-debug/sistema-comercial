import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generatePdfBuffer } from '@/lib/pdf'
import { SeparacionPdf } from '@/components/pdf/SeparacionPdf'
import { validateDNIWithReniec, parseReniecToClient } from '@/lib/reniec'
import path from 'path'
import React from 'react'

// POST /api/separaciones/[id]/pdf
// Process 2: Fill client data and generate the constancia PDF.
// Body: { dni, telefono, email, estadoCivil?, domicilio? }
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id: string; role: string; tenantId?: string }

    // Load the contract
    const contrato = await prisma.contract.findUnique({
        where: { id: params.id },
        include: {
            lot: {
                select: {
                    areaM2: true,
                    manzana: true,
                    loteNumero: true,
                    project: { select: { name: true } },
                },
            },
            user: { select: { name: true } },
        },
    })

    if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })

    // Tenant check
    if (user.role !== 'SUPER_ADMIN' && contrato.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const body = await req.json()
    const {
        dni,
        telefono,
        email,
        estadoCivil = 'Soltero(a)',
        domicilio = '',
    } = body

    if (!dni || !telefono || !email) {
        return NextResponse.json({ error: 'DNI, teléfono y email son obligatorios' }, { status: 400 })
    }

    // ── RENIEC lookup ─────────────────────────────────────────────────────────
    let nombres = 'S/N'
    let apellidos = ''
    try {
        const reniec = await validateDNIWithReniec(dni)
        if (reniec.success) {
            const parsed = parseReniecToClient(reniec)
            if (parsed) {
                nombres = parsed.nombres
                apellidos = parsed.apellidos
            }
        }
    } catch { /* non-critical */ }

    const nombreCompleto = `${nombres} ${apellidos}`.trim()

    // ── Update contract with client data ──────────────────────────────────────
    const datos = (contrato.datos as Record<string, unknown>) ?? {}
    await prisma.contract.update({
        where: { id: contrato.id },
        data: {
            clienteDni:         dni,
            clienteNombres:     nombres,
            clienteApellidos:   apellidos,
            clienteEmail:       email,
            clientePhone:       telefono,
            clienteEstadoCivil: estadoCivil,
            clienteDomicilio:   domicilio || null,
            datos: {
                ...datos,
                pendienteDocumento: false,
            },
        },
    })

    // ── Date helpers ──────────────────────────────────────────────────────────
    const hoy = new Date()
    const fechaHoy = hoy.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const logoPath = path.join(process.cwd(), 'public', 'sep-logo.png')

    const pdfBuffer = await generatePdfBuffer(
        React.createElement(SeparacionPdf, {
            data: {
                fecha:           fechaHoy,
                ejecutivo:       contrato.user?.name ?? '—',
                nombre:          nombreCompleto,
                dni,
                email,
                estadoCivil,
                domicilio,
                telefono,
                area:            contrato.lot.areaM2,
                manzana:         contrato.lot.manzana,
                loteNumero:      contrato.lot.loteNumero,
                precioFinal:     contrato.precioTotal,
                montoSeparacion: contrato.montoSeparacion ?? 0,
                fechaFirma:      fechaHoy,
                logoPath,
            },
        })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="separacion-${contrato.codigo}.pdf"`,
        },
    })
}
