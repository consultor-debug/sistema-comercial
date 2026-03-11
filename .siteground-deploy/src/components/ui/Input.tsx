import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || React.useId()

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-300 mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        id={inputId}
                        className={cn(
                            'flex h-11 w-full rounded-lg border bg-slate-800/50 px-4 py-2 text-sm text-white placeholder:text-slate-500',
                            'border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
                            'transition-all duration-200',
                            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800',
                            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-rose-400">{error}</p>
                )}
                {hint && !error && (
                    <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

export { Input }
