'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const SelectContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}>({
    open: false,
    setOpen: () => { },
})

const Select: React.FC<{
    children: React.ReactNode
    value?: string
    onValueChange?: (value: string) => void
}> = ({ children, value, onValueChange }) => {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div ref={containerRef} className="relative w-full">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => {
    const { open, setOpen } = React.useContext(SelectContext)

    return (
        <button
            type="button"
            className={cn(
                'flex h-11 w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
                open && 'border-blue-500/50 ring-2 ring-blue-500/10',
                className
            )}
            onClick={() => setOpen(!open)}
            {...props}
        >
            {children}
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", open && "rotate-180")} />
        </button>
    )
}

const SelectValue: React.FC<{ placeholder?: string; children?: React.ReactNode }> = ({ placeholder, children }) => {
    const { value } = React.useContext(SelectContext)

    // If children are provided (like from the shadcn pattern triggers), we might need to handle it.
    // However, in our current SelectTrigger, children usually is SelectValue itself.

    return (
        <span className={cn(!value && 'text-slate-500', "truncate")}>
            {value || children || placeholder}
        </span>
    )
}

const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    const { open } = React.useContext(SelectContext)

    if (!open) return null

    return (
        <div
            className={cn(
                'absolute top-full left-0 z-[100] mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-200 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200',
                className
            )}
            {...props}
        >
            <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    )
}

const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
    const { onValueChange, value: selectedValue, setOpen } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    const handleSelect = () => {
        onValueChange?.(value)
        setOpen(false)
    }

    return (
        <div
            className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-3 text-sm outline-none hover:bg-slate-800 focus:bg-slate-800 transition-colors',
                isSelected && 'bg-blue-500/10 text-blue-400 font-medium',
                className
            )}
            onClick={handleSelect}
        >
            {children}
        </div>
    )
}

export {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
}
