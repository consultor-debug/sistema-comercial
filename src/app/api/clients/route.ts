import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { role: userRole, tenantId: userTenantId, assignedTenantIds } = session.user as any
        const allowedTenantIds = [userTenantId, ...(assignedTenantIds || [])].filter(Boolean)

        // If super admin, see all. Otherwise, only for allowed tenants.
        const where = userRole === 'SUPER_ADMIN' ? {} : { tenantId: { in: allowedTenantIds } }

        // Fetch all quotations to extract client info
        const quotations = await prisma.quotation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                clienteDni: true,
                clienteNombres: true,
                clienteApellidos: true,
                clienteEmail: true,
                precioFinal: true,
                createdAt: true
            }
        })

        // Group by DNI
        const clientsMap = new Map<string, any>()
        
        quotations.forEach(q => {
            if (!clientsMap.has(q.clienteDni)) {
                clientsMap.set(q.clienteDni, {
                    dni: q.clienteDni,
                    nombres: q.clienteNombres,
                    apellidos: q.clienteApellidos,
                    email: q.clienteEmail,
                    quotationCount: 1,
                    lastQuotationAt: q.createdAt,
                    totalValue: q.precioFinal
                })
            } else {
                const existing = clientsMap.get(q.clienteDni)
                existing.quotationCount += 1
                existing.totalValue += q.precioFinal
                if (new Date(q.createdAt) > new Date(existing.lastQuotationAt)) {
                    existing.lastQuotationAt = q.createdAt
                }
            }
        })

        const clients = Array.from(clientsMap.values())

        return NextResponse.json({
            success: true,
            clients
        })
    } catch (error) {
        console.error('Clients fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener clientes' },
            { status: 500 }
        )
    }
}
