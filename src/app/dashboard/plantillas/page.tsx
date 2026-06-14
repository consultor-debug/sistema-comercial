'use client'

import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Eye, EyeOff, RotateCcw, Save, Loader2, Check, FileText, Layers, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentTemplate {
    orden: number
    titulo: string
    subtitulo: string
    tipo: 'RESERVA' | 'PRINCIPAL' | 'ANEXO' | 'ADICIONAL'
    cuerpo: string
    editable?: boolean   // false = bloque protegido, no editable
}

const TIPO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    RESERVA:   { label: 'Reserva',   bg: 'bg-violet-500/15', text: 'text-violet-400' },
    PRINCIPAL: { label: 'Principal', bg: 'bg-blue-500/15',   text: 'text-blue-400'   },
    ANEXO:     { label: 'Anexo',     bg: 'bg-slate-500/15',  text: 'text-slate-400'  },
    ADICIONAL: { label: 'Adicional', bg: 'bg-amber-500/15',  text: 'text-amber-400'  },
}

// ── Variables disponibles ────────────────────────────────────────────────────
const VARIABLES: { key: string; desc: string }[] = [
    // Empresa
    { key: '{empresa.nombre}',           desc: 'Nombre comercial'            },
    { key: '{empresa.razonSocial}',      desc: 'Razón social'                },
    { key: '{empresa.ruc}',              desc: 'RUC'                         },
    { key: '{empresa.domicilio}',        desc: 'Domicilio fiscal'            },
    { key: '{empresa.representante}',    desc: 'Representante legal'         },
    { key: '{empresa.representanteDni}', desc: 'DNI representante'           },
    { key: '{empresa.partidaJuridica}',  desc: 'Partida registral empresa'   },
    { key: '{empresa.oficinaRegistral}', desc: 'Oficina registral'           },
    // Comprador
    { key: '{comprador.termino}',        desc: 'EL/LOS COMPRADOR(ES)'       },
    { key: '{comprador.nombre}',         desc: 'Nombre comprador A'          },
    { key: '{comprador.dni}',            desc: 'DNI comprador A'             },
    { key: '{comprador.domicilio}',      desc: 'Domicilio comprador'         },
    { key: '{comprador.estadoCivil}',    desc: 'Estado civil'                },
    { key: '{comprador.ocupacion}',      desc: 'Ocupación'                   },
    { key: '{comprador.telefono}',       desc: 'Teléfono'                    },
    { key: '{comprador.email}',          desc: 'Email comprador A'           },
    // Inmueble
    { key: '{inmueble.proyecto}',        desc: 'Nombre del proyecto'         },
    { key: '{inmueble.unidad}',          desc: 'Número de unidad/lote'       },
    { key: '{inmueble.manzana}',         desc: 'Manzana'                     },
    { key: '{inmueble.area}',            desc: 'Área en m²'                  },
    // Precio
    { key: '{precio}',                   desc: 'Precio total (S/)'           },
    { key: '{precioLetras}',             desc: 'Precio en letras'            },
    { key: '{inicial}',                  desc: 'Cuota inicial (S/)'          },
    { key: '{inicialLetras}',            desc: 'Inicial en letras'           },
    { key: '{saldo}',                    desc: 'Saldo a financiar (S/)'      },
    { key: '{saldoLetras}',              desc: 'Saldo en letras'             },
    { key: '{banco}',                    desc: 'Banco destino'               },
    { key: '{cuenta}',                   desc: 'Nro. cuenta'                 },
    { key: '{penalidad}',                desc: 'Penalidad por mora (S/día)'  },
    { key: '{lucroCesante}',             desc: '% lucro cesante'             },
    { key: '{plazoEntrega}',             desc: 'Plazo de entrega'            },
    // Fecha / Lugar
    { key: '{fecha.hoy}',                desc: 'Fecha actual'                },
    { key: '{fechaLarga}',               desc: 'Fecha larga (p.ej. 13 de junio de 2026)' },
    { key: '{lugar}',                    desc: 'Ciudad/lugar'                },
    { key: '{contrato.codigo}',          desc: 'Código del contrato'         },
]

