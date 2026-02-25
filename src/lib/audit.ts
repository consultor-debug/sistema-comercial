import { prisma } from './db'

export async function createAuditLog(params: {
    tenantId: string
    userId: string
    lotId: string
    campo: string
    valorAnterior: string | null
    valorNuevo: string | null
    ipAddress?: string
    motivo?: string
}) {
    try {
        return await prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                lotId: params.lotId,
                campo: params.campo,
                valorAnterior: params.valorAnterior,
                valorNuevo: params.valorNuevo,
                ipAddress: params.ipAddress || null,
                motivo: params.motivo || null
            }
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
    }
}
