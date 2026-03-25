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
        const newPriceRaw = body['Precio Lista'] || body.Precio || body.Monto || body.precio
        const newAreaRaw = body.Area || body['Area M2'] || body.area
        const projectId = body.projectId || body.proyectoId

        if (!lotCode) {
            return NextResponse.json({ success: false, error: 'Missing lot code (ID)' }, { status: 400 })
        }

        const updateData: any = {}

        // 1. Status Mapping
        if (newStatusRaw) {
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
            const validStatuses = ['LIBRE', 'SEPARADO', 'VENDIDO']
            if (validStatuses.includes(newStatus)) {
                updateData.estado = newStatus
            }
        }

        // 2. Price Mapping
        if (newPriceRaw !== undefined) {
            const price = parseFloat(String(newPriceRaw).replace(/[^0-9.]/g, ''))
            if (!isNaN(price)) {
                updateData.precioLista = price
            }
        }

        // 3. Area Mapping
        if (newAreaRaw !== undefined) {
            const area = parseFloat(String(newAreaRaw).replace(/[^0-9.]/g, ''))
            if (!isNaN(area)) {
                updateData.areaM2 = area
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'No valid data to update' }, { status: 400 })
        }

        // Find and update
        const updatedLots = await prisma.lot.updateMany({
            where: {
                code: String(lotCode),
                ...(projectId ? { projectId } : {})
            },
            data: updateData
        })

        if (updatedLots.count === 0) {
            return NextResponse.json({ 
                success: false, 
                error: `Lot with code ${lotCode} not found` 
            }, { status: 404 })
        }

        return NextResponse.json({ 
            success: true, 
            message: `Updated ${updatedLots.count} lot(s)`,
            details: updateData
        })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 })
    }
}
