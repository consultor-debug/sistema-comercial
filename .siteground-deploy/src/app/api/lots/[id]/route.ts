import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { createAuditLog } from '@/lib/audit'
import { sendToN8n } from '@/lib/n8n'

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

        // Get current lot state for audit
        const existingLot = await prisma.lot.findUnique({
            where: { id },
            include: {
                project: {
                    include: { tenant: true }
                }
            }
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

        // Audit Log if status changed
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

            // Trigger n8n or Google App Script Webhook
            const project = existingLot.project as { n8nWebhookUrl?: string | null, sheetsId?: string | null, tenant: { n8nWebhookUrl?: string | null } }
            const webhookUrl = project.n8nWebhookUrl || project.tenant.n8nWebhookUrl
            if (webhookUrl) {
                await sendToN8n(webhookUrl, {
                    // Google App Script compat keys
                    id: lot.code, // Usar el codigo ('A1') que es lo que esta en la columna 'ID' del Excel
                    status: lot.estado,
                    sheetId: project.sheetsId || '1bxtoP3mjCIHJMQa_x5qRD1sTP-0_JDKyftwA3h-WfKM',
                    // Regular n8n payload keys
                    event: 'lot.status_changed',
                    data: {
                        lot: {
                            id: lot.id,
                            code: lot.code,
                            oldStatus: prevEstado,
                            newStatus: lot.estado
                        },
                        project: {
                            id: existingLot.project.id,
                            name: existingLot.project.name
                        },
                        user: {
                            id: (session.user as { id: string }).id,
                            name: session.user.name
                        },
                        timestamp: new Date().toISOString()
                    }
                }).catch(err => console.error('n8n error in lot update:', err))
            }
        }

        return NextResponse.json({ success: true, lot })
    } catch (error) {
        console.error('Lot update error:', error)
        return NextResponse.json({ error: 'Error al actualizar lote' }, { status: 500 })
    }
}
