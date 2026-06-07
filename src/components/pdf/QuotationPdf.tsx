import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

// ── Paleta ──────────────────────────────────────────────────────
const C = {
    primary:      '#1e3a5f',   // azul marino profundo
    accent:       '#2563eb',   // blue-600 (acento)
    accentLight:  '#eff6ff',   // blue-50
    accentMid:    '#bfdbfe',   // blue-200
    teal:         '#0d9488',   // teal-600
    tealLight:    '#f0fdfa',   // teal-50
    tealMid:      '#99f6e4',   // teal-200
    green:        '#16a34a',
    greenLight:   '#f0fdf4',
    greenMid:     '#bbf7d0',
    red:          '#dc2626',
    redLight:     '#fff1f2',
    amber:        '#d97706',
    bg:           '#f8fafc',
    white:        '#ffffff',
    border:       '#e2e8f0',
    borderLight:  '#f1f5f9',
    text:         '#0f172a',
    textMid:      '#334155',
    textMuted:    '#64748b',
    textFaint:    '#94a3b8',
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: C.bg,
        fontFamily: 'Helvetica',
        color: C.text,
    },

    /* ── Header ───────────────────────────────────────────────── */
    headerBlock: {
        backgroundColor: C.primary,
        paddingHorizontal: 32,
        paddingTop: 22,
        paddingBottom: 18,
    },
    headerInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoBox: {
        width: 44,
        height: 44,
        backgroundColor: C.accent,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoLetter: {
        color: C.white,
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
    },
    companyName: {
        fontSize: 17,
        fontFamily: 'Helvetica-Bold',
        color: C.white,
    },
    companySub: {
        color: C.accentMid,
        fontSize: 9,
        marginTop: 2,
    },
    cotLabel: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: C.accentMid,
        letterSpacing: 2,
        marginBottom: 4,
        textAlign: 'right',
    },
    cotCode: {
        fontSize: 15,
        fontFamily: 'Helvetica-Bold',
        color: C.white,
        textAlign: 'right',
    },
    cotDate: {
        fontSize: 9,
        color: C.accentMid,
        textAlign: 'right',
        marginTop: 3,
    },
    headerDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginTop: 14,
        marginBottom: 0,
    },
    vigenciaBand: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 8,
        gap: 6,
    },
    vigenciaPill: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    vigenciaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    vigenciaText: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.75)',
    },

    /* ── Body ─────────────────────────────────────────────────── */
    body: {
        paddingHorizontal: 28,
        paddingTop: 18,
        paddingBottom: 24,
    },

    /* ── Section header ──────────────────────────────────────── */
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
        marginTop: 14,
        gap: 7,
    },
    sectionBar: {
        width: 3,
        height: 14,
        backgroundColor: C.accent,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
        backgroundColor: C.white,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 4,
    },

    /* ── Label / Value ───────────────────────────────────────── */
    label: {
        color: C.textMuted,
        fontSize: 8,
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    value: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
    },

    /* ── Grid ────────────────────────────────────────────────── */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    /* ── Financial cards ─────────────────────────────────────── */
    finRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    finCard: {
        flex: 1,
        backgroundColor: C.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 9,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    finLabel: {
        fontSize: 7,
        color: C.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    finValue: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
    },

    /* ── Cronograma resumen ───────────────────────────────────── */
    cronoCard: {
        backgroundColor: C.accentLight,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: C.accentMid,
        marginBottom: 4,
    },

    /* ── Bottom columns ──────────────────────────────────────── */
    bottomRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },

    /* ── Footer ──────────────────────────────────────────────── */
    footer: {
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 10,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 7,
        color: C.textFaint,
    },
    footerBrand: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.textMuted,
    },

    /* ── Watermark ───────────────────────────────────────────── */
    watermark: {
        position: 'absolute',
        top: '38%',
        left: '8%',
        fontSize: 72,
        color: 'rgba(226, 232, 240, 0.30)',
        transform: 'rotate(-45deg)',
        fontFamily: 'Helvetica-Bold',
        zIndex: -1,
    },
})

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)

const isValidPhone = (p?: string | null) =>
    !!p && p.trim().replace(/\s/g, '').length >= 6

// ── Sub-components ───────────────────────────────────────────────
const Section = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
)

