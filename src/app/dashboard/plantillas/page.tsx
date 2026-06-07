'use client'

import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Eye, EyeOff, RotateCcw, Save, Loader2, Check, FileText, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentTemplate {
    orden: number
    titulo: string
    subtitulo: string
    tipo: 'RESERVA' | 'PRINCIPAL' | 'ANEXO' | 'ADICIONAL'
    cuerpo: string
}

const TIPO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    RESERVA:   { label: 'Reserva',   bg: 'bg-violet-500/15', text: 'text-violet-400' },
    PRINCIPAL: { label: 'Principal', bg: 'bg-blue-500/15',   text: 'text-blue-400'   },
    ANEXO:     { label: 'Anexo',     bg: 'bg-slate-500/15',  text: 'text-slate-400'  },
    ADICIONAL: { label: 'Adicional', bg: 'bg-amber-500/15',  text: 'text-amber-400'  },
}

const VARIABLES: { key: string; desc: string }[] = [
    { key: '{cliente.nombres}',     desc: 'Nombres del cliente'     },
    { key: '{cliente.apellidos}',   desc: 'Apellidos del cliente'   },
    { key: '{cliente.dni}',         desc: 'DNI del cliente'         },
    { key: '{cliente.estadoCivil}', desc: 'Estado civil'            },
    { key: '{cliente.domicilio}',   desc: 'Domicilio del cliente'   },
    { key: '{empresa.nombre}',      desc: 'Nombre de la empresa'    },
    { key: '{inmueble.proyecto}',   desc: 'Nombre del proyecto'     },
    { key: '{inmueble.manzana}',    desc: 'Manzana del lote'        },
    { key: '{inmueble.lote}',       desc: 'Número de lote'          },
    { key: '{inmueble.area}',       desc: 'Área en m²'              },
    { key: '{inmueble.precio}',     desc: 'Precio de venta (S/)'    },
    { key: '{inmueble.separacion}', desc: 'Monto de separación (S/)'},
    { key: '{fecha.hoy}',           desc: 'Fecha actual'             },
    { key: '{contrato.codigo}',     desc: 'Código del contrato'     },
]

const SAMPLE_DATA: Record<string, string> = {
    '{cliente.nombres}':     'María Elena',
    '{cliente.apellidos}':   'García Rodríguez',
    '{cliente.dni}':         '45678901',
    '{cliente.estadoCivil}': 'Casada',
    '{cliente.domicilio}':   'Av. Brasil 1234, Jesús María, Lima',
    '{empresa.nombre}':      'Lumina Grupo Inmobiliario',
    '{inmueble.proyecto}':   'Villa del Sol',
    '{inmueble.manzana}':    'A',
    '{inmueble.lote}':       '12',
    '{inmueble.area}':       '120.00',
    '{inmueble.precio}':     '85,000.00',
    '{inmueble.separacion}': '3,500.00',
    '{fecha.hoy}':           new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
    '{contrato.codigo}':     'SEP-2025-0042',
}

function renderPreview(text: string): string {
    let result = text
    for (const [key, val] of Object.entries(SAMPLE_DATA)) {
        result = result.split(key).join(val)
    }
    return result
}

