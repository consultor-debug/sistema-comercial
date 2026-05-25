'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Download, Plus, Trash2, FileText } from 'lucide-react'
import { WizardStepper, WIZARD_STEPS } from '@/components/wizard/WizardStepper'
import { PersonaForm, PersonaData, defaultPersona } from '@/components/wizard/PersonaForm'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type TipoDoc = 'SEPARACION' | 'COMPRAVENTA'
type Titularidad = 'unico' | 'copropietarios' | 'conyuge' | 'separacion-bienes'

interface Cuota { fecha: string; monto: number }

interface InmuebleData {
    proyectoId: string
    lotId: string
    partida: string
    direccion: string
    linderoNorte: string; linderoSur: string; linderoEste: string; linderoOeste: string
}

interface TerminosData {
    precioTotal: number
    inicial: number
    modoCuotas: 'iguales' | 'personalizadas'
    numCuotas: number
    primeraCuota: string
    cuotasPersonalizadas: Cuota[]
    banco: string
    numOperacion: string
    plazoEntrega: string
    penalidadDiaria: number
}

interface Project { id: string; name: string }
interface Lot { id: string; code: string; manzana: string; loteNumero: number; areaM2: number; precioLista: number }

// ── Step components ──────────────────────────────────────────────────────────

const TIPO_OPTS: { id: TipoDoc; label: string; desc: string }[] = [
    { id: 'COMPRAVENTA', label: 'Compraventa', desc: 'Contrato de compraventa de bien futuro' },
    { id: 'SEPARACION',  label: 'Separación / Minuta', desc: 'Minuta de separación con reserva de lote' },
]

const TITULAR_OPTS: { id: Titularidad; label: string; desc: string }[] = [
    { id: 'unico',           label: 'Único titular',          desc: 'Una sola persona compradora' },
    { id: 'copropietarios',  label: 'Copropietarios',         desc: 'Dos personas sin vínculo legal' },
    { id: 'conyuge',         label: 'Cónyuges (sociedad)',    desc: 'Matrimonio en sociedad de gananciales' },
    { id: 'separacion-bienes', label: 'Separación de bienes', desc: 'Matrimonio con separación de bienes' },
]

