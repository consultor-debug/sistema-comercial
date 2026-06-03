'use client'

import * as React from 'react'
import {
  Edit3,
  Pencil,
  Plus,
  RotateCcw,
  Check,
  X,
  Move,
  MousePointer2,
  Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnyLot {
  id?: string
  prngId?: string
  code: string
  manzana: string
  loteNumero: number
  areaM2: number
  precioLista: number
  estado: string
  tipologia?: string | null
  etapa?: string | null
  mapShapeData?: { points: { x: number; y: number }[] } | null
}

interface PlanoEditPanelProps {
  editedCount: number
  drawMode: boolean
  drawPointCount: number
  selectedLot: AnyLot | null

  onStartDraw: () => void
  onCancelDraw: () => void
  onFinishDraw: () => void
  onFinishEdit: () => void
  onResetAll: () => void
  onDeleteLot: (lot: AnyLot) => void
  onResetLot: (lot: AnyLot) => void
  onDrawAnother: () => void
  isSaving: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shoelace formula — returns area in fractional units² */
function shoelaceArea(pts: { x: number; y: number }[]): number {
  if (pts.length < 3) return 0
  let area = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  return Math.abs(area) / 2
}

/** Convert fractional shoelace area → m² using a 2800×2006 pixel canvas */
const IMAGE_W = 2800
const IMAGE_H = 2006

function fractionalToM2(frac: number): number {
  return frac * IMAGE_W * IMAGE_H
}

const VERTEX_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelSection({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3 border-b border-gray-100 last:border-b-0">{children}</div>
}

function InstructionRow({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-gray-500">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────

function DrawingState({
  drawPointCount,
  onFinishDraw,
  onCancelDraw,
}: {
  drawPointCount: number
  onFinishDraw: () => void
  onCancelDraw: () => void
}) {
  const canClose = drawPointCount >= 3

  return (
    <>
      {/* Header */}
      <PanelSection>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-800 text-sm">Dibujando polígono</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            {drawPointCount} {drawPointCount === 1 ? 'punto' : 'puntos'}
          </span>
        </div>
      </PanelSection>

      {/* Instructions */}
      <PanelSection>
        <div className="space-y-2.5">
          <InstructionRow
            icon={
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold">
                1
              </span>
            }
            text="Clic para colocar el primer vértice"
          />
          <InstructionRow
            icon={<Plus className="w-3.5 h-3.5" />}
            text="Más clics agregan vértices"
          />
          <InstructionRow
            icon={
              <span className="text-[10px] font-bold text-gray-400 leading-none">×2</span>
            }
            text="Doble-clic cierra el polígono (o usa el botón)"
          />
        </div>
      </PanelSection>

      {/* Actions */}
      <PanelSection>
        <div className="space-y-2">
          <button
            onClick={onFinishDraw}
            disabled={!canClose}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              canClose
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Cerrar polígono ({drawPointCount}/3+)
          </button>
          <button
            onClick={onCancelDraw}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </PanelSection>
    </>
  )
}

function IdleState({
  editedCount,
  isSaving,
  onStartDraw,
  onResetAll,
  onFinishEdit,
}: {
  editedCount: number
  isSaving: boolean
  onStartDraw: () => void
  onResetAll: () => void
  onFinishEdit: () => void
}) {
  return (
    <>
      {/* Header */}
      <PanelSection>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-800 text-sm">Modo edición</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {editedCount > 0 ? `${editedCount} lotes modificados` : 'Sin cambios'}
          </span>
        </div>
      </PanelSection>

      {/* Actions */}
      <PanelSection>
        <div className="space-y-2">
          <button
            onClick={onStartDraw}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dibujar nuevo polígono
          </button>

          <button
            onClick={onResetAll}
            disabled={editedCount === 0}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              editedCount > 0
                ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer ediciones ({editedCount})
          </button>

          <button
            onClick={onFinishEdit}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
          >
            {isSaving ? (
              <>
                <Spinner />
                Guardando…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Terminar edición
              </>
            )}
          </button>
        </div>
      </PanelSection>

      {/* Hint */}
      <PanelSection>
        <p className="text-xs text-gray-400 text-center leading-snug">
          Haz clic en cualquier lote para editar sus vértices
        </p>
      </PanelSection>
    </>
  )
}

function LotSelectedState({
  lot,
  onDeleteLot,
  onResetLot,
  onDrawAnother,
}: {
  lot: AnyLot
  onDeleteLot: (l: AnyLot) => void
  onResetLot: (l: AnyLot) => void
  onDrawAnother: () => void
}) {
  const isNew = lot.id === undefined
  const points = lot.mapShapeData?.points ?? []

  const fracArea = shoelaceArea(points)
  const calcArea = Math.round(fractionalToM2(fracArea) * 100) / 100
  const diff = Math.abs(calcArea - lot.areaM2)
  const diffOk = diff < 5

  return (
    <>
      {/* Header */}
      <PanelSection>
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
              Nuevo
            </span>
          )}
        </div>
        <div className="font-bold text-gray-900 text-base leading-tight">Lote {lot.code}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          Manzana {lot.manzana} · N° {lot.loteNumero}
        </div>
      </PanelSection>

      {/* Vertex list */}
      {points.length > 0 && (
        <PanelSection>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Vértices ({points.length})
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {points.map((pt, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs font-mono text-gray-600"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">
                  {VERTEX_LABELS[i] ?? i}
                </span>
                <span className="text-gray-400">
                  x&nbsp;<span className="text-gray-700">{pt.x.toFixed(2)}</span>
                  &nbsp;y&nbsp;<span className="text-gray-700">{pt.y.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>
        </PanelSection>
      )}

      {/* Area comparison */}
      {points.length >= 3 && (
        <PanelSection>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Área aproximada
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Calculada</span>
              <span className="font-medium text-gray-800">~{calcArea} m²</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Catastro</span>
              <span className="font-medium text-gray-800">{lot.areaM2} m²</span>
            </div>
            <div className="flex justify-between text-xs border-t border-gray-100 pt-1 mt-1">
              <span className="text-gray-500">Diferencia</span>
              <span
                className={`font-semibold ${
                  diffOk ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {diff.toFixed(2)} m²
                {diffOk ? ' ✓' : ' ⚠'}
              </span>
            </div>
          </div>
        </PanelSection>
      )}

      {/* Edit instructions */}
      <PanelSection>
        <div className="space-y-2">
          <InstructionRow
            icon={<Move className="w-3.5 h-3.5" />}
            text="Arrastra vértices para editar · Arrastra el lote para moverlo"
          />
          <InstructionRow
            icon={<MousePointer2 className="w-3.5 h-3.5" />}
            text="+ en aristas para agregar · Doble-clic en vértice para eliminar"
          />
        </div>
      </PanelSection>

      {/* Actions */}
      <PanelSection>
        <div className="space-y-2">
          {isNew ? (
            <button
              onClick={() => onDeleteLot(lot)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar este lote
            </button>
          ) : (
            <button
              onClick={() => onResetLot(lot)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer al original
            </button>
          )}

          <button
            onClick={onDrawAnother}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dibujar otro polígono
          </button>
        </div>
      </PanelSection>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PlanoEditPanel({
  editedCount,
  drawMode,
  drawPointCount,
  selectedLot,
  onStartDraw,
  onCancelDraw,
  onFinishDraw,
  onFinishEdit,
  onResetAll,
  onDeleteLot,
  onResetLot,
  onDrawAnother,
  isSaving,
}: PlanoEditPanelProps) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-64 shrink-0">
      {drawMode ? (
        <DrawingState
          drawPointCount={drawPointCount}
          onFinishDraw={onFinishDraw}
          onCancelDraw={onCancelDraw}
        />
      ) : selectedLot ? (
        <LotSelectedState
          lot={selectedLot}
          onDeleteLot={onDeleteLot}
          onResetLot={onResetLot}
          onDrawAnother={onDrawAnother}
        />
      ) : (
        <IdleState
          editedCount={editedCount}
          isSaving={isSaving}
          onStartDraw={onStartDraw}
          onResetAll={onResetAll}
          onFinishEdit={onFinishEdit}
        />
      )}
    </div>
  )
}
