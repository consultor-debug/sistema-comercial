import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

// Register fonts if needed
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
// });

const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: '#f8fafc',
        fontFamily: 'Helvetica',
        color: '#1e293b',
    },
    topBar: {
        height: 8,
        backgroundColor: '#3b82f6',
        width: '100%',
    },
    contentContent: {
        padding: 30,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 15,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoCircle: {
        width: 48,
        height: 48,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    quotationInfo: {
        textAlign: 'right',
    },
    quotationLabel: {
        fontSize: 10,
        fontWeight: 'extrabold',
        color: '#3b82f6',
        letterSpacing: 2,
        marginBottom: 4,
    },
    quotationCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    dateText: {
        marginTop: 4,
        color: '#64748b',
        fontSize: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#3b82f6',
        borderBottomWidth: 2,
        borderBottomColor: '#bfdbfe',
        paddingBottom: 2,
        marginBottom: 6,
        marginTop: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '30%',
        marginBottom: 12,
    },
    label: {
        color: '#64748b',
        fontSize: 9,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    financialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10,
    },
    financialCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    financialCardHighlight: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    financialCardSuccess: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    financialCardLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    financialCardValue: {
        fontSize: 13,
        fontWeight: 'heavy',
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0',
    },
    cellNum: { width: '15%' },
    cellDate: { width: '45%' },
    cellAmount: { width: '40%', textAlign: 'right' },
    headerText: {
        fontWeight: 'bold',
        color: '#475569',
        fontSize: 9,
        textTransform: 'uppercase',
    },
    cellText: {
        fontSize: 10,
        color: '#334155',
    },
    watermark: {
        position: 'absolute',
        top: '40%',
        left: '10%',
        fontSize: 80,
        color: 'rgba(226, 232, 240, 0.4)',
        transform: 'rotate(-45deg)',
        fontWeight: 'bold',
        zIndex: -1,
    }
});

interface QuotationPdfProps {
    data: {
        codigo: string;
        date: {
            fechaEmision: string;
            horaEmision: string;
            fechaVigencia: string;
        };
        tenant: {
            name: string;
            logoUrl?: string;
        };
        project: {
            name: string;
        };
        lot: {
            code: string;
            manzana: string;
            loteNumero: number;
            areaM2: number;
            precioLista: number;
            tipologia?: string | null;
            etapa?: string | null;
            frenteM?: number | null;
            fondoM?: number | null;
            ladoDerM?: number | null;
            ladoIzqM?: number | null;
        };
        client: {
            dni: string;
            nombreCompleto: string;
            email: string;
        };
        financial: {
            precioLista: number;
            descuento: number;
            precioFinal: number;
            inicial: number;
            cuotas: number;
            cuotaMensual: number;
            cronograma: Array<{ numero: number; fecha: string; monto: number }>;
        };
    }
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
};

const isValidEmail = (email?: string | null) => {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    // Verifica texto + @ + dominio + . + extension
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail);
};

