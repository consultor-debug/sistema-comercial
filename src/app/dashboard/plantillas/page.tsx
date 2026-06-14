'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { Sidebar } from '@/components/Sidebar'
import { Eye, EyeOff, RotateCcw, Save, Loader2, Check, FileText, Layers, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Quill (browser-only) ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactQuill = dynamic(
    () => import('react-quill').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-[420px] bg-slate-800 rounded-b-lg animate-pulse flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
        ),
    }
) as React.ComponentType<any>


const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['clean'],
    ],
}

const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'align', 'indent']

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface DocumentTemplate {
    orden: number
    titulo: string
    subtitulo: string
    tipo: 'RESERVA' | 'PRINCIPAL' | 'ANEXO' | 'ADICIONAL'
    cuerpo: string
    editable?: boolean
}

const TIPO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    RESERVA:   { label: 'Reserva',   bg: 'bg-violet-500/15', text: 'text-violet-400' },
    PRINCIPAL: { label: 'Principal', bg: 'bg-blue-500/15',   text: 'text-blue-400'   },
    ANEXO:     { label: 'Anexo',     bg: 'bg-slate-500/15',  text: 'text-slate-400'  },
    ADICIONAL: { label: 'Adicional', bg: 'bg-amber-500/15',  text: 'text-amber-400'  },
}

// ── Variables disponibles ─────────────────────────────────────────────────────
const VARIABLES: { key: string; desc: string }[] = [
    { key: '{empresa.nombre}',           desc: 'Nombre comercial'          },
    { key: '{empresa.razonSocial}',      desc: 'Razón social'              },
    { key: '{empresa.ruc}',              desc: 'RUC'                       },
    { key: '{empresa.domicilio}',        desc: 'Domicilio fiscal'          },
    { key: '{empresa.representante}',    desc: 'Representante legal'       },
    { key: '{empresa.representanteDni}', desc: 'DNI representante'         },
    { key: '{empresa.partidaJuridica}',  desc: 'Partida registral empresa' },
    { key: '{empresa.oficinaRegistral}', desc: 'Oficina registral'         },
    { key: '{comprador.termino}',        desc: 'EL/LOS COMPRADOR(ES)'     },
    { key: '{comprador.nombre}',         desc: 'Nombre comprador A'        },
    { key: '{comprador.dni}',            desc: 'DNI comprador A'           },
    { key: '{comprador.domicilio}',      desc: 'Domicilio comprador'       },
    { key: '{comprador.estadoCivil}',    desc: 'Estado civil'              },
    { key: '{comprador.ocupacion}',      desc: 'Ocupación'                 },
    { key: '{comprador.telefono}',       desc: 'Teléfono'                  },
    { key: '{comprador.email}',          desc: 'Email comprador A'         },
    { key: '{inmueble.proyecto}',        desc: 'Nombre del proyecto'       },
    { key: '{inmueble.unidad}',          desc: 'Número de lote'            },
    { key: '{inmueble.manzana}',         desc: 'Manzana'                   },
    { key: '{inmueble.area}',            desc: 'Área en m²'                },
    { key: '{precio}',                   desc: 'Precio total (S/)'         },
    { key: '{precioLetras}',             desc: 'Precio en letras'          },
    { key: '{inicial}',                  desc: 'Cuota inicial (S/)'        },
    { key: '{inicialLetras}',            desc: 'Inicial en letras'         },
    { key: '{saldo}',                    desc: 'Saldo a financiar (S/)'    },
    { key: '{saldoLetras}',              desc: 'Saldo en letras'           },
    { key: '{banco}',                    desc: 'Banco destino'             },
    { key: '{cuenta}',                   desc: 'Nro. cuenta'               },
    { key: '{penalidad}',                desc: 'Penalidad por mora (S/día)'},
    { key: '{lucroCesante}',             desc: '% lucro cesante'           },
    { key: '{plazoEntrega}',             desc: 'Plazo de entrega'          },
    { key: '{fecha.hoy}',                desc: 'Fecha actual'              },
    { key: '{fechaLarga}',               desc: 'Fecha larga'               },
    { key: '{lugar}',                    desc: 'Ciudad/lugar'              },
    { key: '{contrato.codigo}',          desc: 'Código del contrato'       },
]

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
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
    '{inmueble.separacion}':      '3,500.00',
    '{inmueble.precio}':          '85,000.00',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convierte texto plano con saltos de línea a HTML para Quill */
