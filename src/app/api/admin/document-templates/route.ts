import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export interface DocumentTemplate {
    orden: number
    titulo: string
    subtitulo: string
    tipo: 'RESERVA' | 'PRINCIPAL' | 'ANEXO' | 'ADICIONAL'
    cuerpo: string
}

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
    {
        orden: 1,
        titulo: 'SEPARACIÓN',
        subtitulo: 'Constancia de Separación',
        tipo: 'RESERVA',
        cuerpo: `Por medio del presente documento, la empresa {empresa.nombre} deja constancia de la separación del inmueble ubicado en el Proyecto "{inmueble.proyecto}", Manzana {inmueble.manzana}, Lote {inmueble.lote}, con un área de {inmueble.area} m².

DATOS DEL SEPARANTE:
Nombre: {cliente.nombres} {cliente.apellidos}
DNI: {cliente.dni}
Estado Civil: {cliente.estadoCivil}
Domicilio: {cliente.domicilio}

CONDICIONES DE SEPARACIÓN:
Monto de separación: S/ {inmueble.separacion}
Precio de venta acordado: S/ {inmueble.precio}
Fecha: {fecha.hoy}

Esta separación tiene vigencia de 72 horas desde la fecha indicada.

_______________________
Firma del separante`,
    },
    {
        orden: 2,
        titulo: 'CONTRATO DE COMPRAVENTA DE BIEN FUTURO',
        subtitulo: 'Proyecto "{inmueble.proyecto}"',
        tipo: 'PRINCIPAL',
        cuerpo: `Conste por el presente documento el CONTRATO DE COMPRAVENTA DE BIEN FUTURO que celebran:

EL VENDEDOR: {empresa.nombre}, con domicilio en Lima, Perú.

EL COMPRADOR: {cliente.nombres} {cliente.apellidos}, identificado con DNI N° {cliente.dni}, de estado civil {cliente.estadoCivil}, con domicilio en {cliente.domicilio}.

PRIMERA: OBJETO DEL CONTRATO
El Vendedor se compromete a transferir al Comprador la propiedad del inmueble del Proyecto "{inmueble.proyecto}", Manzana {inmueble.manzana}, Lote {inmueble.lote}, con un área total de {inmueble.area} m².

SEGUNDA: PRECIO Y FORMA DE PAGO
El precio de venta es de S/ {inmueble.precio}, el cual será cancelado según el cronograma de pagos adjunto.

TERCERA: ENTREGA DEL BIEN
La entrega se realizará conforme al cronograma establecido en el proyecto.

Lima, {fecha.hoy}

_______________________          _______________________
El Vendedor                       El Comprador`,
    },
    {
        orden: 3,
        titulo: 'CRONOGRAMA DE PAGOS',
        subtitulo: 'Anexo al Contrato de Compraventa',
        tipo: 'ANEXO',
        cuerpo: `CRONOGRAMA DE PAGOS

Cliente: {cliente.nombres} {cliente.apellidos}
DNI: {cliente.dni}
Inmueble: Proyecto "{inmueble.proyecto}" — Mz. {inmueble.manzana}, Lt. {inmueble.lote}
Precio de venta: S/ {inmueble.precio}

El detalle de cuotas se adjunta al presente documento según lo pactado en el contrato principal.

Lima, {fecha.hoy}`,
    },
    {
        orden: 4,
        titulo: 'ACTA DE SEPARACIÓN',
        subtitulo: 'Documento Adicional',
        tipo: 'ADICIONAL',
        cuerpo: `ACTA DE SEPARACIÓN

En la ciudad de Lima, a {fecha.hoy}, el señor/señora {cliente.nombres} {cliente.apellidos}, identificado con DNI {cliente.dni}, declara haber realizado la separación del lote Mz. {inmueble.manzana}, Lt. {inmueble.lote} del Proyecto "{inmueble.proyecto}", por el monto de S/ {inmueble.separacion}.

_______________________
Firma`,
    },
    {
        orden: 5,
        titulo: 'TRATAMIENTO DE DATOS PERSONALES',
        subtitulo: 'Anexo de Privacidad',
        tipo: 'ANEXO',
        cuerpo: `AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES

Yo, {cliente.nombres} {cliente.apellidos}, identificado con DNI N° {cliente.dni}, autorizo a {empresa.nombre} a tratar mis datos personales para los fines relacionados con la adquisición del inmueble en el Proyecto "{inmueble.proyecto}".

Esta autorización se otorga en cumplimiento de la Ley N° 29733, Ley de Protección de Datos Personales.

Lima, {fecha.hoy}

_______________________
Firma del titular`,
    },
    {
        orden: 6,
        titulo: 'DECLARACIÓN JURADA DE DOMICILIO Y ESTADO CIVIL',
        subtitulo: 'Anexo Declaratorio',
        tipo: 'ANEXO',
        cuerpo: `DECLARACIÓN JURADA

Yo, {cliente.nombres} {cliente.apellidos}, identificado con DNI N° {cliente.dni}, declaro bajo juramento que:

1. Mi domicilio actual es: {cliente.domicilio}
2. Mi estado civil es: {cliente.estadoCivil}

Declaro que la información proporcionada es verídica y asumo las responsabilidades legales que pudieran derivarse de una declaración falsa.

Lima, {fecha.hoy}

_______________________
Firma del declarante
DNI: {cliente.dni}`,
    },
]

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const user = session.user as { tenantId?: string }
        if (!user.tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })

        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { documentTemplates: true },
        })

        const templates = (tenant?.documentTemplates as DocumentTemplate[] | null) ?? DEFAULT_TEMPLATES
        return NextResponse.json({ ok: true, templates })
    } catch (error) {
        console.error('GET document-templates:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const user = session.user as { tenantId?: string; role?: string }
        if (!user.tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })
        if (!['ADMIN', 'SUPERADMIN'].includes(user.role ?? '')) {
            return NextResponse.json({ error: 'Solo administradores pueden editar plantillas' }, { status: 403 })
        }

        const body = await req.json()
        const templates: DocumentTemplate[] = body.templates

        if (!Array.isArray(templates)) {
            return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
        }

        await prisma.tenant.update({
            where: { id: user.tenantId },
            data: { documentTemplates: templates as unknown as import('@prisma/client').Prisma.InputJsonValue },
        })

        return NextResponse.json({ ok: true, message: 'Plantillas guardadas' })
    } catch (error) {
        console.error('PUT document-templates:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
