'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
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

    const statusColors: Record<string, string> = {
        LIBRE: '#10B981',
        SEPARADO: '#F59E0B',
        VENDIDO: '#EF4444',
        NO_DISPONIBLE: '#64748B'
    }

    const color = statusColors[lot.estado] ?? '#64748B'
    const isClickable = lot.estado === 'LIBRE' || lot.estado === 'SEPARADO' || lot.estado === 'VENDIDO'

    /**
     * Convert stored coordinate to viewBox pixel.
     * 0-1 = normalized fraction → multiply by dimension.
     * >1 = legacy raw pixel → keep as-is.
     */
    const toPixel = (value: number, dimension: number): number => {
        if (value >= 0 && value <= 1 && dimension > 0) {
            return value * dimension
        }
        return value
    }

    // Dynamic radius based on viewBox size — ensures visibility
    const baseRadius = Math.max(8, imageSize.width * 0.012)

    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const radius = shapeData.radius ? Math.max(shapeData.radius, baseRadius) : baseRadius
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)
        const fontSize = Math.max(5, radius * 0.55)

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                className={cn(isClickable && 'cursor-pointer')}
                style={{ pointerEvents: 'all' }}
            >
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isSelected ? 2.5 : 0.8}
                    fillOpacity={isSelected ? 1 : 0.85}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none',
                        transition: 'stroke 0.15s, stroke-width 0.15s, fill-opacity 0.15s'
                    }}
                />

                {isSelected && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius * 1.5}
                        fill="none"
                        stroke={color}
                        strokeWidth={1}
                        strokeOpacity={0.4}
                        strokeDasharray="3 2"
                    />
                )}

                <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontFamily="Inter, system-ui, sans-serif"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                    {lot.code}
                </text>
            </g>
        )
    }

    if (lot.mapShapeType === 'polygon' && shapeData.points) {
        const pixelPoints = shapeData.points.map(p => ({
            x: toPixel(p.x, imageSize.width),
            y: toPixel(p.y, imageSize.height),
        }))

        const pointsStr = pixelPoints.map(p => `${p.x},${p.y}`).join(' ')

        const centroid = pixelPoints.reduce(
            (acc, p) => ({ x: acc.x + p.x / pixelPoints.length, y: acc.y + p.y / pixelPoints.length }),
            { x: 0, y: 0 }
        )

        const fontSize = Math.max(5, baseRadius * 0.7)

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                className={cn(isClickable && 'cursor-pointer')}
                style={{ pointerEvents: 'all' }}
            >
                <polygon
                    points={pointsStr}
                    fill={color}
                    stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.2)'}
                    strokeWidth={isSelected ? 2.5 : 0.5}
                    fillOpacity={isSelected ? 1 : 0.75}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 8px ${color}aa)` : 'none',
                        transition: 'stroke 0.15s, stroke-width 0.15s, fill-opacity 0.15s'
                    }}
                />

                <text
                    x={centroid.x}
                    y={centroid.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontFamily="Inter, system-ui, sans-serif"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                    {lot.code}
                </text>
            </g>
        )
    }

    return null
}