// ── Datos de ejemplo ─────────────────────────────────────────────────────────
const SAMPLE: Record<string, string> = {
    '{empresa.nombre}':           'Lumina Grupo Inmobiliario',
    '{empresa.razonSocial}':      'LUMINA GRUPO INMOBILIARIO S.A.C.',
    '{empresa.ruc}':              '20601234567',
    '{empresa.domicilio}':        'AV. LARCO 1301, MIRAFLORES, LIMA',
    '{empresa.representante}':    'CARLOS ALBERTO MENDOZA RÍOS',
    '{empresa.representanteDni}': '10234567',
    '{empresa.partidaJuridica}':  '14001234',
    '{empresa.oficinaRegistral}': 'OFICINA REGISTRAL DE TRUJILLO',
    '{comprador.termino}':        'EL COMPRADOR',
    '{comprador.nombre}':         'MARÍA ELENA GARCÍA RODRÍGUEZ',
    '{comprador.nombreA}':        'MARÍA ELENA GARCÍA RODRÍGUEZ',
    '{comprador.nombreB}':        'JUAN CARLOS PÉREZ SILVA',
    '{comprador.dni}':            '45678901',
    '{comprador.dniA}':           '45678901',
    '{comprador.dniB}':           '45678902',
    '{comprador.domicilio}':      'AV. BRASIL 1234, JESÚS MARÍA, LIMA',
    '{comprador.estadoCivil}':    'CASADA',
    '{comprador.ocupacion}':      'COMERCIANTE',
    '{comprador.telefono}':       '987654321',
    '{comprador.email}':          'maria@email.com',
    '{comprador.emailA}':         'maria@email.com',
    '{comprador.emailB}':         'juan@email.com',
    '{inmueble.proyecto}':        'VILLA DEL SOL',
    '{inmueble.unidad}':          '12',
    '{inmueble.manzana}':         'A',
    '{inmueble.area}':            '120.00',
    '{precio}':                   '85,000.00',
    '{precioLetras}':             'OCHENTA Y CINCO MIL CON 00/100 SOLES',
    '{inicial}':                  '3,500.00',
    '{inicialLetras}':            'TRES MIL QUINIENTOS CON 00/100 SOLES',
    '{saldo}':                    '81,500.00',
    '{saldoLetras}':              'OCHENTA Y UN MIL QUINIENTOS CON 00/100 SOLES',
    '{banco}':                    'BCP',
    '{cuenta}':                   '194-12345678-0-12',
    '{operacion}':                '00123456',
    '{cuota1.monto}':             '2,263.89',
    '{cuota1.fecha}':             '13/07/2026',
    '{cuota2.monto}':             '2,263.89',
    '{cuota2.fecha}':             '13/08/2026',
    '{penalidad}':                '50',
    '{lucroCesante}':             '20',
    '{plazoEntrega}':             '31/12/2027',
    '{fecha.hoy}':                new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    '{fechaLarga}':               new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{lugar}':                    'LIMA',
    '{contrato.codigo}':          'CCV-2026-0042',
    // legacy aliases
    '{cliente.nombres}':          'MARÍA ELENA',
    '{cliente.apellidos}':        'GARCÍA RODRÍGUEZ',
    '{cliente.dni}':              '45678901',
    '{cliente.estadoCivil}':      'CASADA',
    '{cliente.domicilio}':        'AV. BRASIL 1234, JESÚS MARÍA, LIMA',
    '{inmueble.separacion}':      '3,500.00',
    '{inmueble.precio}':          '85,000.00',
}

// ── Renderer: soporta {var} y {{#flag}}...{{/flag}} ──────────────────────────
function renderTemplate(
    text: string,
    data: Record<string, string> = SAMPLE,
    conditions: Record<string, boolean> = { uno: true, dos: false }
): string {
    // 1. Evaluar bloques condicionales {{#flag}}...{{/flag}}
    let result = text.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, flag: string, content: string) => conditions[flag] ? content : ''
    )
    // 2. Sustituir variables simples {variable}
    for (const [key, val] of Object.entries(data)) {
        result = result.split(key).join(val)
    }
    return result
}

