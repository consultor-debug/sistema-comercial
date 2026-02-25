import bcrypt from 'bcryptjs'
import { prisma } from './db'

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export async function reAuthenticateUser(userId: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
    })

    if (!user) return false

    return verifyPassword(password, user.passwordHash)
}

export function generateQuotationCode(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `COT-${dateStr}-${random}`
}
