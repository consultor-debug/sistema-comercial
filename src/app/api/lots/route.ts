import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const manzana = searchParams.get('manzana')
        const etapa = searchParams.get('etapa')
        const estado = searchParams.get('estado')

        const { role, tenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [tenantId, ...(assignedTenantIds || [])].filter(Boolean)
        const isSuperAdmin = role === 'SUPER_ADMIN'

        const where: Record<string, unknown> = {}

        if (projectId) {
            // Filtro por proyecto específico — verificar acceso
            if (!isSuperAdmin) {
                const project = await prisma.project.findFirst({
                    where: { id: projectId, tenantId: { in: allowedTenantIds } }
                })
                if (!project) {
                    return NextResponse.json(
                        { success: false, error: 'Proyecto no encontrado o sin acceso' },
                        { status: 404 }
                    )
                }
            }
            where.projectId = projectId
        } else if (!isSuperAdmin) {
            // Sin projectId → todos los lotes del tenant (para el wizard de venta)
            const projects = await prisma.project.findMany({
                where: { tenantId: { in: allowedTenantIds } },
                select: { id: true },
            })
            where.projectId = { in: projects.map(p => p.id) }
        }

        if (manzana) where.manzana = manzana
        if (etapa) where.etapa = etapa
        if (estado) where.estado = estado

        // ── Auto-release: liberar separaciones cuya fecha límite venció ──────
        if (projectId) {
            try {
                const now = new Date()
                const expired = await prisma.contract.findMany({
                    where: {
                        tipo: 'SEPARACION',
                        estado: 'ACTIVO',
                        lot: { projectId, estado: 'SEPARADO' },
                    },
                    select: { id: true, lotId: true, datos: true },
                })
                for (const c of expired) {
                    const datos = c.datos as Record<string, unknown> | null
                    if (datos?.fechaLimite && new Date(datos.fechaLimite as string) < now) {
                        await prisma.lot.update({ where: { id: c.lotId }, data: { estado: 'LIBRE' } })
                        await prisma.contract.update({ where: { id: c.id }, data: { estado: 'CANCELADO' } })
                    }
                }
            } catch { /* non-critical — log silently */ }
        }

        const lots = await prisma.lot.findMany({
            where,
            include: {
                asesor: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: [
                { manzana: 'asc' },
                { loteNumero: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            lots
        })
    } catch (error) {
        console.error('Lots fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener lotes' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        const { role } = session.user as { role: string }
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Sin permisos para crear lotes' }, { status: 403 })
        }

        const body = await request.json()
        const { projectId, manzana, loteNumero, tipologia, etapa, areaM2, frenteM, fondoM, ladoDerM, ladoIzqM, precioLista } = body

        if (!projectId || !manzana || !loteNumero) {
            return NextResponse.json({ success: false, error: 'projectId, manzana y loteNumero son requeridos' }, { status: 400 })
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ success: false, error: 'Proyecto no encontrado' }, { status: 404 })
        }

        const code = `${manzana}-${String(loteNumero).padStart(2, '0')}`

        const existing = await prisma.lot.findUnique({
            where: { projectId_code: { projectId, code } }
        })
        if (existing) {
            return NextResponse.json({ success: false, error: `El lote ${code} ya existe en este proyecto` }, { status: 409 })
        }

        const lot = await prisma.lot.create({
            data: {
                projectId,
                code,
                manzana,
                loteNumero: Number(loteNumero),
                tipologia: tipologia || 'Lote Residencial',
                etapa: etapa || '',
                areaM2: Number(areaM2) || 0,
                frenteM: frenteM ? Number(frenteM) : null,
                fondoM: fondoM ? Number(fondoM) : null,
                ladoDerM: ladoDerM ? Number(ladoDerM) : null,
                ladoIzqM: ladoIzqM ? Number(ladoIzqM) : null,
                precioLista: Number(precioLista) || 0,
                estado: 'LIBRE',
                mapShapeType: 'circle',
                mapShapeData: {}
            }
        })

        return NextResponse.json({ success: true, lot }, { status: 201 })
    } catch (error) {
        console.error('Lot create error:', error)
        return NextResponse.json({ success: false, error: 'Error al crear lote' }, { status: 500 })
    }
}

