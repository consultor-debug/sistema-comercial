import React from 'react'
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer'

// ─── Data ────────────────────────────────────────────────────────────────────

export interface SeparacionPdfData {
    fecha: string            // e.g. "06 de junio de 2026"
    ejecutivo: string        // asesor name
    nombre: string           // full client name
    dni: string
    email: string
    estadoCivil: string
    domicilio: string
    telefono: string
    area: number             // m²
    manzana: string
    loteNumero: number
    precioFinal: number      // S/
    montoSeparacion: number  // deposit S/
    fechaFirma: string       // e.g. "06 de junio de 2026"
    logoPath: string         // absolute path to /public/sep-logo.png
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        paddingTop: 36,
        paddingBottom: 50,
        paddingHorizontal: 50,
        color: '#000',
    },

    // ── Title ──
    title: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ── Section heading ──
    sectionHead: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        textDecoration: 'underline',
        marginTop: 10,
        marginBottom: 4,
    },

    sectionHeadUnderOnly: {
        fontSize: 9,
        textDecoration: 'underline',
        marginTop: 10,
        marginBottom: 4,
    },

    // ── Tables ──
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 2,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    rowLast: {
        flexDirection: 'row',
    },
    cellLabel: {
        width: '35%',
        padding: 4,
        fontFamily: 'Helvetica-Bold',
        fontSize: 8.5,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    cellValue: {
        width: '65%',
        padding: 4,
        fontSize: 8.5,
    },

    // Header table (2 equal cols)
    headerTable: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
    },
    headerCell: {
        flex: 1,
        padding: 4,
        fontSize: 8.5,
    },
    headerCellBorder: {
        flex: 1,
        padding: 4,
        fontSize: 8.5,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },

    // ── Paragraphs ──
    para: {
        fontSize: 8.5,
        textAlign: 'justify',
        marginBottom: 6,
        lineHeight: 1.4,
    },

    // ── Signature ──
    sigRow: {
        flexDirection: 'row',
        marginTop: 28,
        justifyContent: 'space-between',
    },
    sigBlock: {
        width: '45%',
        alignItems: 'center',
    },
    sigLogo: {
        width: 70,
        height: 70,
        marginBottom: 4,
    },
    sigLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        width: '100%',
        marginTop: 20,
    },
    sigLabel: {
        fontSize: 7.5,
        textAlign: 'center',
        marginTop: 4,
        color: '#333',
    },
})

// ─── Currency helper ─────────────────────────────────────────────────────────

