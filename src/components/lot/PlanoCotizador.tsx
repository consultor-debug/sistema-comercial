'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  X,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Ruler,
  Tag,
  ShieldCheck,
  FileText,
  Download,
  Users,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanoCotizadorProps {
  lot: {
    id: string
    code: string
    manzana: string
    loteNumero: number
    areaM2: number
    frenteM: number | null
    fondoM: number | null
    precioLista: number
    estado: 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
    tipologia: string | null
    etapa: string | null
    asesor?: { name: string } | null
  } | null
  condiciones: {
    descuentoContadoMax: number
    descuentoFinancMax: number
    descuentoExcepMax: number           // excepción contado S/
    descuentoExcepFinancMax?: number    // excepción financiamiento S/
    tiempoExcepSeg?: number             // countdown nivel 2
    tasaDefault: number
    plazoMax: number
    inicialMinPct: number
    tiempoAprobSeg: number
    penalidad: number
    aprobadores: Array<{ id: string; nombre: string; cargo: string }>
  } | null
  onClose: () => void
  onVenderRapido: (
    lotId: string,
    datos: {
      dni: string
      nombres: string
      apellidos: string
      email: string
      telefono: string
      tipo: 'SEPARACION' | 'COMPRAVENTA'
    }
  ) => void
  onGenerarVenta: (lotId: string) => void
  onUpdate?: () => void
}

// ─── Status chip config ────────────────────────────────────────────────────────

const STATUS_CHIP: Record<
  string,
  { label: string; cls: string }
