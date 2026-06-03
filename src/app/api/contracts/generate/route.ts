import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { generateQuotationCode } from '@/lib/auth'
import {
    Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
    Table, TableRow, TableCell, WidthType, ShadingType, HeadingLevel
} from 'docx'

function formatCurrency(n: number) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(n)
}

function formatDate(d: Date) {
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima' })
}

function boldRun(text: string) {
    return new TextRun({ text, bold: true, font: 'Arial', size: 22 })
}
function normalRun(text: string) {
    return new TextRun({ text, font: 'Arial', size: 22 })
}

function sectionPara(text: string) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, font: 'Arial', size: 22 })],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2C3E50', space: 1 } }
    })
}

function bodyPara(children: TextRun[], align?: typeof AlignmentType[keyof typeof AlignmentType]) {
    return new Paragraph({
        children,
        alignment: align ?? AlignmentType.JUSTIFIED,
        spacing: { before: 100, after: 100 },
    })
}

function buildContractDoc(data: {
    tipo: 'SEPARACION' | 'COMPRAVENTA'
    codigo: string
    projectName: string
    tenantName: string
    clienteNombreCompleto: string
    clienteDni: string
    clienteDomicilio: string
    clientePhone: string
    clienteEmail: string
    lotCode: string
    manzana: string
    loteNumero: number
    areaM2: number
    precioTotal: number
    montoSeparacion?: number
    inicial?: number
    cuotas?: number
    cuotaMensual?: number
    cronograma?: Array<{ numero: number; fecha: string; monto: number }>
    fecha: string
}) {
    const esSeparacion = data.tipo === 'SEPARACION'
    const titulo = esSeparacion
        ? `MINUTA DE SEPARACIÓN`
        : `CONTRATO DE COMPRAVENTA DE BIEN FUTURO`
    const subtitulo = `PROYECTO "${data.projectName.toUpperCase()}"`

    const children: (Paragraph | Table)[] = [
        // Title
        new Paragraph({
            children: [new TextRun({ text: titulo, bold: true, font: 'Arial', size: 32, color: '1A252F' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [new TextRun({ text: subtitulo, bold: true, font: 'Arial', size: 24, color: '2C3E50' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [new TextRun({ text: `Código: ${data.codigo}`, font: 'Arial', size: 20, color: '7F8C8D' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
        }),

        // Intro
        bodyPara([
            normalRun(`CONSTE POR EL PRESENTE INSTRUMENTO, QUE SE SUSCRIBE EN DOS EJEMPLARES DE IGUAL VALOR, EL PRESENTE ${titulo} QUE CELEBRAN:`),
        ]),

        // Parties
        sectionPara('I. DE LAS PARTES'),

        bodyPara([
            boldRun('COMO EL VENDEDOR: '),
            normalRun(`${data.tenantName.toUpperCase()}, `, ),
            normalRun('con domicilio en la ciudad de Trujillo, La Libertad, Perú; '),
            normalRun('en adelante denominada LA VENDEDORA.'),
        ]),

        bodyPara([
            boldRun('COMO EL COMPRADOR: '),
            normalRun(`${data.clienteNombreCompleto.toUpperCase()}, `),
            normalRun(`identificado con DNI N° ${data.clienteDni}, `),
            normalRun(`con domicilio en ${data.clienteDomicilio || 'no indicado'}, `),
            normalRun(`teléfono ${data.clientePhone || 'no indicado'}, `),
            normalRun(`correo electrónico ${data.clienteEmail}; `),
            normalRun('en adelante denominado EL COMPRADOR.'),
        ]),

        // Subject matter
        sectionPara('II. DEL OBJETO DEL CONTRATO'),

        bodyPara([
            normalRun(`El presente contrato tiene por objeto la ${esSeparacion ? 'separación y reserva' : 'compraventa'} del siguiente inmueble de bien futuro:`),
        ]),
    ]

    // Lot table
    const border = { style: BorderStyle.SINGLE, size: 4, color: 'BDC3C7' }
    const borders = { top: border, bottom: border, left: border, right: border }
    const lotRows = [
        ['Código de Lote', data.lotCode],
        ['Manzana', data.manzana],
        ['Lote N°', String(data.loteNumero)],
        ['Área', `${data.areaM2} m²`],
        ['Proyecto', data.projectName],
    ]

    children.push(
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3000, 6360],
            rows: lotRows.map(([label, value]) =>
                new TableRow({
                    children: [
                        new TableCell({
                            borders,
                            width: { size: 3000, type: WidthType.DXA },
                            shading: { fill: 'ECF0F1', type: ShadingType.CLEAR },
                            margins: { top: 80, bottom: 80, left: 120, right: 120 },
                            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 20 })] })]
                        }),
                        new TableCell({
                            borders,
                            width: { size: 6360, type: WidthType.DXA },
                            margins: { top: 80, bottom: 80, left: 120, right: 120 },
                            children: [new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 20 })] })]
                        }),
                    ]
                })
            ),
        })
    )

    children.push(new Paragraph({ children: [], spacing: { before: 200 } }))

    // Financial clauses
    if (esSeparacion) {
        children.push(
            sectionPara('III. DE LA SEPARACIÓN'),
            bodyPara([
                normalRun('EL COMPRADOR abona como monto de separación la suma de '),
                boldRun(`${formatCurrency(data.montoSeparacion ?? 0)}`),
                normalRun(`, el cual será descontado del precio total de venta del lote. `),
                normalRun('Esta separación tiene una vigencia de treinta (30) días calendario contados desde la fecha del presente documento. '),
                normalRun('De no formalizarse el contrato de compraventa dentro de dicho plazo, la separación podrá ser declarada sin efecto por LA VENDEDORA.'),
            ]),
            sectionPara('IV. DEL PRECIO TOTAL'),
            bodyPara([
                normalRun('Las partes acuerdan que el precio total del lote asciende a la suma de '),
                boldRun(`${formatCurrency(data.precioTotal)}`),
                normalRun(' ('),
                normalRun(data.precioTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })),
                normalRun('), suma que incluye el monto de separación ya abonado.'),
            ]),
        )
    } else {
        const cuotaMensual = data.cuotaMensual ?? (data.cuotas && data.inicial
            ? (data.precioTotal - data.inicial) / data.cuotas
            : 0)

        children.push(
            sectionPara('III. DEL PRECIO Y FORMA DE PAGO'),
            bodyPara([
                normalRun('Las partes acuerdan que el precio total del lote asciende a la suma de '),
                boldRun(`${formatCurrency(data.precioTotal)}`),
                normalRun(', pagadero de la siguiente manera:'),
            ]),
            bodyPara([
                boldRun('a) Cuota Inicial: '),
                normalRun(`${formatCurrency(data.inicial ?? 0)} al momento de la firma del presente contrato.`),
            ]),
            bodyPara([
                boldRun('b) Saldo: '),
                normalRun(`${formatCurrency(data.precioTotal - (data.inicial ?? 0))} dividido en ${data.cuotas ?? 0} cuotas mensuales de `),
                boldRun(`${formatCurrency(cuotaMensual)}`),
                normalRun(' cada una.'),
            ]),
        )

        // Payment schedule table
        if (data.cronograma && data.cronograma.length > 0) {
            children.push(
                sectionPara('IV. CRONOGRAMA DE PAGOS'),
                new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1560, 5000, 2800],
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    borders,
                                    width: { size: 1560, type: WidthType.DXA },
                                    shading: { fill: '2C3E50', type: ShadingType.CLEAR },
                                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Cuota', bold: true, font: 'Arial', size: 20, color: 'FFFFFF' })] })]
                                }),
                                new TableCell({
                                    borders,
                                    width: { size: 5000, type: WidthType.DXA },
                                    shading: { fill: '2C3E50', type: ShadingType.CLEAR },
                                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Fecha de Vencimiento', bold: true, font: 'Arial', size: 20, color: 'FFFFFF' })] })]
                                }),
                                new TableCell({
                                    borders,
                                    width: { size: 2800, type: WidthType.DXA },
                                    shading: { fill: '2C3E50', type: ShadingType.CLEAR },
                                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Monto (S/)', bold: true, font: 'Arial', size: 20, color: 'FFFFFF' })] })]
                                }),
                            ]
                        }),
                        ...data.cronograma.map((c, i) =>
                            new TableRow({
                                children: [
                                    new TableCell({
                                        borders,
                                        width: { size: 1560, type: WidthType.DXA },
                                        shading: { fill: i % 2 === 0 ? 'FDFEFE' : 'F2F3F4', type: ShadingType.CLEAR },
                                        margins: { top: 60, bottom: 60, left: 120, right: 120 },
                                        children: [new Paragraph({ children: [new TextRun({ text: String(c.numero).padStart(2, '0'), font: 'Arial', size: 20 })] })]
                                    }),
                                    new TableCell({
                                        borders,
                                        width: { size: 5000, type: WidthType.DXA },
                                        shading: { fill: i % 2 === 0 ? 'FDFEFE' : 'F2F3F4', type: ShadingType.CLEAR },
                                        margins: { top: 60, bottom: 60, left: 120, right: 120 },
                                        children: [new Paragraph({ children: [new TextRun({ text: c.fecha, font: 'Arial', size: 20 })] })]
                                    }),
                                    new TableCell({
                                        borders,
                                        width: { size: 2800, type: WidthType.DXA },
                                        shading: { fill: i % 2 === 0 ? 'FDFEFE' : 'F2F3F4', type: ShadingType.CLEAR },
                                        margins: { top: 60, bottom: 60, left: 120, right: 120 },
                                        children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(c.monto), font: 'Arial', size: 20 })] })]
                                    }),
                                ]
                            })
                        )
                    ],
                })
            )
            children.push(new Paragraph({ children: [], spacing: { before: 200 } }))
        }
    }

    // Obligations
    children.push(
        sectionPara(esSeparacion ? 'V. OBLIGACIONES' : 'V. OBLIGACIONES DE LAS PARTES'),
        bodyPara([boldRun('Del Vendedor: '), normalRun('LA VENDEDORA se compromete a entregar el lote libre de cargas, gravámenes e hipotecas una vez cumplidas todas las obligaciones de pago por parte del COMPRADOR.')]),
        bodyPara([boldRun('Del Comprador: '), normalRun('EL COMPRADOR se compromete a realizar los pagos acordados en los plazos establecidos y a destinar el inmueble a los fines acordados con LA VENDEDORA.')]),

        sectionPara('VI. RESOLUCIÓN DE CONTROVERSIAS'),
        bodyPara([normalRun('Cualquier controversia derivada del presente contrato será sometida a los juzgados y tribunales del distrito judicial de La Libertad, renunciando las partes a cualquier otro fuero o domicilio especial.')]),

        sectionPara('VII. DECLARACIONES FINALES'),
        bodyPara([normalRun('Ambas partes declaran haber leído y entendido el presente documento en su totalidad, estando de acuerdo con su contenido y firmando en señal de conformidad.')]),
    )

    // Signature block
    children.push(
        new Paragraph({ children: [], spacing: { before: 400 } }),
        new Paragraph({
            children: [normalRun(`Trujillo, ${data.fecha}`)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
        }),
        // Signatures table
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4500, 360, 4500],
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                            width: { size: 4500, type: WidthType.DXA },
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new Paragraph({ children: [], spacing: { before: 1440 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: '_'.repeat(40), font: 'Arial', size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                }),
                                new Paragraph({ children: [boldRun(data.tenantName.toUpperCase())], alignment: AlignmentType.CENTER }),
                                new Paragraph({ children: [normalRun('EL VENDEDOR')], alignment: AlignmentType.CENTER }),
                            ]
                        }),
                        new TableCell({
                            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                            width: { size: 360, type: WidthType.DXA },
                            children: [new Paragraph({ children: [] })]
                        }),
                        new TableCell({
                            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                            width: { size: 4500, type: WidthType.DXA },
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new Paragraph({ children: [], spacing: { before: 1440 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: '_'.repeat(40), font: 'Arial', size: 22 })],
                                    alignment: AlignmentType.CENTER,
                                }),
                                new Paragraph({ children: [boldRun(data.clienteNombreCompleto.toUpperCase())], alignment: AlignmentType.CENTER }),
                                new Paragraph({ children: [normalRun(`DNI N° ${data.clienteDni}`)], alignment: AlignmentType.CENTER }),
                                new Paragraph({ children: [normalRun('EL COMPRADOR')], alignment: AlignmentType.CENTER }),
                            ]
                        }),
                    ]
                })
            ]
        })
    )

    return new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 12240, height: 15840 },
                    margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
                }
            },
            children,
        }]
    })
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const userId = (session.user as { id: string }).id

        const body = await request.json()
        const { lotId, quotationId, tipo, clienteData, financialData } = body

        if (!lotId || !tipo || !clienteData) {
            return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 })
        }

        const lot = await prisma.lot.findUnique({
            where: { id: lotId },
            include: { project: { include: { tenant: true } } }
        })

        if (!lot) {
            return NextResponse.json({ success: false, error: 'Lote no encontrado' }, { status: 404 })
        }

        const codigo = generateQuotationCode()
        const fecha = formatDate(new Date())

        // Build DOCX
        const doc = buildContractDoc({
            tipo,
            codigo,
            projectName: lot.project.name,
            tenantName: lot.project.tenant.name,
            clienteNombreCompleto: `${clienteData.nombres} ${clienteData.apellidos}`,
            clienteDni: clienteData.dni,
            clienteDomicilio: clienteData.domicilio || '',
            clientePhone: clienteData.phone || '',
            clienteEmail: clienteData.email || '',
            lotCode: lot.code,
            manzana: lot.manzana,
            loteNumero: lot.loteNumero,
            areaM2: lot.areaM2,
            precioTotal: financialData?.precioTotal ?? lot.precioLista,
            montoSeparacion: financialData?.montoSeparacion,
            inicial: financialData?.inicial,
            cuotas: financialData?.cuotas,
            cuotaMensual: financialData?.cuotaMensual,
            cronograma: financialData?.cronograma,
            fecha,
        })

        const buffer = await Packer.toBuffer(doc)
        const base64 = buffer.toString('base64')

        // Save to DB (without file URL — file is streamed directly)
        const contract = await prisma.contract.create({
            data: {
                codigo,
                tenantId: lot.project.tenantId,
                lotId: lot.id,
                quotationId: quotationId || null,
                userId,
                tipo,
                clienteDni: clienteData.dni,
                clienteNombres: clienteData.nombres,
                clienteApellidos: clienteData.apellidos,
                clienteEmail: clienteData.email || '',
                clientePhone: clienteData.phone || null,
                clienteDomicilio: clienteData.domicilio || null,
                precioTotal: financialData?.precioTotal ?? lot.precioLista,
                montoSeparacion: financialData?.montoSeparacion ?? null,
                inicial: financialData?.inicial ?? null,
                cuotasNum: financialData?.cuotas ?? null,
                datos: financialData?.cronograma ? { cronograma: financialData.cronograma } : undefined,
                docxUrl: null,
            }
        })

        return NextResponse.json({ success: true, contractId: contract.id, codigo, docxBase64: base64 })
    } catch (error) {
        console.error('Error generating contract:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}
