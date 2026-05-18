import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { createAuditLog } from '@/lib/audit'
import { sendToN8n } from '@/lib/n8n'

// PATCH — estado + mapa (uso interno del panel de ventas)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { mapShapeType, mapShapeData, estado, motivo } = body

        const existingLot = await prisma.lot.findUnique({
            where: { id },
            include: { project: { include: { tenant: true } } }
        })

        if (!existingLot) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        const prevEstado = existingLot.estado

        const lot = await prisma.lot.update({
            where: { id },
            data: {
                ...(mapShapeType && { mapShapeType }),
                ...(mapShapeData && { mapShapeData }),
                ...(estado && { estado })
            }
        })

        if (estado && estado !== prevEstado) {
            await createAuditLog({
                tenantId: existingLot.project.tenantId,
                userId: (session.user as { id: string }).id,
                lotId: id,
                campo: 'estado',
                valorAnterior: prevEstado,
                valorNuevo: estado,
                motivo
            })

            const project = existingLot.project as { n8nWebhookUrl?: string | null, sheetsId?: string | null, tenant: { n8nWebhookUrl?: string | null } }
            const webhookUrl = project.n8nWebhookUrl || project.tenant.n8nWebhookUrl

            if (webhookUrl) {
                const payload = {
                    id: lot.code,
                    status: lot.estado,
                    sheetId: project.sheetsId || '',
                    event: 'lot.status_changed',
                    data: {
                        lot: { id: lot.id, code: lot.code, oldStatus: prevEstado, newStatus: lot.estado },
                        project: { id: existingLot.project.id, name: existingLot.project.name },
                        timestamp: new Date().toISOString()
                    }
                }
                await sendToN8n(webhookUrl, payload).catch(err => console.error('Webhook error:', err))
            }
        }

        return NextResponse.json({ success: true, lot })
    } catch (error) {
        console.error('Lot patch error:', error)
        return NextResponse.json({ error: 'Error al actualizar lote' }, { status: 500 })
    }
}

// PUT — edición completa de campos (uso del administrador de lotes)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role } = session.user as { role: string }
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Sin permisos para editar lotes' }, { status: 403 })
        }

        const body = await request.json()
        const { manzana, loteNumero, tipologia, etapa, areaM2, frenteM, fondoM, ladoDerM, ladoIzqM, precioLista } = body

        const existingLot = await prisma.lot.findUnique({
            where: { id },
            include: { project: true }
        })

        if (!existingLot) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        // Rebuild code if manzana or loteNumero changed
        const newManzana = manzana ?? existingLot.manzana
        const newLoteNumero = loteNumero ?? existingLot.loteNumero
        const newCode = `${newManzana}-${String(newLoteNumero).padStart(2, '0')}`

        const lot = await prisma.lot.update({
            where: { id },
            data: {
                manzana: newManzana,
                loteNumero: newLoteNumero,
                code: newCode,
                ...(tipologia !== undefined && { tipologia }),
                ...(etapa !== undefined && { etapa }),
                ...(areaM2 !== undefined && { areaM2: Number(areaM2) }),
                ...(frenteM !== undefined && { frenteM: Number(frenteM) }),
                ...(fondoM !== undefined && { fondoM: Number(fondoM) }),
                ...(ladoDerM !== undefined && { ladoDerM: Number(ladoDerM) }),
                ...(ladoIzqM !== undefined && { ladoIzqM: Number(ladoIzqM) }),
                ...(precioLista !== undefined && { precioLista: Number(precioLista) }),
            }
        })

        // Audit if price changed
        if (precioLista !== undefined && Number(precioLista) !== existingLot.precioLista) {
            await createAuditLog({
                tenantId: existingLot.project.tenantId,
                userId: (session.user as { id: string }).id,
                lotId: id,
                campo: 'precioLista',
                valorAnterior: String(existingLot.precioLista),
                valorNuevo: String(precioLista),
            })
        }

        return NextResponse.json({ success: true, lot })
    } catch (error) {
        console.error('Lot PUT error:', error)
        return NextResponse.json({ error: 'Error al actualizar lote' }, { status: 500 })
    }
}

// DELETE — eliminar lote
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role } = session.user as { role: string }
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Sin permisos para eliminar lotes' }, { status: 403 })
        }

        const lot = await prisma.lot.findUnique({ where: { id } })
        if (!lot) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        if (lot.estado === 'VENDIDO') {
            return NextResponse.json({ error: 'No se puede eliminar un lote vendido' }, { status: 400 })
        }

        await prisma.lot.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Lot DELETE error:', error)
        return NextResponse.json({ error: 'Error al eliminar lote' }, { status: 500 })
    }
}
