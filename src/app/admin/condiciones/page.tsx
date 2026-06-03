'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import {
    Save, RotateCcw, Loader2, CheckCircle2, Shield,
    DollarSign, Clock, Users, Plus, Trash2, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Condiciones {
    descuentoContadoMax:    number
    descuentoFinancMax:     number
    descuentoExcepMax:      number   // excepcion contado
    descuentoExcepFinancMax:number   // excepcion financiamiento
    tiempoExcepSeg:         number   // countdown nivel 2
    tasaDefault:            number
    plazoMax:               number
    inicialMinPct:          number
    tiempoAprobSeg:         number   // countdown VB gerencial
    aprobadores:            Array<{ id: string; nombre: string; cargo?: string }>
    penalidad:              number
    lucroCesante:           number
}

const DEFAULTS: Condiciones = {
    descuentoContadoMax: 0, descuentoFinancMax: 0,
    descuentoExcepMax: 0, descuentoExcepFinancMax: 0,
    tiempoExcepSeg: 60,
    tasaDefault: 8, plazoMax: 60, inicialMinPct: 0,
    tiempoAprobSeg: 120,
    aprobadores: [],
    penalidad: 0, lucroCesante: 0,
}

function NumInput({ value, onChange, min = 0, step = 1, className }: {
    value: number; onChange: (v: number) => void; min?: number; step?: number; className?: string
}) {
    return (
        <input
            type="number" value={value} min={min} step={step}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className={cn(
                'h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
                'w-full', className
            )}
        />
    )
}