export const QuotationPdf = ({ data }: QuotationPdfProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.topBar} />
                <View style={styles.contentContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoSection}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoText}>{data.tenant.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text style={styles.companyName}>{data.tenant.name}</Text>
                                <Text style={{ color: '#64748b', fontSize: 10 }}>Gestión Inmobiliaria</Text>
                            </View>
                        </View>
                        <View style={styles.quotationInfo}>
                            <Text style={styles.quotationLabel}>COTIZACIÓN</Text>
                            <Text style={styles.quotationCode}>{data.codigo}</Text>
                            <Text style={styles.dateText}>Emitido: {data.date.fechaEmision} – {data.date.horaEmision}</Text>
                            <Text style={[styles.dateText, { marginTop: 2 }]}>Vigencia: Hasta {data.date.fechaVigencia} – {data.date.horaEmision}</Text>
                        </View>
                    </View>

                    {/* Client Info */}
                    <Text style={styles.sectionTitle}>Datos del Cliente</Text>
                    <View style={styles.card}>
                        <View style={styles.grid}>
                            <View style={[styles.gridItem, { width: '45%' }]}>
                                <Text style={styles.label}>Nombres y Apellidos</Text>
                                <Text style={styles.value}>{data.client.nombreCompleto}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '25%' }]}>
                                <Text style={styles.label}>DNI / RUC</Text>
                                <Text style={styles.value}>{data.client.dni}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '30%' }]}>
                                <Text style={styles.label}>Correo Electrónico</Text>
                                {isValidEmail(data.client.email) ? (
                                    <Text style={styles.value}>{data.client.email}</Text>
                                ) : (
                                    <View>
                                        <Text style={[styles.value, { color: '#ef4444' }]}>PENDIENTE</Text>
                                        <Text style={{ fontSize: 7, color: '#ef4444', marginTop: 2 }}>Confirma tu correo para validar esta cotización.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Project & Lot Info */}
                    <Text style={styles.sectionTitle}>Detalles del Inmueble</Text>
                    <View style={styles.card}>
                        <View style={styles.grid}>
                            <View style={[styles.gridItem, { width: '40%' }]}>
                                <Text style={styles.label}>Proyecto</Text>
                                <Text style={styles.value}>{data.project.name}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '15%' }]}>
                                <Text style={styles.label}>Manzana</Text>
                                <Text style={styles.value}>{data.lot.manzana}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '15%' }]}>
                                <Text style={styles.label}>Lote N°</Text>
                                <Text style={styles.value}>{data.lot.loteNumero}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '15%' }]}>
                                <Text style={styles.label}>Área</Text>
                                <Text style={styles.value}>{data.lot.areaM2} m²</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '15%' }]}>
                                <Text style={styles.label}>Etapa</Text>
                                <Text style={styles.value}>{data.lot.etapa || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={[styles.grid, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }]}>
                            <View style={[styles.gridItem, { width: '25%' }]}>
                                <Text style={styles.label}>Tipología</Text>
                                <Text style={styles.value}>{data.lot.tipologia || 'Lote'}</Text>
                            </View>
                            {data.lot.frenteM && (
                                <View style={[styles.gridItem, { width: '15%' }]}>
                                    <Text style={styles.label}>Frente</Text>
                                    <Text style={styles.value}>{data.lot.frenteM} m</Text>
                                </View>
                            )}
                            {data.lot.fondoM && (
                                <View style={[styles.gridItem, { width: '15%' }]}>
                                    <Text style={styles.label}>Fondo</Text>
                                    <Text style={styles.value}>{data.lot.fondoM} m</Text>
                                </View>
                            )}
                            {data.lot.ladoDerM && (
                                <View style={[styles.gridItem, { width: '15%' }]}>
                                    <Text style={styles.label}>Lado Der.</Text>
                                    <Text style={styles.value}>{data.lot.ladoDerM} m</Text>
                                </View>
                            )}
                            {data.lot.ladoIzqM && (
                                <View style={[styles.gridItem, { width: '15%' }]}>
                                    <Text style={styles.label}>Lado Izq.</Text>
                                    <Text style={styles.value}>{data.lot.ladoIzqM} m</Text>
                                </View>
                            )}
                            <View style={[styles.gridItem, { width: '15%', marginLeft: 'auto' }]}>
                                <Text style={styles.label}>Precio Lista</Text>
                                <Text style={styles.value}>{formatCurrency(data.lot.precioLista)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Financial Summary */}
                    <Text style={styles.sectionTitle}>Propuesta Económica</Text>
                    <View style={styles.financialContainer}>
                        <View style={styles.financialCard}>
                            <Text style={styles.financialCardLabel}>Precio Final</Text>
                            <Text style={[styles.financialCardValue, { color: '#0f172a' }]}>{formatCurrency(data.financial.precioFinal)}</Text>
                        </View>
                        <View style={styles.financialCard}>
                            <Text style={styles.financialCardLabel}>A Inicial</Text>
                            <Text style={[styles.financialCardValue, { color: '#0f172a' }]}>{formatCurrency(data.financial.inicial)}</Text>
                        </View>
                        <View style={[styles.financialCard, styles.financialCardHighlight]}>
                            <Text style={[styles.financialCardLabel, { color: '#1d4ed8' }]}>Financiamiento</Text>
                            <Text style={[styles.financialCardValue, { color: '#1e3a8a' }]}>{data.financial.cuotas} Meses</Text>
                        </View>
                        <View style={[styles.financialCard, styles.financialCardSuccess]}>
                            <Text style={[styles.financialCardLabel, { color: '#166534' }]}>Cuota Mensual</Text>
                            <Text style={[styles.financialCardValue, { color: '#14532d' }]}>{formatCurrency(data.financial.cuotaMensual)}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Cronograma Corto</Text>
                    <View style={[styles.card, { paddingVertical: 10, marginBottom: 15 }]}>
                        <View style={styles.grid}>
                            <View style={[styles.gridItem, { width: '25%', marginBottom: 0 }]}>
                                <Text style={styles.label}>N° de cuotas</Text>
                                <Text style={styles.value}>{data.financial.cuotas}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '25%', marginBottom: 0 }]}>
                                <Text style={styles.label}>Monto de cuota</Text>
                                <Text style={styles.value}>S/ {formatCurrency(data.financial.cuotaMensual).replace('S/ ', '').replace('S/', '')}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '25%', marginBottom: 0 }]}>
                                <Text style={styles.label}>Primera cuota</Text>
                                <Text style={styles.value}>{data.financial.cronograma[0]?.fecha || '-'}</Text>
                            </View>
                            <View style={[styles.gridItem, { width: '25%', marginBottom: 0 }]}>
                                <Text style={styles.label}>Última cuota</Text>
                                <Text style={styles.value}>{data.financial.cronograma[data.financial.cronograma.length - 1]?.fecha || '-'}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>
                            Detalle completo del cronograma disponible con tu asesor.
                        </Text>
                    </View>

                    {/* Terminos y Reserva en formato Columnas */}
                    <View style={{ flexDirection: 'row', gap: 15, marginTop: 5 }}>
                        {/* Reserva */}
                        <View style={{ flex: 1, backgroundColor: '#f0fdfa', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#ccfbf1' }}>
                            <Text style={[styles.sectionTitle, { marginTop: 0, paddingBottom: 4, borderBottomWidth: 0, color: '#0f766e', fontSize: 10 }]}>ASEGURA HOY ESTA UBICACIÓN</Text>
                            <Text style={[styles.value, { marginBottom: 6, color: '#0f766e' }]}>Separación inmediata: S/ 500</Text>
                            <Text style={{ fontSize: 9, color: '#134e4a', marginBottom: 2, lineHeight: 1.3 }}>Proceso:</Text>
                            <Text style={{ fontSize: 9, color: '#134e4a', marginBottom: 1, lineHeight: 1.3 }}>1. Confirma la Manzana y Lote.</Text>
                            <Text style={{ fontSize: 9, color: '#134e4a', marginBottom: 1, lineHeight: 1.3 }}>2. Realiza transferencia o Yape.</Text>
                            <Text style={{ fontSize: 9, color: '#134e4a', marginBottom: 4, lineHeight: 1.3 }}>3. Envía el comprobante al asesor asignado.</Text>
                            <Text style={{ fontSize: 9, color: '#134e4a', fontWeight: 'bold', lineHeight: 1.2 }}>Con la separación, la ubicación queda bloqueada y retirada temporalmente de la oferta comercial. El monto se descuenta íntegramente de la inicial.</Text>
                        </View>

                        {/* Términos */}
                        <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                            <Text style={[styles.sectionTitle, { marginTop: 0, paddingBottom: 4, borderBottomWidth: 0, fontSize: 10, color: '#0f172a' }]}>TÉRMINOS Y CONDICIONES</Text>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ fontSize: 10, color: '#475569', marginRight: 4, lineHeight: 1 }}>•</Text>
                                <Text style={{ fontSize: 8, color: '#475569', flex: 1, lineHeight: 1.2 }}>Esta cotización tiene vigencia de 3 días calendario desde su fecha y hora de emisión.</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ fontSize: 10, color: '#475569', marginRight: 4, lineHeight: 1 }}>•</Text>
                                <Text style={{ fontSize: 8, color: '#475569', flex: 1, lineHeight: 1.2 }}>La disponibilidad se confirma al momento de la separación.</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ fontSize: 10, color: '#475569', marginRight: 4, lineHeight: 1 }}>•</Text>
                                <Text style={{ fontSize: 8, color: '#475569', flex: 1, lineHeight: 1.2 }}>La separación de S/ 500 asegura la ubicación seleccionada.</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ fontSize: 10, color: '#475569', marginRight: 4, lineHeight: 1 }}>•</Text>
                                <Text style={{ fontSize: 8, color: '#475569', flex: 1, lineHeight: 1.2 }}>Fuera del plazo de vigencia, precios y condiciones pueden actualizarse.</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 10, color: '#475569', marginRight: 4, lineHeight: 1 }}>•</Text>
                                <Text style={{ fontSize: 8, color: '#475569', flex: 1, lineHeight: 1.2 }}>Documento referencial que no constituye contrato de compra-venta.</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.watermark}>S.COMERCIAL</Text>
                </View>
            </Page>
        </Document>
    );
};
