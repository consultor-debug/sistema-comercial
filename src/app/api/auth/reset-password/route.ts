import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { hashPassword } from '@/lib/auth'

const JWT_SECRET = process.env.AUTH_SECRET || 'fallback-secret'

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json()
        if (!token || !password) {
            return NextResponse.json({ ok: false, error: 'Token y contraseña requeridos' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

        // Verify JWT
        let payload: { sub: string; purpose: string }
        try {
            payload = jwt.verify(token, JWT_SECRET) as { sub: string; purpose: string }
        } catch {
            return NextResponse.json({ ok: false, error: 'El enlace ha expirado o no es válido' }, { status: 400 })
        }

        if (payload.purpose !== 'password-reset') {
            return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub } })
        if (!user) {
            return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await hashPassword(password) }
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
    }
}
