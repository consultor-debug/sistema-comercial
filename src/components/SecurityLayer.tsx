'use client'

import { useEffect } from 'react'

/**
 * SecurityLayer — blocks common code inspection shortcuts and right-click.
 * Runs only on the client. Does NOT block normal user interactions (copy, paste, etc.)
 */
export function SecurityLayer() {
    useEffect(() => {
        // ── Block right-click context menu ──
        const onContextMenu = (e: MouseEvent) => {
            e.preventDefault()
        }

        // ── Block keyboard shortcuts used to view/steal source code ──
        const onKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey
            const shift = e.shiftKey

            const blocked =
                e.key === 'F12' ||                          // DevTools
                (ctrl && e.key === 'u') ||                  // View Source
                (ctrl && e.key === 'U') ||
                (ctrl && e.key === 's') ||                  // Save As
                (ctrl && e.key === 'S') ||
                (ctrl && shift && e.key === 'i') ||         // DevTools (Inspect)
                (ctrl && shift && e.key === 'I') ||
                (ctrl && shift && e.key === 'j') ||         // Console
                (ctrl && shift && e.key === 'J') ||
                (ctrl && shift && e.key === 'c') ||         // Element picker
                (ctrl && shift && e.key === 'C') ||
                (ctrl && shift && e.key === 'k') ||         // Firefox console
                (ctrl && shift && e.key === 'K')

            if (blocked) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        document.addEventListener('contextmenu', onContextMenu)
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('contextmenu', onContextMenu)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    return null
}
