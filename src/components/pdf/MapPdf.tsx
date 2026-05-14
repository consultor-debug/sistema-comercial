/* eslint-disable */
import { Document, Page, Image, View, Text, StyleSheet } from '@react-pdf/renderer'
import { LotStatus } from '@prisma/client'
import * as React from 'react'

const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: '#ffffff',
    },
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    header: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8 12',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    title: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 8,
        color: '#94a3b8',
        marginTop: 2,
    },
    legend: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '6 10',
        borderRadius: 4,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendColor: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 8,
        color: '#64748b',
    }
})

const statusColors: Record<LotStatus, string> = {
    LIBRE: '#10B981',
    SEPARADO: '#F59E0B',
    VENDIDO: '#EF4444',
    NO_DISPONIBLE: '#94a3b8'
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
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.container}>
                    <View style={{ position: 'relative', width: '100%' }}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image 
                            src={mapImagePath} 
                            style={{ width: '100%', height: 'auto' }} 
                            cache={false}
                        />

                        {/* Markers overlay */}
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

                                // Use percentage positioning with margin offset to center
                                // react-pdf doesn't support transform: translate, so we offset with margin
                                const markerSize = 16
                                const leftPct = `${x * 100}%`
                                const topPct = `${y * 100}%`

                                return (
                                    <View 
                                        key={lot.id}
                                        style={{
                                            position: 'absolute',
                                            left: leftPct,
                                            top: topPct,
                                            marginLeft: -(markerSize / 2),
                                            marginTop: -(markerSize / 2),
                                            backgroundColor: color,
                                            borderRadius: 3,
                                            width: markerSize,
                                            height: markerSize,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 0.5,
                                            borderColor: '#ffffff',
                                        }}
                                    >
                                        <Text style={{ fontSize: 4, color: '#ffffff', fontWeight: 'bold' }}>{lot.code}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{projectName}</Text>
                        <Text style={styles.subtitle}>Estado de Disponibilidad — {new Date().toLocaleDateString('es-PE')}</Text>
                    </View>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: statusColors.LIBRE }]} />
                            <Text style={styles.legendText}>Disponible</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: statusColors.SEPARADO }]} />
                            <Text style={styles.legendText}>Separado</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: statusColors.VENDIDO }]} />
                            <Text style={styles.legendText}>Vendido</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
