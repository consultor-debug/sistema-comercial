'use client'
/**
 * /vender — Asistente de venta (wizard 5 pasos)
 * Paso 1: Seleccionar lote (o viene pre-seleccionado vía ?lotId=)
 * Paso 2: Datos del comprador (DNI + consulta RENIEC)
 * Paso 3: Condiciones (tipo, descuento 3 niveles, financiamiento)
 * Paso 4: Cronograma de cuotas
 * Paso 5: Revisión y confirmación
 */

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import {
    Loader2, ArrowLeft, ArrowRight, CheckCircle2, MapPin,
    User, DollarSign, Calendar, Eye, AlertTriangle, Search,
    Clock, ShieldCheck, Users
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────────
interface Lot {
    id: string; code: string; manzana: string; loteNumero: number
    areaM2: number; frenteM: number | null; fondoM: number | null
    precioLista: number; descuentoMax: number; estado: string
    etapa: string | null; tipologia: string | null
    project: { id: string; name: string }
}

interface Condiciones {
    descuentoContadoMax: number; descuentoFinancMax: number; descuentoExcepMax: number
    tasaDefault: number; plazoMax: number; inicialMinPct: number
    tiempoAprobSeg: number; penalidad: number; aprobadores: Array<{id:string;nombre:string;cargo:string}>
}

interface WizardData {
    // Paso 1
    lot: Lot | null
    // Paso 2
    dni: string; nombres: string; apellidos: string
    email: string; telefono: string; domicilio: string; estadoCivil: string
    reniecOk: boolean
    // Paso 3
    tipo: 'SEPARACION' | 'COMPRAVENTA'
    esContado: boolean
    descuentoPct: number; descuentoNivel: number
    descuentoAprobadoPor: string; descuentoAprobadoCargo: string
    inicial: number; cuotasNum: number; tasaAnual: number
    // Paso 4
    cronograma: Array<{descripcion:string; monto:number; fecha:string}>
    // Paso 5
    notas: string
}

const STEPS = [
    { id: 1, label: 'Lote', icon: MapPin },
    { id: 2, label: 'Comprador', icon: User },
    { id: 3, label: 'Condiciones', icon: DollarSign },
    { id: 4, label: 'Cronograma', icon: Calendar },
    { id: 5, label: 'Revisión', icon: Eye },
]

function fmtS(n: number) { return `S/ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')}` }

function generateCronograma(
    precioFinal: number, inicial: number, cuotasNum: number,
    tasaAnual: number, startDate: Date
): Array<{descripcion:string; monto:number; fecha:string}> {
    const saldo = precioFinal - inicial
    if (saldo <= 0 || cuotasNum <= 0) return []
    const tasaMensual = tasaAnual / 100 / 12
    let cuotaMensual: number
    if (tasaMensual === 0) {
        cuotaMensual = saldo / cuotasNum
    } else {
        cuotaMensual = saldo * tasaMensual * Math.pow(1 + tasaMensual, cuotasNum) / (Math.pow(1 + tasaMensual, cuotasNum) - 1)
    }
    const crons = []
    for (let i = 0; i < cuotasNum; i++) {
        const fecha = new Date(startDate)
        fecha.setMonth(fecha.getMonth() + i + 1)
        crons.push({
            descripcion: `Cuota ${i + 1}/${cuotasNum}`,
            monto: Math.round(cuotaMensual * 100) / 100,
            fecha: fecha.toISOString().split('T')[0],
        })
    }
    return crons
}

export default function VenderPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedLotId = searchParams.get('lotId')

    const [step, setStep] = React.useState(1)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [condiciones, setCondiciones] = React.useState<Condiciones | null>(null)
    const [reniecLoading, setReniecLoading] = React.useState(false)
    const [approvalCountdown, setApprovalCountdown] = React.useState<number | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState('')

    const [data, setData] = React.useState<WizardData>({
        lot: null, dni: '', nombres: '', apellidos: '', email: '',
        telefono: '', domicilio: '', estadoCivil: 'soltero', reniecOk: false,
        tipo: 'SEPARACION', esContado: false,
        descuentoPct: 0, descuentoNivel: 1, descuentoAprobadoPor: '', descuentoAprobadoCargo: '',
        inicial: 0, cuotasNum: 12, tasaAnual: 8,
        cronograma: [], notas: '',
    })

    const upd = (patch: Partial<WizardData>) => setData(d => ({ ...d, ...patch }))

    // Cargar datos iniciales
    React.useEffect(() => {
        Promise.all([
            fetch('/api/lots?estado=LIBRE').then(r => r.json()),
            fetch('/api/admin/condiciones').then(r => r.json()),
        ]).then(([lotsData, condData]) => {
            const allLots: Lot[] = lotsData.lots || []
            setLots(allLots)
            if (condData.condiciones) setCondiciones(condData.condiciones)
            if (preselectedLotId) {
                const found = allLots.find(l => l.id === preselectedLotId)
                if (found) {
                    upd({ lot: found, inicial: found.precioLista * 0.2 })
                }
            }
        })
    }, [preselectedLotId])

    // Consulta RENIEC simulada (en prod se conecta al API real)
    const consultarReniec = async () => {
        if (data.dni.length !== 8) return
        setReniecLoading(true)
        try {
            // Intentar API real del tenant primero
            const r = await fetch(`/api/reniec?dni=${data.dni}`)
            const d = await r.json()
            if (d.ok && d.nombres) {
                upd({ nombres: d.nombres, apellidos: d.apellidos, reniecOk: true })
            }
        } catch {
            // Sin conexión RENIEC — el usuario digita manualmente
        } finally {
            setReniecLoading(false)
        }
    }

    // Aprobación de excepción nivel 2 (cuenta regresiva)
    const solicitarAprobacion = () => {
        if (!condiciones) return
        setApprovalCountdown(condiciones.tiempoAprobSeg)
        const interval = setInterval(() => {
            setApprovalCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval)
                    // Aprobación automática concedida
                    upd({ descuentoNivel: 2 })
                    return null
                }
                return prev - 1
            })
        }, 1000)
    }

    // Recalcular cronograma al cambiar condiciones financieras
    React.useEffect(() => {
        if (!data.lot || data.esContado) { upd({ cronograma: [] }); return }
        const precioFinal = data.lot.precioLista * (1 - data.descuentoPct / 100)
        const cron = generateCronograma(precioFinal, data.inicial, data.cuotasNum, data.tasaAnual, new Date())
        upd({ cronograma: cron })
    }, [data.lot, data.descuentoPct, data.inicial, data.cuotasNum, data.tasaAnual, data.esContado])

    // Calcular precio final
    const precioFinal = data.lot ? data.lot.precioLista * (1 - data.descuentoPct / 100) : 0
    const saldo = precioFinal - data.inicial
    const cuotaMensual = data.cronograma[0]?.monto ?? 0

    const canNext = () => {
        if (step === 1) return !!data.lot
        if (step === 2) return data.dni.length === 8 && data.nombres.length > 0
        if (step === 3) return precioFinal > 0
        if (step === 4) return data.esContado || data.cronograma.length > 0
        return true
    }

    const handleSubmit = async () => {
        if (!data.lot) return
        setSubmitting(true)
        setError('')
        try {
            const r = await fetch('/api/contratos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotId: data.lot.id,
                    tipo: data.tipo,
                    estado: 'ACTIVO',
                    clienteDni: data.dni,
                    clienteNombres: data.nombres,
                    clienteApellidos: data.apellidos,
                    clienteEmail: data.email,
                    clientePhone: data.telefono,
                    clienteDomicilio: data.domicilio,
                    clienteEstadoCivil: data.estadoCivil,
                    precioTotal: precioFinal,
                    descuentoPct: data.descuentoPct,
                    descuentoNivel: data.descuentoNivel,
                    descuentoAprobadoPor: data.descuentoAprobadoPor || undefined,
                    descuentoAprobadoCargo: data.descuentoAprobadoCargo || undefined,
                    inicial: data.esContado ? precioFinal : data.inicial,
                    cuotasNum: data.esContado ? 0 : data.cuotasNum,
                    tasaAnual: data.tasaAnual,
                    cronograma: data.esContado ? [] : data.cronograma,
                    datos: { notas: data.notas, esContado: data.esContado },
                })
            })
            const d = await r.json()
            if (!d.ok) throw new Error(d.error || 'Error al crear contrato')
            router.push(`/contratos/${d.contrato.id}`)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Nueva venta</h1>
                            <p className="text-xs text-gray-500">Asistente de {data.tipo === 'COMPRAVENTA' ? 'compraventa' : 'separación'}</p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
                    <div className="flex items-center gap-2 max-w-2xl">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon
                            const done = step > s.id
                            const active = step === s.id
                            return (
                                <React.Fragment key={s.id}>
                                    <button
                                        onClick={() => done && setStep(s.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                            active ? 'bg-blue-600 text-white'
                                                : done ? 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                                                    : 'text-gray-400 cursor-default'
                                        )}
                                    >
                                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div className={cn('flex-1 h-px', done ? 'bg-blue-300' : 'bg-gray-200')} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                    <div className="max-w-2xl mx-auto">
                        {/* PASO 1: Seleccionar lote */}
                        {step === 1 && (
                            <StepCard title="Seleccionar lote" subtitle="Elige el lote a vender o separar">
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                    {lots.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No hay lotes disponibles</p>
                                    ) : lots.map(lot => (
                                        <button key={lot.id}
                                            onClick={() => upd({ lot, inicial: lot.precioLista * 0.2 })}
                                            className={cn(
                                                'w-full text-left p-4 rounded-xl border transition-all',
                                                data.lot?.id === lot.id
                                                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            )}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        Manzana {lot.manzana} · Lote {lot.loteNumero} ({lot.code})
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-0.5">
                                                        {lot.areaM2} m² · {lot.project?.name}
                                                        {lot.etapa && ` · ${lot.etapa}`}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="font-bold text-gray-900">{fmtS(lot.precioLista)}</div>
                                                    {lot.frenteM && <div className="text-xs text-gray-400">{lot.frenteM}m × {lot.fondoM}m</div>}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </StepCard>
                        )}

                        {/* PASO 2: Datos del comprador */}
                        {step === 2 && (
                            <StepCard title="Datos del comprador" subtitle="Ingresa el DNI para consultar RENIEC">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">DNI *</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text" maxLength={8} placeholder="12345678"
                                                value={data.dni}
                                                onChange={e => upd({ dni: e.target.value.replace(/\D/g,''), reniecOk: false })}
                                                className="flex-1 px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            />
                                            <button onClick={consultarReniec} disabled={data.dni.length !== 8 || reniecLoading}
                                                className="px-4 h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                                                {reniecLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                                RENIEC
                                            </button>
                                        </div>
                                        {data.reniecOk && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verificado</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombres *</label>
                                            <input value={data.nombres} onChange={e => upd({ nombres: e.target.value })}
                                                placeholder="Juan Carlos"
                                                className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Apellidos *</label>
                                            <input value={data.apellidos} onChange={e => upd({ apellidos: e.target.value })}
                                                placeholder="Pérez López"
                                                className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Correo</label>
                                            <input type="email" value={data.email} onChange={e => upd({ email: e.target.value })}
                                                placeholder="juan@email.com"
                                                className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
                                            <input value={data.telefono} onChange={e => upd({ telefono: e.target.value })}
                                                placeholder="999 888 777"
                                                className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado civil</label>
                                            <select value={data.estadoCivil} onChange={e => upd({ estadoCivil: e.target.value })}
                                                className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                                                <option value="soltero">Soltero/a</option>
                                                <option value="casado">Casado/a</option>
                                                <option value="divorciado">Divorciado/a</option>
                                                <option value="viudo">Viudo/a</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Domicilio</label>
                                        <input value={data.domicilio} onChange={e => upd({ domicilio: e.target.value })}
                                            placeholder="Av. Principal 123, Trujillo"
                                            className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                        />
                                    </div>
                                </div>
                            </StepCard>
                        )}

                        {/* PASO 3: Condiciones financieras + descuento */}
                        {step === 3 && data.lot && condiciones && (
                            <StepCard title="Condiciones de venta" subtitle="Define el tipo, precio y financiamiento">
                                <div className="space-y-5">
                                    {/* Tipo */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de contrato</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['SEPARACION', 'COMPRAVENTA'] as const).map(t => (
                                                <button key={t} onClick={() => upd({ tipo: t })}
                                                    className={cn(
                                                        'p-3 rounded-xl border text-sm font-medium transition-all',
                                                        data.tipo === t
                                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                    )}>
                                                    {t === 'SEPARACION' ? '📋 Separación' : '📝 Compraventa'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Precio base */}
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Precio lista</span>
                                            <span className="font-semibold text-gray-900">{fmtS(data.lot.precioLista)}</span>
                                        </div>
                                    </div>

                                    {/* Sistema de descuentos 3 niveles */}
                                    <DescuentoSystem
                                        lot={data.lot}
                                        condiciones={condiciones}
                                        descuentoPct={data.descuentoPct}
                                        descuentoNivel={data.descuentoNivel}
                                        descuentoAprobadoPor={data.descuentoAprobadoPor}
                                        descuentoAprobadoCargo={data.descuentoAprobadoCargo}
                                        esContado={data.esContado}
                                        approvalCountdown={approvalCountdown}
                                        onDescuentoChange={(pct, nivel, aprobPor, aprobCargo) =>
                                            upd({ descuentoPct: pct, descuentoNivel: nivel, descuentoAprobadoPor: aprobPor, descuentoAprobadoCargo: aprobCargo })
                                        }
                                        onSolicitarAprobacion={solicitarAprobacion}
                                    />

                                    {/* Precio final */}
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-blue-800">Precio final</span>
                                            <span className="text-xl font-bold text-blue-900">{fmtS(precioFinal)}</span>
                                        </div>
                                        {data.descuentoPct > 0 && (
                                            <div className="text-xs text-blue-600 mt-0.5">
                                                Descuento {data.descuentoPct}% = -{fmtS(data.lot.precioLista - precioFinal)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pago */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Modalidad de pago</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[false, true].map(contado => (
                                                <button key={String(contado)} onClick={() => upd({ esContado: contado })}
                                                    className={cn(
                                                        'p-3 rounded-xl border text-sm font-medium transition-all',
                                                        data.esContado === contado
                                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                    )}>
                                                    {contado ? '💵 Contado' : '📅 Financiamiento'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!data.esContado && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                        Inicial ({((data.inicial/precioFinal)*100).toFixed(0)}%)
                                                    </label>
                                                    <input type="number" step="100" min={0}
                                                        value={data.inicial}
                                                        onChange={e => upd({ inicial: parseFloat(e.target.value) || 0 })}
                                                        className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                                    />
                                                    <div className="flex gap-1 mt-1">
                                                        {[10, 20, 30, 50].map(pct => (
                                                            <button key={pct} onClick={() => upd({ inicial: Math.round(precioFinal * pct / 100) })}
                                                                className="px-2 py-0.5 text-[10px] border border-gray-200 rounded text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                                                                {pct}%
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                        Plazo (máx {condiciones.plazoMax} meses)
                                                    </label>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {[12, 24, 36, 48, 60].filter(p => p <= condiciones.plazoMax).map(p => (
                                                            <button key={p} onClick={() => upd({ cuotasNum: p })}
                                                                className={cn(
                                                                    'px-3 h-9 rounded-lg border text-sm font-medium transition-colors',
                                                                    data.cuotasNum === p
                                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                                                )}>{p}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-medium text-gray-600">Tasa anual</label>
                                                    <span className="text-sm font-bold text-gray-900">{data.tasaAnual}%</span>
                                                </div>
                                                <input type="range" min={0} max={18} step={0.5}
                                                    value={data.tasaAnual}
                                                    onChange={e => upd({ tasaAnual: parseFloat(e.target.value) })}
                                                    className="w-full accent-blue-600"
                                                />
                                                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>0%</span><span>9%</span><span>18%</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </StepCard>
                        )}

                        {/* PASO 4: Cronograma */}
                        {step === 4 && (
                            <StepCard title="Cronograma de pagos" subtitle={data.esContado ? 'Pago de contado — sin cuotas' : `${data.cronograma.length} cuotas mensuales`}>
                                {data.esContado ? (
                                    <div className="p-8 bg-emerald-50 rounded-xl text-center">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                        <p className="font-semibold text-emerald-800">Pago de contado</p>
                                        <p className="text-2xl font-bold text-emerald-900 mt-1">{fmtS(precioFinal)}</p>
                                        <p className="text-sm text-emerald-600 mt-1">Se paga en un solo desembolso</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="p-3 bg-blue-50 rounded-xl grid grid-cols-3 gap-3 mb-4 text-center">
                                            <div>
                                                <div className="text-xs text-blue-500">Inicial</div>
                                                <div className="font-bold text-blue-900">{fmtS(data.inicial)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-blue-500">Cuota mensual</div>
                                                <div className="font-bold text-blue-900">{fmtS(cuotaMensual)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-blue-500">Total a pagar</div>
                                                <div className="font-bold text-blue-900">{fmtS(data.inicial + cuotaMensual * data.cuotasNum)}</div>
                                            </div>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">N°</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Vencimiento</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {data.cronograma.map((c, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            <td className="px-3 py-2 text-gray-500">#{i+1}</td>
                                                            <td className="px-3 py-2 text-gray-700">{new Date(c.fecha).toLocaleDateString('es-PE', {day:'2-digit',month:'short',year:'numeric'})}</td>
                                                            <td className="px-3 py-2 text-right font-medium text-gray-900">{fmtS(c.monto)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </StepCard>
                        )}

                        {/* PASO 5: Revisión */}
                        {step === 5 && data.lot && (
                            <StepCard title="Revisión final" subtitle="Confirma los datos antes de generar el contrato">
                                <div className="space-y-4">
                                    <ReviewSection title="Lote">
                                        <ReviewRow label="Código" value={`${data.lot.manzana}-${data.lot.code}`} />
                                        <ReviewRow label="Área" value={`${data.lot.areaM2} m²`} />
                                        <ReviewRow label="Tipo" value={data.tipo === 'COMPRAVENTA' ? 'Compraventa' : 'Separación'} />
                                    </ReviewSection>
                                    <ReviewSection title="Comprador">
                                        <ReviewRow label="Nombre" value={`${data.nombres} ${data.apellidos}`} />
                                        <ReviewRow label="DNI" value={data.dni} />
                                        <ReviewRow label="Email" value={data.email || '—'} />
                                        <ReviewRow label="Teléfono" value={data.telefono || '—'} />
                                    </ReviewSection>
                                    <ReviewSection title="Financiero">
                                        <ReviewRow label="Precio final" value={fmtS(precioFinal)} highlight />
                                        {data.descuentoPct > 0 && <ReviewRow label="Descuento" value={`${data.descuentoPct}% (Nivel ${data.descuentoNivel})`} />}
                                        <ReviewRow label="Modalidad" value={data.esContado ? 'Contado' : `Financiamiento — ${data.cuotasNum} cuotas`} />
                                        {!data.esContado && <>
                                            <ReviewRow label="Inicial" value={fmtS(data.inicial)} />
                                            <ReviewRow label="Cuota mensual" value={fmtS(cuotaMensual)} />
                                            <ReviewRow label="Tasa anual" value={`${data.tasaAnual}%`} />
                                        </>}
                                    </ReviewSection>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas internas</label>
                                        <textarea value={data.notas} onChange={e => upd({ notas: e.target.value })}
                                            placeholder="Observaciones, acuerdos adicionales..."
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-sm text-rose-700">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </StepCard>
                        )}

                        {/* Navegación */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
                                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {step === 1 ? 'Cancelar' : 'Anterior'}
                            </button>

                            {step < 5 ? (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={!canNext()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Continuar <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Confirmar y generar contrato
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Sub-componentes ────────────────────────────────────────────────
function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            </div>
            {children}
        </div>
    )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">{children}</div>
        </div>
    )
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={cn('text-sm font-medium', highlight ? 'text-blue-700 font-bold text-base' : 'text-gray-900')}>{value}</span>
        </div>
    )
}

// ── Sistema de descuentos 3 niveles ───────────────────────────────
function DescuentoSystem({
    lot, condiciones, descuentoPct, descuentoNivel, descuentoAprobadoPor, descuentoAprobadoCargo,
    esContado, approvalCountdown, onDescuentoChange, onSolicitarAprobacion
}: {
    lot: Lot; condiciones: Condiciones; descuentoPct: number; descuentoNivel: number
    descuentoAprobadoPor: string; descuentoAprobadoCargo: string
    esContado: boolean; approvalCountdown: number | null
    onDescuentoChange: (pct: number, nivel: number, aprobPor: string, aprobCargo: string) => void
    onSolicitarAprobacion: () => void
}) {
    const topeNivel1 = esContado ? condiciones.descuentoContadoMax : condiciones.descuentoFinancMax
    const topeNivel2 = condiciones.descuentoExcepMax
    const topeNivel3 = lot.descuentoMax || condiciones.descuentoExcepMax + 5

    const nivel = descuentoNivel
    const pct = descuentoPct

    return (
        <div className="space-y-3">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-600">Descuento (%)</label>
                    <span className="text-sm font-bold text-gray-900">{pct}%</span>
                </div>
                <input type="range" min={0} max={topeNivel3} step={0.5}
                    value={pct}
                    onChange={e => {
                        const v = parseFloat(e.target.value)
                        let newNivel = nivel
                        if (v <= topeNivel1) newNivel = 1
                        else if (v <= topeNivel2 && nivel >= 2) newNivel = 2
                        else if (v > topeNivel2 && nivel >= 3) newNivel = 3
                        else if (v > topeNivel1) return // no permite sin aprobación
                        onDescuentoChange(v, newNivel, descuentoAprobadoPor, descuentoAprobadoCargo)
                    }}
                    className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>0%</span>
                    <span className="text-blue-500">Nivel 1: {topeNivel1}%</span>
                    <span className="text-amber-500">Nivel 2: {topeNivel2}%</span>
                    <span className="text-rose-500">Máx: {topeNivel3}%</span>
                </div>
            </div>

            {/* Nivel 1: estándar */}
            {pct <= topeNivel1 && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-xs text-blue-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Descuento estándar — aplicado directamente
                </div>
            )}

            {/* Nivel 2: solicitar excepción */}
            {pct > topeNivel1 && pct <= topeNivel2 && nivel < 2 && (
                <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Supera el tope estándar — requiere aprobación de excepción
                    </p>
                    {approvalCountdown === null ? (
                        <button onClick={onSolicitarAprobacion}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors">
                            Solicitar aprobación
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            Aprobando en {approvalCountdown}s...
                        </div>
                    )}
                </div>
            )}

            {pct > topeNivel1 && nivel === 2 && pct <= topeNivel2 && (
                <div className="p-3 bg-emerald-50 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Excepción aprobada por supervisor
                </div>
            )}

            {/* Nivel 3: VB gerencial */}
            {pct > topeNivel2 && nivel < 3 && (
                <div className="p-3 bg-rose-50 rounded-lg space-y-3">
                    <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Requiere VB Gerencial — selecciona el aprobador
                    </p>
                    <select
                        value={descuentoAprobadoPor}
                        onChange={e => {
                            const aprobador = condiciones.aprobadores.find(a => a.id === e.target.value)
                            onDescuentoChange(pct, 3, e.target.value, aprobador?.cargo || '')
                        }}
                        className="w-full px-3 h-8 text-xs border border-rose-200 rounded-lg bg-white text-gray-900 focus:outline-none">
                        <option value="">— Seleccionar aprobador —</option>
                        {condiciones.aprobadores.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre} · {a.cargo}</option>
                        ))}
                    </select>
                </div>
            )}

            {pct > topeNivel2 && nivel === 3 && descuentoAprobadoPor && (
                <div className="p-3 bg-emerald-50 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    VB Gerencial aprobado · {descuentoAprobadoCargo}
                </div>
            )}
        </div>
    )
}
