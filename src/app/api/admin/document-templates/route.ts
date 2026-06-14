import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export interface DocumentTemplate {
    orden: number
    titulo: string
    subtitulo: string
    tipo: 'RESERVA' | 'PRINCIPAL' | 'ANEXO' | 'ADICIONAL'
    cuerpo: string
    editable?: boolean   // false = protegido, no editable desde la UI
}

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
    {
        orden: 1,
        titulo: 'SEPARACIÓN',
        subtitulo: 'Constancia de Separación',
        tipo: 'RESERVA',
        editable: true,
        cuerpo: `Por medio del presente documento, la empresa {empresa.nombre} deja constancia de la separación del inmueble ubicado en el Proyecto "{inmueble.proyecto}", Manzana {inmueble.manzana}, Lote {inmueble.unidad}, con un área de {inmueble.area} m².

DATOS DEL SEPARANTE:
Nombre: {comprador.nombre}
DNI: {comprador.dni}
Estado Civil: {comprador.estadoCivil}
Domicilio: {comprador.domicilio}

CONDICIONES DE SEPARACIÓN:
Monto de separación: S/ {inmueble.separacion}
Precio de venta acordado: S/ {precio}
Fecha: {fecha.hoy}

Esta separación tiene vigencia de 72 horas desde la fecha indicada.

_______________________
Firma del separante`,
    },
    {
        orden: 2,
        titulo: 'CONTRATO DE COMPRAVENTA DE BIEN FUTURO',
        subtitulo: 'Proyecto "{inmueble.proyecto}"',
        tipo: 'PRINCIPAL',
        editable: false,
        cuerpo: `CONTRATO DE COMPRAVENTA DE BIEN FUTURO - PROYECTO "{inmueble.proyecto}"

CONSTE POR EL PRESENTE INSTRUMENTO, QUE SE SUSCRIBE EN DOS EJEMPLARES, EL CONTRATO DE COMPRAVENTA DE BIEN FUTURO QUE CELEBRAN:

COMO EL VENDEDOR:
	{empresa.razonSocial} CON R.U.C {empresa.ruc}, CON DOMICILIO EN {empresa.domicilio}; DEBIDAMENTE REPRESENTADA POR SU GERENTE GENERAL EL SEÑOR {empresa.representante}, IDENTIFICADO CON DNI N°{empresa.representanteDni}; SEGUN PODERES Y NOMBRAMIENTOS INSCRITOS EN LA PARTIDA REGISTRAL N°{empresa.partidaJuridica} DEL REGISTRO DE PERSONAS JURIDICAS DE LA {empresa.oficinaRegistral}.

COMO {comprador.termino}: 
	{{#uno}}{comprador.nombre}{{/uno}}{{#dos}}{comprador.nombreA}{{/dos}}, IDENTIFICADO CON DNI N°{{#uno}}{comprador.dni}{{/uno}}{{#dos}}{comprador.dniA}{{/dos}} CON DOMICILIO {comprador.domicilio}, DE ESTADO CIVIL {comprador.estadoCivil}, DE OCUPACIÓN {comprador.ocupacion}, CON TELÉFONO {comprador.telefono} CON CORREO ELECTRÓNICO {{#uno}}{comprador.email}{{/uno}}{{#dos}}{comprador.emailA}{{/dos}} 
	{{#dos}}{comprador.nombreB}, IDENTIFICADO CON DNI N° {comprador.dniB} CON DOMICILIO {comprador.domicilio}, DE ESTADO CIVIL {comprador.estadoCivil}, DE OCUPACIÓN {comprador.ocupacion}, CON TELÉFONO {comprador.telefono} CON CORREO ELECTRÓNICO {comprador.emailB} {{/dos}}
Y CONDICIONES SIGUIENTES:

ANTECEDENTES:
PRIMERA. – EL VENDEDOR MANIFIESTA Y ACREDITA QUE OBSTENTA LA TITULARIDAD SOBRE EL PREDIO URBANO, UBICADO EN VALLE CHICAMA PREDIO MOCAN SECTOR LA ARENITA U.C. 1900, DISTRITO RAZURI, PROVINCIA ASCOPE, DEPARTAMENTO LA LIBERTAD, EL MISMO QUE OBRA REGISTRADO EN LA PARTIDA ELECTRÓNICA 11550511, DEL REGISTRO DE PREDIOS DE LA SUNARP - SEDE TRUJILLO – OFICINA REGISTRAL TRUJILLO.

SEGUNDA. – SOBRE EL BIEN REFERIDO EN LA CLAUSULA ANTERIOR, EL VENDEDOR VIENE DESARROLLANDO EL PROYECTO INMOBILIARIO DENOMINADO "{inmueble.proyecto}", DONDE SE OBTENDRÁ LOTES DE TERRENO DEBIDAMENTE INDEPENDIZADOS; EN ADELANTE EL PROYECTO. 

TERCERA. – {comprador.termino} HA TENIDO POR BIEN, ELEGIR EL LOTE "{inmueble.unidad}" DE LA MANZANA "{inmueble.manzana}", DETALLADO CON UN ÁREA TOTAL DE {inmueble.area} M2 DENTRO DE LOS PLANOS DE EL PROYECTO. ASIMISMO, {comprador.termino} DECLARA SABER Y ACEPTAR QUE LA EXTENSIÓN SUPERFICIAL Y MEDIDAS PERIMÉTRICAS DE LAS ÁREAS COMUNES QUE PERTENECEN AL CONDOMINIO ESTÁN SUPEDITADAS A LOS REAJUSTES DEFINITIVOS QUE CONSTEN EN EL PLANO DE REPLANTEO, RESULTANTE LUEGO DE LA RECEPCIÓN DE LAS OBRAS DEL PROYECTO. ADEMÁS, RECONOCEN QUE ES FACULTAD DE EL VENDEDOR REALIZAR CUALQUIER TIPO DE MODIFICACIÓN AL PROYECTO CON RESPECTO A LAS ÁREAS COMUNES, CON UNA FINALIDAD DE MEJORA, SIN LIMITACIÓN DE NINGUNA ESPECIE Y SIN NECESIDAD DE CONSULTA PREVIA A {comprador.termino}.

CUARTA. – EL VENDEDOR SE COMPROMETE Y RESPONSABILIZA SOBRE EL DESARROLLO DEL PROYECTO "{inmueble.proyecto}" EN CADA UNA DE SUS ETAPAS, CONTANDO CON LA ENTREGA FINAL DEL PROYECTO CON LAS SIGUIENTES CARACTERÍSTICAS:

A.  ENTREGA DEL LOTE DE TERRENO CON TITULO INDEPENDIZADO (PREDIO URBANO).
B.  PÓRTICO DE INGRESO, CERCO PERIMÉTRICO, VIAS AFIRMADAS, CANCHA DE FUTBOL, CANCHA DE FRONTON, PARQUES RECREATIVOS, PISCINA,ZONA DE FOGATA,JUEGOS PARA NIÑOS Y GIMNASIO AL AIRE LIBRE.
C. PUNTO DE AGUA EN CADA LOTE, AGUA QUE SERÁ CAPTADA DE UN POZO TUBULAR DE 25 MTS DE PROFUNDIDAD Y ALMACENADA EN UN RESERVORIO ELEVADO PARA SER DISTRIBUIDO A TRAVES DE TUBERIAS MATRICES Y DOMICILIARIAS.
D.  ALUMBRADO PÚBLICO POR MEDIO DE PANELES SOLARES Y CERTIFICADO DE FACTIBILIDAD ELECTRICA PARA LA MATRIZ DE LUZ EN EL PORTICO DE INGRESO.

QUINTA. – POR MEDIO DEL PRESENTE CONTRATO, EL VENDEDOR TRANSFIERE A FAVOR DE {comprador.termino} EL LOTE DESCRITO EN LA CLÁUSULA TERCERA DE ESTE PRESENTE DOCUMENTO POR EL PRECIO DE VENTA PACTADO, DE MUTUO Y COMÚN ACUERDO DE S/ {precio} ({precioLetras} ). LOS CUALES SERÁN CANCELADOS, CONFORME AL SIGUIENTE DETALLE:
-  UNA CANTIDAD DE S/{inicial} ({inicialLetras}  ) POR CONCEPTO DE INICIAL, REALIZADO MEDIANTE EL DEPÓSITO A LA CUENTA CORRIENTE DEL BANCO {banco} N.º{cuenta}  A NOMBRE DE {empresa.razonSocial}.  CON NÚMERO DE OPERACIÓN {operacion}.

Y EL MONTO RESTANTE DE S/{saldo} ({saldoLetras}  ), {comprador.termino} DECLARA Y ESTABLECE QUE SERÁ CANCELADOS TENIENDO COMO FECHA DE PAGO CONSIDERANDO EL SIGUIENTE CRONOGRAMA:


N° CUOTAS	MONTO A DEPOSITAR	FECHAS DE PAGO
1	S/{cuota1.monto}	{cuota1.fecha}
2	S/{cuota2.monto}	{cuota2.fecha}

- EN LA SITUACIÓN DESAFORTUNADA QUE {comprador.termino} NO PUEDE REALIZAR EL PAGO EN LAS FECHAS ANTES MENCIONADAS, SE LE BRINDARÁ UN PLAZO DE 5 DÍAS HÁBILES PARA QUE REGULARICE EL PAGO SOBRE LA CUOTA ESTABLECIDA. DESPUÉS DEL PLAZO MENCIONADO TENDRÁ UN INTERÉS POR DÍA DE {penalidad} SOLES Y DE NO PONERSE AL DÍA EN 3 MESES CONSECUTIVOS, EL VENDEDOR PODRÁ DAR POR RESUELTO EL CONTRATO DE PLENO DERECHO, BASTANDO PARA TAL EFECTO LA COMUNICACIÓN DIRIGIDA A {comprador.termino} POR CONDUCTO NOTARIAL, DE ACUERDO A LO ESTABLECIDO POR EL ARTÍCULO 1430º DEL CÓDIGO CIVIL. ADEMÁS, QUEDA ENTENDIDO QUE ESTA OPCIÓN PODRÁ SER EJERCITADA POR EL VENDEDOR SIN IMPORTAR EL MONTO DEL PRECIO QUE SE HUBIERA CANCELADO, QUEDANDO EL CONTRATO RESUELTO DE PLENO DERECHO SIN NECESIDAD DE PRONUNCIAMIENTO JUDICIAL O ARBITRAL DE NINGUNA ESPECIE. TAMBIÉN, HA DE MENCIONARSE QUE, SI EL VENDEDOR OPTASE POR LA RESOLUCIÓN AUTOMÁTICA DEL CONTRATO, ÉSTA PODRÁ RETENER PARA SÍ EL EQUIVALENTE AL {lucroCesante}% DEL PRECIO DE VENTA POR CONCEPTO DE LUCRO CESANTE, DEVOLVIENDO A {comprador.termino} EL REMANENTE DE LA SUMA QUE HUBIERA PAGADO HASTA LA FECHA, PREVIA DEDUCCIÓN DE LOS GASTOS ADMINISTRATIVOS Y COMISIONES ORIGINADOS POR LA VENTA.
-     POR CADA PAGO MENSUAL CORRESPONDIENTE A LAS CUOTAS PACTADAS EN EL PRESENTE   CONTRATO, SE LE ENVIARÁ AL COMPRADOR LA BOLETA DE SU PAGO RESPECTIVO, A TRAVÉS DEL MEDIO PREVIAMENTE ACORDADO ENTRE LAS PARTES

-	LUEGO DE LA FIRMA DEL PRESENTE CONTRATO, EL ASESOR DESIGNADO POR LA PARTE VENDEDORA ESTARÁ A CARGO DE REALIZAR LA GESTIÓN DE POST VENTA, DEBIENDO INFORMAR AL COMPRADOR DE MANERA PERIÓDICA Y OPORTUNA SOBRE TODOS LOS AVANCES DE LA OBRA, HASTA LA FINALIZACIÓN DEL PROYECTO. 

SEXTA. – EN CASO QUE EL BIEN SE ENCUENTRE DENTRO DE UN RÉGIMEN DE UNIDADES INMOBILIARIAS DE PROPIEDAD EXCLUSIVA Y PROPIEDAD COMÚN, LA VENTA COMPRENDE EL ÁREA SEÑALADA COMO PROPIEDAD EXCLUSIVA Y EL PORCENTAJE DE PARTICIPACIÓN QUE LE CORRESPONDE SOBRE LAS ÁREAS Y BIENES COMUNES SEGÚN SE ESTIPULA EN EL REGLAMENTO INTERNO. ADEMÁS, LA VENTA DEL BIEN SE EFECTÚA EN AD CORPUS Y COMPRENDE LA FÁBRICA CORRESPONDIENTE, SUS ÁREAS, AIRES, USOS, COSTUMBRES, SERVIDUMBRES, ENTRADAS, SALIDAS Y EN GENERAL, TODO AQUELLO QUE DE HECHO O POR DERECHO PUDIERE CORRESPONDER AL BIEN ENAJENADO, SIN RESERVA NI LIMITACIÓN ALGUNA.

SÉPTIMA. – LAS PARTES CONTRATANTES CONVIENEN EXPRESAMENTE QUE LA COMPRA VENTA MATERIA DEL PRESENTE, SE EFECTÚA DENTRO DE LOS ALCANCES DEL ARTÍCULO 1583º DEL CÓDIGO CIVIL. POR LO QUE, {comprador.termino} ADQUIERE EL DERECHO DE PROPIEDAD DEL INMUEBLE SÓLO CUANDO HAYA PAGADO EL ÍNTEGRO DEL PRECIO PACTADO O EN EL MOMENTO EN EL CUAL EL VENDEDOR RENUNCIE POR ESCRITO Y EXPRESAMENTE AL PACTO DE RESERVA DE DOMINIO, LO QUE OCURRA PRIMERO.

OCTAVA. – {comprador.termino}, EN TANTO EXISTA LA RESERVA DE DOMINIO ANTES DETALLADA, NO PODRÁN TRANSFERIR ESTE CONTRATO Y POR LO TANTO DISPONER O GRAVAR DERECHOS SOBRE EL INMUEBLE DESCRITO EN LA CLÁUSULA TERCERA, SIN AUTORIZACIÓN ESCRITA DE EL VENDEDOR.

NOVENA. – EL VENDEDOR DECLARA QUE, SOBRE EL INMUEBLE QUE SE ENAJENA, NO EXISTE MEDIDA JUDICIAL O EXTRAJUDICIAL ALGUNA QUE RESTRINJA O LIMITE SU LIBRE DISPOSICIÓN, OBLIGÁNDOSE NO OBSTANTE ESTA DECLARACIÓN AL SANEAMIENTO POR EVICCIÓN DE ACUERDO A LEY.

DÉCIMA. – QUEDA EXPRESAMENTE ENTENDIDO QUE ESTÁN EXCEPTUADAS DE ESTA VENTA LAS OBRAS PERTINENTES DE ELECTRIFICACIÓN, AGUA POTABLE Y ALCANTARILLADO, PISTAS Y VEREDAS POR LO QUE ESTÁN EXCLUIDAS DE ESTE CONTRATO. EN TAL SENTIDO {comprador.termino} DEJAN EXPRESA CONSTANCIA QUE NO LE CORRESPONDE NADA POR DICHOS CONCEPTOS, SIENDO CUALQUIER REEMBOLSO POR DICHOS CONCEPTOS DE PROPIEDAD EXCLUSIVA DE EL VENDEDOR. TAMBIÉN, {comprador.termino} DECLARA CONOCER QUE EL VENDEDOR NO ESTÁ OBLIGADO A EJECUTAR LAS OBRAS DE REDES TELEFÓNICAS NI INTERNET.

DÉCIMO PRIMERA. – EL VENDEDOR ENTREGARÁ EL INMUEBLE MATERIA DE VENTA EN LA FECHA {plazoEntrega}, MÁXIMO PARA EL DESARROLLO DEL PROYECTO. ESTE PLAZO ES EL PRIMIGENIAMENTE ESTIPULADO, EL MISMO QUE PODRÁ VARIAR SI OCURRIESE SITUACIONES DE CASO FORTUITO O FUERZA MAYOR, LO QUE SE LE COMUNICARÁ OPORTUNAMENTE A {comprador.termino}, ESTO SEGÚN LO ESTABLECIDO EN EL ARTÍCULO 1315 DEL CÓDIGO CIVIL QUE SEÑALA "CASO FORTUITO O FUERZA MAYOR ES LA CAUSA NO IMPUTABLE, CONSISTENTE EN UN EVENTO EXTRAORDINARIO, IMPREVISIBLE E IRRESISTIBLE, QUE IMPIDE LA EJECUCIÓN DE LA OBLIGACIÓN O DETERMINA SU CUMPLIMIENTO PARCIAL, TARDÍO O DEFECTUOSO".

DÉCIMO SEGUNDA. – EL PRESENTE CONTRATO QUEDA SUJETO A LA CONDICIÓN SUSPENSIVA DE QUE EL BIEN LLEGUE A TENER EXISTENCIA, EN APLICACIÓN DEL ARTÍCULO 1534 DEL CÓDIGO CIVIL. NO OBSTANTE, LAS PARTES ACUERDAN QUE LA CONDICIÓN SE ENTENDERÁ CUMPLIDA CUANDO SE ENCUENTRE INSCRITA LA DECLARATORIA DE FÁBRICA, LA INDEPENDIZACIÓN Y EL REGLAMENTO INTERNO, LO QUE OCURRA PRIMERO RESPECTO DEL BIEN OBJETO DE VENTA, EN EL REGISTRO CORRESPONDIENTE, FECHA EN LA CUAL EL PRESENTE CONTRATO SURTIRÁ PLENOS EFECTOS.

DÉCIMO TERCERA. – EN CASO DE INCUMPLIMIENTO DE CONTRATO POR PARTE DE EL VENDEDOR EN LA ENTREGA DEL PROYECTO TERMINADO Y DENTRO DEL PLAZO CORRESPONDIENTE, {comprador.termino} PODRÁ A SU ELECCIÓN, EJERCER CUALESQUIERA DE LOS SIGUIENTES DERECHOS DE MANERA ALTERNATIVA:

A. RESOLVER EL CONTRATO CONFORME A LEY. ASIMISMO, EL VENDEDOR DEBERÁ DEVOLVER EN UN PLAZO NO MAYOR DE 30 (TREINTA) DÍAS ÚTILES DE CURSADA LA COMUNICACIÓN DE FECHA CIERTA QUE DA POR RESUELTO EL CONTRATO, EL PRECIO QUE {comprador.termino} HUBIERA PAGADO HASTA ESA FECHA. ASÍ COMO, REEMBOLSAR EL COSTO DE TODOS LOS GASTOS EN QUE HUBIERA INCURRIDO A {comprador.termino} POR LA TRANSFERENCIA DEL BIEN OBJETO DE VENTA Y/O POR LA NO ENTREGA OPORTUNA DEL BIEN.

B. EXIGIR A EL VENDEDOR LA ENTREGA DEL INMUEBLE, DE ACUERDO A LAS CONDICIONES PACTADAS.

DÉCIMO CUARTA. – A EFECTOS DE LA RELACIÓN INTERNA ENTRE CONTRATANTES, SON DE CARGO DE EL VENDEDOR LOS TRIBUTOS QUE SE HUBIERAN DEVENGADO Y ACOTADO HASTA LA FECHA DE LA ENTREGA FÍSICA DEL LOTE A {comprador.termino}, SIENDO DE CUENTA Y CARGO DE {comprador.termino} TODOS LOS TRIBUTOS QUE SE DEVENGUEN DESDE ESTA FECHA EN ADELANTE.

DÉCIMO QUINTA. – CORRESPONDE A {comprador.termino} EL PAGO DEL IMPUESTO DE ALCABALA SI ÉSTE FUERE APLICABLE A LA PRESENTE TRANSFERENCIA SEGÚN LO PREVISTO POR EL D. LEG. 776 Y SUS NORMAS MODIFICATORIAS. ADEMÁS DE LOS TRIBUTOS Y GASTOS POSTERIORES QUE ORIGINE EL PRESENTE CONTRATO COMO LA MINUTA Y ESCRITURA PÚBLICA, INCLUYENDO UNA COPIA SIMPLE DE LA ESCRITURA DE COMPRAVENTA. 

DÉCIMO SEXTA. – {comprador.termino} ES CONSCIENTE Y ES DE SU RESPONSABILIDAD EL COSTO DE INSTALACIÓN DE LAS CONEXIONES DOMICILIARIAS DE SERVICIOS DE AGUA Y ENERGÍA ELÉCTRICA, ASÍ COMO LAS INSTALACIONES DE LOS MEDIDORES CORRESPONDIENTES.

DÉCIMO SÉPTIMA. – LAS PARTES CONTRATANTES DECLARAN QUE CUALQUIER MODIFICACIÓN FUTURA DE LA OBRA DE URBANIZACIÓN, DESPUÉS DE QUE HAYA SIDO RECIBIDA POR LA AUTORIDAD COMPETENTE SERÁ DE CARGO DE {comprador.termino}.

DÉCIMO OCTAVA. – AMBAS PARTES RENUNCIAN AL FUERO DE SUS DOMICILIOS Y SE SOMETEN EXPRESAMENTE A LA JURISDICCIÓN DE LOS JUECES Y TRIBUNALES DE TRUJILLO PARA TODO LO QUE SE RELACIONE CON LA INTERPRETACIÓN, CUMPLIMIENTO, EJECUCIÓN U CUALQUIER DIVERGENCIA O CONFLICTO DERIVADOS DEL PRESENTE CONTRATO. SEÑALANDO COMO SUS DOMICILIOS LOS QUE APARECEN EN LA INTRODUCCIÓN DEL PRESENTE DOCUMENTO, POR LO QUE SE TENDRÁN POR BIEN HECHAS LAS NOTIFICACIONES Y/O COMUNICACIONES QUE SE EFECTÚEN EN DICHO DOMICILIO SI NO FUERA COMUNICADO POR ESCRITO EL CAMBIO DEL MISMO.

DÉCIMO NOVENA. – SI EN CASO {comprador.termino} DECIDA CAMBIAR DE DIRECCIÓN DE DOMICILIO, DEBERÁ HABERLO COMUNICADO POR ESCRITO CURSADO POR CONDUCTO NOTARIAL A EL VENDEDOR.

VIGÉSIMA. – {comprador.termino} EN ESTE ACTO Y CON ARREGLO A LA LEGISLACIÓN PERUANA DE PREVENCIÓN DE LAVADO DE ACTIVOS Y FINANCIAMIENTO DEL TERRORISMO DECLARA BAJO JURAMENTO:

A.  QUE ADQUIEREN PARA SÍ Y ES EL BENEFICIARIO FINAL DEL BIEN INMUEBLE QUE ADQUIERE EN VIRTUD DEL PRESENTE INSTRUMENTO.

B.  QUE LAS SUMAS DE DINERO QUE UTILIZA PARA LA ADQUISICIÓN DEL INMUEBLE QUE MEDIANTE ESTE CONTRATO COMPRA TIENEN ORIGEN LEGÍTIMO Y NO ESTÁN VINCULADAS O SON DERIVADAS DE ACTIVIDADES ILÍCITAS DE NINGUNA ESPECIE.

C.   LA PRESENTE COMPRAVENTA TIENE SU FUNDAMENTO ECONÓMICO EN ACTIVIDADES LÍCITAS Y NO ESTÁ VINCULADA AL LAVADO DE ACTIVOS O CUALQUIER OTRA ACTIVIDAD ILÍCITA.

VIGÉSIMA PRIMERA. – {comprador.termino} DECLARA SABER Y CONOCER QUE:

A.  CONSTITUYE SU OBLIGACIÓN PRACTICAR LA DECLARACIÓN JURADA DE ADQUISICIÓN DEL INMUEBLE (CARGO) MEDIANTE EL PRESENTE INSTRUMENTO DE COMPRA ANTE LA MUNICIPALIDAD DISTRITAL DE LA JURISDICCIÓN DONDE SE ENCUENTRA UBICADO ÉSTE, DENTRO DEL MES SIGUIENTE DE HABER ADQURIDO LA TITULARIDAD DEL BIEN.

B.  ES DE SU CUENTA, CARGO Y RESPONSABILIDAD EL PAGO DEL IMPUESTO DE ALCABALA, DEBIENDO PRACTICAR LA DECLARACIÓN Y PAGO DE DICHO TRIBUTO DENTRO DEL MES SIGUIENTE DE HABER ADQUIRIDO LA TITULARIDAD DEL BIEN.


                                                              {lugar}, {fechaLarga}


{empresa.razonSocial}              {{#uno}}{comprador.nombre}{{/uno}}{{#dos}}{comprador.nombreA}{{/dos}}
GERENTE                            DNI N°{{#uno}}{comprador.dni}{{/uno}}{{#dos}}{comprador.dniA}{{/dos}}
{empresa.representante}            ({comprador.termino})
DNI N°{empresa.representanteDni}		
(EL VENDEDOR)		


{{#dos}}{comprador.nombreB}
DNI N° {comprador.dniB}  
({comprador.termino}){{/dos}}`,
    },
    {
        orden: 3,
        titulo: 'CRONOGRAMA DE PAGOS',
        subtitulo: 'Anexo al Contrato de Compraventa',
        tipo: 'ANEXO',
        editable: true,
        cuerpo: `CRONOGRAMA DE PAGOS

Cliente: {comprador.nombre}
DNI: {comprador.dni}
Inmueble: Proyecto "{inmueble.proyecto}" — Mz. {inmueble.manzana}, Lt. {inmueble.unidad}
Precio de venta: S/ {precio}

El detalle de cuotas se adjunta al presente documento según lo pactado en el contrato principal.

{lugar}, {fecha.hoy}`,
    },
    {
        orden: 4,
        titulo: 'ACTA DE SEPARACIÓN',
        subtitulo: 'Documento Adicional',
        tipo: 'ADICIONAL',
        editable: true,
        cuerpo: `ACTA DE SEPARACIÓN

En la ciudad de {lugar}, a {fechaLarga}, el señor/señora {comprador.nombre}, identificado con DNI {comprador.dni}, declara haber realizado la separación del lote Mz. {inmueble.manzana}, Lt. {inmueble.unidad} del Proyecto "{inmueble.proyecto}", por el monto de S/ {inmueble.separacion}.

_______________________
Firma`,
    },
    {
        orden: 5,
        titulo: 'TRATAMIENTO DE DATOS PERSONALES',
        subtitulo: 'Anexo de Privacidad',
        tipo: 'ANEXO',
        editable: true,
        cuerpo: `AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES

Yo, {comprador.nombre}, identificado con DNI N° {comprador.dni}, autorizo a {empresa.razonSocial} a tratar mis datos personales para los fines relacionados con la adquisición del inmueble en el Proyecto "{inmueble.proyecto}".

Esta autorización se otorga en cumplimiento de la Ley N° 29733, Ley de Protección de Datos Personales.

{lugar}, {fechaLarga}

_______________________
Firma del titular`,
    },
    {
        orden: 6,
        titulo: 'DECLARACIÓN JURADA DE DOMICILIO Y ESTADO CIVIL',
        subtitulo: 'Anexo Declaratorio',
        tipo: 'ANEXO',
        editable: true,
        cuerpo: `DECLARACIÓN JURADA

Yo, {comprador.nombre}, identificado con DNI N° {comprador.dni}, declaro bajo juramento que:

1. Mi domicilio actual es: {comprador.domicilio}
2. Mi estado civil es: {comprador.estadoCivil}

Declaro que la información proporcionada es verídica y asumo las responsabilidades legales que pudieran derivarse de una declaración falsa.

{lugar}, {fechaLarga}

_______________________
Firma del declarante
DNI: {comprador.dni}`,
    },
]

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const user = session.user as { tenantId?: string }
        if (!user.tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })

        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { documentTemplates: true },
        })

        const stored = tenant?.documentTemplates as DocumentTemplate[] | null

        // Si hay templates en DB, respetar editable=false desde los defaults
        let templates: DocumentTemplate[]
        if (stored && Array.isArray(stored) && stored.length > 0) {
            // Proteger plantillas marcadas como no editables en defaults
            templates = stored.map((t) => {
                const def = DEFAULT_TEMPLATES.find(d => d.orden === t.orden)
                if (def?.editable === false) return { ...def }  // siempre usar el default protegido
                return t
            })
        } else {
            templates = DEFAULT_TEMPLATES
        }

        return NextResponse.json({ ok: true, templates })
    } catch (error) {
        console.error('GET document-templates:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const user = session.user as { tenantId?: string; role?: string }
        if (!user.tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })
        if (!['ADMIN', 'SUPERADMIN'].includes(user.role ?? '')) {
            return NextResponse.json({ error: 'Solo administradores pueden editar plantillas' }, { status: 403 })
        }

        const body = await req.json()
        const incoming: DocumentTemplate[] = body.templates
        if (!Array.isArray(incoming)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })

        // Sustituir las plantillas protegidas con el default — nunca se guardan cambios sobre ellas
        const merged = incoming.map((t) => {
            const def = DEFAULT_TEMPLATES.find(d => d.orden === t.orden)
            if (def?.editable === false) return def
            return t
        })

        await prisma.tenant.update({
            where: { id: user.tenantId },
            data: { documentTemplates: merged as unknown as import('@prisma/client').Prisma.InputJsonValue },
        })

        return NextResponse.json({ ok: true, message: 'Plantillas guardadas' })
    } catch (error) {
        console.error('PUT document-templates:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