export default function CondicionesPage() {
    const [data, setData]       = React.useState<Condiciones>(DEFAULTS)
    const [original, setOrig]   = React.useState<Condiciones>(DEFAULTS)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving]   = React.useState(false)
    const [saved, setSaved]     = React.useState(false)

    React.useEffect(() => {
        fetch('/api/admin/condiciones').then(r => r.json()).then(d => {
            if (d.ok && d.condiciones) {
                const c = { ...DEFAULTS, ...d.condiciones }
                setData(c); setOrig(c)
            }
        }).finally(() => setLoading(false))
    }, [])

    const set = (k: keyof Condiciones) => (v: number) => setData(p => ({ ...p, [k]: v }))

    const save = async () => {
        setSaving(true)
        await fetch('/api/admin/condiciones', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        setSaving(false); setSaved(true); setOrig(data)
        setTimeout(() => setSaved(false), 2500)
    }

    const addAprobador = () => setData(p => ({
        ...p,
        aprobadores: [...p.aprobadores, { id: Date.now().toString(), nombre: '', cargo: '' }],
    }))
    const updateAprobador = (id: string, campo: 'nombre' | 'cargo', val: string) =>
        setData(p => ({ ...p, aprobadores: p.aprobadores.map(a => a.id === id ? { ...a, [campo]: val } : a) }))
    const removeAprobador = (id: string) =>
        setData(p => ({ ...p, aprobadores: p.aprobadores.filter(a => a.id !== id) }))

    const dirty = JSON.stringify(data) !== JSON.stringify(original)

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex flex-col">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Admin</Link>
                            <h1 className="text-xl font-bold text-gray-900">Condiciones Comerciales</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {dirty && (
                                <button onClick={() => setData(original)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                                    <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                                </button>
                            )}
                            <button onClick={save} disabled={saving || !dirty}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                                    saved
                                        ? 'bg-emerald-600 text-white'
                                        : dirty
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                )}>
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : saved ? <CheckCircle2 className="w-3.5 h-3.5" />
                                        : <Save className="w-3.5 h-3.5" />}
                                {saved ? '¡Guardado!' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl">

                    {/* Info banner */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                        <span><strong>Política de descuentos del proyecto.</strong> Estos límites se aplican automáticamente en el Cotizador del Plano. Cambios aquí afectan a todo el equipo comercial.</span>
                    </div>

                    {/* Financiamiento */}
                    <Card icon={<Clock className="w-4 h-4 text-amber-600" />} title="Financiamiento">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="PLAZO MÁXIMO" hint="Los asesores no podrán ofrecer plazos mayores a este.">
                                <div className="flex">
                                    <NumInput value={data.plazoMax} onChange={set('plazoMax')} min={1} step={6}
                                        className="rounded-r-none border-r-0" />
                                    <span className="flex items-center px-3 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-500 whitespace-nowrap">meses</span>
                                </div>
                            </Field>
                            <Field label="TASA ANUAL SUGERIDA" hint="Valor por defecto del slider de tasa en el cotizador.">
                                <div className="flex">
                                    <NumInput value={data.tasaDefault} onChange={set('tasaDefault')} min={0} max={30} step={0.5}
                                        className="rounded-r-none border-r-0" />
                                    <span className="flex items-center px-3 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-500">%</span>
                                </div>
                            </Field>
                        </div>
                    </Card>

                    {/* Topes de descuento */}
                    <Card icon={<DollarSign className="w-4 h-4 text-blue-600" />} title="Topes de descuento">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 w-48">Nivel</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Contado</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pl-4">Financiamiento</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pl-4">Aprobación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {/* Nivel 1 — Estándar */}
                                    <tr className="py-4">
                                        <td className="py-4 pr-6">
                                            <div className="flex items-start gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900">Descuento estándar</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Cualquier asesor puede aplicar</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-1.5 max-w-[160px]">
                                                <span className="text-gray-400 text-sm font-medium">S/</span>
                                                <NumInput value={data.descuentoContadoMax} onChange={set('descuentoContadoMax')} min={0} step={500} />
                                            </div>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-1.5 max-w-[160px]">
                                                <span className="text-gray-400 text-sm font-medium">S/</span>
                                                <NumInput value={data.descuentoFinancMax} onChange={set('descuentoFinancMax')} min={0} step={500} />
                                            </div>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Automática
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Nivel 2 — Excepción */}
                                    <tr>
                                        <td className="py-4 pr-6">
                                            <div className="flex items-start gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900">Excepción</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Espera de aprobación automática</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-1.5 max-w-[160px]">
                                                <span className="text-gray-400 text-sm font-medium">S/</span>
                                                <NumInput value={data.descuentoExcepMax} onChange={set('descuentoExcepMax')} min={0} step={500} />
                                            </div>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-1.5 max-w-[160px]">
                                                <span className="text-gray-400 text-sm font-medium">S/</span>
                                                <NumInput value={data.descuentoExcepFinancMax} onChange={set('descuentoExcepFinancMax')} min={0} step={500} />
                                            </div>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-2 max-w-[120px]">
                                                <NumInput value={data.tiempoExcepSeg} onChange={set('tiempoExcepSeg')} min={10} step={10} className="w-20" />
                                                <span className="text-gray-400 text-sm whitespace-nowrap">seg</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Nivel 3 — VB Gerencial */}
                                    <tr>
                                        <td className="py-4 pr-6">
                                            <div className="flex items-start gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900">Visto Bueno (VB)</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Cualquier monto, requiere firma de gerencia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-sm text-gray-400 italic">Sin tope · requiere VB</p>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <p className="text-sm text-gray-400 italic">Sin tope · requiere VB</p>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-2 max-w-[120px]">
                                                <NumInput value={data.tiempoAprobSeg} onChange={set('tiempoAprobSeg')} min={10} step={30} className="w-20" />
                                                <span className="text-gray-400 text-sm whitespace-nowrap">seg</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Aprobadores */}
                    <Card icon={<Users className="w-4 h-4 text-purple-600" />} title="Aprobadores autorizados para VB Gerencial">
                        <p className="text-sm text-gray-500 mb-4">
                            Solo estos roles pueden firmar el visto bueno para descuentos sin tope. El sistema registra automáticamente quién aprobó cada operación.
                        </p>
                        <div className="space-y-2">
                            {data.aprobadores.length === 0 && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Sin aprobadores — el nivel VB no estará disponible hasta agregar al menos uno.
                                </div>
                            )}
                            {data.aprobadores.map(a => (
                                <div key={a.id} className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-300 shrink-0" />
                                    <input
                                        value={a.nombre}
                                        onChange={e => updateAprobador(a.id, 'nombre', e.target.value)}
                                        placeholder="Nombre del aprobador"
                                        className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    />
                                    <input
                                        value={a.cargo ?? ''}
                                        onChange={e => updateAprobador(a.id, 'cargo', e.target.value)}
                                        placeholder="Cargo (opcional)"
                                        className="w-44 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    />
                                    <button onClick={() => removeAprobador(a.id)}
                                        className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addAprobador}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Agregar aprobador
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
                {icon}
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
            {children}
        </div>
    )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            {children}
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
    )
}
