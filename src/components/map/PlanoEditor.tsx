'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnyLot {
  id?: string
  prngId?: string
  code: string
  manzana: string
  loteNumero: number
  areaM2: number
  precioLista: number
  estado: 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'
  tipologia?: string | null
  etapa?: string | null
  mapShapeType?: string | null
  mapShapeData?: { points: { x: number; y: number }[] } | null
}

interface PlanoEditorProps {
  lots: AnyLot[]
  selectedLotId: string | null
  onSelectLot: (lot: AnyLot | null) => void
  editMode: boolean
  drawMode: boolean
  onDrawFinish: (points: { x: number; y: number }[]) => void
  onDrawCancel: () => void
  onPolygonChange: (lotCode: string, points: { x: number; y: number }[]) => void
  statusFilter?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Constants — estado colors
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<string, { fill: string; stroke: string }> = {
  LIBRE:         { fill: '#dfe7f9', stroke: '#3b67d0' },
  SEPARADO:      { fill: '#fbedd5', stroke: '#a86a12' },
  VENDIDO:       { fill: '#d4d8e0', stroke: '#7a8398' },
  NO_DISPONIBLE: { fill: '#1f2a44', stroke: '#0b1a33' },
}

// ---------------------------------------------------------------------------
// Helper: clamp
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// ---------------------------------------------------------------------------
// Helper: centroid of a polygon (pixel SVG coords)
// ---------------------------------------------------------------------------

function centroid(pts: { x: number; y: number }[]) {
  const n = pts.length
  if (n === 0) return { x: 0, y: 0 }
  const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / n, y: sum.y / n }
}

// ---------------------------------------------------------------------------
// Helper: bounding-box width/height of pixel SVG coords
// ---------------------------------------------------------------------------

function bbox(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return { w: 0, h: 0 }
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  return {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  }
}

// ---------------------------------------------------------------------------
// Sub-component: DrawPreview
// ---------------------------------------------------------------------------

interface DrawPreviewProps {
  points: { x: number; y: number }[]   // fractions 0-1
  mousePos: { x: number; y: number } | null  // SVG coords
}

