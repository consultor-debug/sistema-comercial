/* eslint-disable */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generatePdfBuffer } from '@/lib/pdf'
import { MapPdf } from '@/components/pdf/MapPdf'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new Response('No autorizado', { status: 401 })
        }
        
        const { id } = await params
        
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
            return new Response('Proyecto o plano no encontrado', { status: 404 })
        }

        // Resolve absolute path for map image
        const cleanPath = project.mapImageUrl.startsWith('/') 
            ? project.mapImageUrl.substring(1) 
            : project.mapImageUrl
            
        const absoluteImagePath = path.join(process.cwd(), 'public', cleanPath)

        if (!fs.existsSync(absoluteImagePath)) {
            console.error('Map image not found at:', absoluteImagePath)
            return new Response('Archivo de plano no encontrado en el servidor', { status: 404 })
        }

        // Render PDF to buffer
        const pdfBuffer = await generatePdfBuffer(
            <MapPdf 
                projectName={project.name}
                mapImagePath={absoluteImagePath}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                lots={project.lots as any}
            />
        )
        
        // Return response with PDF buffer
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Plano-${project.name.replace(/\s+/g, '-')}.pdf"`,
                'Content-Length': pdfBuffer.length.toString()
            },
        })
    } catch (error) {
        console.error('PDF Generation Error:', error)
        return new Response('Error al generar el PDF', { status: 500 })
    }
}