function plainToHtml(text: string): string {
    if (!text) return '<p><br></p>'
    if (text.trim().startsWith('<')) return text  // ya es HTML
    return text
        .split('\n')
        .map(line => `<p>${line.replace(/&/g, '&amp;') || '<br>'}</p>`)
        .join('')
}

/** Evalúa {{#flag}}...{{/flag}} y sustituye {variables} */
function renderTemplate(
    text: string,
    data: Record<string, string> = SAMPLE,
    conditions: Record<string, boolean> = { uno: true, dos: false }
): string {
    let result = text.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_m, flag: string, content: string) => conditions[flag] ? content : ''
    )
    for (const [key, val] of Object.entries(data)) {
        result = result.split(key).join(val)
    }
    return result
}

// ── DocCard ───────────────────────────────────────────────────────────────────
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
                {selected && locked  && <Lock    className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />}
            </div>
        </button>
    )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PlantillasPage() {
    const [templates, setTemplates]       = React.useState<DocumentTemplate[]>([])
    const [original,  setOriginal]        = React.useState<DocumentTemplate[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [loading,   setLoading]         = React.useState(true)
    const [saving,    setSaving]          = React.useState(false)
    const [saved,     setSaved]           = React.useState(false)
    const [showPreview, setShowPreview]   = React.useState(true)
    const [showVars,  setShowVars]        = React.useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quillRef  = React.useRef<any>(null)
    const lastSelRef = React.useRef<{ index: number; length: number } | null>(null)

    // Solo cuenta cambios en plantillas editables
    const isDirty = templates.some((t, i) => {
        if (t.editable === false) return false
        return JSON.stringify(t) !== JSON.stringify(original[i])
    })

    React.useEffect(() => {
        fetch('/api/admin/document-templates')
            .then(r => r.json())
            .then(d => {
                if (d.templates) {
                    const normalized = (d.templates as DocumentTemplate[]).map(t => ({
                        ...t,
                        // Editable → convertir plain text a HTML para Quill
                        cuerpo: t.editable === false ? t.cuerpo : plainToHtml(t.cuerpo),
                    }))
                    setTemplates(normalized)
                    setOriginal(JSON.parse(JSON.stringify(normalized)))
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
                setOriginal(JSON.parse(JSON.stringify(templates)))
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

    /** Inserta una variable en la posición del cursor de Quill */
    function insertVar(key: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const editor = (quillRef.current as any)?.getEditor?.()
        if (!editor) return
        const range = lastSelRef.current ?? { index: Math.max(0, editor.getLength() - 1), length: 0 }
        editor.focus()
        setTimeout(() => {
            editor.insertText(range.index, key, 'user')
            editor.setSelection(range.index + key.length, 0)
            lastSelRef.current = { index: range.index + key.length, length: 0 }
        }, 0)
    }

    const selected = templates[selectedIndex]
    const locked   = selected?.editable === false

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Sidebar />
            <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            {/* ── Quill dark theme + preview styles ──────────────────────────── */}
            <style>{`
                /* Toolbar */
                .quill-dark .ql-toolbar {
                    background: #1e293b;
                    border-color: rgba(255,255,255,0.08) !important;
                    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                    border-radius: 8px 8px 0 0;
                    padding: 6px 8px;
                }
                .quill-dark .ql-toolbar .ql-stroke        { stroke: #64748b; }
                .quill-dark .ql-toolbar .ql-fill          { fill:  #64748b; }
                .quill-dark .ql-toolbar .ql-picker-label  { color: #64748b; }
                .quill-dark .ql-toolbar button:hover .ql-stroke,
                .quill-dark .ql-toolbar button.ql-active .ql-stroke { stroke: #60a5fa; }
                .quill-dark .ql-toolbar button:hover .ql-fill,
                .quill-dark .ql-toolbar button.ql-active .ql-fill   { fill:  #60a5fa; }
                .quill-dark .ql-snow.ql-toolbar button:hover,
                .quill-dark .ql-snow.ql-toolbar button.ql-active    { background: rgba(255,255,255,0.06); border-radius:4px; }
                .quill-dark .ql-toolbar .ql-picker-options {
                    background: #1e293b;
                    border-color: rgba(255,255,255,0.12);
                    border-radius: 6px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                }
                .quill-dark .ql-toolbar .ql-picker-item         { color: #94a3b8; }
                .quill-dark .ql-toolbar .ql-picker-item:hover   { color: #e2e8f0; background: rgba(255,255,255,0.05); }
                .quill-dark .ql-toolbar .ql-picker-label::before { color: #64748b; }

                /* Container + Editor */
                .quill-dark .ql-container {
                    background: #1e293b;
                    border-color: rgba(255,255,255,0.08) !important;
                    border-radius: 0 0 8px 8px;
                    font-family: inherit;
                }
                .quill-dark .ql-editor {
                    color: #e2e8f0;
                    font-size: 12.5px;
                    line-height: 1.7;
                    min-height: 380px;
                    padding: 14px 18px;
                }
                .quill-dark .ql-editor p       { margin-bottom: 3px; }
                .quill-dark .ql-editor h1,
                .quill-dark .ql-editor h2,
                .quill-dark .ql-editor h3      { color: #f1f5f9; font-weight: 600; margin: 8px 0 4px; }
                .quill-dark .ql-editor ol,
                .quill-dark .ql-editor ul      { color: #e2e8f0; padding-left: 1.5em; }
                .quill-dark .ql-editor li      { margin-bottom: 2px; }
                .quill-dark .ql-editor strong  { color: #f1f5f9; }
                .quill-dark .ql-editor.ql-blank::before { color: #475569; font-style: normal; }

                /* Separador visual de Quill (snow) */
                .quill-dark .ql-toolbar.ql-snow { border-top: none; border-left: none; border-right: none; }
                .quill-dark .ql-container.ql-snow { border-top: none !important; }

                /* ── Preview del documento ─────────────────────────────────── */
                .doc-preview p          { margin-bottom: 4px; font-size: 12px; line-height: 1.6; color: #374151; }
                .doc-preview h1         { font-size: 13px; font-weight: 700; margin: 12px 0 6px; color: #111827; }
                .doc-preview h2         { font-size: 12.5px; font-weight: 700; margin: 10px 0 5px; color: #111827; }
                .doc-preview h3         { font-size: 12px; font-weight: 600; margin: 8px 0 4px; color: #111827; }
                .doc-preview strong     { font-weight: 700; color: #111827; }
                .doc-preview em         { font-style: italic; }
                .doc-preview ul         { list-style: disc;    padding-left: 1.6em; margin: 6px 0; }
                .doc-preview ol         { list-style: decimal; padding-left: 1.6em; margin: 6px 0; }
                .doc-preview li         { margin-bottom: 3px; font-size: 12px; color: #374151; }
                .doc-preview .ql-align-center  { text-align: center; }
                .doc-preview .ql-align-right   { text-align: right; }
                .doc-preview .ql-align-justify { text-align: justify; }
                .doc-preview .ql-indent-1 { padding-left: 2em; }
                .doc-preview .ql-indent-2 { padding-left: 4em; }
                .doc-preview .ql-indent-3 { padding-left: 6em; }
            `}</style>

            <main className="md:pl-56 min-h-screen flex flex-col pb-10">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-6 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                                <Layers className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold text-white leading-tight">Plantillas de documentos</h1>
                                <p className="text-[11px] text-slate-500 leading-tight flex items-center gap-2">
                                    <span>Paquete Estándar de Venta · {templates.length} documentos</span>
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
                                {showPreview ? 'Ocultar previa' : 'Ver previa'}
                            </button>
                            {isDirty && (
                                <button
                                    onClick={() => setTemplates(JSON.parse(JSON.stringify(original)))}
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
                                    saved   ? 'bg-emerald-600 text-white'
                                    : isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    :           'bg-white/5 text-slate-600 cursor-not-allowed'
                                )}
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : saved ? <Check className="w-3.5 h-3.5" />
                                    :         <Save  className="w-3.5 h-3.5" />}
                                {saved ? 'Guardado' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-5">

                    {/* ── Cards ──────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {templates.map((t, i) => (
                            <DocCard key={i} template={t} selected={i === selectedIndex} onClick={() => setSelectedIndex(i)} />
                        ))}
                    </div>

                    {/* ── Editor + Preview ────────────────────────────────────── */}
                    {selected && (
                        <div className={cn('grid gap-5', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>

                            {/* ── Panel editor ─────────────────────────────── */}
                            <div className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">

                                {/* Banner protegido */}
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
                                            const cfg    = TIPO_CONFIG[tipo]
                                            const active = selected.tipo === tipo
                                            return (
                                                <button key={tipo}
                                                    onClick={() => !locked && update('tipo', tipo)}
                                                    disabled={locked}
                                                    className={cn(
                                                        'px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-colors border',
                                                        active ? cn(cfg.bg, cfg.text, 'border-current/20') : 'bg-transparent text-slate-600 border-white/5',
                                                        !locked && 'hover:text-slate-400 cursor-pointer',
                                                        locked  && 'cursor-default'
                                                    )}
                                                >{cfg.label}</button>
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
                                            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                                Cuerpo del documento
                                            </label>
                                            {!locked && (
                                                <button onClick={() => setShowVars(v => !v)}
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                                    {showVars ? 'Ocultar variables' : 'Ver variables'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Panel de variables */}
                                        {showVars && !locked && (
                                            <div className="mb-3 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                                                <p className="text-[10px] text-slate-500 mb-2">
                                                    Clic para insertar en el cursor del editor:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {VARIABLES.map(v => (
                                                        <button key={v.key} title={v.desc}
                                                            onClick={() => insertVar(v.key)}
                                                            className="px-2 py-0.5 rounded bg-slate-700 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-mono transition-colors border border-white/5">
                                                            {v.key}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-slate-600 mt-2">
                                                    Condicionales:&nbsp;
                                                    <code className="text-amber-400/80 text-[9px]">{'{{#uno}}'}...{'{{/uno}}'}</code>
                                                    &nbsp;un comprador &nbsp;·&nbsp;
                                                    <code className="text-amber-400/80 text-[9px]">{'{{#dos}}'}...{'{{/dos}}'}</code>
                                                    &nbsp;dos compradores
                                                </p>
                                            </div>
                                        )}

                                        {/* Editor visual (editable) */}
                                        {!locked ? (
                                            <div className="quill-dark rounded-lg border border-white/8 overflow-hidden">
                                                <ReactQuill
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={selected.cuerpo}
                                                    onChange={(html: string) => update('cuerpo', html)}
                                                    onChangeSelection={(range: { index: number; length: number } | null) => {
                                                        if (range) lastSelRef.current = range
                                                    }}
                                                    modules={QUILL_MODULES}
                                                    formats={QUILL_FORMATS}
                                                    placeholder="Escribe el contenido del documento..."
                                                />
                                            </div>
                                        ) : (
                                            /* Vista bloqueada — sólo muestra un extracto */
                                            <div className="bg-slate-800/40 border border-white/5 rounded-lg px-4 py-3 text-[11px] text-slate-500 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-hidden opacity-70 select-none relative">
                                                {selected.cuerpo.substring(0, 400)}
                                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Preview ──────────────────────────────────── */}
                            {showPreview && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Vista previa</span>
                                        <span className="text-[10px] text-slate-600 italic">datos de ejemplo · un comprador</span>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-h-[820px] overflow-y-auto">
                                        {/* Encabezado del doc */}
                                        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                                {TIPO_CONFIG[selected.tipo]?.label ?? selected.tipo}
                                            </p>
                                            <h2 className="text-sm font-bold text-gray-900 leading-tight">
                                                {renderTemplate(selected.titulo)}
                                            </h2>
                                            {selected.subtitulo && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {renderTemplate(selected.subtitulo)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Cuerpo */}
                                        <div className="px-8 py-6">
                                            {locked ? (
                                                /* Contrato protegido: plain text con preservación de espacios */
                                                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                                    {renderTemplate(selected.cuerpo)}
                                                </div>
                                            ) : (
                                                /* Plantilla editable: renderiza el HTML de Quill */
                                                <div
                                                    className="doc-preview"
                                                    dangerouslySetInnerHTML={{ __html: renderTemplate(selected.cuerpo) }}
                                                />
                                            )}
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
