import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { renderToStream } from '@react-pdf/renderer'
import { MapPdf } from '@/components/pdf/MapPdf'
import path from 'path'
import fs from 'fs'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('No autorizado', { status: 401 })
        }

        const { id } = params
        
        // Fetch project and lots
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                lots: {
                    select: {
                        id: true,
                        code: true,
                        estado: true,
                        mapShapeType: true,
                        mapShapeData: true
                    }
                }
            }
        })

        if (!project || !project.mapImageUrl) {
            return new NextResponse('Proyecto o plano no encontrado', { status: 404 })
        }

        // Resolve absolute path for map image
        // mapImageUrl common format: /maps/project-id.svg or /maps/image.png
        const cleanPath = project.mapImageUrl.startsWith('/') 
            ? project.mapImageUrl.substring(1) 
            : project.mapImageUrl
            
        const absoluteImagePath = path.join(process.cwd(), 'public', cleanPath)

        if (!fs.existsSync(absoluteImagePath)) {
            console.error('Map image not found at:', absoluteImagePath)
            return new NextResponse('Archivo de plano no encontrado en el servidor', { status: 404 })
        }

        // Render PDF to stream
        const stream = await renderToStream(
            <MapPdf 
                projectName={project.name}
                mapImagePath={absoluteImagePath}
                lots={project.lots}
            />
        )

        // Convert stream to response
        const response = new NextResponse(stream as unknown as ReadableStream)
        
        // Set headers for PDF download
        response.headers.set('Content-Type', 'application/pdf')
        response.headers.set(
            'Content-Disposition', 
            `attachment; filename="Plano-${project.name.replace(/\s+/g, '-')}.pdf"`
        )

        return response
    } catch (error) {
        console.error('PDF Generation Error:', error)
        return new NextResponse('Error al generar el PDF', { status: 500 })
    }
}
