import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'PEN'): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(d)
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d)
}

export function validateDNI(dni: string): boolean {
    return /^\d{8}$/.test(dni)
}

export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const LOT_STATUS_COLORS = {
    LIBRE: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
    SEPARADO: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    VENDIDO: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' },
    NO_DISPONIBLE: { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500' }
} as const

export const LOT_STATUS_LABELS = {
    LIBRE: 'Libre',
    SEPARADO: 'Separado',
    VENDIDO: 'Vendido',
    NO_DISPONIBLE: 'No Disponible'
} as const
