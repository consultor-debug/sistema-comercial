'use client'

import * as React from 'react'
import { LotStatus } from '@prisma/client'

interface LotMarkerProps {
    lot: {
        id: string
        code: string
        estado: LotStatus
        mapShapeType?: string | null
        mapShapeData?: unknown
    }
    onClick?: () => void
    isSelected?: boolean
    imageSize?: { width: number; height: number }
}

/* ── Paleta de colores ──────────────────────────────────────────
   Círculos: fondo sólido saturado + texto blanco (máximo contraste)
   Polígonos: relleno pastel suave (estilo plano de urbanización)
              + badge pill centrado para el código de lote
─────────────────────────────────────────────────────────────── */
const COLORS: Record<string, {
    dot:        string   // fondo del círculo
    polyFill:   string   // área del lote
    polyStroke: string   // contorno del lote
    badge:      string   // fondo del badge label
}> = {
    LIBRE: {
        dot:        '#2563eb',   // blue-600
        polyFill:   '#dbeafe',   // blue-100
        polyStroke: '#3b82f6',   // blue-500
        badge:      '#1d4ed8',   // blue-700
    },
    SEPARADO: {
        dot:        '#eab308',   // yellow-500
        polyFill:   '#fef9c3',   // yellow-100
        polyStroke: '#ca8a04',   // yellow-600
        badge:      '#a16207',   // yellow-700
    },
    VENDIDO: {
        dot:        '#dc2626',   // red-600
        polyFill:   '#fee2e2',   // red-100
        polyStroke: '#ef4444',   // red-500
        badge:      '#b91c1c',   // red-700
    },
    NO_DISPONIBLE: {
        dot:        '#1e293b',
        polyFill:   '#334155',
        polyStroke: '#1e293b',
        badge:      '#1e293b',
    },
}

export const LotMarker: React.FC<LotMarkerProps> = ({
    lot,
    onClick,
    isSelected = false,
    imageSize = { width: 1000, height: 1000 },
}) => {
    const shapeData = lot.mapShapeData as {
        x?: number
        y?: number
        radius?: number
        points?: { x: number; y: number }[]
    } | null

    if (!shapeData) return null

    const c           = COLORS[lot.estado] ?? COLORS.VENDIDO
    const isClickable = lot.estado !== 'NO_DISPONIBLE'

    const toPixel = (v: number, dim: number): number =>
        v >= 0 && v <= 1 && dim > 0 ? v * dim : v

    /* ── CIRCLE ─────────────────────────────────────────────────
       Radio 16 (vs 8 anterior): visible, legible, con sombra CSS
    ────────────────────────────────────────────────────────────── */
    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)
        const r  = 7
        // Fuente más pequeña para códigos largos (A-10 vs G1)
        const fs = lot.code.length <= 3 ? r * 0.62 : r * 0.52

        const dotFill   = isSelected ? '#1d4ed8'               : c.dot
        const dotStroke = isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{
                    cursor:        isClickable ? 'pointer' : 'default',
                    pointerEvents: 'all',
                    opacity:       isClickable ? 1 : 0.35,
                }}
            >
                {/* Anillo de selección */}
                {isSelected && (
                    <circle
                        cx={cx} cy={cy} r={r + 3}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth={2.5}
                        strokeDasharray="5 3"
                        opacity={0.9}
                    />
                )}

                {/* Círculo principal con sombra */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill={dotFill}
                    stroke={dotStroke}
                    strokeWidth={1.8}
                    style={{
                        transition: 'fill .15s',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.38))',
                    }}
                />

                {/* Código de lote — texto blanco para máximo contraste */}
                <text
                    x={cx} y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fs}
                    fontWeight="700"
                    fontFamily="ui-monospace, 'Courier New', monospace"
                    fill="#ffffff"
                    letterSpacing="-0.3"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    {lot.code}
                </text>
            </g>
        )
    }

    /* ── POLYGON ────────────────────────────────────────────────
       Relleno pastel Mattika + badge pill con código centrado
    ────────────────────────────────────────────────────────────── */
    if (lot.mapShapeType === 'polygon' && shapeData.points) {
        const px = shapeData.points.map(p => ({
            x: toPixel(p.x, imageSize.width),
            y: toPixel(p.y, imageSize.height),
        }))
        const pointsStr = px.map(p => `${p.x},${p.y}`).join(' ')
        const centroid  = px.reduce(
            (acc, p) => ({ x: acc.x + p.x / px.length, y: acc.y + p.y / px.length }),
            { x: 0, y: 0 }
        )
        const bbW = Math.max(...px.map(p => p.x)) - Math.min(...px.map(p => p.x))
        const bbH = Math.max(...px.map(p => p.y)) - Math.min(...px.map(p => p.y))

        const polyFill   = isSelected ? '#bfdbfe' : c.polyFill
        const polyStroke = isSelected ? '#1d4ed8' : c.polyStroke
        const badgeFill  = isSelected ? '#1d4ed8' : c.badge

        // Dimensiones del badge pill
        const code      = lot.code
        const badgeFs   = 8.5
        const badgePadX = 5
        const badgePadY = 2.5
        const badgeW    = code.length * 5.6 + badgePadX * 2
        const badgeH    = badgeFs + badgePadY * 2
        const showBadge = bbW > 24 && bbH > 18

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{
                    cursor:        isClickable ? 'pointer' : 'not-allowed',
                    pointerEvents: 'all',
                    opacity:       isClickable ? 0.88 : 0.22,
                }}
            >
                {/* Área del lote */}
                <polygon
                    points={pointsStr}
                    fill={polyFill}
                    fillOpacity={1}
                    stroke={polyStroke}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    style={{ transition: 'fill .12s, stroke .12s' }}
                />

                {/* Badge pill centrado con código */}
                {showBadge && (
                    <g
                        transform={`translate(${centroid.x}, ${centroid.y})`}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        <rect
                            x={-badgeW / 2}
                            y={-badgeH / 2}
                            width={badgeW}
                            height={badgeH}
                            rx={3}
                            fill={badgeFill}
                            fillOpacity={0.9}
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                        />
                        <text
                            x={0} y={0}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={badgeFs}
                            fontWeight="700"
                            fontFamily="ui-monospace, 'Courier New', monospace"
                            fill="#ffffff"
                            letterSpacing="-0.3"
                        >
                            {code}
                        </text>
                    </g>
                )}
            </g>
        )
    }

    return null
}
