'use client'

/**
 * SatelliteMap.tsx
 * Vista satelital georreferenciada — Esri World Imagery (sin API key).
 * El plano del proyecto se superpone sobre el mapa real anclado por 4 esquinas
 * con una transformación proyectiva (CSS matrix3d / homografía).
 * Los lotes se renderizan como polígonos SVG con la misma transformación.
 *
 * Portado desde mattika-system/plano-satelite.jsx
 */

import * as React from 'react'
import { Lot } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Maximize2, Minimize2, Navigation, Settings, GripVertical, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// ── Tipos ─────────────────────────────────────────────────────────
interface LatLng { lat: number; lng: number }
interface SatCorners { tl: LatLng; tr: LatLng; br: LatLng; bl: LatLng }
interface SatelliteMapProps {
    projectId: string
    projectName: string
    mapImageUrl: string
    lots: Lot[]
    onLotClick: (lot: Lot) => void
    selectedLotId?: string | null
    satCorners?: SatCorners | null
    onSatCornersChange?: (corners: SatCorners) => void
    isAdmin?: boolean
    className?: string
}

// ── Constantes ────────────────────────────────────────────────────
const ESRI_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
const M_PER_DEG_LAT = 111320
// Centro por defecto: valle Chicama, Razuri (La Libertad, Perú)
const DEFAULT_CENTER: LatLng = { lat: -7.70395, lng: -79.42010 }
const DEFAULT_WIDTH_M = 720
const VIEW_SIZE = 1000 // coordenadas internas del plano

// ── Álgebra de homografía 2D ──────────────────────────────────────
function adj(m: number[]): number[] {
    return [
        m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
        m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
        m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3],
    ]
}
function multmm(a: number[], b: number[]): number[] {
    const c: number[] = []
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            let s = 0
            for (let k = 0; k < 3; k++) s += a[3*i+k] * b[3*k+j]
            c[3*i+j] = s
        }
    return c
}
function multmv(m: number[], v: number[]): number[] {
    return [
        m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
        m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
        m[6]*v[0]+m[7]*v[1]+m[8]*v[2],
    ]
}
function basisToPoints(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number,x4:number,y4:number): number[] {
    const m = [x1,x2,x3, y1,y2,y3, 1,1,1]
    const v = multmv(adj(m), [x4,y4,1])
    return multmm(m, [v[0],0,0, 0,v[1],0, 0,0,v[2]])
}
function general2D(s: number[], d: number[]): number[] {
    return multmm(d, adj(s))
}
/** Genera el string matrix3d() que mapea (0,0)-(W,H) a 4 puntos en píxeles */
function homographyMatrix3d(W: number, H: number, pts: {x:number;y:number}[]): string {
    const s = basisToPoints(0,0, W,0, W,H, 0,H)
    const d = basisToPoints(pts[0].x,pts[0].y, pts[1].x,pts[1].y, pts[2].x,pts[2].y, pts[3].x,pts[3].y)
    const t = general2D(s, d)
    for (let i = 0; i < 9; i++) t[i] = t[i] / t[8]
    const m = [t[0],t[3],0,t[6], t[1],t[4],0,t[7], 0,0,1,0, t[2],t[5],0,t[8]]
    return 'matrix3d(' + m.join(',') + ')'
}