function fmtSol(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SeparacionPdf({ data }: { data: SeparacionPdfData }) {
    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* Title */}
                <Text style={s.title}>CONSTANCIA DE SEPARACIÓN</Text>

                {/* Fecha / Ejecutivo */}
                <View style={s.headerTable}>
                    <View style={s.headerRow}>
                        <Text style={s.headerCellBorder}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>FECHA: </Text>
                            {data.fecha}
                        </Text>
                        <Text style={s.headerCell}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>ASESOR INMOBILIARIO: </Text>
                            {data.ejecutivo}
                        </Text>
                    </View>
                </View>

                {/* ── DATOS DEL ADQUIRENTE ── */}
                <Text style={s.sectionHead}>DATOS DEL ADQUIRENTE:</Text>
                <View style={s.table}>
                    {[
                        ['Nombre Completo', data.nombre],
                        ['DNI',             data.dni],
                        ['EMAIL',           data.email],
                        ['Estado Civil',    data.estadoCivil],
                        ['Domicilio',       data.domicilio],
                    ].map(([label, value], i, arr) => (
                        <View key={label} style={i === arr.length - 1 ? s.rowLast : s.row}>
                            <Text style={s.cellLabel}>{label}</Text>
                            <Text style={s.cellValue}>{value}</Text>
                        </View>
                    ))}
                    <View style={s.rowLast}>
                        <Text style={s.cellLabel}>Teléfono</Text>
                        <Text style={s.cellValue}>{data.telefono}</Text>
                    </View>
                </View>

                {/* ── DATOS DEL TERRENO RESERVADO ── */}
                <Text style={s.sectionHead}>DATOS DEL TERRENO RESERVADO:</Text>
                <View style={s.table}>
                    <View style={s.row}>
                        <Text style={s.cellLabel}>Área del predio:</Text>
                        <Text style={s.cellValue}>{data.area} m2</Text>
                    </View>
                    <View style={s.rowLast}>
                        <Text style={s.cellLabel}>Etapa / Mz. / Lote:</Text>
                        <Text style={s.cellValue}>
                            Nápoles I Etapa - Mz. {data.manzana} Lt. {data.loteNumero}
                        </Text>
                    </View>
                </View>

                {/* ── PRECIO TOTAL DEL TERRENO ── */}
                <Text style={s.sectionHeadUnderOnly}>PRECIO TOTAL DEL TERRENO:</Text>
                <View style={s.table}>
                    <View style={s.row}>
                        <Text style={s.cellLabel}>Precio al Contado:</Text>
                        <Text style={s.cellValue}>{fmtSol(data.precioFinal)}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.cellLabel}>Precio a Crédito:</Text>
                        <Text style={s.cellValue}>{fmtSol(data.precioFinal)}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.cellLabel}>Cuota Inicial:</Text>
                        <Text style={s.cellValue}>{fmtSol(data.montoSeparacion)}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.cellLabel}>Descuento</Text>
                        <Text style={s.cellValue}>—</Text>
                    </View>
                    <View style={s.rowLast}>
                        <Text style={s.cellLabel}>Fecha de firma:</Text>
                        <Text style={s.cellValue}>{data.fechaFirma}</Text>
                    </View>
                </View>

                {/* ── TERMINOS Y CONDICIONES ── */}
                <Text style={s.sectionHead}>TERMINOS Y CONDICIONES:</Text>

                <Text style={s.para}>
                    El reservante abonará{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>S/. {data.montoSeparacion.toFixed(2)} </Text>
                    soles como concepto de reserva y declara poseer dinero de origen lícito.
                </Text>

                <Text style={s.para}>
                    Este documento será válido para la separación de un lote de terreno en{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>NÁPOLES CONDOMINIO CLUB</Text>
                    , no siendo aplicable a ningún otro tipo de transacción o proyecto.
                </Text>

                <Text style={s.para}>
                    El transferente emitirá un recibo provisional para canjear la boleta de venta cuando
                    el adquirente haya tomado la decisión de comprar el terreno reservado.
                </Text>

                <Text style={s.para}>
                    En caso el adquirente desista de formalizar el contrato después de haber efectuado
                    la separación de lote de terreno, dicha separación quedará sin efecto e
                    inmediatamente el lote volverá al estatus de disponible para la venta, quedando la
                    suma entregada por concepto de reserva a favor de{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>TERRENOPOLIS S.A.C</Text>
                    , en calidad de gastos administrativos (visita, movilidad, oportunidad de venta a
                    otro cliente, publicidad, etc), por lo tanto, no será devuelto al cliente.
                </Text>

                {/* ── NOTA ── */}
                <Text style={s.sectionHead}>NOTA:</Text>

                <Text style={s.para}>
                    Los trámites de formalización son personales, en la oficina principal de{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>TERRENOPOLIS S.A.C</Text>
                </Text>

                <Text style={s.para}>
                    Además de la presente constancia, deberá adjuntar DNI original (si en caso es
                    casado(a) también deberá presentarse su cónyuge portando su DNI original).
                </Text>

                {/* ── Firmas ── */}
                <View style={s.sigRow}>
                    {/* Empresa */}
                    <View style={s.sigBlock}>
                        <Image style={s.sigLogo} src={data.logoPath} />
                        <View style={s.sigLine} />
                        <Text style={s.sigLabel}>TERRENOPOLIS S.A.C{'\n'}Representante</Text>
                    </View>

                    {/* Cliente */}
                    <View style={s.sigBlock}>
                        <View style={[s.sigLine, { marginTop: 74 }]} />
                        <Text style={s.sigLabel}>{data.nombre}{'\n'}Adquirente</Text>
                    </View>
                </View>

            </Page>
        </Document>
    )
}
