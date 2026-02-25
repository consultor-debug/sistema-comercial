import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const projectName = formData.get('projectName') as string || 'proyecto'
        const projectId = formData.get('projectId') as string

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionó archivo' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Tipo de archivo no permitido. Use PNG, JPG o SVG.' },
                { status: 400 }
            )
        }

        // Check file size (max 10MB)
        const maxSize = 15 * 1024 * 1024 // Increased for large SVGs
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'El archivo es muy grande. Máximo 15MB.' },
                { status: 400 }
            )
        }

        // Create maps directory if it doesn't exist
        const mapsDir = path.join(process.cwd(), 'public', 'maps')
        await mkdir(mapsDir, { recursive: true })

        // Generate filename
        const ext = file.name.split('.').pop() || 'png'
        const sanitizedName = projectName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50)
        const timestamp = Date.now()
        const filename = `${sanitizedName}-${timestamp || 'map'}.${ext}`
        const filepath = path.join(mapsDir, filename)

        // Write file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Return public URL
        const publicUrl = `/maps/${filename}`

        // Update Project in DB if projectId provided
        if (projectId) {
            const { prisma } = await import('@/lib/db')
            await prisma.project.update({
                where: { id: projectId },
                data: { mapImageUrl: publicUrl }
            })
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
            size: file.size
        })
    } catch (error) {
        console.error('Map upload error:', error)
        return NextResponse.json(
            { success: false, error: 'Error al subir el archivo' },
            { status: 500 }
        )
    }
}

