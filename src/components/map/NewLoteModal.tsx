'use client'

import * as React from 'react'
import { X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewLoteModalProps {
  projectId: string
  points: { x: number; y: number }[]
  estimatedArea: number
  onSave: (data: {
    manzana: string
    loteNumero: number
    tipologia: string
    etapa: string | null
    areaM2: number
    frenteM: number
    fondoM: number
    precioLista: number
    points: { x: number; y: number }[]
  }) => Promise<void>
  onCancel: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCode(manzana: string, numero: string): string {
  if (!manzana || !numero) return '…'
  const n = parseInt(numero, 10)
  if (isNaN(n)) return '…'
  return `${manzana.trim().toUpperCase()}-${String(n).padStart(2, '0')}`
}

function round1(v: number) {
  return Math.round(v * 10) / 10
}

function roundPrice(area: number): number {
  return Math.round((area * 430) / 1000) * 1000
}

/** Compute bounding box of a point set */
function boundingBox(pts: { x: number; y: number }[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

const VERTEX_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const TIPOLOGIAS = ['Flat', 'Dúplex', 'Triple', 'Esquina']
const ETAPAS: { label: string; value: string | null }[] = [
  { label: '1ra Etapa', value: '1ra Etapa' },
  { label: '2da Etapa', value: '2da Etapa' },
  { label: '3ra Etapa', value: '3ra Etapa' },
  { label: 'Sin etapa', value: null },
]

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

// ─── SVG Preview ──────────────────────────────────────────────────────────────

function PolygonPreview({ points }: { points: { x: number; y: number }[] }) {
  const W = 300
  const H = 200
  const PAD = 16
  const VERTEX_R = 8

  if (points.length < 2) {
    return (
      <div
        style={{ width: W, height: H }}
        className="flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400"
      >
        Sin puntos
      </div>
    )
  }

  const bb = boundingBox(points)
  const bbW = bb.maxX - bb.minX || 1
  const bbH = bb.maxY - bb.minY || 1

  const scaleX = (W - PAD * 2 - VERTEX_R * 2) / bbW
  const scaleY = (H - PAD * 2 - VERTEX_R * 2) / bbH
  const scale = Math.min(scaleX, scaleY)

  const offX = PAD + VERTEX_R + ((W - PAD * 2 - VERTEX_R * 2) - bbW * scale) / 2
  const offY = PAD + VERTEX_R + ((H - PAD * 2 - VERTEX_R * 2) - bbH * scale) / 2

  function toSvg(pt: { x: number; y: number }) {
    return {
      sx: offX + (pt.x - bb.minX) * scale,
      sy: offY + (pt.y - bb.minY) * scale,
    }
  }

  const polyPoints = points.map(p => {
    const { sx, sy } = toSvg(p)
    return `${sx},${sy}`
  }).join(' ')

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-xl border border-gray-200 bg-gray-50"
    >
      <polygon
        points={polyPoints}
        fill="#dfe7f9"
        stroke="#3b67d0"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {points.map((pt, i) => {
        const { sx, sy } = toSvg(pt)
        return (
          <g key={i}>
            <circle cx={sx} cy={sy} r={VERTEX_R} fill="#3b67d0" />
            <text
              x={sx}
              y={sy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {VERTEX_LABELS[i] ?? i}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Form field helpers ───────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
  )
}

const FieldInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function FieldInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${props.className ?? ''}`}
      />
    )
  }
)

function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white ${props.className ?? ''}`}
    />
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function NewLoteModal({
  projectId: _projectId,
  points,
  estimatedArea,
  onSave,
  onCancel,
}: NewLoteModalProps) {
  // Form state
  const [manzana, setManzana] = React.useState('')
  const [numero, setNumero] = React.useState('')
  const [tipologia, setTipologia] = React.useState(TIPOLOGIAS[0])
  const [etapaIdx, setEtapaIdx] = React.useState(0)

  // Derived initial values
  const initFrente = round1(Math.sqrt(estimatedArea * 1.2))
  const initFondo = round1(estimatedArea / (initFrente || 1))

  const [areaM2, setAreaM2] = React.useState(round1(estimatedArea))
  const [frenteM, setFrenteM] = React.useState(initFrente)
  const [fondoM, setFondoM] = React.useState(initFondo)
  const [precioLista, setPrecioLista] = React.useState(roundPrice(estimatedArea))

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const manzanaRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    manzanaRef.current?.focus()
  }, [])

  // Recompute frente/fondo/precio when area changes
  React.useEffect(() => {
    const f = round1(Math.sqrt(areaM2 * 1.2))
    const fo = round1(areaM2 / (f || 1))
    setFrenteM(f)
    setFondoM(fo)
    setPrecioLista(roundPrice(areaM2))
  }, [areaM2])

  const code = buildCode(manzana, numero)
  const canSubmit = manzana.trim().length > 0 && numero.trim().length > 0 && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setError(null)

    try {
      const etapa = ETAPAS[etapaIdx]?.value ?? null
      await onSave({
        manzana: manzana.trim().toUpperCase(),
        loteNumero: parseInt(numero, 10),
        tipologia,
        etapa,
        areaM2,
        frenteM,
        fondoM,
        precioLista,
        points,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el lote')
      setSaving(false)
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 mb-1">Nuevo lote</h2>
        <p className="text-xs text-gray-500 mb-4">Completa los datos para guardar el lote en la base de datos.</p>

        {/* Polygon preview */}
        <div className="flex flex-col items-center mb-4">
          <PolygonPreview points={points} />
          <p className="text-xs text-gray-500 mt-1.5">
            {points.length} vértices · ~{round1(estimatedArea)} m² estimados
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row: Manzana + N° lote */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manzana</Label>
              <FieldInput
                ref={manzanaRef}
                type="text"
                required
                placeholder="A"
                value={manzana}
                onChange={e => setManzana(e.target.value)}
              />
            </div>
            <div>
              <Label>N° de lote</Label>
              <FieldInput
                type="number"
                required
                placeholder="1"
                min={1}
                value={numero}
                onChange={e => setNumero(e.target.value)}
              />
            </div>
          </div>

          {/* Code preview */}
          {(manzana || numero) && (
            <div className="text-xs text-gray-500 -mt-2">
              Código generado:{' '}
              <span className="font-semibold text-gray-800">{code}</span>
            </div>
          )}

          {/* Row: Tipología + Etapa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipología</Label>
              <FieldSelect
                value={tipologia}
                onChange={e => setTipologia(e.target.value)}
              >
                {TIPOLOGIAS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </FieldSelect>
            </div>
            <div>
              <Label>Etapa</Label>
              <FieldSelect
                value={etapaIdx}
                onChange={e => setEtapaIdx(parseInt(e.target.value, 10))}
              >
                {ETAPAS.map((et, i) => (
                  <option key={i} value={i}>{et.label}</option>
                ))}
              </FieldSelect>
            </div>
          </div>

          {/* Row: Área */}
          <div>
            <Label>Área (m²)</Label>
            <FieldInput
              type="number"
              required
              step="0.1"
              min={0.1}
              value={areaM2}
              onChange={e => setAreaM2(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Row: Frente + Fondo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frente (m)</Label>
              <FieldInput
                type="number"
                step="0.1"
                min={0.1}
                value={frenteM}
                onChange={e => setFrenteM(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Fondo (m)</Label>
              <FieldInput
                type="number"
                step="0.1"
                min={0.1}
                value={fondoM}
                onChange={e => setFondoM(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Row: Precio */}
          <div>
            <Label>Precio S/</Label>
            <FieldInput
              type="number"
              step="1000"
              min={0}
              value={precioLista}
              onChange={e => setPrecioLista(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <Spinner className="text-white" />}
              Agregar lote {code}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