function StepTipo({ tipo, setTipo }: { tipo: TipoDoc; setTipo: (t: TipoDoc) => void }) {
    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold text-white mb-4">Selecciona el tipo de documento</h2>
            <div className="grid sm:grid-cols-2 gap-3">
                {TIPO_OPTS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setTipo(opt.id)}
                        className={cn(
                            'text-left p-4 rounded-xl border transition-all',
                            tipo === opt.id
                                ? 'bg-white/8 border-white/30 ring-1 ring-white/20'
                                : 'bg-slate-900/40 border-white/8 hover:border-white/15'
                        )}
                    >
                        <p className="text-sm font-semibold text-white mb-1">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

function StepTitular({ titularidad, setTitularidad }: { titularidad: Titularidad; setTitularidad: (t: Titularidad) => void }) {
    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold text-white mb-4">Tipo de titularidad</h2>
            <div className="grid sm:grid-cols-2 gap-3">
                {TITULAR_OPTS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setTitularidad(opt.id)}
                        className={cn(
                            'text-left p-4 rounded-xl border transition-all',
                            titularidad === opt.id
                                ? 'bg-white/8 border-white/30 ring-1 ring-white/20'
                                : 'bg-slate-900/40 border-white/8 hover:border-white/15'
                        )}
                    >
                        <p className="text-sm font-semibold text-white mb-1">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

function StepComprador({
    titularidad, compradorA, setCompradorA, compradorB, setCompradorB
}: {
    titularidad: Titularidad
    compradorA: PersonaData; setCompradorA: (p: PersonaData) => void
    compradorB: PersonaData; setCompradorB: (p: PersonaData) => void
}) {
    const dual = titularidad !== 'unico'
    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Datos del comprador</h2>
            <PersonaForm label={dual ? 'Comprador A' : 'Comprador'} persona={compradorA} onChange={setCompradorA} />
            {dual && <PersonaForm label="Comprador B" persona={compradorB} onChange={setCompradorB} />}
        </div>
    )
}

function StepInmueble({
    inmueble, setInmueble, projects, lots, loadingLots
}: {
    inmueble: InmuebleData; setInmueble: (i: InmuebleData) => void
    projects: Project[]; lots: Lot[]; loadingLots: boolean
}) {
    const set = (k: keyof InmuebleData, v: string) => setInmueble({ ...inmueble, [k]: v })
    const inputClass = 'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20'
    const labelClass = 'block text-[11px] font-medium text-slate-400 mb-1'
    const selectedLot = lots.find(l => l.id === inmueble.lotId)

    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Selecciona el inmueble</h2>
            <div className="bg-slate-900/60 border border-white/8 rounded-xl p-5 grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <label className={labelClass}>Proyecto</label>
                    <select className={inputClass} value={inmueble.proyectoId} onChange={e => set('proyectoId', e.target.value)}>
                        <option value="">Seleccionar proyecto...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <label className={labelClass}>Lote</label>
                    <select className={inputClass} value={inmueble.lotId} onChange={e => set('lotId', e.target.value)} disabled={!inmueble.proyectoId || loadingLots}>
                        <option value="">{loadingLots ? 'Cargando lotes...' : 'Seleccionar lote...'}</option>
                        {lots.map(l => <option key={l.id} value={l.id}>Mz. {l.manzana} - Lote {l.loteNumero} ({l.code}) — {l.areaM2} m²</option>)}
                    </select>
                </div>
                {selectedLot && (
                    <div className="sm:col-span-2 grid grid-cols-3 gap-2 p-3 bg-white/[0.03] rounded-lg">
                        <div><p className="text-[10px] text-slate-500">Manzana</p><p className="text-sm text-white font-medium">{selectedLot.manzana}</p></div>
                        <div><p className="text-[10px] text-slate-500">Lote N°</p><p className="text-sm text-white font-medium">{selectedLot.loteNumero}</p></div>
                        <div><p className="text-[10px] text-slate-500">Área</p><p className="text-sm text-white font-medium">{selectedLot.areaM2} m²</p></div>
                        <div className="col-span-3"><p className="text-[10px] text-slate-500">Precio lista</p><p className="text-sm text-emerald-400 font-semibold">S/ {selectedLot.precioLista.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p></div>
                    </div>
                )}
                <div className="sm:col-span-2">
                    <label className={labelClass}>Partida registral</label>
                    <input className={inputClass} placeholder="Ej. 11550511" value={inmueble.partida} onChange={e => set('partida', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <label className={labelClass}>Dirección del inmueble</label>
                    <input className={inputClass} placeholder="Ej. Valle Chicama, Predio Mocan..." value={inmueble.direccion} onChange={e => set('direccion', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Lindero Norte</label>
                    <input className={inputClass} value={inmueble.linderoNorte} onChange={e => set('linderoNorte', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Lindero Sur</label>
                    <input className={inputClass} value={inmueble.linderoSur} onChange={e => set('linderoSur', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Lindero Este</label>
                    <input className={inputClass} value={inmueble.linderoEste} onChange={e => set('linderoEste', e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>Lindero Oeste</label>
                    <input className={inputClass} value={inmueble.linderoOeste} onChange={e => set('linderoOeste', e.target.value)} />
                </div>
            </div>
        </div>
    )
}

function StepTerminos({ terminos, setTerminos, tipo }: { terminos: TerminosData; setTerminos: (t: TerminosData) => void; tipo: TipoDoc }) {
    const set = (k: keyof TerminosData, v: any) => setTerminos({ ...terminos, [k]: v })
    const saldo = terminos.precioTotal - terminos.inicial
    const inputClass = 'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20'
    const labelClass = 'block text-[11px] font-medium text-slate-400 mb-1'

    const addCuota = () => {
        const next = [...terminos.cuotasPersonalizadas, { fecha: '', monto: 0 }]
        set('cuotasPersonalizadas', next)
    }
    const removeCuota = (idx: number) => {
        set('cuotasPersonalizadas', terminos.cuotasPersonalizadas.filter((_, i) => i !== idx))
    }
    const updateCuota = (idx: number, field: 'fecha' | 'monto', value: any) => {
        const next = terminos.cuotasPersonalizadas.map((c, i) => i === idx ? { ...c, [field]: value } : c)
        set('cuotasPersonalizadas', next)
    }

    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Términos económicos</h2>
            <div className="bg-slate-900/60 border border-white/8 rounded-xl p-5 grid sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Precio total (S/)</label>
                    <input type="number" className={inputClass} value={terminos.precioTotal} onChange={e => set('precioTotal', +e.target.value)} />
                </div>
                <div>
                    <label className={labelClass}>{tipo === 'SEPARACION' ? 'Monto separación (S/)' : 'Inicial (S/)'}</label>
                    <input type="number" className={inputClass} value={terminos.inicial} onChange={e => set('inicial', +e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <p className="text-[11px] text-slate-400">Saldo a financiar: <span className="text-white font-semibold">S/ {saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></p>
                </div>

                {tipo === 'COMPRAVENTA' && (
                    <>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Modo de cuotas</label>
                            <div className="flex gap-2">
                                {(['iguales', 'personalizadas'] as const).map(m => (
                                    <button key={m} onClick={() => set('modoCuotas', m)} className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', terminos.modoCuotas === m ? 'bg-white text-slate-950 border-white' : 'bg-slate-800 text-slate-400 border-white/8 hover:border-white/20')}>
                                        {m === 'iguales' ? 'Cuotas iguales' : 'Personalizadas'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {terminos.modoCuotas === 'iguales' ? (
                            <>
                                <div>
                                    <label className={labelClass}>N° cuotas</label>
                                    <input type="number" className={inputClass} value={terminos.numCuotas} onChange={e => set('numCuotas', +e.target.value)} min={1} />
                                </div>
                                <div>
                                    <label className={labelClass}>Primera cuota</label>
                                    <input type="date" className={inputClass} value={terminos.primeraCuota} onChange={e => set('primeraCuota', e.target.value)} />
                                </div>
                                {terminos.numCuotas > 0 && (
                                    <div className="sm:col-span-2">
                                        <p className="text-[11px] text-slate-400">Cuota mensual aprox: <span className="text-white font-semibold">S/ {(saldo / terminos.numCuotas).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Cronograma personalizado</label>
                                <div className="space-y-2">
                                    {terminos.cuotasPersonalizadas.map((c, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <span className="text-xs text-slate-600 w-6 shrink-0">{i + 1}</span>
                                            <input type="date" className="flex-1 bg-slate-800 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" value={c.fecha} onChange={e => updateCuota(i, 'fecha', e.target.value)} />
                                            <input type="number" className="w-28 bg-slate-800 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" placeholder="Monto" value={c.monto} onChange={e => updateCuota(i, 'monto', +e.target.value)} />
                                            <button onClick={() => removeCuota(i)} className="text-slate-600 hover:text-rose-400 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    <button onClick={addCuota} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors mt-1">
                                        <Plus className="w-3.5 h-3.5" /> Agregar cuota
                                    </button>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Total cuotas: S/ {terminos.cuotasPersonalizadas.reduce((s, c) => s + (+c.monto || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })} / S/ {saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={labelClass}>Banco</label>
                            <input className={inputClass} placeholder="Ej. BCP" value={terminos.banco} onChange={e => set('banco', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>N° Operación</label>
                            <input className={inputClass} placeholder="Ej. 001234567" value={terminos.numOperacion} onChange={e => set('numOperacion', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Plazo de entrega</label>
                            <input className={inputClass} placeholder="Ej. 12/2027" value={terminos.plazoEntrega} onChange={e => set('plazoEntrega', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Penalidad diaria (S/)</label>
                            <input type="number" className={inputClass} value={terminos.penalidadDiaria} onChange={e => set('penalidadDiaria', +e.target.value)} />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StepRevision({
    tipo, titularidad, compradorA, compradorB, inmueble, terminos, projects, lots
}: {
    tipo: TipoDoc; titularidad: Titularidad
    compradorA: PersonaData; compradorB: PersonaData
    inmueble: InmuebleData; terminos: TerminosData
    projects: Project[]; lots: Lot[]
}) {
    const dual = titularidad !== 'unico'
    const project = projects.find(p => p.id === inmueble.proyectoId)
    const lot = lots.find(l => l.id === inmueble.lotId)
    const Row = ({ label, value }: { label: string; value: string }) => (
        <div className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs text-white font-medium text-right max-w-[60%]">{value || '—'}</span>
        </div>
    )
    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Revisión del documento</h2>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Documento</p>
                    <Row label="Tipo" value={tipo === 'COMPRAVENTA' ? 'Compraventa' : 'Separación'} />
                    <Row label="Titularidad" value={TITULAR_OPTS.find(t => t.id === titularidad)?.label || ''} />
                </div>
                <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Inmueble</p>
                    <Row label="Proyecto" value={project?.name || ''} />
                    <Row label="Lote" value={lot ? `Mz. ${lot.manzana} - L${lot.loteNumero}` : ''} />
                    {lot && <Row label="Área" value={`${lot.areaM2} m²`} />}
                </div>
                <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Comprador A</p>
                    <Row label="Nombre" value={`${compradorA.nombres} ${compradorA.apellidos}`} />
                    <Row label="DNI" value={compradorA.dni} />
                    <Row label="Email" value={compradorA.email} />
                </div>
                {dual && (
                    <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Comprador B</p>
                        <Row label="Nombre" value={`${compradorB.nombres} ${compradorB.apellidos}`} />
                        <Row label="DNI" value={compradorB.dni} />
                        <Row label="Email" value={compradorB.email} />
                    </div>
                )}
                <div className={cn('bg-slate-900/60 border border-white/8 rounded-xl p-4', !dual && 'sm:col-span-2')}>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Términos económicos</p>
                    <Row label="Precio total" value={`S/ ${terminos.precioTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} />
                    <Row label="Inicial / Separación" value={`S/ ${terminos.inicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} />
                    <Row label="Saldo" value={`S/ ${(terminos.precioTotal - terminos.inicial).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} />
                    {tipo === 'COMPRAVENTA' && terminos.modoCuotas === 'iguales' && <Row label="N° cuotas" value={String(terminos.numCuotas)} />}
                    {tipo === 'COMPRAVENTA' && terminos.modoCuotas === 'personalizadas' && <Row label="Cuotas" value={`${terminos.cuotasPersonalizadas.length} personalizadas`} />}
                </div>
            </div>
        </div>
    )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function WizardPage() {
    const router = useRouter()
    const [stepIdx, setStepIdx] = React.useState(0)
    const [tipo, setTipo] = React.useState<TipoDoc>('COMPRAVENTA')
    const [titularidad, setTitularidad] = React.useState<Titularidad>('unico')
    const [compradorA, setCompradorA] = React.useState<PersonaData>({ ...defaultPersona })
    const [compradorB, setCompradorB] = React.useState<PersonaData>({ ...defaultPersona, estadoCivil: 'Casado(a)' })
    const [inmueble, setInmueble] = React.useState<InmuebleData>({
        proyectoId: '', lotId: '', partida: '', direccion: '',
        linderoNorte: '', linderoSur: '', linderoEste: '', linderoOeste: '',
    })
    const [terminos, setTerminos] = React.useState<TerminosData>({
        precioTotal: 0, inicial: 0, modoCuotas: 'iguales', numCuotas: 12,
        primeraCuota: '', cuotasPersonalizadas: [], banco: 'BCP',
        numOperacion: '', plazoEntrega: '', penalidadDiaria: 30,
    })
    const [projects, setProjects] = React.useState<Project[]>([])
    const [lots, setLots] = React.useState<Lot[]>([])
    const [loadingLots, setLoadingLots] = React.useState(false)
    const [generating, setGenerating] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Load projects
    React.useEffect(() => {
        fetch('/api/projects')
            .then(r => r.json())
            .then(d => { if (d.success) setProjects(d.projects || d.data || []) })
            .catch(() => {})
    }, [])

    // Load lots when project changes
    React.useEffect(() => {
        if (!inmueble.proyectoId) { setLots([]); return }
        setLoadingLots(true)
        setInmueble(prev => ({ ...prev, lotId: '' }))
        fetch(`/api/projects/${inmueble.proyectoId}/lots`)
            .then(r => r.json())
            .then(d => setLots(d.lots || d.data || []))
            .catch(() => {})
            .finally(() => setLoadingLots(false))
    }, [inmueble.proyectoId])

    // Update terminos price when lot changes
    React.useEffect(() => {
        const lot = lots.find(l => l.id === inmueble.lotId)
        if (lot) setTerminos(prev => ({ ...prev, precioTotal: lot.precioLista }))
    }, [inmueble.lotId, lots])

    const next = () => setStepIdx(i => Math.min(WIZARD_STEPS.length - 1, i + 1))
    const back = () => setStepIdx(i => Math.max(0, i - 1))

    const buildCronograma = () => {
        if (tipo !== 'COMPRAVENTA') return undefined
        if (terminos.modoCuotas === 'personalizadas') {
            return terminos.cuotasPersonalizadas.map((c, i) => ({
                numero: i + 1,
                fecha: c.fecha,
                monto: c.monto,
            }))
        }
        // Auto-generate monthly
        const saldo = terminos.precioTotal - terminos.inicial
        const cuotaMensual = terminos.numCuotas > 0 ? saldo / terminos.numCuotas : 0
        const start = terminos.primeraCuota ? new Date(terminos.primeraCuota) : new Date()
        return Array.from({ length: terminos.numCuotas }, (_, i) => {
            const d = new Date(start)
            d.setMonth(d.getMonth() + i)
            return {
                numero: i + 1,
                fecha: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
                monto: +(cuotaMensual.toFixed(2)),
            }
        })
    }

    const handleGenerate = async () => {
        setGenerating(true)
        setError(null)
        try {
            const cronograma = buildCronograma()
            const res = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotId: inmueble.lotId,
                    tipo,
                    clienteData: {
                        nombres: compradorA.nombres,
                        apellidos: compradorA.apellidos,
                        dni: compradorA.dni,
                        email: compradorA.email,
                        phone: compradorA.telefono,
                        domicilio: compradorA.domicilio,
                    },
                    financialData: {
                        precioTotal: terminos.precioTotal,
                        montoSeparacion: tipo === 'SEPARACION' ? terminos.inicial : undefined,
                        inicial: tipo === 'COMPRAVENTA' ? terminos.inicial : undefined,
                        cuotas: tipo === 'COMPRAVENTA' ? (terminos.modoCuotas === 'iguales' ? terminos.numCuotas : terminos.cuotasPersonalizadas.length) : undefined,
                        cuotaMensual: tipo === 'COMPRAVENTA' && terminos.modoCuotas === 'iguales'
                            ? (terminos.precioTotal - terminos.inicial) / terminos.numCuotas
                            : undefined,
                        cronograma,
                    },
                }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Error generando contrato')

            // Download DOCX
            const blob = new Blob([Buffer.from(data.docxBase64, 'base64')], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `contrato-${data.codigo}.docx`
            a.click()
            URL.revokeObjectURL(url)

            router.push('/dashboard/contratos')
        } catch (err: any) {
            setError(err.message || 'Error generando contrato')
        } finally {
            setGenerating(false)
        }
    }

    const stepKey = WIZARD_STEPS[stepIdx].key
    const isLast = stepIdx === WIZARD_STEPS.length - 1

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                {/* Header */}
                <header className="h-14 sticky top-0 z-30 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <button onClick={() => router.push('/dashboard/contratos')} className="text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Nuevo documento</span>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto py-8 space-y-6">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">Generar contrato</h1>
                        <p className="text-slate-500 text-sm">Paso {stepIdx + 1} de {WIZARD_STEPS.length} — {WIZARD_STEPS[stepIdx].label}</p>
                    </div>

                    {/* Stepper */}
                    <WizardStepper currentStep={stepIdx} />

                    {/* Step content */}
                    <div>
                        {stepKey === 'tipo'      && <StepTipo tipo={tipo} setTipo={setTipo} />}
                        {stepKey === 'titular'   && <StepTitular titularidad={titularidad} setTitularidad={setTitularidad} />}
                        {stepKey === 'comprador' && <StepComprador titularidad={titularidad} compradorA={compradorA} setCompradorA={setCompradorA} compradorB={compradorB} setCompradorB={setCompradorB} />}
                        {stepKey === 'inmueble'  && <StepInmueble inmueble={inmueble} setInmueble={setInmueble} projects={projects} lots={lots} loadingLots={loadingLots} />}
                        {stepKey === 'terminos'  && <StepTerminos terminos={terminos} setTerminos={setTerminos} tipo={tipo} />}
                        {stepKey === 'revision'  && <StepRevision tipo={tipo} titularidad={titularidad} compradorA={compradorA} compradorB={compradorB} inmueble={inmueble} terminos={terminos} projects={projects} lots={lots} />}
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm">{error}</div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-2">
                        <button
                            onClick={back}
                            disabled={stepIdx === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Anterior
                        </button>
                        {isLast ? (
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !inmueble.lotId}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {generating ? (
                                    <div className="w-4 h-4 border-2 border-slate-700 border-t-slate-950 rounded-full animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {generating ? 'Generando...' : 'Generar documento'}
                            </button>
                        ) : (
                            <button
                                onClick={next}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Siguiente <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
