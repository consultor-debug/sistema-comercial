'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-md w-full">
                <div className="w-3.5 h-3.5" />
                <span className="text-xs">Tema</span>
            </div>
        )
    }

    const isDark = theme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.03] rounded-md transition-colors w-full text-left text-xs group"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
            ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
            )}
            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
    )
}
