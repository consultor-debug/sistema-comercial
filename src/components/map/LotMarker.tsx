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
    imageSize = { width: 0, height: 0 },
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

    const toPixel = (value: number, dimension: number): number => {
        if (value >= 0 && value <= 1 && dimension > 0) {
            return value * dimension
        }
        return value
    }

    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const radius = shapeData.radius || 20
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)

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
                    stroke={isSelected ? '#fff' : color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    fillOpacity={isSelected ? 1 : 0.8}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 12px ${color})` : 'none',
                        transition: 'stroke 0.2s, stroke-width 0.2s, fill-opacity 0.2s'
                    }}
                />

                {isSelected && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius * 1.6}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                        strokeDasharray="4 3"
                    />
                )}

                <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={radius * 0.6}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
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

        return (
            <g
                onClick={isClickable ? onClick : undefined}
                className={cn(isClickable && 'cursor-pointer')}
                style={{ pointerEvents: 'all' }}
            >
                <polygon
                    points={pointsStr}
                    fill={color}
                    stroke={isSelected ? '#fff' : color}
                    strokeWidth={isSelected ? 3 : 1}
                    fillOpacity={isSelected ? 1 : 0.7}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 12px ${color}aa)` : 'none',
                        transition: 'stroke 0.2s, stroke-width 0.2s, fill-opacity 0.2s'
                    }}
                />

                <text
                    x={centroid.x}
                    y={centroid.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                    {lot.code}
                </text>
            </g>
        )
    }

    return null
}