> = {
  LIBRE: {
    label: 'Libre',
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  SEPARADO: {
    label: 'Separado',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  VENDIDO: {
    label: 'Vendido',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  NO_DISPONIBLE: {
    label: 'No disponible',
    cls: 'bg-slate-800 text-slate-200 border-slate-700',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPEN(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** French amortisation monthly payment */
function cuotaMensualFrances(saldo: number, tasaAnual: number, meses: number): number {
  if (meses <= 0 || saldo <= 0) return 0
  if (tasaAnual === 0) return saldo / meses
  const r = tasaAnual / 12 / 100
  return (saldo * r) / (1 - Math.pow(1 + r, -meses))
}

// ─── Discount meter ───────────────────────────────────────────────────────────

type ExcepcionState =
  | { phase: 'idle' }
  | { phase: 'countdown'; secondsLeft: number }
  | { phase: 'approved' }

type GerencialState =
  | { phase: 'idle' }
  | { phase: 'selecting' }
  | { phase: 'countdown'; secondsLeft: number; aprobadorId: string }
  | { phase: 'approved'; nombre: string; cargo: string; fecha: string }

interface DiscountBlockProps {
  precioLista: number
  modo: 'contado' | 'financiamiento'
  topeNivel1: number      // S/ máximo nivel 1
  topeNivel2: number      // S/ máximo nivel 2 (excepción)
  tiempoAprobSeg: number
  aprobadores: Array<{ id: string; nombre: string; cargo: string }>
  value: number           // S/ descuento actual
  onChange: (v: number) => void
}

function DiscountBlock({
  precioLista,
  topeNivel1,
  topeNivel2,
  tiempoAprobSeg,
  aprobadores,
  value,
  onChange,
}: DiscountBlockProps) {
  const topeN1 = topeNivel1
  const topeN2 = topeNivel2

  const [excep, setExcep] = React.useState<ExcepcionState>({ phase: 'idle' })
  const [gerencial, setGerencial] = React.useState<GerencialState>({ phase: 'idle' })
  const [notice, setNotice] = React.useState<string | null>(null)

  // which tope is active right now
  const topeActivo =
    gerencial.phase === 'approved'
      ? Infinity
      : excep.phase === 'approved' || gerencial.phase !== 'idle'
      ? topeN2
      : topeN1

  // countdown excepcion
  React.useEffect(() => {
    if (excep.phase !== 'countdown') return
    if (excep.secondsLeft <= 0) {
      setExcep({ phase: 'approved' })
      showNotice('Excepcion aprobada')
      return
    }
    const t = setTimeout(
      () => setExcep({ phase: 'countdown', secondsLeft: excep.secondsLeft - 1 }),
      1000
    )
    return () => clearTimeout(t)
  }, [excep])

  // countdown gerencial
  React.useEffect(() => {
    if (gerencial.phase !== 'countdown') return
    if (gerencial.secondsLeft <= 0) {
      const apb = aprobadores.find(a => a.id === gerencial.aprobadorId)
      setGerencial({
        phase: 'approved',
        nombre: apb?.nombre ?? '',
        cargo: apb?.cargo ?? '',
        fecha: new Date().toLocaleDateString('es-PE'),
      })
      showNotice('VB gerencial aprobado')
      return
    }
    const t = setTimeout(
      () =>
        setGerencial({
          phase: 'countdown',
          secondsLeft: gerencial.secondsLeft - 1,
          aprobadorId: gerencial.aprobadorId,
        }),
      1000
    )
    return () => clearTimeout(t)
  }, [gerencial, aprobadores])

  function showNotice(msg: string) {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const pctBar =
    topeActivo === Infinity
      ? 100
      : topeActivo === 0
      ? 0
      : Math.min(100, (value / topeActivo) * 100)

  const inputStr = value === 0 ? '' : String(value)

  function handleInput(raw: string) {
    const n = Math.max(0, parseFloat(raw) || 0)
    const capped = topeActivo === Infinity ? n : Math.min(n, topeActivo)
    onChange(capped)
  }

  const pctDelPrecio = precioLista > 0 ? (value / precioLista) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Notice */}
      {notice && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {notice}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0 w-28">Descuento en S/</label>
        <div className="flex items-center gap-1 flex-1 border border-gray-200 rounded-lg overflow-hidden">
          <span className="px-2 text-gray-400 text-xs">S/</span>
          <input
            type="number"
            min={0}
            value={inputStr}
            placeholder="0"
            onChange={e => handleInput(e.target.value)}
            className="flex-1 min-w-0 py-1.5 pr-2 text-sm font-mono text-gray-900 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pr-2 text-xs text-gray-400">{pctDelPrecio.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>0</span>
          <span>
            {topeActivo === Infinity
              ? 'sin tope'
              : `Tope: ${fmtPEN(topeActivo)}`}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              pctBar >= 100 ? 'bg-red-500' : pctBar > 70 ? 'bg-amber-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(100, pctBar)}%` }}
          />
        </div>
      </div>

      {/* Nivel 2 — solicitar excepcion */}
      {value >= topeN1 && topeN1 > 0 && excep.phase === 'idle' && gerencial.phase === 'idle' && (
        <button
          onClick={() => setExcep({ phase: 'countdown', secondsLeft: tiempoAprobSeg })}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Solicitar excepcion
        </button>
      )}

      {excep.phase === 'countdown' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          Esperando aprobacion... {excep.secondsLeft}s
        </div>
      )}

      {excep.phase === 'approved' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Excepcion aprobada · tope {fmtPEN(topeN2)}
        </div>
      )}

      {/* Nivel 3 — VB gerencial */}
      {excep.phase === 'approved' && value >= topeN2 && topeN2 > 0 && gerencial.phase === 'idle' && (
        <button
          onClick={() => setGerencial({ phase: 'selecting' })}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Solicitar VB gerencial
        </button>
      )}

      {gerencial.phase === 'selecting' && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Selecciona el aprobador
          </p>
          {aprobadores.map(a => (
            <button
              key={a.id}
              onClick={() =>
                setGerencial({ phase: 'countdown', secondsLeft: 60, aprobadorId: a.id })
              }
              className="w-full text-left px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-xs transition-colors"
            >
              <span className="font-medium text-gray-900">{a.nombre}</span>
              <span className="ml-2 text-gray-400">{a.cargo}</span>
            </button>
          ))}
        </div>
      )}

      {gerencial.phase === 'countdown' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          Esperando VB gerencial... {gerencial.secondsLeft}s
        </div>
      )}

      {gerencial.phase === 'approved' && (
        <div className="px-3 py-2.5 bg-green-50 border border-green-300 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            VB gerencial aprobado · sin tope
          </div>
          <p className="text-[11px] text-green-600">
            {gerencial.nombre} · {gerencial.cargo} · {gerencial.fecha}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── QuickSaleModal ────────────────────────────────────────────────────────────

interface QuickSaleModalProps {
  lot: NonNullable<PlanoCotizadorProps['lot']>
  onClose: () => void
  onConfirm: PlanoCotizadorProps['onVenderRapido']
}

function QuickSaleModal({ lot, onClose, onConfirm }: QuickSaleModalProps) {
  const [tipo, setTipo] = React.useState<'SEPARACION' | 'COMPRAVENTA'>('SEPARACION')
  const [dni, setDni] = React.useState('')
  const [nombres, setNombres] = React.useState('')
  const [apellidos, setApellidos] = React.useState('')
  const [telefono, setTelefono] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [buscando, setBuscando] = React.useState(false)
  const [reniecMsg, setReniecMsg] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function buscarReniec() {
    if (!/^\d{8}$/.test(dni)) {
      setReniecMsg('Ingresa 8 digitos')
      return
    }
    setBuscando(true)
    setReniecMsg(null)
    try {
      const res = await fetch(`/api/clients/validate?dni=${dni}`)
      const data = await res.json()
      if (data?.nombres) {
        setNombres(data.nombres)
        setApellidos(data.apellidos ?? '')
        setReniecMsg('Datos cargados desde RENIEC')
      } else {
        setReniecMsg('No encontrado, ingrese manualmente')
      }
    } catch {
      setReniecMsg('Error al consultar RENIEC')
    } finally {
      setBuscando(false)
    }
  }

  async function handleConfirm() {
    if (!nombres.trim() || !apellidos.trim() || !telefono.trim() || !email.trim()) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(lot.id, { dni, nombres, apellidos, email, telefono, tipo })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Apartar / Vender
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Lote {lot.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tipo operacion */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Tipo de operacion</p>
            <div className="flex gap-2">
              {(['SEPARACION', 'COMPRAVENTA'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                    tipo === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  )}
                >
                  {t === 'SEPARACION' ? 'Separacion' : 'Compraventa'}
                </button>
              ))}
            </div>
          </div>

          {/* DNI + RENIEC */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">DNI</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={dni}
                onChange={e => {
                  setDni(e.target.value.replace(/\D/g, ''))
                  setReniecMsg(null)
                }}
                placeholder="12345678"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <button
                onClick={buscarReniec}
                disabled={buscando || dni.length !== 8}
                className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
              >
                {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar RENIEC'}
              </button>
            </div>
            {reniecMsg && (
              <p
                className={cn(
                  'text-[11px] mt-1',
                  reniecMsg.includes('cargados') ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {reniecMsg}
              </p>
            )}
          </div>

          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Nombres <span className="text-red-400">*</span>
              </label>
              <input
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                placeholder="Juan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Apellidos <span className="text-red-400">*</span>
              </label>
              <input
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                placeholder="Perez"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Telefono */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Telefono <span className="text-red-400">*</span>
            </label>
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="+51 999 999 999"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanoCotizador({
  lot,
  condiciones,
  onClose,
  onVenderRapido,
  onGenerarVenta,
  onUpdate: _onUpdate,
}: PlanoCotizadorProps) {
  const [modo, setModo] = React.useState<'contado' | 'financiamiento'>('contado')
  const [descuento, setDescuento] = React.useState(0)

  // financing state
  const [inicialS, setInicialS] = React.useState<number | ''>('')
  const [plazo, setPlazo] = React.useState(24)
  const [tasa, setTasa] = React.useState(condiciones?.tasaDefault ?? 8)

  const [showModal, setShowModal] = React.useState(false)
  const [showCronograma, setShowCronograma] = React.useState(false)

  // reset on lot change or mode change
  React.useEffect(() => {
    setDescuento(0)
    setInicialS('')
    setPlazo(Math.min(24, condiciones?.plazoMax ?? 60))
    setTasa(condiciones?.tasaDefault ?? 8)
    setShowCronograma(false)
    setModo('contado')
  }, [lot?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setDescuento(0)
  }, [modo])

  if (!lot) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-400 text-sm">
        Selecciona un lote en el plano
      </div>
    )
  }

  const isLibre = lot.estado === 'LIBRE'
  const cond = condiciones
  const precioLista = lot.precioLista
  const precioM2 = lot.areaM2 > 0 ? precioLista / lot.areaM2 : 0

  // discount caps — S/ amounts, split by modo y nivel
  const topeNivel1 =
    modo === 'contado'
      ? (cond?.descuentoContadoMax ?? 0)
      : (cond?.descuentoFinancMax ?? 0)
  const topeNivel2 =
    modo === 'contado'
      ? (cond?.descuentoExcepMax ?? 0)
      : (cond?.descuentoExcepFinancMax ?? cond?.descuentoExcepMax ?? 0)
  const tiempoExcep = cond?.tiempoExcepSeg ?? cond?.tiempoAprobSeg ?? 60

  const descuentoActivo = descuento
  const precioConDesc = Math.max(0, precioLista - descuentoActivo)

  // contado: 5% pronto pago
  const prontoPago = Math.round(precioConDesc * 0.05)
  const totalContado = precioConDesc - prontoPago

  // financing — inicialMinPct now stores S/ amount directly
  const inicialMin = cond?.inicialMinPct ?? 0
  const inicialNum = typeof inicialS === 'number' ? inicialS : 0
  const saldoFinanc = Math.max(0, precioConDesc - inicialNum)
  const cuotaMensual = cuotaMensualFrances(saldoFinanc, tasa, plazo)
  const interesesTotales = cuotaMensual * plazo - saldoFinanc
  const totalPagarFinanc = inicialNum + cuotaMensual * plazo

  const plazoMax = cond?.plazoMax ?? 60
  const plazosDisponibles = [12, 24, 36, 48, 60, 72].filter(p => p <= plazoMax)

  const chipsPct = [10, 20, 30, 50]

  const statusCfg = STATUS_CHIP[lot.estado] ?? STATUS_CHIP['NO_DISPONIBLE']

  return (
    <>
      {showModal && (
        <QuickSaleModal
          lot={lot}
          onClose={() => setShowModal(false)}
          onConfirm={onVenderRapido}
        />
      )}

      <div className="flex flex-col h-full bg-white overflow-hidden min-w-0">
        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                Lote {lot.code}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manzana {lot.manzana} · N° {lot.loteNumero}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                  statusCfg.cls
                )}
              >
                {statusCfg.label}
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* ── Specs ── */}
          <div className="flex flex-wrap gap-2">
            <SpecChip
              icon={<Ruler className="w-3 h-3" />}
              label={`${lot.areaM2} m²`}
            />
            {lot.frenteM != null && (
              <SpecChip
                icon={<Ruler className="w-3 h-3 rotate-90" />}
                label={`Frente ${lot.frenteM} m`}
              />
            )}
            {lot.fondoM != null && (
              <SpecChip
                icon={<Ruler className="w-3 h-3 rotate-90" />}
                label={`Fondo ${lot.fondoM} m`}
              />
            )}
            {lot.etapa && (
              <SpecChip
                icon={<Tag className="w-3 h-3" />}
                label={`Etapa ${lot.etapa}`}
              />
            )}
            {lot.tipologia && (
              <SpecChip
                icon={<Tag className="w-3 h-3" />}
                label={lot.tipologia}
              />
            )}
          </div>

          {/* ── Precio ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Precio lista
            </p>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {fmtPEN(precioLista)}
            </p>
            {precioM2 > 0 && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {fmtPEN(Math.round(precioM2))} / m²
              </p>
            )}
          </div>

          {/* ── Toggle modo ── */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            {(['contado', 'financiamiento'] as const).map(m => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  modo === m
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {m === 'contado' ? 'Contado' : 'Financiamiento'}
              </button>
            ))}
          </div>

          {/* ── Descuento ── */}
          {isLibre && cond && (
            <div className="border border-gray-200 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700">Descuento</p>
              <DiscountBlock
                precioLista={precioLista}
                modo={modo}
                topeNivel1={topeNivel1}
                topeNivel2={topeNivel2}
                tiempoAprobSeg={tiempoExcep}
                aprobadores={cond.aprobadores}
                value={descuentoActivo}
                onChange={setDescuento}
              />
            </div>
          )}

          {/* ── Modo Contado ── */}
          {modo === 'contado' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 space-y-2">
                <LineItem label="Precio lista" value={fmtPEN(precioLista)} />
                {descuentoActivo > 0 && (
                  <LineItem
                    label="Descuento"
                    value={`-${fmtPEN(descuentoActivo)}`}
                    cls="text-blue-600"
                  />
                )}
                <LineItem
                  label="Pronto pago 5%"
                  value={`-${fmtPEN(prontoPago)}`}
                  cls="text-green-600"
                />
                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Pagas hoy</span>
                  <span className="text-xl font-bold font-mono text-gray-900">
                    {fmtPEN(totalContado)}
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                <p className="text-[11px] text-blue-700 flex items-start gap-1.5">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  Pago unico contra contrato. Incluye gestion notarial.
                </p>
              </div>
            </div>
          )}

          {/* ── Modo Financiamiento ── */}
          {modo === 'financiamiento' && (
            <div className="space-y-4">

              {/* Inicial */}
              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Cuota inicial</p>
                  <p className="text-[11px] text-gray-400">
                    Mín. {fmtPEN(inicialMin)}
                  </p>
                </div>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  <span className="px-2 text-gray-400 text-xs shrink-0">S/</span>
                  <input
                    type="number"
                    min={0}
                    value={inicialS === '' ? '' : inicialS}
                    placeholder={String(inicialMin)}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      setInicialS(isNaN(v) ? '' : Math.max(0, v))
                    }}
                    className="flex-1 min-w-0 py-1.5 pr-2 text-sm font-mono text-gray-900 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {/* Quick pct chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {chipsPct.map(pct => {
                    const s = Math.round(precioConDesc * pct / 100)
                    return (
                      <button
                        key={pct}
                        onClick={() => setInicialS(s)}
                        className={cn(
                          'flex-1 min-w-[50px] py-1 rounded-md text-[11px] font-medium border transition-colors',
                          inicialS === s
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        )}
                      >
                        {pct}%
                        <span className="block text-[9px] opacity-70">{fmtPEN(s)}</span>
                      </button>
                    )
                  })}
                </div>
                {inicialNum > 0 && inicialNum < inicialMin && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Inicial minimo: {fmtPEN(inicialMin)}
                  </p>
                )}
              </div>

              {/* Plazo */}
              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Plazo</p>
                <div className="flex flex-wrap gap-1.5">
                  {plazosDisponibles.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlazo(p)}
                      className={cn(
                        'flex-1 min-w-[44px] py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        plazo === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      )}
                    >
                      {p}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasa */}
              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Tasa anual</p>
                  <span className="text-sm font-bold font-mono text-gray-900">{tasa.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={18}
                  step={0.5}
                  value={tasa}
                  onChange={e => setTasa(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0%</span>
                  <span>9%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Cuota mensual */}
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
                  Cuota mensual estimada
                </p>
                <p className="text-2xl font-bold font-mono text-gray-900">
                  {fmtPEN(Math.round(cuotaMensual))}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  por {plazo} meses · {tasa.toFixed(1)}% anual
                </p>
              </div>

              {/* Desglose */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowCronograma(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Ver desglose
                  <ChevronDown
                    className={cn('w-4 h-4 text-gray-400 transition-transform', showCronograma && 'rotate-180')}
                  />
                </button>
                {showCronograma && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                    <LineItem label="Precio lista" value={fmtPEN(precioLista)} />
                    {descuentoActivo > 0 && (
                      <LineItem label="Descuento" value={`-${fmtPEN(descuentoActivo)}`} cls="text-blue-600" />
                    )}
                    <LineItem label="Precio con descuento" value={fmtPEN(precioConDesc)} />
                    <LineItem label="Cuota inicial" value={fmtPEN(inicialNum)} />
                    <LineItem label="Saldo a financiar" value={fmtPEN(saldoFinanc)} />
                    <LineItem
                      label="Intereses totales"
                      value={fmtPEN(Math.round(interesesTotales))}
                      cls="text-amber-600"
                    />
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Total a pagar</span>
                      <span className="text-base font-bold font-mono text-gray-900">
                        {fmtPEN(Math.round(totalPagarFinanc))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  Calculo referencial sujeto a evaluacion crediticia.
                </p>
              </div>
            </div>
          )}

          {/* ── Acciones ── */}
          {isLibre ? (
            <div className="space-y-2 pb-2">
              {/* CTA principal */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Apartar / Vender lote
              </button>

              {/* Secundario */}
              <button
                onClick={() => onGenerarVenta(lot.id)}
                className="w-full py-2.5 rounded-xl bg-white text-gray-700 text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generar venta con documentos
              </button>

              {/* Terciario — no funcional */}
              <button
                disabled
                className="w-full py-2.5 rounded-xl bg-white text-gray-400 text-sm font-medium border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar cotizacion PDF
              </button>
            </div>
          ) : (
            <div className="py-4 text-center border border-gray-200 rounded-xl bg-gray-50">
              <p className="text-sm text-gray-500">
                Este lote esta{' '}
                <span className="font-semibold text-gray-700">{statusCfg.label}</span>
                {lot.asesor && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Asesor: {lot.asesor.name}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SpecChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600">
      {icon}
      {label}
    </span>
  )
}

function LineItem({
  label,
  value,
  cls,
}: {
  label: string
  value: string
  cls?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={cn('text-xs font-mono font-medium text-gray-900', cls)}>{value}</span>
    </div>
  )
}
