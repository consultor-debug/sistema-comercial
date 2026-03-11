'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
    size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
    showCloseButton?: boolean
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    className,
    size = 'default',
    showCloseButton = true
}) => {
    const sizes = {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]'
    }

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal content */}
            <div
                className={cn(
                    'relative w-full mx-4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl',
                    'animate-in fade-in-0 zoom-in-95 duration-200',
                    'max-h-[90vh] overflow-hidden flex flex-col',
                    sizes[size],
                    className
                )}
            >
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                {children}
            </div>
        </div>
    )
}

const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div
        className={cn('px-6 py-4 border-b border-slate-700/50', className)}
        {...props}
    >
        {children}
    </div>
)

const ModalTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => (
    <h2
        className={cn('text-xl font-semibold text-white', className)}
        {...props}
    >
        {children}
    </h2>
)

const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div
        className={cn('flex-1 overflow-y-auto p-6', className)}
        {...props}
    >
        {children}
    </div>
)

const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div
        className={cn('px-6 py-4 border-t border-slate-700/50 flex items-center justify-end gap-3', className)}
        {...props}
    >
        {children}
    </div>
)

export { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter }
