import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generateQuotationCode } from '@/lib/auth'
import { generatePdfBuffer } from '@/lib/pdf'
import { QuotationPdf } from '@/components/pdf/QuotationPdf'
import { sendEmail } from '@/lib/mail'
import { sendToN8n } from '@/lib/n8n'
import React from 'react'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lotId, quotation, client } = body

        // Validate required fields
        if (!lotId || !quotation || !client) {
            return NextResponse.json(
                { success: false, error: 'Datos incompletos' },
                { status: 400 }
            )
        }

        // Get lot with project info
        const lot = await prisma.lot.findUnique({
            where: { id: lotId },
            include: {
                project: {
                    include: {
                        tenant: true
                    }
                }
            }
        })

        if (!lot) {
            return NextResponse.json(
                { success: false, error: 'Lote no encontrado' },
                { status: 404 }
            )
        }

        // Check lot is LIBRE
        if (lot.estado !== 'LIBRE') {
            return NextResponse.json(
                { success: false, error: 'El lote no está disponible para cotizar' },
                { status: 400 }
            )
        }

        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const userId = (session.user as { id: string }).id
        // const userId = '00000000-0000-0000-0000-000000000001' // Mock user ID (Super Admin from seed)

        // Generate quotation code
        const codigo = generateQuotationCode()

        // Create quotation record
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

        const now = new Date()
        const vigencia = new Date(now)
        vigencia.setDate(vigencia.getDate() + 3)

        // Generate PDF
        const pdfData = {
            codigo: newQuotation.codigo,
            date: {
                fechaEmision: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                horaEmision: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
                fechaVigencia: vigencia.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            },
            tenant: {
                name: lot.project.tenant.name,
                logoUrl: lot.project.tenant.logoUrl || undefined
            },
            project: {
                name: lot.project.name
            },
            lot: {
                code: lot.code,
                manzana: lot.manzana,
                loteNumero: lot.loteNumero,
                areaM2: lot.areaM2,
                precioLista: lot.precioLista,
                tipologia: lot.tipologia,
                etapa: lot.etapa,
                frenteM: lot.frenteM,
                fondoM: lot.fondoM,
                ladoDerM: lot.ladoDerM,
                ladoIzqM: lot.ladoIzqM
            },
            client: {
                dni: client.dni,
                nombreCompleto: `${client.nombres} ${client.apellidos}`,
                email: client.email
            },
            financial: {
                precioLista: quotation.precioLista,
                descuento: quotation.descuento,
                precioFinal: quotation.precioFinal,
                inicial: quotation.inicial,
                cuotas: quotation.cuotas,
                cuotaMensual: quotation.cuotaMensual,
                cronograma: quotation.cronograma as unknown as Array<{ numero: number; fecha: string; monto: number }>
            }
        }

        let emailSent = false
        try {
            console.log('Generando PDF...')
            const pdfBuffer = await generatePdfBuffer(<QuotationPdf data={pdfData} />)

            // Send email if tenant has SMTP settings
            const { tenant } = lot.project
            const hasSmtpSettings = !!(tenant.smtpHost && tenant.smtpUser && tenant.smtpPassword);

            if (hasSmtpSettings) {
                console.log('Enviando correo...')
                await sendEmail({
                    host: tenant.smtpHost!,
                    port: tenant.smtpPort || 587,
                    user: tenant.smtpUser!,
                    pass: tenant.smtpPassword!,
                    from: tenant.smtpFrom || tenant.name
                }, {
                    to: client.email,
                    subject: `Cotización ${newQuotation.codigo} - ${lot.project.name}`,
                    text: `Estimado(a) ${client.nombres},\n\nAdjunto encontrará la cotización solicitada para el lote ${lot.code} del proyecto ${lot.project.name}.\n\nAtentamente,\n${tenant.name}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>Hola, ${client.nombres} 👋</h2>
                            <p>Gracias por tu interés en el proyecto <strong>${lot.project.name}</strong>.</p>
                            <p>Adjunto encontrarás el detalle de la cotización para el <strong>Lote ${lot.code}</strong>.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="color: #666; font-size: 12px;">
                                Si tienes alguna duda, puedes responder a este correo o contactar a tu asesor.
                            </p>
                        </div>
                    `,
                    attachments: [{
                        filename: `Cotizacion_${newQuotation.codigo}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }]
                })
                emailSent = true
                console.log('Correo enviado correctamente')
            } else {
                console.log('⚠ No se enviará correo: Faltan credenciales SMTP en el Tenant')
            }

            // Send email if tenant has SMTP settings
            // ... (keep current email logic)
            // AFTER all local processing, send to n8n if configured
            const webhookUrl = (lot.project as { n8nWebhookUrl?: string }).n8nWebhookUrl || (lot.project.tenant as { n8nWebhookUrl?: string }).n8nWebhookUrl
            if (webhookUrl) {
                console.log('Enviando a n8n...')
                try {
                    await sendToN8n(webhookUrl, {
                        event: 'quotation.created',
                        data: {
                            quotation: newQuotation,
                            project: {
                                id: lot.project.id,
                                name: lot.project.name
                            },
                            lot: {
                                code: lot.code,
                                area: lot.areaM2
                            },
                            client,
                            timestamp: new Date().toISOString()
                        }
                    })
                    console.log('Enviado a n8n correctamente')
                } catch (n8nErr) {
                    console.error('Error enviando a n8n:', n8nErr)
                }
            }

        } catch (err) {
            console.error('Error generando PDF o enviando correo:', err)
            // Error handling: We still want to return success if quotation was created, 
            // but emailSent will be false.
        }

        // Update quotation status
        await prisma.quotation.update({
            where: { id: newQuotation.id },
            data: {
                emailStatus: emailSent ? 'SENT' : 'FAILED',
                emailSentAt: emailSent ? new Date() : null
            }
        })

        return NextResponse.json({
            success: true,
            quotation: {
                id: newQuotation.id,
                codigo: newQuotation.codigo,
                emailSent
            }
        })
    } catch (error) {
        console.error('Quotation send error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al procesar la cotización' },
            { status: 500 }
        )
    }
}
