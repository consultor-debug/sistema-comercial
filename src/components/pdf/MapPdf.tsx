/* eslint-disable */
import { Document, Page, Image, View, Text, StyleSheet } from '@react-pdf/renderer'
import { LotStatus } from '@prisma/client'
import * as React from 'react'

const statusColors: Record<LotStatus, string> = {
    LIBRE: '#10B981',
    SEPARADO: '#F59E0B',
    VENDIDO: '#EF4444',
    NO_DISPONIBLE: '#94a3b8'
}

const statusLabels: Record<string, string> = {
    LIBRE: 'Disponible',
    SEPARADO: 'Separado',
    VENDIDO: 'Vendido',
}

interface MapPdfProps {
    projectName: string
    mapImagePath: string
    lots: {
        id: string
        code: string
        estado: LotStatus
        mapShapeType: string | null
        mapShapeData: unknown
    }[]
}

export const MapPdf = ({ projectName, mapImagePath, lots }: MapPdfProps) => {
    return (
        <Document>
            <Page 
                size="A4" 
                orientation="landscape" 
                style={{ 
                    backgroundColor: '#f8fafc',
                    padding: 0,
                    position: 'relative',
                }}
            >
                {/* Full-page map container */}
                <View style={{ 
                    width: '100%', 
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                }}>
                    {/* Map image — fills the page maintaining aspect ratio */}
                    <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image 
                            src={mapImagePath} 
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                objectFit: 'contain',
                            }} 
                            cache={false}
                        />

                        {/* Markers overlay — percentage positioned */}
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}>
                            {lots.map((lot) => {
                                if (!lot.mapShapeData) return null
                                const data = lot.mapShapeData as { x?: number; y?: number; points?: { x: number; y: number }[] }
                                const color = statusColors[lot.estado] || '#94a3b8'
                                
                                let x = 0
                                let y = 0
                                
                                if (lot.mapShapeType === 'circle' && data.x !== undefined && data.y !== undefined) {
                                    x = data.x
                                    y = data.y
                                } else if (lot.mapShapeType === 'polygon' && data.points) {
                                    x = data.points.reduce((acc, p) => acc + p.x / data.points!.length, 0)
                                    y = data.points.reduce((acc, p) => acc + p.y / data.points!.length, 0)
                                } else {
                                    return null
                                }

                                // Convert 0-1 fraction to percentage
                                const leftPct = `${x * 100}%`
                                const topPct = `${y * 100}%`
                                const markerW = 22
                                const markerH = 12

                                return (
                                    <View 
                                        key={lot.id}
                                        style={{
                                            position: 'absolute',
                                            left: leftPct,
                                            top: topPct,
                                            marginLeft: -(markerW / 2),
                                            marginTop: -(markerH / 2),
                                            backgroundColor: color,
                                            borderRadius: 2,
                                            width: markerW,
                                            height: markerH,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 0.5,
                                            borderColor: '#ffffff',
                                        }}
                                    >
                                        <Text style={{ 
                                            fontSize: 5, 
                                            color: '#ffffff', 
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                        }}>
                                            {lot.code}
                                        </Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                </View>

                {/* Header overlay */}
                <View style={{
                    position: 'absolute',
                    top: 25,
                    left: 25,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8 14',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                }}>
                    <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: 'bold' }}>
                        {projectName}
                    </Text>
                    <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>
                        Estado de Disponibilidad — {new Date().toLocaleDateString('es-PE')}
                    </Text>
                </View>

                {/* Legend overlay */}
                <View style={{
                    position: 'absolute',
                    bottom: 25,
                    left: 25,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '5 10',
                    borderRadius: 4,
                    flexDirection: 'row',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                }}>
                    {(['LIBRE', 'SEPARADO', 'VENDIDO'] as LotStatus[]).map(status => (
                        <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColors[status] }} />
                            <Text style={{ fontSize: 7, color: '#64748b' }}>{statusLabels[status]}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    )
}
