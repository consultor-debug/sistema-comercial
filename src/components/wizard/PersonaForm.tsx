'use client'

import React from 'react'
import { Search, Loader2 } from 'lucide-react'

export interface PersonaData {
    nombres: string
    apellidos: string
    dni: string
    estadoCivil: string
    ocupacion: string
    telefono: string
    email: string
    domicilio: string
}

interface PersonaFormProps {
    label: string
    persona: PersonaData
    onChange: (updated: PersonaData) => void
}

export const defaultPersona: PersonaData = {
    nombres: '', apellidos: '', dni: '',
    estadoCivil: 'Soltero(a)', ocupacion: '',
    telefono: '', email: '', domicilio: '',
}

export function PersonaForm({ label, persona, onChange }: PersonaFormProps) {
    const [lookingUp, setLookingUp] = React.useState(false)
    const [lookupError, setLookupError] = React.useState<string | null>(null)

    const set = (k: keyof PersonaData, v: string) => onChange({ ...persona, [k]: v })

    const lookupDni = async () => {
        if (persona.dni.length !== 8) return
        setLookingUp(true)
        setLookupError(null)
        try {
            const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${persona.dni}`, {
                headers: { Accept: 'application/json' }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.nombres) {
                    onChange({
                        ...persona,
                        nombres: data.nombres,
                        apellidos: `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim(),
                    })
                } else {
                    setLookupError('DNI no encontrado')
                }
            } else {
                setLookupError('Error consultando DNI')
            }
        } catch {
            setLookupError('Error de conexión')
        } finally {
            setLookingUp(false)
        }
    }

    const inputClass = 'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors'
    const labelClass = 'block text-[11px] font-medium text-slate-400 mb-1'

    return (
        <div className="bg-slate-900/60 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{label}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-400 rounded-full border border-white/8">Persona natural</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Nombres <span className="text-rose-400">*</span></label>
                    <input className={inputClass} placeholder="Ej. Rosa Mercedes" value={persona.nombres} onChange={e => set('nombres', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Apellidos <span className="text-rose-400">*</span></label>
                    <input className={inputClass} placeholder="Ej. Pacheco Arias" value={persona.apellidos} onChange={e => set('apellidos', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>DNI <span className="text-rose-400">*</span></label>
                    <div className="flex gap-2">
                        <input
                            className={inputClass + ' font-mono'}
                            placeholder="00000000"
                            maxLength={8}
                            value={persona.dni}
                            onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                        />
                        <button
                            type="button"
                            onClick={lookupDni}
                            disabled={persona.dni.length !== 8 || lookingUp}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/8 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                            title="Buscar en RENIEC"
                        >
                            {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>
                    {lookupError && <p className="text-rose-400 text-[11px] mt-1">{lookupError}</p>}
                </div>
                <div>
                    <label className={labelClass}>Estado civil</label>
                    <select className={inputClass} value={persona.estadoCivil} onChange={e => set('estadoCivil', e.target.value)}>
                        <option>Soltero(a)</option>
                        <option>Casado(a)</option>
                        <option>Conviviente</option>
                        <option>Divorciado(a)</option>
                        <option>Viudo(a)</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Ocupación</label>
                    <input className={inputClass} placeholder="Ej. Ingeniero civil" value={persona.ocupacion} onChange={e => set('ocupacion', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Teléfono</label>
                    <div className="flex">
                        <span className="flex items-center px-3 bg-slate-800/50 border border-r-0 border-white/8 rounded-l-lg text-slate-500 text-sm shrink-0">+51</span>
                        <input
                            className="flex-1 bg-slate-800 border border-white/8 rounded-r-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="987 654 321"
                            value={persona.telefono}
                            onChange={e => set('telefono', e.target.value)}
                        />
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label className={labelClass}>Correo electrónico</label>
                    <input className={inputClass} type="email" placeholder="ejemplo@correo.com" value={persona.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <label className={labelClass}>Domicilio <span className="text-rose-400">*</span></label>
                    <input className={inputClass} placeholder="Av./Jr./Calle, número, distrito, provincia, departamento" value={persona.domicilio} onChange={e => set('domicilio', e.target.value)} />
                </div>
            </div>
        </div>
    )
}
