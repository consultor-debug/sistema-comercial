import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Called by ActivityTracker on each navigation to stamp lastActiveAt
export async function POST() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ ok: false }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() },
        })
        return NextResponse.json({ ok: true })
    } catch {
        // Gracefully ignore errors (e.g. column not yet migrated)
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
