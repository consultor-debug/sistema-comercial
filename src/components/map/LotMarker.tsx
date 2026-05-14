'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    /** Rendered pixel size of the map image — used to convert normalized (0-1) coordinates */
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

    const statusColors = {
        LIBRE: '#10B981',
        SEPARADO: '#F59E0B',
        VENDIDO: '#EF4444',
        NO_DISPONIBLE: '#64748B'
    }

    const color = statusColors[lot.estado] ?? '#64748B'
    const isClickable = lot.estado === 'LIBRE' || lot.estado === 'SEPARADO' || lot.estado === 'VENDIDO'

    /**
     * Convert a stored coordinate to a pixel value relative to the image.
     * Stored coords between 0–1 are normalized fractions; values > 1 are
     * treated as raw pixel values (legacy data).
     */
    const toPixel = (value: number, dimension: number): number => {
        if (value >= 0 && value <= 1 && dimension > 0) {
            return value * dimension
        }
        return value
    }

    // Render circle marker
    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const radius = shapeData.radius || 20
        const cx = toPixel(shapeData.x, imageSize.width)
        const cy = toPixel(shapeData.y, imageSize.height)

        return (
            <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={isClickable ? { brightness: 1.2 } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
                onClick={isClickable ? onClick : undefined}
                className={cn(
                    'transition-all duration-200',
                    isClickable && 'cursor-pointer'
                )}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
                <motion.circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    animate={{
                        stroke: isSelected ? '#fff' : color,
                        strokeWidth: isSelected ? 3 : 1.5,
                        fillOpacity: isSelected ? 1 : 0.8,
                    }}
                    whileHover={{ strokeWidth: 3 }}
                    className="transition-all duration-300"
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 12px ${color})` : 'none'
                    }}
                />

                {isSelected && (
                    <motion.circle
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
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
                    style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.6)' }}
                >
                    {lot.code}
                </text>
            </motion.g>
        )
    }

    // Render polygon marker
    if (lot.mapShapeType === 'polygon' && shapeData.points) {
        const pixelPoints = shapeData.points.map(p => ({
            x: toPixel(p.x, imageSize.width),
            y: toPixel(p.y, imageSize.height),
        }))

        const pointsStr = pixelPoints.map(p => `${p.x},${p.y}`).join(' ')

        // Calculate centroid
        const centroid = pixelPoints.reduce(
            (acc, p) => ({ x: acc.x + p.x / pixelPoints.length, y: acc.y + p.y / pixelPoints.length }),
            { x: 0, y: 0 }
        )

        return (
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={isClickable ? { filter: 'brightness(1.2)' } : {}}
                whileTap={isClickable ? { scale: 0.99 } : {}}
                onClick={isClickable ? onClick : undefined}
                className={cn(
                    'transition-all duration-200 origin-center',
                    isClickable && 'cursor-pointer'
                )}
                style={{ transformOrigin: `${centroid.x}px ${centroid.y}px` }}
            >
                <motion.polygon
                    points={pointsStr}
                    fill={color}
                    animate={{
                        stroke: isSelected ? '#fff' : color,
                        strokeWidth: isSelected ? 3 : 1,
                        fillOpacity: isSelected ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        filter: isSelected ? `drop-shadow(0 0 15px ${color}aa)` : 'none'
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
                    style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.6)' }}
                >
                    {lot.code}
                </text>
            </motion.g>
        )
    }

    return null
}
