import * as React from 'react'
import { cn } from '@/lib/utils'
import { LotStatus } from '@prisma/client'
import { LOT_STATUS_LABELS } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    size?: 'sm' | 'default' | 'lg'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            danger: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
            info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        }

        const sizes = {
            sm: 'h-5 min-w-5 px-1 text-[10px]',
            default: 'px-3 py-1 text-sm',
            lg: 'px-4 py-1.5 text-base'
        }

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center font-medium rounded-full border leading-none whitespace-nowrap',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = 'Badge'

// Specialized badge for lot status
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    status: LotStatus
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
    ({ status, className, ...props }, ref) => {
        const variantMap: Record<LotStatus, BadgeProps['variant']> = {
            LIBRE: 'success',
            SEPARADO: 'warning',
            VENDIDO: 'danger',
            NO_DISPONIBLE: 'neutral'
        }

        return (
            <Badge
                ref={ref}
                variant={variantMap[status]}
                className={cn('uppercase tracking-wide', className)}
                {...props}
            >
                {LOT_STATUS_LABELS[status]}
            </Badge>
        )
    }
)
StatusBadge.displayName = 'StatusBadge'

export { Badge, StatusBadge }
