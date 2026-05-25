'use client'

import React from 'react'
import { FileText, Save, RotateCcw } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

const DEFAULT_TEMPLATE = `CONSTE POR EL PRESENTE INSTRUMENTO, QUE SE SUSCRIBE EN DOS EJEMPLARES DE IGUAL VALOR, EL PRESENTE CONTRATO QUE CELEBRAN:

COMO EL VENDEDOR: {{NOMBRE_VENDEDOR}}, con domicilio en la ciudad de Trujillo, La Libertad, Perú; en adelante denominada LA VENDEDORA.

COMO EL COMPRADOR: {{NOMBRE_COMPRADOR}}, identificado con DNI N° {{DNI_COMPRADOR}}, con domicilio en {{DOMICILIO_COMPRADOR}}, teléfono {{TELEFONO_COMPRADOR}}, correo electrónico {{EMAIL_COMPRADOR}}; en adelante denominado EL COMPRADOR.

I. DEL OBJETO DEL CONTRATO
El presente contrato tiene por objeto la {{TIPO_OPERACION}} del siguiente inmueble de bien futuro:
- Código de Lote: {{CODIGO_LOTE}}
- Manzana: {{MANZANA}}
- Lote N°: {{NUMERO_LOTE}}
- Área: {{AREA}} m²
- Proyecto: {{NOMBRE_PROYECTO}}

II. DEL PRECIO
Las partes acuerdan que el precio total del lote asciende a la suma de {{PRECIO_TOTAL}}, pagadero de la siguiente manera:
a) Cuota Inicial: {{INICIAL}} al momento de la firma del presente contrato.
b) Saldo: {{SALDO}} dividido en {{NUM_CUOTAS}} cuotas mensuales.

III. OBLIGACIONES DE LAS PARTES
Del Vendedor: LA VENDEDORA se compromete a entregar el lote libre de cargas, gravámenes e hipotecas una vez cumplidas todas las obligaciones de pago.
Del Comprador: EL COMPRADOR se compromete a realizar los pagos acordados en los plazos establecidos.

IV. RESOLUCIÓN DE CONTROVERSIAS
Cualquier controversia derivada del presente contrato será sometida a los juzgados y tribunales del distrito judicial de La Libertad.

V. DECLARACIONES FINALES
Ambas partes declaran haber leído y entendido el presente documento en su totalidad, estando de acuerdo con su contenido y firmando en señal de conformidad.

Trujillo, {{FECHA}}
`

const STORAGE_KEY = 'mattika_contract_template'

export default function PlantillasPage() {
    const [content, setContent] = React.useState('')
    const [saved, setSaved] = React.useState(false)

    React.useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        setContent(stored || DEFAULT_TEMPLATE)
    }, [])

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, content)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = () => {
        if (confirm('¿Restaurar la plantilla por defecto? Se perderán tus cambios.')) {
            setContent(DEFAULT_TEMPLATE)
            localStorage.removeItem(STORAGE_KEY)
        }
    }

    const VARS = [
        '{{NOMBRE_VENDEDOR}}', '{{NOMBRE_COMPRADOR}}', '{{DNI_COMPRADOR}}',
        '{{DOMICILIO_COMPRADOR}}', '{{TELEFONO_COMPRADOR}}', '{{EMAIL_COMPRADOR}}',
        '{{TIPO_OPERACION}}', '{{CODIGO_LOTE}}', '{{MANZANA}}', '{{NUMERO_LOTE}}',
        '{{AREA}}', '{{NOMBRE_PROYECTO}}', '{{PRECIO_TOTAL}}', '{{INICIAL}}',
        '{{SALDO}}', '{{NUM_CUOTAS}}', '{{FECHA}}',
    ]

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 px-4 md:pr-6 min-h-screen pb-20 md:pb-8">
                <header className="h-14 sticky top-0 z-30 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <FileText className="w-4 h-4" />
                        <span>Plantillas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-white border border-white/8 rounded-lg transition-colors">
                            <RotateCcw className="w-3 h-3" /> Restaurar
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-100 rounded-lg transition-colors">
                            <Save className="w-3 h-3" /> {saved ? '¡Guardado!' : 'Guardar'}
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto py-8 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Plantilla de contrato</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Edita el texto base para los contratos generados. Guardado en tu navegador.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Editor */}
                        <div className="md:col-span-2">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full h-[600px] bg-slate-900 border border-white/8 rounded-xl p-4 text-sm text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-white/20 resize-none transition-colors"
                                placeholder="Contenido de la plantilla..."
                            />
                        </div>

                        {/* Variables reference */}
                        <div>
                            <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Variables disponibles</p>
                                <div className="space-y-1.5">
                                    {VARS.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setContent(prev => prev + v)}
                                            className="block w-full text-left px-2 py-1.5 font-mono text-[11px] text-sky-400 hover:bg-white/5 rounded transition-colors"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 mt-3">Haz clic para insertar al final</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
