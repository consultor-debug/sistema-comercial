import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// ── GET /api/contratos ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id: string; role: string; tenantId?: string }
    const estado = request.nextUrl.searchParams.get('estado')
    const tipo   = request.nextUrl.searchParams.get('tipo')

    const where: Record<string, unknown> = {}
    if (user.role !== 'SUPER_ADMIN') where.tenantId = user.tenantId
    if (estado) where.estado = estado
    if (tipo)   where.tipo   = tipo

    const contratos = await prisma.contract.findMany({
        where,
        include: {
            lot:    { select: { code: true, manzana: true, areaM2: true, loteNumero: true } },
            user:   { select: { name: true } },
            cuotas: { select: { id: true, estado: true, monto: true, fechaVenc: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ok: true, contratos })
}

// ── POST /api/contratos ────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id: string; role: string; tenantId?: string }
    if (!user.tenantId && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })
    }

    const body = await req.json()
    const {
        lotId, tipo, estado,
        clienteDni, clienteNombres, clienteApellidos,
        clienteEmail, clientePhone, clienteDomicilio, clienteEstadoCivil,
        precioTotal, descuentoPct, descuentoNivel,
        descuentoAprobadoPor, descuentoAprobadoCargo,
        inicial, cuotasNum, tasaAnual,
        cronograma, datos,
    } = body

    if (!lotId || !clienteDni || !clienteNombres || !clienteApellidos || !precioTotal) {
        return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const tenantId = user.tenantId!

    // Generar código único: CV/SP-YYYYMMDD-XXXX
    const hoy   = new Date()
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
    const count  = await prisma.contract.count({ where: { tenantId } })
    const codigo = `${tipo === 'COMPRAVENTA' ? 'CV' : 'SP'}-${fecha}-${String(count + 1).padStart(4, '0')}`

    const contrato = await prisma.contract.create({
        data: {
            codigo,
            tenantId,
            lotId,
            userId:               user.id,
            tipo:                 tipo    ?? 'SEPARACION',
            estado:               estado  ?? 'ACTIVO',
            clienteDni,
            clienteNombres,
            clienteApellidos,
            clienteEmail,
            clientePhone:           clientePhone        || null,
            clienteDomicilio:       clienteDomicilio     || null,
            clienteEstadoCivil:     clienteEstadoCivil   || null,
            precioTotal,
            descuentoPct:           descuentoPct         ?? 0,
            descuentoNivel:         descuentoNivel       ?? 1,
            descuentoAprobadoPor:   descuentoAprobadoPor  || null,
            descuentoAprobadoCargo: descuentoAprobadoCargo || null,
            inicial:                inicial   ?? null,
            cuotasNum:              cuotasNum ?? null,
            tasaAnual:              tasaAnual ?? null,
            datos:                  datos     ?? null,
        },
    })

    // Generar cuotas si hay cronograma
    if (Array.isArray(cronograma) && cronograma.length > 0) {
        await prisma.cuota.createMany({
            data: cronograma.map((c: { descripcion: string; monto: number; fecha: string }, i: number) => ({
                tenantId,
                contractId:  contrato.id,
                numero:      i + 1,
                descripcion: c.descripcion,
                monto:       c.monto,
                fechaVenc:   new Date(c.fecha),
                estado:      'PENDIENTE' as const,
            })),
        })
    }

    // Actualizar estado del lote
    const nuevoEstadoLote = tipo === 'COMPRAVENTA' ? 'VENDIDO' : 'SEPARADO'
    await prisma.lot.update({
        where: { id: lotId },
        data:  { estado: nuevoEstadoLote },
    }).catch(() => {})

    return NextResponse.json({ ok: true, contrato })
}
