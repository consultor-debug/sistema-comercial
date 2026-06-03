// Canvas del plano
export const PLANO_W = 2800
export const PLANO_H = 2006

// Shape de un lote generado (compatible con la tabla lots de Prisma, pero sin ID de BD)
export interface LoteBase {
  prngId: string
  code: string
  manzana: string
  loteNumero: number
  areaM2: number
  frenteM: number
  fondoM: number
  precioLista: number
  descuentoMax: number
  estado: 'LIBRE'
  tipologia: string
  etapa: string | null
  orientacion: string
  mapShapeType: 'polygon'
  mapShapeData: { points: { x: number; y: number }[] }
}

interface ManzanaDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  cols: number
  rows: number
  rotation: number
  precioPorM2Base: number
}

const MANZANAS_DEF: ManzanaDef[] = [
  { id: 'A', x: 120,  y: 100,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 420 },
  { id: 'B', x: 450,  y: 100,  w: 240, h: 320, cols: 3, rows: 5, rotation: 0,  precioPorM2Base: 430 },
  { id: 'C', x: 740,  y: 100,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 425 },
  { id: 'D', x: 1080, y: 100,  w: 240, h: 320, cols: 3, rows: 5, rotation: 0,  precioPorM2Base: 440 },
  { id: 'E', x: 1370, y: 100,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 445 },
  { id: 'F', x: 120,  y: 500,  w: 280, h: 280, cols: 4, rows: 4, rotation: 0,  precioPorM2Base: 420 },
  { id: 'G', x: 450,  y: 500,  w: 240, h: 280, cols: 3, rows: 4, rotation: 0,  precioPorM2Base: 430 },
  { id: 'H', x: 740,  y: 500,  w: 280, h: 280, cols: 4, rows: 4, rotation: 0,  precioPorM2Base: 435 },
  { id: 'I', x: 1080, y: 500,  w: 240, h: 280, cols: 3, rows: 4, rotation: 0,  precioPorM2Base: 440 },
  { id: 'J', x: 1370, y: 500,  w: 280, h: 280, cols: 4, rows: 4, rotation: 0,  precioPorM2Base: 445 },
  { id: 'K', x: 120,  y: 860,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 415 },
  { id: 'L', x: 450,  y: 860,  w: 240, h: 320, cols: 3, rows: 5, rotation: 0,  precioPorM2Base: 420 },
  { id: 'M', x: 740,  y: 860,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 425 },
  { id: 'N', x: 1080, y: 860,  w: 240, h: 320, cols: 3, rows: 5, rotation: 0,  precioPorM2Base: 430 },
  { id: 'O', x: 1370, y: 860,  w: 280, h: 320, cols: 4, rows: 5, rotation: 0,  precioPorM2Base: 435 },
]

function mkPrng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

function calcOrientacion(col: number, row: number, cols: number, rows: number): string {
  const isTop    = row === 0
  const isBottom = row === rows - 1
  const isLeft   = col === 0
  const isRight  = col === cols - 1

  if (isTop && isLeft)     return 'Noroeste'
  if (isTop && isRight)    return 'Noreste'
  if (isBottom && isLeft)  return 'Suroeste'
  if (isBottom && isRight) return 'Sureste'
  if (isTop)               return 'Norte'
  if (isBottom)            return 'Sur'
  if (isLeft)              return 'Oeste'
  if (isRight)             return 'Este'
  return 'Norte'
}

export function buildLotes(): LoteBase[] {
  const rng = mkPrng(0x10c)
  const lotes: LoteBase[] = []

  for (const manzana of MANZANAS_DEF) {
    const { id, x, y, w, h, cols, rows, precioPorM2Base } = manzana
    const lotW = w / cols
    const lotH = h / rows

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const loteNumero = row * cols + col + 1
        const code = `${id}-${loteNumero.toString().padStart(2, '0')}`
        const prngId = code

        // Small positional variation ±3px (consumed but not applied to polygon vertices)
        const _varX = rng() * 6 - 3
        const _varY = rng() * 6 - 3

        // Frente and fondo with ±0.5 variation
        const frenteM = Math.round((lotW / 3.5 + (rng() * 1.0 - 0.5)) * 10) / 10
        const fondoM  = Math.round((lotH / 3.5 + (rng() * 1.0 - 0.5)) * 10) / 10
        const areaM2  = Math.round(frenteM * fondoM * 10) / 10

        // Tipologia
        const isCorner =
          (col === 0 || col === cols - 1) && (row === 0 || row === rows - 1)
        let tipologia: string
        let precioMultiplier = 1.0
        if (isCorner) {
          tipologia = 'Esquina'
          precioMultiplier = 1.06
        } else if (areaM2 > 130) {
          tipologia = 'Triple'
        } else if (areaM2 > 100) {
          tipologia = 'Dúplex'
        } else {
          tipologia = 'Flat'
        }

        // Precio
        const varPRNG = rng() * 0.1 - 0.05
        const precioLista =
          Math.round((areaM2 * precioPorM2Base * precioMultiplier * (1 + varPRNG)) / 1000) * 1000

        // Etapa
        let etapa: string | null
        if (row < rows / 3) {
          etapa = '1ra Etapa'
        } else if (row < (2 * rows) / 3) {
          etapa = '2da Etapa'
        } else {
          etapa = '3ra Etapa'
        }

        // Orientacion
        const orientacion = calcOrientacion(col, row, cols, rows)

        // Polygon vertices — normalized to 0-1 fractions of canvas
        const n = (ax: number, ay: number) => ({ x: ax / PLANO_W, y: ay / PLANO_H })
        const tlX = x + col * lotW + 1
        const tlY = y + row * lotH + 1
        const trX = x + (col + 1) * lotW - 1
        const brX = x + (col + 1) * lotW - 1
        const brY = y + (row + 1) * lotH - 1
        const blX = x + col * lotW + 1
        const blY = y + (row + 1) * lotH - 1

        lotes.push({
          prngId,
          code,
          manzana: id,
          loteNumero,
          areaM2,
          frenteM,
          fondoM,
          precioLista,
          descuentoMax: 5,
          estado: 'LIBRE',
          tipologia,
          etapa,
          orientacion,
          mapShapeType: 'polygon',
          mapShapeData: {
            points: [
              n(tlX, tlY),
              n(trX, tlY),
              n(brX, brY),
              n(blX, blY),
            ],
          },
        })
      }
    }
  }

  return lotes
}

// Fusiona lotes PRNG con overrides de BD
// dbLots: lotes reales de la BD (tienen id real de BD)
// Returns: lotes fusionados donde el DB tiene prioridad sobre PRNG por code
export function mergeLotes(prngLotes: LoteBase[], dbLots: any[]): (LoteBase | any)[] {
  const dbMap = new Map(dbLots.map(l => [l.code, l]))
  return prngLotes.map(p => dbMap.get(p.code) ?? p)
}
