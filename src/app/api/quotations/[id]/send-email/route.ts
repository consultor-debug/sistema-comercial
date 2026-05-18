import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generatePdfBuffer } from '@/lib/pdf'
import { QuotationPdf } from '@/components/pdf/QuotationPdf'
import nodemailer from 'nodemailer'
import React from 'react'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    let body: { email?: string } = {}
    try { body = await request.json() } catch { /* empty body OK */ }

    const recipientEmail = (body.email || '').trim()

    try {
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: { tenant: true, project: true, lot: true }
        })

        if (!quotation) {
            return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
        }

        // Determine where to send
        const emailTo = recipientEmail || quotation.clienteEmail
        if (!emailTo || !emailTo.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'Ingresa un email válido del cliente' },
                { status: 400 }
            )
        }

        // Verify SMTP settings are configured for this tenant
        const t = quotation.tenant
        if (!t.smtpHost || !t.smtpUser || !t.smtpPassword) {
            return NextResponse.json(
                { success: false, error: 'Configura el servidor SMTP en Configuración del Sistema primero' },
                { status: 400 }
            )
        }

        // Build PDF data (identical logic to /api/quotations/download GET)
        const now = quotation.createdAt
        const vigencia = new Date(now)
        vigencia.setDate(vigencia.getDate() + 3)

        const crono = Array.isArray(quotation.cronograma) ? quotation.cronograma : []
        const cuotaMensual =
            crono.length > 0
                ? (crono[0] as { monto: number }).monto
                : quotation.cuotas > 0
                    ? (quotation.precioFinal - quotation.inicial) / quotation.cuotas
                    : 0

        const pdfData = {
            codigo: quotation.codigo,
            date: {
                fechaEmision: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' }),
                horaEmision: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' }),
                fechaVigencia: vigencia.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' }),
            },
            tenant: { name: t.name, logoUrl: t.logoUrl || undefined },
            project: { name: quotation.project.name },
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
                ladoIzqM: quotation.lot.ladoIzqM,
            },
            client: {
                dni: quotation.clienteDni,
                nombreCompleto: `${quotation.clienteNombres} ${quotation.clienteApellidos}`,
                email: emailTo,
            },
            financial: {
                precioLista: quotation.precioLista,
                descuento: quotation.descuento,
                precioFinal: quotation.precioFinal,
                inicial: quotation.inicial,
                cuotas: quotation.cuotas,
                cuotaMensual: Number(cuotaMensual),
                cronograma: quotation.cronograma as unknown as Array<{ numero: number; fecha: string; monto: number }>,
            },
        }

        const pdfBuffer = await generatePdfBuffer(<QuotationPdf data={pdfData} />)

        // Configure nodemailer transport
        const transporter = nodemailer.createTransport({
            host: t.smtpHost,
            port: t.smtpPort || 587,
            secure: (t.smtpPort || 587) === 465,
            auth: { user: t.smtpUser, pass: t.smtpPassword },
        })

        const fromDisplay = t.smtpFrom || t.smtpUser
        const precioFormatted = quotation.precioFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })

        await transporter.sendMail({
            from: `"${t.name}" <${fromDisplay}>`,
            to: emailTo,
            subject: `Tu cotización ${quotation.codigo} — ${quotation.project.name}`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <div style="background:#0f172a;padding:24px 32px">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">${t.name}</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px">${quotation.project.name}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600">
        Hola, ${quotation.clienteNombres}
      </p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">
        Adjuntamos tu cotización personalizada para el proyecto <strong>${quotation.project.name}</strong>.
        Puedes revisar el PDF con todos los detalles de tu financiamiento.
      </p>

      <!-- Summary card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr">
          <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Código</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b">${quotation.codigo}</p>
          </div>
          <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Lote</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b">${quotation.lot.code}</p>
          </div>
          <div style="padding:14px 16px">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Precio Final</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#059669">S/ ${precioFormatted}</p>
          </div>
          <div style="padding:14px 16px;border-left:1px solid #e2e8f0">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Vigencia</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b">${pdfData.date.fechaVigencia}</p>
          </div>
        </div>
      </div>

      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5">
        Esta cotización es válida por 3 días desde su emisión. Para más información,
        comunícate directamente con tu asesor.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#cbd5e1;font-size:11px;text-align:center">${t.name} · Cotización generada automáticamente</p>
    </div>
  </div>
</body>
</html>`,
            attachments: [
                {
                    filename: `Cotizacion_${quotation.codigo}.pdf`,
                    content: Buffer.from(pdfBuffer),
                    contentType: 'application/pdf',
                },
            ],
        })

        // Update status
        await prisma.quotation.update({
            where: { id },
            data: { emailStatus: 'SENT', emailSentAt: new Date() },
        })

        return NextResponse.json({ success: true, sentTo: emailTo })
    } catch (error: unknown) {
        console.error('Send email error:', error)
        // Mark as failed
        await prisma.quotation
            .update({ where: { id }, data: { emailStatus: 'FAILED' } })
            .catch(() => { })

        const msg = error instanceof Error ? error.message : 'Error al enviar email'
        return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
}