const FieldItem = ({
    label, value, w = '25%', accent = false, small = false,
}: {
    label: string; value: string; w?: string; accent?: boolean; small?: boolean
}) => (
    <View style={[styles.grid, { width: w, marginBottom: 10 }]}>
        <View>
            <Text style={styles.label}>{label}</Text>
            <Text style={[
                styles.value,
                accent ? { color: C.accent } : {},
                small ? { fontSize: 9 } : {},
            ]}>{value}</Text>
        </View>
    </View>
)

// ── Props ────────────────────────────────────────────────────────
interface QuotationPdfProps {
    data: {
        codigo: string;
        date: { fechaEmision: string; horaEmision: string; fechaVigencia: string };
        tenant: { name: string; logoUrl?: string };
        project: { name: string };
        lot: {
            code: string; manzana: string; loteNumero: number; areaM2: number;
            precioLista: number; tipologia?: string | null; etapa?: string | null;
            frenteM?: number | null; fondoM?: number | null;
            ladoDerM?: number | null; ladoIzqM?: number | null;
        };
        client: { dni: string; nombreCompleto: string; email: string };
        financial: {
            precioLista: number; descuento: number; precioFinal: number;
            inicial: number; cuotas: number; cuotaMensual: number;
            cronograma: Array<{ numero: number; fecha: string; monto: number }>;
        };
    }
}

