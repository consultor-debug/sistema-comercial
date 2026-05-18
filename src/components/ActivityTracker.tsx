'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const THROTTLE_MS = 60_000 // max one ping per minute

export function ActivityTracker() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const lastPingRef = useRef<number>(0)

    useEffect(() => {
        if (status !== 'authenticated' || !session?.user) return

        const now = Date.now()
        if (now - lastPingRef.current < THROTTLE_MS) return
        lastPingRef.current = now

        fetch('/api/activity', { method: 'POST' }).catch(() => { /* silent */ })
    }, [pathname, session, status])

    return null
}
