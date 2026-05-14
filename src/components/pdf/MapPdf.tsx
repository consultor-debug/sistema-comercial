/* eslint-disable */
import { Document, Page, Image, View, Text, StyleSheet } from '@react-pdf/renderer'
import { LotStatus } from '@prisma/client'
import * as React from 'react'

const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: '#0f172a',
    },
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    svgOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    header: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
    },
    title: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2,
    },
    legend: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        gap: 15,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 10,
        color: '#cbd5e1',
    }
})

const statusColors: Record<LotStatus, string> = {
    LIBRE: '#10B981',
    SEPARADO: '#F59E0B',
    VENDIDO: '#EF4444',
    NO_DISPONIBLE: '#64748B'
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
                        {/* The image defines the aspect ratio of the container */}
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image 
                            src={mapImagePath} 
                            style={{ width: '100%', height: 'auto' }} 
                            cache={false}
                        />

                        {/* Markers overlay using percentage positioning to avoid distortion */}
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
                                const color = statusColors[lot.estado] || '#64748B'
                                
                                // Calculate position based on either centroid or circle center
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

                                // Adjust for percentage (stored as 0-1)
                                const left = `${x * 100}%`
                                const top = `${y * 100}%`

                                return (
                                    <View 
                                        key={lot.id}
                                        style={{
                                            position: 'absolute',
                                            left,
                                            top,
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: color,
                                            borderRadius: 4,
                                            padding: 2,
                                            minWidth: 12,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 0.5,
                                            borderColor: '#ffffff',
                                            opacity: 0.9
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
                        <Text style={styles.subtitle}>Estado de Disponibilidad - {new Date().toLocaleDateString('es-PE')}</Text>
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
