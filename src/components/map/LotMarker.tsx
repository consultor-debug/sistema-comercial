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
    scale?: number
}

export const LotMarker: React.FC<LotMarkerProps> = ({
    lot,
    onClick,
    isSelected = false,
    scale = 1
}) => {
    const svgRef = React.useRef<SVGGElement>(null)
    const [svgSize, setSvgSize] = React.useState({ width: 0, height: 0 })

    const shapeData = lot.mapShapeData as {
        x?: number
        y?: number
        radius?: number
        points?: { x: number; y: number }[]
    } | null

    React.useEffect(() => {
        if (svgRef.current) {
            const svg = svgRef.current.closest('svg')
            if (svg) {
                const updateSize = () => {
                    setSvgSize({
                        width: svg.clientWidth,
                        height: svg.clientHeight
                    })
                }
                updateSize()
                const observer = new ResizeObserver(updateSize)
                observer.observe(svg)
                return () => observer.disconnect()
            }
        }
    }, [])

    if (!shapeData) return null

    const statusColors = {
        LIBRE: '#10B981',
        SEPARADO: '#F59E0B',
        VENDIDO: '#EF4444',
        NO_DISPONIBLE: '#64748B'
    }

    const color = statusColors[lot.estado]
    const isClickable = lot.estado === 'LIBRE' || lot.estado === 'SEPARADO' || lot.estado === 'VENDIDO'

    // Helper to calculate render coordinates
    const getRenderCoords = (x?: number, y?: number) => {
        if (x === undefined || y === undefined) return { x: 0, y: 0 }

        // If x or y are between 0 and 1, they are normalized
        const isNormalizedX = x <= 1 && x >= 0
        const isNormalizedY = y <= 1 && y >= 0

        if (isNormalizedX && isNormalizedY && svgSize.width > 0) {
            return {
                x: x * svgSize.width,
                y: y * svgSize.height
            }
        }
        return { x, y }
    }

    const { x: renderX, y: renderY } = getRenderCoords(shapeData.x, shapeData.y)

    // Render circle marker
    if (lot.mapShapeType === 'circle' && shapeData.x !== undefined && shapeData.y !== undefined) {
        const radius = shapeData.radius || 20

        return (
            <motion.g
                ref={svgRef}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={isClickable ? { scale: 1.15 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                onClick={isClickable ? onClick : undefined}
                className={cn(
                    'transition-all duration-200',
                    isClickable && 'cursor-pointer'
                )}
            >
                <motion.circle
                    cx={renderX}
                    cy={renderY}
                    r={radius}
                    fill={color}
                    animate={{
                        stroke: isSelected ? '#fff' : color,
                        strokeWidth: isSelected ? 3 : 1.5,
                        fillOpacity: isSelected ? 1 : 0.8,
                    }}
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
                        cx={renderX}
                        cy={renderY}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                    />
                )}

                <text
                    x={renderX}
                    y={renderY}
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
        const points = shapeData.points.map(p => {
            const { x, y } = getRenderCoords(p.x, p.y)
            return `${x},${y}`
        }).join(' ')

        // Calculate centroid for label
        const rawCentroid = shapeData.points.reduce(
            (acc, p) => ({ x: acc.x + p.x / shapeData.points!.length, y: acc.y + p.y / shapeData.points!.length }),
            { x: 0, y: 0 }
        )
        const { x: centroidX, y: centroidY } = getRenderCoords(rawCentroid.x, rawCentroid.y)

        return (
            <motion.g
                ref={svgRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={isClickable ? { scale: 1.02, filter: 'brightness(1.2)' } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
                onClick={isClickable ? onClick : undefined}
                className={cn(
                    'transition-all duration-200 origin-center',
                    isClickable && 'cursor-pointer'
                )}
                style={{ transformOrigin: `${centroidX}px ${centroidY}px` }}
            >
                <motion.polygon
                    points={points}
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
                    x={centroidX}
                    y={centroidY}
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

    return <g ref={svgRef} />
}