// ── Utilidades geográficas ────────────────────────────────────────
function defaultCorners(aspect: number): SatCorners {
    const { lat, lng } = DEFAULT_CENTER
    const dLat = (DEFAULT_WIDTH_M * aspect / 2) / M_PER_DEG_LAT
    const dLng = (DEFAULT_WIDTH_M / 2) / (M_PER_DEG_LAT * Math.cos(lat * Math.PI / 180))
    return {
        tl: { lat: lat + dLat, lng: lng - dLng },
        tr: { lat: lat + dLat, lng: lng + dLng },
        br: { lat: lat - dLat, lng: lng + dLng },
        bl: { lat: lat - dLat, lng: lng - dLng },
    }
}
function cornersCentroid(c: SatCorners): LatLng {
    const ks = ['tl','tr','br','bl'] as const
    return {
        lat: ks.reduce((s,k) => s + c[k].lat, 0) / 4,
        lng: ks.reduce((s,k) => s + c[k].lng, 0) / 4,
    }
}
function translateCorners(c: SatCorners, dLat: number, dLng: number): SatCorners {
    return {
        tl: { lat: c.tl.lat + dLat, lng: c.tl.lng + dLng },
        tr: { lat: c.tr.lat + dLat, lng: c.tr.lng + dLng },
        br: { lat: c.br.lat + dLat, lng: c.br.lng + dLng },
        bl: { lat: c.bl.lat + dLat, lng: c.bl.lng + dLng },
    }
}
function transformCorners(corners: SatCorners, rotDeg: number, scale: number): SatCorners {
    const ks = ['tl','tr','br','bl'] as const
    const clat = ks.reduce((s,k) => s + corners[k].lat, 0) / 4
    const clng = ks.reduce((s,k) => s + corners[k].lng, 0) / 4
    const mLat = M_PER_DEG_LAT
    const mLng = M_PER_DEG_LAT * Math.cos(clat * Math.PI / 180)
    const rad = rotDeg * Math.PI / 180
    const cos = Math.cos(rad), sin = Math.sin(rad)
    const out: Partial<SatCorners> = {}
    ks.forEach(k => {
        let x = (corners[k].lng - clng) * mLng
        let y = (corners[k].lat - clat) * mLat
        x *= scale; y *= scale
        const rx = x * cos - y * sin
        const ry = x * sin + y * cos
        out[k] = { lat: clat + ry / mLat, lng: clng + rx / mLng }
    })
    return out as SatCorners
}

// ── Colores de lote ────────────────────────────────────────────────
const LOT_COLORS: Record<string, { fill: string; stroke: string }> = {
    LIBRE:         { fill: 'rgba(34,197,94,0.45)',  stroke: '#22c55e' },
    SEPARADO:      { fill: 'rgba(251,191,36,0.55)', stroke: '#fbbf24' },
    VENDIDO:       { fill: 'rgba(239,68,68,0.55)',  stroke: '#ef4444' },
    NO_DISPONIBLE: { fill: 'rgba(100,116,139,0.55)',stroke: '#64748b' },
}

