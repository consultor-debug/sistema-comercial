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

const STATUS_FILL: Record<string, string> = {
    LIBRE:        '#22c55e',   // green-500
    SEPARADO:     '#f59e0b',   // amber-400
    VENDIDO:      '#ef4444',   // red-500
    NO_DISPONIBLE:'#475569',   // slate-600
}

const STATUS_FILL_OPACITY: Record<string, number> = {
    LIBRE:         1,
    SEPARADO:      1,
    VENDIDO:       1,
    NO_DISPONIBLE: 0.6,
}

const STATUS_STROKE: Record<string, string> = {
    LIBRE:         '#16a34a',
    SEPARADO:      '#d97706',
    VENDIDO:       '#dc2626',
    NO_DISPONIBLE: '#334155',
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

    const fill        = STATUS_FILL[lot.estado]        ?? '#475569'
    const fillOpacity = STATUS_FILL_OPACITY[lot.estado] ?? 0.5
    const stroke      = STATUS_STROKE[lot.estado]      ?? '#334155'
    const isClickable = lot.estado !== 'NO_DISPONIBLE'

    const toPixel = (value: number, dimension: number): number =>
        value >= 0 && value <= 1 && dimension > 0 ? value * dimension : value

    const baseRadius = 18

    /* ── CIRCLE ─────────────────────────────────────────────── */
    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const r  = baseRadius
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)
        const gradId = `cg-${lot.id}`

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default', pointerEvents: 'all' }}
            >
                <defs>
                    <radialGradient id={gradId} cx="38%" cy="32%" r="60%">
                        <stop offset="0%"   stopColor="#fff" stopOpacity={0.18} />
                        <stop offset="100%" stopColor={fill} stopOpacity={0} />
                    </radialGradient>
                </defs>

                {/* Selection ring */}
                {isSelected && (
                    <circle cx={cx} cy={cy} r={r * 1.55}
                        fill="none" stroke="#fff" strokeWidth={1.5} strokeOpacity={0.6}
                        strokeDasharray="4 3"
                    />
                )}

                {/* Main fill */}
                <circle cx={cx} cy={cy} r={r}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : fillOpacity}
                    stroke={isSelected ? '#fff' : stroke}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 0.9 : 0.5}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 6px ${fill})` : undefined,
                        transition: 'fill-opacity .15s, stroke .15s',
                    }}
                />

                {/* Inner highlight */}
                <circle cx={cx} cy={cy} r={r}
                    fill={`url(#${gradId})`}
                    style={{ pointerEvents: 'none' }}
                />
            </g>
        )
    }

    /* ── POLYGON ─────────────────────────────────────────────── */
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

        const gradId = `pg-${lot.id}`
        const dotR   = Math.max(3, baseRadius * 0.22)

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default', pointerEvents: 'all' }}
            >
                <defs>
                    <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
                        <stop offset="0%"   stopColor="#fff" stopOpacity={0.15} />
                        <stop offset="100%" stopColor={fill} stopOpacity={0} />
                    </radialGradient>
                </defs>

                {/* Selection ring */}
                {isSelected && (
                    <polygon points={pointsStr}
                        fill="none" stroke="#fff" strokeWidth={2.5} strokeOpacity={0.5}
                        strokeDasharray="5 3"
                    />
                )}

                {/* Main fill */}
                <polygon points={pointsStr}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : fillOpacity}
                    stroke={isSelected ? '#fff' : stroke}
                    strokeWidth={isSelected ? 1.8 : 0.8}
                    strokeOpacity={isSelected ? 0.85 : 0.45}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 5px ${fill}99)` : undefined,
                        transition: 'fill-opacity .15s, stroke .15s',
                    }}
                />

                {/* Inner highlight */}
                <polygon points={pointsStr}
                    fill={`url(#${gradId})`}
                    style={{ pointerEvents: 'none' }}
                />

                {/* Subtle center dot */}
                <circle cx={centroid.x} cy={centroid.y} r={dotR}
                    fill="#fff" fillOpacity={isSelected ? 0.7 : 0.35}
                    style={{ pointerEvents: 'none' }}
                />
            </g>
        )
    }

    return null
}
