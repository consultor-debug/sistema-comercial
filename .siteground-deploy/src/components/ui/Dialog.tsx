'use client'

import * as React from 'react'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './Modal'
import { cn } from '@/lib/utils'

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
    return (
        <Modal isOpen={open} onClose={() => onOpenChange(false)}>
            {children}
        </Modal>
    )
}

const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return (
        <div className={cn('flex flex-col h-full', className)} {...props}>
            {children}
        </div>
    )
}

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return <ModalHeader className={className} {...props}>{children}</ModalHeader>
}

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
    return <ModalTitle className={className} {...props}>{children}</ModalTitle>
}

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
    return <p className={cn('text-sm text-slate-500', className)} {...props}>{children}</p>
}

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return <ModalFooter className={className} {...props}>{children}</ModalFooter>
}

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
}
