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

// Colores estilo Mattika: pasteles suaves como en el plano real
const STATUS_FILL: Record<string, string> = {
    LIBRE:         '#dfe7f9',  // azul pastel
    SEPARADO:      '#fbedd5',  // naranja/crema pastel
    VENDIDO:       '#d4d8e0',  // gris claro
    NO_DISPONIBLE: '#1f2a44',  // azul oscuro
}

const STATUS_FILL_OPACITY: Record<string, number> = {
    LIBRE:         1,
    SEPARADO:      1,
    VENDIDO:       1,
    NO_DISPONIBLE: 1,
}

const STATUS_STROKE: Record<string, string> = {
    LIBRE:         '#3b67d0',  // azul
    SEPARADO:      '#a86a12',  // naranja oscuro
    VENDIDO:       '#7a8398',  // gris
    NO_DISPONIBLE: '#0b1a33',  // azul muy oscuro
}

const STATUS_TEXT: Record<string, string> = {
    LIBRE:         '#0F2A6B',
    SEPARADO:      '#5C3A0E',
    VENDIDO:       '#3a3f4d',
    NO_DISPONIBLE: '#E8EDF7',
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

    const fill        = STATUS_FILL[lot.estado]        ?? '#d4d8e0'
    const fillOpacity = STATUS_FILL_OPACITY[lot.estado] ?? 1
    const stroke      = STATUS_STROKE[lot.estado]      ?? '#7a8398'
    const textColor   = STATUS_TEXT[lot.estado]        ?? '#3a3f4d'
    const isClickable = lot.estado !== 'NO_DISPONIBLE'
    const isSelected2 = isSelected  // alias para claridad

    const toPixel = (value: number, dimension: number): number =>
        value >= 0 && value <= 1 && dimension > 0 ? value * dimension : value

    const baseRadius = 8

    /* ── CIRCLE (punto en el mapa, sin polígono definido) ─────── */
    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const r  = baseRadius
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default', pointerEvents: 'all' }}
                opacity={isClickable ? 0.85 : 0.45}
            >
                {/* Selección */}
                {isSelected && (
                    <circle cx={cx} cy={cy} r={r * 1.7}
                        fill="none" stroke="#1d4ed8" strokeWidth={2} strokeDasharray="4 3"
                    />
                )}
                {/* Fondo */}
                <circle cx={cx} cy={cy} r={r}
                    fill={isSelected ? '#1d4ed8' : fill}
                    stroke={isSelected ? '#1e40af' : stroke}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ transition: 'fill .15s' }}
                />
                {/* Texto */}
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                    fontSize={r * 0.72} fontWeight="700" fontFamily="ui-monospace, monospace"
                    fill={isSelected ? '#fff' : textColor}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    {lot.code}
                </text>
            </g>
        )
    }

    /* ── POLYGON (área completa del lote, estilo Mattika) ────── */
    if (lot.mapShapeType === 'polygon' && shapeData.points) {
        const px = shapeData.points.map(p => ({
            x: toPixel(p.x, imageSize.width),
            y: toPixel(p.y, imageSize.height),
        }))
        const pointsStr = px.map(p => `${p.x},${p.y}`).join(' ')
        const centroid = px.reduce(
            (acc, p) => ({ x: acc.x + p.x / px.length, y: acc.y + p.y / px.length }),
            { x: 0, y: 0 }
        )
        const bbW = Math.max(...px.map(p=>p.x)) - Math.min(...px.map(p=>p.x))
        const bbH = Math.max(...px.map(p=>p.y)) - Math.min(...px.map(p=>p.y))

        const selFill   = '#bfdbfe'  // azul selección
        const selStroke = '#1d4ed8'

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
                opacity={isClickable ? 0.78 : 0.22}
            >
                {/* Área del lote */}
                <polygon points={pointsStr}
                    fill={isSelected ? selFill : fill}
                    fillOpacity={fillOpacity}
                    stroke={isSelected ? selStroke : stroke}
                    strokeWidth={isSelected ? 2.5 : 1}
                    style={{ transition: 'fill .12s, stroke .12s' }}
                />

                {/* Etiqueta centrada — solo si hay espacio suficiente */}
                {bbW > 20 && bbH > 14 && (
                    <text
                        x={centroid.x} y={centroid.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={20}
                        fontWeight={isSelected ? 700 : 600}
                        fontFamily="ui-monospace, monospace"
                        fill={isSelected ? selStroke : textColor}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {lot.code}
                    </text>
                )}
            </g>
        )
    }

    return null
}
