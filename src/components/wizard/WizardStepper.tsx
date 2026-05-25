'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const WIZARD_STEPS = [
    { key: 'tipo',      label: 'Tipo' },
    { key: 'titular',   label: 'Titularidad' },
    { key: 'comprador', label: 'Comprador' },
    { key: 'inmueble',  label: 'Inmueble' },
    { key: 'terminos',  label: 'Términos' },
    { key: 'revision',  label: 'Revisión' },
]

interface WizardStepperProps {
    currentStep: number
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
    return (
        <div className="flex items-center gap-0">
            {WIZARD_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep
                const isCurrent = idx === currentStep
                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0',
                                isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                        ? 'bg-white text-slate-950 ring-2 ring-white/30'
                                        : 'bg-slate-800 text-slate-500'
                            )}>
                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium whitespace-nowrap hidden sm:block',
                                isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {idx < WIZARD_STEPS.length - 1 && (
                            <div className={cn(
                                'h-px flex-1 mx-1 transition-colors mt-[-14px]',
                                isCompleted ? 'bg-emerald-500' : 'bg-slate-800'
                            )} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}