function DocCard({ template, selected, onClick }: {
    template: DocumentTemplate
    selected: boolean
    onClick: () => void
}) {
    const cfg = TIPO_CONFIG[template.tipo] ?? TIPO_CONFIG.ANEXO
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
                    <p className={cn('text-xs font-semibold leading-tight', selected ? 'text-white' : 'text-slate-300')}>
                        {template.titulo}
                    </p>
                    <span className={cn('inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase', cfg.bg, cfg.text)}>
                        {cfg.label}
                    </span>
                </div>
                {selected && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
            </div>
        </button>
    )
}

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

    const isDirty = JSON.stringify(templates) !== JSON.stringify(original)

    React.useEffect(() => {
        fetch('/api/admin/document-templates')
            .then(r => r.json())
            .then(d => {
                if (d.templates) {
                    setTemplates(d.templates)
                    setOriginal(d.templates)
                }
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
        } finally {
            setSaving(false)
        }
    }

    function update(field: keyof DocumentTemplate, value: string) {
        setTemplates(prev => prev.map((t, i) =>
            i === selectedIndex ? { ...t, [field]: value } : t
        ))
    }

    function insertVar(key: string) {
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const current = templates[selectedIndex]?.cuerpo ?? ''
        const next = current.slice(0, start) + key + current.slice(end)
        update('cuerpo', next)
        requestAnimationFrame(() => {
            if (el) { el.selectionStart = el.selectionEnd = start + key.length; el.focus() }
        })
    }

    const selected = templates[selectedIndex]

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
                                    <span>Paquete Estándar de Venta &middot; {templates.length} documentos por venta</span>
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
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restaurar
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || !isDirty}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                    saved
                                        ? 'bg-emerald-600 text-white'
                                        : isDirty
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

                    {/* Document cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {templates.map((t, i) => (
                            <DocCard key={i} template={t} selected={i === selectedIndex} onClick={() => setSelectedIndex(i)} />
                        ))}
                    </div>

                    {/* Editor + Preview */}
                    {selected && (
                        <div className={cn('grid gap-5', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>

                            {/* Editor */}
                            <div className="bg-slate-900 border border-white/8 rounded-xl p-5 space-y-4">

                                {/* Tipo selector */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {(['RESERVA', 'PRINCIPAL', 'ANEXO', 'ADICIONAL'] as const).map(tipo => {
                                        const cfg = TIPO_CONFIG[tipo]
                                        const active = selected.tipo === tipo
                                        return (
                                            <button
                                                key={tipo}
                                                onClick={() => update('tipo', tipo)}
                                                className={cn(
                                                    'px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-colors border',
                                                    active ? cn(cfg.bg, cfg.text, 'border-current opacity-100') : 'bg-transparent text-slate-600 border-white/5 hover:text-slate-400'
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
                                        className="w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors font-medium"
                                        placeholder="Título del documento..."
                                    />
                                </div>

                                {/* Subtítulo */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Subtítulo</label>
                                    <input
                                        value={selected.subtitulo}
                                        onChange={e => update('subtitulo', e.target.value)}
                                        className="w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                                        placeholder="Subtítulo..."
                                    />
                                </div>

                                {/* Cuerpo */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cuerpo del documento</label>
                                        <button onClick={() => setShowVars(v => !v)} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                            {showVars ? 'Ocultar variables' : 'Ver variables'}
                                        </button>
                                    </div>

                                    {showVars && (
                                        <div className="mb-2 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                                            <p className="text-[10px] text-slate-500 mb-2">Clic para insertar en el cursor:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {VARIABLES.map(v => (
                                                    <button
                                                        key={v.key}
                                                        title={v.desc}
                                                        onClick={() => insertVar(v.key)}
                                                        className="px-2 py-0.5 rounded bg-slate-700 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-mono transition-colors border border-white/5"
                                                    >
                                                        {v.key}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-slate-600 mb-1.5">
                                        Edita libremente. Usa{' '}
                                        <code className="text-blue-400 bg-blue-500/10 px-1 rounded text-[9px]">{'{variable}'}</code>
                                        {' '}para datos dinámicos.
                                    </p>
                                    <textarea
                                        ref={textareaRef}
                                        value={selected.cuerpo}
                                        onChange={e => update('cuerpo', e.target.value)}
                                        rows={18}
                                        className="w-full bg-slate-800 border border-white/8 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors font-mono leading-relaxed resize-y"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            {showPreview && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Vista previa</span>
                                        <span className="text-[10px] text-slate-600 italic">datos de ejemplo</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                                        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                                {TIPO_CONFIG[selected.tipo]?.label ?? selected.tipo}
                                            </p>
                                            <h2 className="text-sm font-bold text-gray-900 leading-tight">{renderPreview(selected.titulo)}</h2>
                                            {selected.subtitulo && (
                                                <p className="text-xs text-gray-500 mt-1">{renderPreview(selected.subtitulo)}</p>
                                            )}
                                        </div>
                                        <div className="px-8 py-6">
                                            <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans break-words">
                                                {renderPreview(selected.cuerpo)}
                                            </pre>
                                        </div>
                                        <div className="px-8 pb-6 border-t border-gray-50">
                                            <p className="text-[9px] text-gray-300 mt-3 text-right">
                                                {SAMPLE_DATA['{empresa.nombre}']} — documento generado automáticamente
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
