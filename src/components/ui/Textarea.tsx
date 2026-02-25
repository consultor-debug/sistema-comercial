import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        const generatedId = React.useId()
        const textareaId = id || generatedId

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-slate-300 mb-2"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    className={cn(
                        'flex min-h-[100px] w-full rounded-lg border bg-slate-800/50 px-4 py-2 text-sm text-white placeholder:text-slate-500',
                        'border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
                        'transition-all duration-200',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800',
                        error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
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
Textarea.displayName = 'Textarea'

export { Textarea }