// ── Tarjeta de documento ─────────────────────────────────────────────────────
function DocCard({ template, selected, onClick }: {
    template: DocumentTemplate; selected: boolean; onClick: () => void
}) {
    const cfg = TIPO_CONFIG[template.tipo] ?? TIPO_CONFIG.ANEXO
    const locked = template.editable === false
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-xl border p-4 transition-all duration-150',
                selected
                    ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
                    : 'border-white/8 bg-slate-900 hover:border-white/15 hover:bg-white/[0.02]'
            )}
        >
            <div className="flex items-start gap-3">
                <span className={cn('text-xs font-mono font-bold mt-0.5 shrink-0', selected ? 'text-blue-400' : 'text-slate-600')}>
                    {String(template.orden).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                    <p className={cn('text-xs font-semibold leading-tight line-clamp-2', selected ? 'text-white' : 'text-slate-300')}>
                        {template.titulo}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase', cfg.bg, cfg.text)}>
                            {cfg.label}
                        </span>
                        {locked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-500">
                                <Lock className="w-2.5 h-2.5" /> Protegido
                            </span>
                        )}
                    </div>
                </div>
                {selected && !locked && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
                {selected && locked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />}
            </div>
        </button>
    )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PlantillasPage() {
    const [templates, setTemplates] = React.useState<DocumentTemplate[]>([])
    const [original, setOriginal] = React.useState<DocumentTemplate[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [saved, setSaved] = React.useState(false)
    const [showPreview, setShowPreview] = React.useState(true)
    const [showVars, setShowVars] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Solo cuenta cambios en plantillas editables
    const isDirty = templates.some((t, i) => {
        if (t.editable === false) return false
        return JSON.stringify(t) !== JSON.stringify(original[i])
    })

    React.useEffect(() => {
        fetch('/api/admin/document-templates')
            .then(r => r.json())
            .then(d => {
                if (d.templates) { setTemplates(d.templates); setOriginal(d.templates) }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function handleSave() {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/document-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templates }),
            })
            if (res.ok) {
                setOriginal(templates)
                setSaved(true)
                setTimeout(() => setSaved(false), 2500)
            }
        } finally { setSaving(false) }
    }

    function update(field: keyof DocumentTemplate, value: string) {
        setTemplates(prev => prev.map((t, i) =>
            i === selectedIndex && t.editable !== false ? { ...t, [field]: value } : t
        ))
    }

    function insertVar(key: string) {
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const current = templates[selectedIndex]?.cuerpo ?? ''
        update('cuerpo', current.slice(0, start) + key + current.slice(end))
        requestAnimationFrame(() => {
            if (el) { el.selectionStart = el.selectionEnd = start + key.length; el.focus() }
        })
    }

    const selected = templates[selectedIndex]
    const locked = selected?.editable === false

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Sidebar />
                <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="md:pl-56 min-h-screen flex flex-col pb-10">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-6 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                                <Layers className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold text-white leading-tight">Plantillas de documentos</h1>
                                <p className="text-[11px] text-slate-500 leading-tight flex items-center gap-2">
                                    <span>Paquete Estándar de Venta · {templates.length} documentos por venta</span>
                                    {isDirty && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                            Sin guardar
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowPreview(p => !p)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-colors"
                            >
                                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showPreview ? 'Ocultar previa' : 'Mostrar previa'}
                            </button>
                            {isDirty && (
                                <button
                                    onClick={() => setTemplates(original)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || !isDirty}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                    saved ? 'bg-emerald-600 text-white'
                                        : isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                )}
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                {saved ? 'Guardado' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-5">

                    {/* Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {templates.map((t, i) => (
                            <DocCard key={i} template={t} selected={i === selectedIndex} onClick={() => setSelectedIndex(i)} />
                        ))}
                    </div>

                    {/* Editor + Preview */}
                    {selected && (
                        <div className={cn('grid gap-5', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>

                            {/* Editor */}
                            <div className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">

                                {/* Banner de documento protegido */}
                                {locked && (
                                    <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-800/60 border-b border-white/5">
                                        <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                                        <p className="text-xs text-slate-500">
                                            <span className="font-medium text-slate-400">Documento protegido.</span>
                                            {' '}El contenido de este documento no puede ser modificado.
                                        </p>
                                    </div>
                                )}

                                <div className="p-5 space-y-4">
                                    {/* Tipo */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(['RESERVA', 'PRINCIPAL', 'ANEXO', 'ADICIONAL'] as const).map(tipo => {
                                            const cfg = TIPO_CONFIG[tipo]
                                            const active = selected.tipo === tipo
                                            return (
                                                <button key={tipo} onClick={() => !locked && update('tipo', tipo)} disabled={locked}
                                                    className={cn('px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-colors border',
                                                        active ? cn(cfg.bg, cfg.text, 'border-current/20') : 'bg-transparent text-slate-600 border-white/5',
                                                        !locked && 'hover:text-slate-400 cursor-pointer',
                                                        locked && 'cursor-default'
                                                    )}
                                                >
                                                    {cfg.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Título */}
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Título del documento</label>
                                        <input
                                            value={selected.titulo}
                                            onChange={e => update('titulo', e.target.value)}
                                            readOnly={locked}
                                            className={cn(
                                                'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-medium',
                                                locked ? 'opacity-60 cursor-default select-none' : 'focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20'
                                            )}
                                        />
                                    </div>

                                    {/* Subtítulo */}
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Subtítulo</label>
                                        <input
                                            value={selected.subtitulo}
                                            onChange={e => update('subtitulo', e.target.value)}
                                            readOnly={locked}
                                            className={cn(
                                                'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors',
                                                locked ? 'opacity-60 cursor-default select-none' : 'focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20'
                                            )}
                                        />
                                    </div>

                                    {/* Cuerpo */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cuerpo del documento</label>
                                            {!locked && (
                                                <button onClick={() => setShowVars(v => !v)} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                                    {showVars ? 'Ocultar variables' : 'Ver variables'}
                                                </button>
                                            )}
                                        </div>

                                        {showVars && !locked && (
                                            <div className="mb-2 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                                                <p className="text-[10px] text-slate-500 mb-2">Clic para insertar en el cursor:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {VARIABLES.map(v => (
                                                        <button key={v.key} title={v.desc} onClick={() => insertVar(v.key)}
                                                            className="px-2 py-0.5 rounded bg-slate-700 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-mono transition-colors border border-white/5">
                                                            {v.key}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-slate-600 mt-2">
                                                    Condicionales: <code className="text-amber-400/80 text-[9px]">{'{{#uno}}'}...{'{{/uno}}'}</code> (un comprador) &nbsp;
                                                    <code className="text-amber-400/80 text-[9px]">{'{{#dos}}'}...{'{{/dos}}'}</code> (dos compradores)
                                                </p>
                                            </div>
                                        )}

                                        {!locked && (
                                            <p className="text-[10px] text-slate-600 mb-1.5">
                                                Usa <code className="text-blue-400 bg-blue-500/10 px-1 rounded text-[9px]">{'{variable}'}</code> para datos dinámicos.
                                            </p>
                                        )}
                                        <textarea
                                            ref={textareaRef}
                                            value={selected.cuerpo}
                                            onChange={e => update('cuerpo', e.target.value)}
                                            readOnly={locked}
                                            rows={20}
                                            className={cn(
                                                'w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors font-mono leading-relaxed resize-y',
                                                locked ? 'opacity-60 cursor-default' : 'focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20'
                                            )}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            {showPreview && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Vista previa</span>
                                        <span className="text-[10px] text-slate-600 italic">datos de ejemplo — modo: un comprador</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-h-[800px] overflow-y-auto">
                                        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                                {TIPO_CONFIG[selected.tipo]?.label ?? selected.tipo}
                                            </p>
                                            <h2 className="text-sm font-bold text-gray-900 leading-tight">{renderTemplate(selected.titulo)}</h2>
                                            {selected.subtitulo && (
                                                <p className="text-xs text-gray-500 mt-1">{renderTemplate(selected.subtitulo)}</p>
                                            )}
                                        </div>
                                        <div className="px-8 py-6">
                                            <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans break-words">
                                                {renderTemplate(selected.cuerpo)}
                                            </pre>
                                        </div>
                                        <div className="px-8 pb-6 border-t border-gray-50">
                                            <p className="text-[9px] text-gray-300 mt-3 text-right">
                                                {SAMPLE['{empresa.nombre}']} — documento generado automáticamente
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
