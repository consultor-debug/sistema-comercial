import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const resolvedParams = await params
        const filePath = resolvedParams.path.join('/')
        const absolutePath = path.join(process.cwd(), 'public', 'maps', filePath)

        if (!existsSync(absolutePath)) {
            return new NextResponse('File not found', { status: 404 })
        }

        const fileBuffer = await readFile(absolutePath)
        
        // Determine content type
        let contentType = 'application/octet-stream'
        if (filePath.endsWith('.svg')) contentType = 'image/svg+xml'
        else if (filePath.endsWith('.png')) contentType = 'image/png'
        else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg'
        else if (filePath.endsWith('.webp')) contentType = 'image/webp'
        
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Error serving map file:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