const DrawPreview: React.FC<DrawPreviewProps> = ({ points, mousePos }) => {
  if (points.length === 0) return null

  // Convert fraction points → SVG pixel coords
  const svgPts = points.map(p => ({ x: p.x * 1000, y: p.y * 717 }))
  const n = svgPts.length

  return (
    <g>
      {/* Filled polygon preview when ≥3 points */}
      {n >= 3 && (
        <polygon
          points={svgPts.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#3b82f620"
          stroke="none"
        />
      )}

      {/* Edges between drawn points */}
      {svgPts.map((p, i) => {
        if (i === n - 1) return null
        const next = svgPts[i + 1]
        return (
          <line
            key={`edge-${i}`}
            x1={p.x} y1={p.y}
            x2={next.x} y2={next.y}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )
      })}

      {/* Closing line from last to first when ≥3 points */}
      {n >= 3 && (
        <line
          x1={svgPts[n - 1].x} y1={svgPts[n - 1].y}
          x2={svgPts[0].x} y2={svgPts[0].y}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
      )}

      {/* Rubber-band line from last point to mouse */}
      {mousePos && (
        <line
          x1={svgPts[n - 1].x} y1={svgPts[n - 1].y}
          x2={mousePos.x} y2={mousePos.y}
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="4 3"
          strokeOpacity={0.7}
        />
      )}

      {/* Point markers */}
      {svgPts.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={p.x} cy={p.y} r={5}
          fill={i === 0 ? '#22c55e' : '#3b82f6'}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlanoEditor({
  lots,
  selectedLotId,
  onSelectLot,
  editMode,
  drawMode,
  onDrawFinish,
  onDrawCancel,
  onPolygonChange,
  statusFilter,
  className,
}: PlanoEditorProps) {
  // draw state: fraction coords 0-1
  const [drawPoints, setDrawPoints] = React.useState<{ x: number; y: number }[]>([])
  // mouse position in SVG coords (0-1000, 0-717)
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null)

  const [dragging, setDragging] = React.useState<{
    type: 'vertex' | 'body'
    lotCode: string
    vertexIdx?: number
    startPts: { x: number; y: number }[]  // fractions at drag start
    startMouse: { x: number; y: number }   // SVG coords at drag start
    didMove: boolean
  } | null>(null)

  const svgRef = React.useRef<SVGSVGElement>(null)

  // -------------------------------------------------------------------------
  // Coordinate helpers
  // -------------------------------------------------------------------------

  const fx = (f: number) => f * 1000
  const fy = (f: number) => f * 717
  const toFracX = (px: number) => px / 1000
  const toFracY = (py: number) => py / 717

  function screenToSvg(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }

  // -------------------------------------------------------------------------
  // Keyboard handler
  // -------------------------------------------------------------------------

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (drawMode) {
          onDrawCancel()
          setDrawPoints([])
        } else if (editMode) {
          onSelectLot(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawMode, editMode, onDrawCancel, onSelectLot])

  // Reset draw points when draw mode turns off
  React.useEffect(() => {
    if (!drawMode) setDrawPoints([])
  }, [drawMode])

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (drawMode) return

    const target = e.target as HTMLElement | SVGElement

    // Check for vertex handle
    const vertexEl = (target as Element).closest('[data-vertex]') as SVGElement | null
    if (vertexEl) {
      const lotCode = vertexEl.getAttribute('data-lot-code') ?? ''
      const vertexIdx = parseInt(vertexEl.getAttribute('data-vertex') ?? '0', 10)
      const lot = lots.find(l => l.code === lotCode)
      if (lot?.mapShapeData) {
        setDragging({
          type: 'vertex',
          lotCode,
          vertexIdx,
          startPts: lot.mapShapeData.points,
          startMouse: screenToSvg(e.clientX, e.clientY),
          didMove: false,
        })
        e.preventDefault()
        e.stopPropagation()
      }
      return
    }

    // Check for polygon body drag
    const polygonEl = (target as Element).closest('[data-lote]') as SVGElement | null
    if (polygonEl && editMode) {
      const lotCode = polygonEl.getAttribute('data-lote') ?? ''
      const lot = lots.find(l => l.code === lotCode)
      if (lot?.mapShapeData) {
        setDragging({
          type: 'body',
          lotCode,
          startPts: lot.mapShapeData.points,
          startMouse: screenToSvg(e.clientX, e.clientY),
          didMove: false,
        })
        e.preventDefault()
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svgPos = screenToSvg(e.clientX, e.clientY)
    setMousePos(svgPos)

    if (!dragging) return

    const dx = toFracX(svgPos.x - dragging.startMouse.x)
    const dy = toFracY(svgPos.y - dragging.startMouse.y)

    // Threshold to consider it a real drag (not an accidental micro-move)
    if (!dragging.didMove && Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return

    let newPts: { x: number; y: number }[]

    if (dragging.type === 'vertex' && dragging.vertexIdx !== undefined) {
      newPts = [...dragging.startPts]
      newPts[dragging.vertexIdx] = {
        x: clamp(dragging.startPts[dragging.vertexIdx].x + dx, 0, 1),
        y: clamp(dragging.startPts[dragging.vertexIdx].y + dy, 0, 1),
      }
    } else {
      newPts = dragging.startPts.map(p => ({
        x: clamp(p.x + dx, 0, 1),
        y: clamp(p.y + dy, 0, 1),
      }))
    }

    setDragging(prev => prev ? { ...prev, didMove: true } : null)
    onPolygonChange(dragging.lotCode, newPts)
  }

  function handleMouseUp(_e: React.MouseEvent<SVGSVGElement>) {
    setDragging(null)
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    // If we were dragging, ignore this click
    if (dragging?.didMove) return

    const target = e.target as Element

    // Draw mode: add a new point
    if (drawMode) {
      const svgPos = screenToSvg(e.clientX, e.clientY)
      setDrawPoints(prev => [...prev, { x: toFracX(svgPos.x), y: toFracY(svgPos.y) }])
      return
    }

    // Mid-edge handle: insert new vertex
    const midEdgeEl = target.closest('[data-midedge]') as SVGElement | null
    if (midEdgeEl && editMode) {
      const edgeIdx = parseInt(midEdgeEl.getAttribute('data-midedge') ?? '0', 10)
      const lotCode = midEdgeEl.getAttribute('data-lot-code') ?? ''
      const lot = lots.find(l => l.code === lotCode)
      if (lot?.mapShapeData) {
        const pts = lot.mapShapeData.points
        const n = pts.length
        const a = pts[edgeIdx]
        const b = pts[(edgeIdx + 1) % n]
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const newPts = [
          ...pts.slice(0, edgeIdx + 1),
          mid,
          ...pts.slice(edgeIdx + 1),
        ]
        onPolygonChange(lotCode, newPts)
        e.stopPropagation()
      }
      return
    }
  }

  function handleDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.target as Element

    // Draw mode: finish polygon
    if (drawMode) {
      if (drawPoints.length >= 3) {
        onDrawFinish(drawPoints)
        setDrawPoints([])
      }
      return
    }

    // Edit mode: delete vertex on double-click
    if (editMode) {
      const vertexEl = target.closest('[data-vertex]') as SVGElement | null
      if (vertexEl) {
        const lotCode = vertexEl.getAttribute('data-lot-code') ?? ''
        const vertexIdx = parseInt(vertexEl.getAttribute('data-vertex') ?? '0', 10)
        const lot = lots.find(l => l.code === lotCode)
        if (lot?.mapShapeData) {
          const pts = lot.mapShapeData.points
          if (pts.length > 3) {
            const newPts = pts.filter((_, i) => i !== vertexIdx)
            onPolygonChange(lotCode, newPts)
          }
        }
        e.stopPropagation()
      }
    }
  }

  // -------------------------------------------------------------------------
  // Status filter helper
  // -------------------------------------------------------------------------

  function passesFilter(lot: AnyLot): boolean {
    if (!statusFilter || statusFilter === 'ALL') return true
    return lot.estado === statusFilter
  }

  // -------------------------------------------------------------------------
  // Render a single lot
  // -------------------------------------------------------------------------

  function renderLot(lot: AnyLot) {
    if (!lot.mapShapeData?.points?.length) return null

    const fracPts = lot.mapShapeData.points
    // Convert fractions → SVG pixel coords
    const pts = fracPts.map(p => ({ x: fx(p.x), y: fy(p.y) }))
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')

    const passes = passesFilter(lot)
    const isSelected = editMode && selectedLotId === lot.code

    const style = STATUS_STYLE[lot.estado] ?? STATUS_STYLE.LIBRE
    const opacity = isSelected ? 1 : passes ? 0.78 : 0.12
    const strokeWidth = isSelected ? 3 : 1.5

    const cen = centroid(pts)
    const bb = bbox(pts)
    const showLabel = bb.w > 25 && bb.h > 16

    // Cursor logic
    let cursor: string
    if (drawMode) cursor = 'crosshair'
    else if (editMode) cursor = 'move'
    else if (lot.estado === 'NO_DISPONIBLE') cursor = 'not-allowed'
    else cursor = 'pointer'

    return (
      <g key={lot.code} style={{ opacity, cursor }}>
        {/* Main polygon */}
        <polygon
          points={pointsStr}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
          data-lote={lot.code}
          onClick={(e) => {
            if (!drawMode) {
              e.stopPropagation()
              onSelectLot(lot)
            }
          }}
        />

        {/* Label */}
        {showLabel && (
          <text
            x={cen.x}
            y={cen.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fontWeight={500}
            fill={lot.estado === 'NO_DISPONIBLE' ? '#9ba8bb' : '#1e293b'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {lot.code}
          </text>
        )}

        {/* Edit handles — only when this lot is selected in edit mode */}
        {isSelected && editMode && (
          <g>
            {/* Dashed halo */}
            <polygon
              points={pointsStr}
              fill="none"
              stroke="#93c5fd"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              style={{ pointerEvents: 'none' }}
            />

            {/* Mid-edge handles (add vertex) */}
            {pts.map((p, i) => {
              const next = pts[(i + 1) % pts.length]
              const mx = (p.x + next.x) / 2
              const my = (p.y + next.y) / 2
              return (
                <circle
                  key={`mid-${i}`}
                  cx={mx} cy={my} r={5.5}
                  fill="white"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  cursor="crosshair"
                  data-midedge={i}
                  data-lot-code={lot.code}
                />
              )
            })}

            {/* Vertex handles */}
            {pts.map((p, i) => (
              <circle
                key={`vtx-${i}`}
                cx={p.x} cy={p.y} r={8}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
                cursor="grab"
                data-vertex={i}
                data-lot-code={lot.code}
              />
            ))}
          </g>
        )}
      </g>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={cn('relative w-full bg-gray-50 overflow-hidden', className)}
      style={drawMode || editMode ? undefined : { aspectRatio: '2800/2006' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 717"
        preserveAspectRatio="xMidYMid meet"
        className={cn('w-full h-full', drawMode ? 'cursor-crosshair' : 'cursor-default')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* White background */}
        <rect x="0" y="0" width="1000" height="717" fill="white" />

        {/* Lots */}
        {lots.map(lot => renderLot(lot))}

        {/* Draw preview */}
        {drawMode && <DrawPreview points={drawPoints} mousePos={mousePos} />}
      </svg>
    </div>
  )
}