// ── Componente principal ──────────────────────────────────────────
export function SatelliteMap({
    projectId, projectName, mapImageUrl, lots,
    onLotClick, selectedLotId,
    satCorners: initialCorners, onSatCornersChange,
    isAdmin = false, className
}: SatelliteMapProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const mapRef = React.useRef<any>(null)
    const layerRef = React.useRef<any>(null)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [alignMode, setAlignMode] = React.useState(false)
    const [draggingCorner, setDraggingCorner] = React.useState<keyof SatCorners | 'center' | null>(null)
    const [imageAspect, setImageAspect] = React.useState(1)
    const [mapReady, setMapReady] = React.useState(false)
    const [corners, setCorners] = React.useState<SatCorners>(() =>
        initialCorners ?? defaultCorners(1)
    )
    const [opacity, setOpacity] = React.useState(0.65)
    const [saving, setSaving] = React.useState(false)

    // Inicializar Leaflet al montar (solo cliente)
    React.useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        import('leaflet').then(L => {
            const mapEl = containerRef.current?.querySelector('#sat-map') as HTMLDivElement
            if (!mapEl || mapRef.current) return

            // Suprimir el error del ícono por defecto de Leaflet en Next.js
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' })

            const center = cornersCentroid(corners)
            const map = L.map(mapEl, {
                center: [center.lat, center.lng],
                zoom: 17,
                zoomControl: false,
                attributionControl: false,
            })

            L.tileLayer(ESRI_TILE_URL, {
                attribution: ESRI_ATTRIBUTION,
                maxZoom: 21,
                maxNativeZoom: 19,
            }).addTo(map)

            L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

            mapRef.current = map
            setMapReady(true)
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
                setMapReady(false)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Cargar imagen para conocer el aspect ratio
    React.useEffect(() => {
        if (!mapImageUrl) return
        const img = new Image()
        img.onload = () => setImageAspect(img.naturalHeight / img.naturalWidth)
        img.src = mapImageUrl
    }, [mapImageUrl])

    // Actualizar corners cuando cambia el aspect
    React.useEffect(() => {
        if (!initialCorners && imageAspect !== 1) {
            setCorners(defaultCorners(imageAspect))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageAspect])

    // Redibujar la capa del plano + lotes cada vez que cambian corners, opacity, selected
    React.useEffect(() => {
        if (!mapReady || !mapRef.current) return
        import('leaflet').then(L => {
            renderLayer(L, corners, opacity)
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, corners, opacity, selectedLotId, lots, mapImageUrl, alignMode])

    function renderLayer(L: any, c: SatCorners, op: number) {
        const map = mapRef.current
        if (!map) return

        // Quitar capa anterior
        if (layerRef.current) {
            map.removeLayer(layerRef.current)
            layerRef.current = null
        }
        if (!mapImageUrl) return

        // Convertir esquinas geo → píxeles del mapa
        function geoToPixel(ll: LatLng): {x:number; y:number} {
            const pt = map.latLngToLayerPoint([ll.lat, ll.lng])
            return { x: pt.x, y: pt.y }
        }

        // Crear capa personalizada (plano + SVG lotes)
        const CustomLayer = L.Layer.extend({
            onAdd(m: any) {
                this._map = m
                const pane = m.getPane('overlayPane')
                const container = L.DomUtil.create('div', '', pane) as HTMLDivElement
                container.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;'
                this._container = container

                // Imagen del plano
                const img = L.DomUtil.create('img', '', container) as HTMLImageElement
                img.src = mapImageUrl
                img.style.cssText = `position:absolute;top:0;left:0;width:${VIEW_SIZE}px;height:${VIEW_SIZE}px;transform-origin:0 0;pointer-events:none;opacity:${op};`
                img.draggable = false
                this._img = img

                // SVG de lotes
                const NS = 'http://www.w3.org/2000/svg'
                const svg = document.createElementNS(NS, 'svg') as SVGSVGElement
                svg.setAttribute('viewBox', `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`)
                svg.setAttribute('width', String(VIEW_SIZE))
                svg.setAttribute('height', String(VIEW_SIZE))
                svg.style.cssText = `position:absolute;top:0;left:0;transform-origin:0 0;pointer-events:auto;overflow:visible;`
                this._svg = svg
                container.appendChild(svg)

                // Renderizar polígonos de lotes
                lots.forEach(lot => {
                    const shapeData = lot.mapShapeData as any
                    if (!shapeData) return
                    // Normalizar vértices: acepta tanto {x,y}[] como {vertices:[{x,y}]}
                    let verts: {x:number;y:number}[] = []
                    if (Array.isArray(shapeData)) verts = shapeData
                    else if (Array.isArray(shapeData.vertices)) verts = shapeData.vertices
                    else if (shapeData.x !== undefined) {
                        // rect {x,y,w,h} en 0-1 → escalar a VIEW_SIZE
                        const {x,y,w,h} = shapeData
                        verts = [
                            {x: x*VIEW_SIZE, y: y*VIEW_SIZE},
                            {x: (x+w)*VIEW_SIZE, y: y*VIEW_SIZE},
                            {x: (x+w)*VIEW_SIZE, y: (y+h)*VIEW_SIZE},
                            {x: x*VIEW_SIZE, y: (y+h)*VIEW_SIZE},
                        ]
                    }
                    if (!verts.length) return

                    const colors = LOT_COLORS[lot.estado] ?? LOT_COLORS.LIBRE
                    const isSelected = selectedLotId === lot.id

                    const poly = document.createElementNS(NS, 'polygon')
                    poly.setAttribute('points', verts.map(v => `${v.x},${v.y}`).join(' '))
                    poly.setAttribute('fill', isSelected ? 'rgba(59,130,246,0.7)' : colors.fill)
                    poly.setAttribute('stroke', isSelected ? '#3b82f6' : colors.stroke)
                    poly.setAttribute('stroke-width', isSelected ? '3' : '1.5')
                    poly.setAttribute('vector-effect', 'non-scaling-stroke')
                    poly.style.cursor = 'pointer'
                    poly.style.transition = 'fill 0.15s'
                    poly.addEventListener('click', e => { e.stopPropagation(); onLotClick(lot) })
                    poly.addEventListener('mouseenter', () => {
                        if (!isSelected) poly.setAttribute('fill', 'rgba(59,130,246,0.4)')
                    })
                    poly.addEventListener('mouseleave', () => {
                        if (!isSelected) poly.setAttribute('fill', colors.fill)
                    })
                    svg.appendChild(poly)

                    // Label
                    if (verts.length >= 3) {
                        const cx = verts.reduce((s,v)=>s+v.x,0)/verts.length
                        const cy = verts.reduce((s,v)=>s+v.y,0)/verts.length
                        const label = document.createElementNS(NS, 'text')
                        label.setAttribute('x', String(cx))
                        label.setAttribute('y', String(cy))
                        label.setAttribute('text-anchor', 'middle')
                        label.setAttribute('dominant-baseline', 'middle')
                        label.setAttribute('font-size', '11')
                        label.setAttribute('font-weight', '600')
                        label.setAttribute('fill', 'white')
                        label.setAttribute('pointer-events', 'none')
                        label.setAttribute('paint-order', 'stroke')
                        label.setAttribute('stroke', 'rgba(0,0,0,0.6)')
                        label.setAttribute('stroke-width', '2.5')
                        label.textContent = `${lot.manzana}${lot.loteNumero}`
                        svg.appendChild(label)
                    }
                })

                m.on('zoom viewreset move zoomanim', this._update, this)
                this._update()
            },
            onRemove(m: any) {
                if (this._container) L.DomUtil.remove(this._container)
                m.off('zoom viewreset move zoomanim', this._update, this)
            },
            _update() {
                const m = this._map
                if (!m || !this._container) return

                const pxCorners = (['tl','tr','br','bl'] as const).map(k => geoToPixel(c[k]))
                const transform = homographyMatrix3d(VIEW_SIZE, VIEW_SIZE, pxCorners)

                const offset = m.getPixelOrigin()
                const mapOffset = m._getMapPanePos()
                const ox = -offset.x + mapOffset.x
                const oy = -offset.y + mapOffset.y

                this._container.style.transform = `translate(${ox}px,${oy}px)`
                if (this._img) this._img.style.transform = transform
                if (this._svg) this._svg.style.transform = transform
            }
        })

        const layer = new CustomLayer()
        layer.addTo(map)
        layerRef.current = layer
    }

    // Modo alineación: manejar drag de esquinas sobre el mapa
    React.useEffect(() => {
        const map = mapRef.current
        if (!map || !alignMode) return
        const handleClick = (e: any) => {
            if (!draggingCorner) return
            const ll = e.latlng
            if (draggingCorner === 'center') {
                const centroid = cornersCentroid(corners)
                const dLat = ll.lat - centroid.lat
                const dLng = ll.lng - centroid.lng
                const newCorners = translateCorners(corners, dLat, dLng)
                setCorners(newCorners)
            } else {
                setCorners(prev => ({ ...prev, [draggingCorner]: { lat: ll.lat, lng: ll.lng } }))
            }
            setDraggingCorner(null)
        }
        map.on('click', handleClick)
        return () => map.off('click', handleClick)
    }, [alignMode, draggingCorner, corners])

    // Guardar corners en DB
    const saveCorners = async () => {
        setSaving(true)
        try {
            await fetch(`/api/projects/${projectId}/sat-corners`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ satCorners: corners }),
            })
            onSatCornersChange?.(corners)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleFullscreen = async () => {
        if (!containerRef.current) return
        if (!isFullscreen) {
            await containerRef.current.requestFullscreen?.()
            setIsFullscreen(true)
        } else {
            await document.exitFullscreen?.()
            setIsFullscreen(false)
        }
        setTimeout(() => mapRef.current?.invalidateSize(), 300)
    }

    const zoomIn = () => mapRef.current?.zoomIn()
    const zoomOut = () => mapRef.current?.zoomOut()
    const recenter = () => {
        const c2 = cornersCentroid(corners)
        mapRef.current?.setView([c2.lat, c2.lng], 17)
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative flex flex-col bg-slate-950 overflow-hidden transition-all duration-300',
                isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-xl border border-white/5',
                className
            )}
        >
            {/* Toolbar */}
            <div className="absolute top-2 left-2 right-2 z-[500] flex items-center gap-2 pointer-events-none">
                <div className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 shrink-0 pointer-events-auto">
                    <h2 className="text-[11px] font-semibold text-white leading-none">{projectName}</h2>
                </div>
                <div className="flex-1" />
                {isAdmin && (
                    <button
                        onClick={() => setAlignMode(v => !v)}
                        className={cn(
                            'pointer-events-auto px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors',
                            alignMode
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-white'
                        )}
                    >
                        <Settings className="w-3 h-3 inline mr-1" />
                        {alignMode ? 'Alineando...' : 'Alinear plano'}
                    </button>
                )}
                <button
                    onClick={handleFullscreen}
                    className="pointer-events-auto p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/60 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Panel de alineación */}
            {alignMode && (
                <div className="absolute top-12 right-2 z-[500] bg-slate-900/95 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 w-64 text-sm">
                    <p className="text-amber-300 font-semibold mb-2 flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5" /> Calce del plano
                    </p>
                    <p className="text-slate-400 text-[11px] mb-3">
                        Selecciona una esquina y haz clic en el mapa para moverla. O ajusta rotación/escala.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {(['tl','tr','bl','br'] as const).map(k => (
                            <button
                                key={k}
                                onClick={() => setDraggingCorner(prev => prev === k ? null : k)}
                                className={cn(
                                    'px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                                    draggingCorner === k
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                )}
                            >
                                {{ tl:'↖ Sup-Izq', tr:'↗ Sup-Der', bl:'↙ Inf-Izq', br:'↘ Inf-Der' }[k]}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5 mb-3">
                        <button
                            onClick={() => setDraggingCorner(prev => prev === 'center' ? null : 'center')}
                            className={cn(
                                'flex-1 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                                draggingCorner === 'center'
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            )}
                        >
                            ✛ Mover todo
                        </button>
                    </div>
                    <div className="mb-3 space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Opacidad del plano</label>
                        <input
                            type="range" min={0.1} max={1} step={0.05}
                            value={opacity}
                            onChange={e => setOpacity(Number(e.target.value))}
                            className="w-full accent-amber-400"
                        />
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => { setCorners(defaultCorners(imageAspect)); setDraggingCorner(null) }}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white text-[11px] transition-colors"
                        >
                            <RotateCw className="w-3 h-3 inline mr-1" />Restablecer
                        </button>
                        <button
                            onClick={saveCorners}
                            disabled={saving}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-medium transition-colors"
                        >
                            {saving ? 'Guardando...' : '✓ Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Controles de zoom */}
            <div className="absolute bottom-12 right-2 z-[500] flex flex-col gap-1">
                <button onClick={zoomIn} className="p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/70 hover:text-white transition-colors">
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={zoomOut} className="p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/70 hover:text-white transition-colors">
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={recenter} className="p-1.5 bg-slate-900/90 backdrop-blur-sm rounded-md border border-white/10 text-white/70 hover:text-white transition-colors">
                    <Navigation className="w-4 h-4" />
                </button>
            </div>

            {/* Leyenda */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm rounded-full border border-white/10 text-xs">
                    {Object.entries({ LIBRE:'Disponible', SEPARADO:'Separado', VENDIDO:'Vendido', NO_DISPONIBLE:'Bloqueado' }).map(([estado,label]) => (
                        <span key={estado} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full border" style={{ background: LOT_COLORS[estado]?.fill, borderColor: LOT_COLORS[estado]?.stroke }} />
                            <span className="text-slate-400">{label}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Mapa Leaflet */}
            <div id="sat-map" className="flex-1 w-full" style={{ minHeight: '400px' }} />

            {/* CSS de Leaflet inline (evita SSR issues) */}
            <style>{`
                .leaflet-container { background: #0f172a; }
                .leaflet-control-attribution { font-size: 9px !important; opacity: 0.5; }
                #sat-map .leaflet-tile { filter: brightness(0.9) contrast(1.05); }
            `}</style>
        </div>
    )
}