// ── Main component ───────────────────────────────────────────────
export const QuotationPdf = ({ data }: QuotationPdfProps) => {
    const { financial: f, lot, client, project, date, tenant, codigo } = data
    const saldoFinanciar = f.precioFinal - f.inicial
    const phone = isValidPhone(client.email)

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── HEADER OSCURO ─────────────────────────────────────── */}
                <View style={styles.headerBlock}>
                    <View style={styles.headerInner}>
                        {/* Logo + empresa */}
                        <View style={styles.logoRow}>
                            <View style={styles.logoBox}>
                                <Text style={styles.logoLetter}>
                                    {tenant.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.companyName}>{tenant.name}</Text>
                                <Text style={styles.companySub}>Gestión Inmobiliaria · Cotización Oficial</Text>
                            </View>
                        </View>
                        {/* Código cotización */}
                        <View>
                            <Text style={styles.cotLabel}>COTIZACIÓN</Text>
                            <Text style={styles.cotCode}>{codigo}</Text>
                            <Text style={styles.cotDate}>
                                Emitido: {date.fechaEmision} — {date.horaEmision}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.headerDivider} />

                    <View style={styles.vigenciaBand}>
                        <View style={styles.vigenciaPill}>
                            <View style={styles.vigenciaDot} />
                            <Text style={styles.vigenciaText}>
                                Válida hasta {date.fechaVigencia}
                            </Text>
                        </View>
                        <View style={[styles.vigenciaPill, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
                            <Text style={styles.vigenciaText}>
                                Proyecto: {project.name}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── BODY ────────────────────────────────────────────── */}
                <View style={styles.body}>

                    {/* ── Cliente ─────────────────────────────────────── */}
                    <Section title="Datos del Cliente" />
                    <View style={styles.card}>
                        <View style={styles.grid}>
                            <FieldItem label="Nombres y Apellidos" value={client.nombreCompleto} w="48%" />
                            <FieldItem label="DNI / RUC" value={client.dni} w="22%" />
                            <View style={{ width: '30%', marginBottom: 10 }}>
                                <Text style={styles.label}>Nro de Teléfono</Text>
                                {phone ? (
                                    <Text style={styles.value}>{client.email}</Text>
                                ) : (
                                    <View style={{
                                        backgroundColor: '#fff1f2', borderRadius: 5,
                                        paddingHorizontal: 7, paddingVertical: 4,
                                        borderWidth: 1, borderColor: '#fecdd3', marginTop: 1,
                                    }}>
                                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.red }}>PENDIENTE</Text>
                                        <Text style={{ fontSize: 7, color: '#9f1239', marginTop: 1 }}>
                                            Ingresa el teléfono para completar.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ── Inmueble ─────────────────────────────────────── */}
                    <Section title="Detalles del Inmueble" />
                    <View style={styles.card}>
                        <View style={styles.grid}>
                            <FieldItem label="Proyecto"  value={project.name}              w="38%" />
                            <FieldItem label="Manzana"   value={lot.manzana}               w="14%" />
                            <FieldItem label="Lote N°"   value={String(lot.loteNumero)}    w="14%" />
                            <FieldItem label="Área"      value={`${lot.areaM2} m²`}        w="17%" />
                            <FieldItem label="Etapa"     value={lot.etapa || '—'}          w="17%" />
                        </View>
                        <View style={{ height: 1, backgroundColor: C.borderLight, marginBottom: 8 }} />
                        <View style={styles.grid}>
                            <FieldItem label="Tipología"   value={lot.tipologia || 'Lote'} w="30%" small />
                            {lot.frenteM   && <FieldItem label="Frente"    value={`${lot.frenteM} m`}   w="14%" small />}
                            {lot.fondoM    && <FieldItem label="Fondo"     value={`${lot.fondoM} m`}    w="14%" small />}
                            {lot.ladoDerM  && <FieldItem label="Lado Der." value={`${lot.ladoDerM} m`}  w="14%" small />}
                            {lot.ladoIzqM  && <FieldItem label="Lado Izq." value={`${lot.ladoIzqM} m`} w="14%" small />}
                            <View style={{ marginLeft: 'auto', marginBottom: 10 }}>
                                <Text style={styles.label}>Precio Lista</Text>
                                <Text style={[styles.value, { color: C.accent, fontSize: 11 }]}>
                                    {fmt(lot.precioLista)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Propuesta Económica ───────────────────────────── */}
                    <Section title="Propuesta Económica" />

                    {/* Fila precio lista → descuento → precio final */}
                    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 0, paddingVertical: 10, marginBottom: 6 }]}>
                        {/* Precio lista */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Precio Lista</Text>
                            <Text style={[styles.value, { fontSize: 12 }]}>{fmt(f.precioLista)}</Text>
                        </View>

                        {/* Separador */}
                        <View style={{ width: 28, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, color: C.textFaint, marginBottom: 2 }}>−</Text>
                        </View>

                        {/* Descuento */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Descuento</Text>
                            <Text style={[styles.value, { fontSize: 12, color: f.descuento > 0 ? C.green : C.textFaint }]}>
                                {f.descuento > 0 ? `- ${fmt(f.descuento)}` : 'S/ 0.00'}
                            </Text>
                        </View>

                        {/* Separador */}
                        <View style={{ width: 28, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, color: C.textFaint, marginBottom: 2 }}>=</Text>
                        </View>

                        {/* Precio final — destacado */}
                        <View style={{
                            flex: 1.2,
                            backgroundColor: C.primary,
                            borderRadius: 7,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                        }}>
                            <Text style={{ fontSize: 8, color: C.accentMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Precio Final</Text>
                            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white }}>{fmt(f.precioFinal)}</Text>
                        </View>
                    </View>

                    {/* Cards financieras */}
                    <View style={styles.finRow}>
                        {/* Inicial */}
                        <View style={styles.finCard}>
                            <Text style={styles.finLabel}>A Inicial</Text>
                            <Text style={[styles.finValue, { fontSize: 11 }]}>{fmt(f.inicial)}</Text>
                        </View>

                        {/* Saldo */}
                        <View style={styles.finCard}>
                            <Text style={styles.finLabel}>Saldo a Financiar</Text>
                            <Text style={[styles.finValue, { fontSize: 11 }]}>{fmt(saldoFinanciar)}</Text>
                        </View>

                        {/* Cuotas — azul */}
                        <View style={[styles.finCard, { backgroundColor: C.accentLight, borderColor: C.accentMid }]}>
                            <Text style={[styles.finLabel, { color: C.accent }]}>Financiamiento</Text>
                            <Text style={[styles.finValue, { color: C.primary }]}>{f.cuotas} meses</Text>
                        </View>

                        {/* Cuota mensual — verde */}
                        <View style={[styles.finCard, { backgroundColor: C.greenLight, borderColor: C.greenMid }]}>
                            <Text style={[styles.finLabel, { color: C.green }]}>Cuota Mensual</Text>
                            <Text style={[styles.finValue, { color: '#14532d', fontSize: 13 }]}>{fmt(f.cuotaMensual)}</Text>
                        </View>
                    </View>

                    {/* Cronograma resumen */}
                    <Section title="Cronograma Corto" />
                    <View style={styles.cronoCard}>
                        <View style={styles.grid}>
                            <FieldItem
                                label="N° de cuotas"
                                value={String(f.cuotas)}
                                w="25%" accent
                            />
                            <FieldItem
                                label="Monto de cuota"
                                value={fmt(f.cuotaMensual)}
                                w="30%" accent
                            />
                            <FieldItem
                                label="Primera cuota"
                                value={f.cronograma[0]?.fecha || '—'}
                                w="22%"
                            />
                            <FieldItem
                                label="Última cuota"
                                value={f.cronograma[f.cronograma.length - 1]?.fecha || '—'}
                                w="23%"
                            />
                        </View>
                        <Text style={{ fontSize: 7.5, color: C.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                            El detalle completo del cronograma está disponible con tu asesor comercial.
                        </Text>
                    </View>

                    {/* ── Reserva + Términos ───────────────────────────── */}
                    <View style={styles.bottomRow}>
                        {/* Separación */}
                        <View style={{
                            flex: 1,
                            backgroundColor: C.tealLight,
                            borderRadius: 8,
                            padding: 11,
                            borderWidth: 1,
                            borderColor: C.tealMid,
                        }}>
                            <Text style={{
                                fontSize: 9, fontFamily: 'Helvetica-Bold',
                                color: C.teal, textTransform: 'uppercase',
                                letterSpacing: 0.8, marginBottom: 5,
                            }}>
                                Asegura Esta Ubicación
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f766e', marginBottom: 6 }}>
                                Separación: S/ 500
                            </Text>
                            <Text style={{ fontSize: 8, color: '#134e4a', marginBottom: 2, lineHeight: 1.4 }}>
                                1. Confirma la Manzana y Lote.
                            </Text>
                            <Text style={{ fontSize: 8, color: '#134e4a', marginBottom: 2, lineHeight: 1.4 }}>
                                2. Realiza transferencia o Yape.
                            </Text>
                            <Text style={{ fontSize: 8, color: '#134e4a', marginBottom: 6, lineHeight: 1.4 }}>
                                3. Envía el comprobante a tu asesor.
                            </Text>
                            <View style={{ height: 1, backgroundColor: C.tealMid, marginBottom: 6 }} />
                            <Text style={{ fontSize: 7.5, color: '#0f766e', fontFamily: 'Helvetica-Bold', lineHeight: 1.4 }}>
                                El monto de separación se descuenta íntegramente de la inicial al momento de firma.
                            </Text>
                        </View>

                        {/* Términos */}
                        <View style={{
                            flex: 1,
                            backgroundColor: C.white,
                            borderRadius: 8,
                            padding: 11,
                            borderWidth: 1,
                            borderColor: C.border,
                        }}>
                            <Text style={{
                                fontSize: 9, fontFamily: 'Helvetica-Bold',
                                color: C.primary, textTransform: 'uppercase',
                                letterSpacing: 0.8, marginBottom: 7,
                            }}>
                                Términos y Condiciones
                            </Text>
                            {[
                                'Esta cotización tiene vigencia de 3 días calendario desde su emisión.',
                                'La disponibilidad se confirma al momento de efectuar la separación.',
                                'La separación de S/ 500 bloquea la ubicación seleccionada.',
                                'Vencida la vigencia, precios y condiciones pueden actualizarse.',
                                'Documento referencial — no constituye contrato de compra-venta.',
                            ].map((t, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 4, gap: 4 }}>
                                    <View style={{
                                        width: 4, height: 4, borderRadius: 2,
                                        backgroundColor: C.accent, marginTop: 2.5,
                                    }} />
                                    <Text style={{ fontSize: 7.5, color: C.textMid, flex: 1, lineHeight: 1.4 }}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Footer ─────────────────────────────────────────── */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Documento generado automáticamente por el Sistema Comercial
                        </Text>
                        <Text style={styles.footerBrand}>
                            {tenant.name} · {codigo}
                        </Text>
                    </View>

                    <Text style={styles.watermark}>S.COMERCIAL</Text>
                </View>
            </Page>
        </Document>
    );
};
