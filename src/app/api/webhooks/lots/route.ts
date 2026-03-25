import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('Webhook lot update received:', body)

        // Map typical Google Sheet / n8n columns to our schema
        // Note: The Apps Script sends the header names as keys.
        // We look for 'ID', 'Lote', or 'id' for the lot code.
        // We look for 'Estado', 'Status', or 'estado' for the state.
        
        const lotCode = body.ID || body.Lote || body.id || body.code
        const newStatusRaw = body.Estado || body.Status || body.estado || body.status
        const projectId = body.projectId || body.proyectoId // Optional: helps disambiguate if codes repeat across projects

        if (!lotCode || !newStatusRaw) {
            return NextResponse.json({ 
                success: false, 
                error: 'Missing ID or Estado in payload' 
            }, { status: 400 })
        }

        // Standardize status to uppercase (LIBRE, SEPARADO, VENDIDO)
        const statusMap: Record<string, string> = {
            'disponible': 'LIBRE',
            'libre': 'LIBRE',
            'separado': 'SEPARADO',
            'vendido': 'VENDIDO',
            'v': 'VENDIDO',
            's': 'SEPARADO',
            'l': 'LIBRE'
        }

        const newStatus = statusMap[String(newStatusRaw).toLowerCase()] || String(newStatusRaw).toUpperCase()

        // Validate if it's a valid LotStatus enum
        const validStatuses = ['LIBRE', 'SEPARADO', 'VENDIDO']
        if (!validStatuses.includes(newStatus)) {
            return NextResponse.json({ 
                success: false, 
                error: `Invalid status: ${newStatusRaw}` 
            }, { status: 400 })
        }

        // Find and update the lot
        // If projectId is provided, use it to be more specific
        const whereClause = projectId 
            ? { code: String(lotCode), projectId: String(projectId) }
            : { code: String(lotCode) }

        // Find first lot with that code (usually unique per project)
        // If no projectId, and same code exists in multiple projects, it might update the wrong one.
        // But usually, the Webhook is specific.
        
        const updatedLots = await prisma.lot.updateMany({
            where: {
                code: String(lotCode),
                ...(projectId ? { projectId } : {})
            },
            data: {
                estado: newStatus as any
            }
        })

        if (updatedLots.count === 0) {
            return NextResponse.json({ 
                success: false, 
                error: `Lot with code ${lotCode} not found` 
            }, { status: 404 })
        }

        return NextResponse.json({ 
            success: true, 
            message: `Updated ${updatedLots.count} lot(s) to ${newStatus}` 
        })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 })
    }
}
