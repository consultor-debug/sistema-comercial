'use client'

import * as React from 'react'
import Link from 'next/link'
import { InteractiveMap } from '@/components/map'
import { LotModal } from '@/components/lot'
import { Lot } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { Building2, ArrowLeft, Info } from 'lucide-react'

type LotStatus = 'LIBRE' | 'SEPARADO' | 'VENDIDO' | 'NO_DISPONIBLE'

// Demo lots data generated on client side to avoid hydration mismatch

function generateDemoLots() {
    const lots = []
    const manzanas = ['A', 'B', 'C', 'D']
    const tipologias = ['Residencial', 'Comercial', 'Mixto']
    const estados: LotStatus[] = ['LIBRE', 'LIBRE', 'LIBRE', 'SEPARADO', 'VENDIDO', 'NO_DISPONIBLE']

    let id = 1
    for (const manzana of manzanas) {
        const lotsInManzana = manzana === 'A' ? 12 : manzana === 'B' ? 10 : 8

        for (let lote = 1; lote <= lotsInManzana; lote++) {
            const baseX = manzana === 'A' ? 100 : manzana === 'B' ? 350 : manzana === 'C' ? 100 : 350
            const baseY = manzana === 'A' || manzana === 'B' ? 80 : 320

            const col = (lote - 1) % 4
            const row = Math.floor((lote - 1) / 4)

            const estado = estados[Math.floor(Math.random() * estados.length)]

            lots.push({
                id: `lot-${id}`,
                code: `${manzana}-${lote.toString().padStart(2, '0')}`,
                manzana,
                loteNumero: lote,
                areaM2: 120 + Math.floor(Math.random() * 80),
                tipologia: tipologias[Math.floor(Math.random() * tipologias.length)],
                etapa: manzana <= 'B' ? '1era Etapa' : '2da Etapa',
                frenteM: 8 + Math.random() * 4,
                fondoM: 15 + Math.random() * 5,
                ladoDerM: 15 + Math.random() * 5,
                ladoIzqM: 15 + Math.random() * 5,
                precioLista: 50000 + Math.floor(Math.random() * 30000),
                descuentoMax: 5000 + Math.floor(Math.random() * 3000),
                estado,
                asesorId: estado !== 'LIBRE' ? 'asesor-1' : null,
                asesor: estado !== 'LIBRE' ? {
                    name: 'Juan Pérez',
                    email: 'juan.perez@inmobiliaria.com'
                } : null,
                mapShapeType: 'circle',
                mapShapeData: {
                    x: baseX + col * 60,
                    y: baseY + row * 60,
                    radius: 22
                }
            })
            id++
        }
    }

    return lots
}

export default function DemoPage() {
    const [lots, setLots] = React.useState<Lot[]>([])
    const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setLots(generateDemoLots() as unknown as Lot[])
        setIsMounted(true)
    }, [])

    const handleLotClick = (lot: Lot) => {
        setSelectedLot(lot)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedLot(null)
    }

    if (!isMounted) return null // Prevent hydration flash/mismatch

    return (
        <div className="min-h-screen bg-grid">
            {/* Header */}
            <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver
                                </Button>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">Demo Interactivo</h1>
                                    <p className="text-xs text-slate-400">Proyecto Residencial Los Jardines</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Info className="w-4 h-4" />
                            <span>Haz clic en un lote para ver detalles</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-6">
                <InteractiveMap
                    projectName="Residencial Lumina - Vista General"
                    mapImageUrl="/maps/Lumina_SVG2.svg"
                    lots={lots}
                    onLotClick={handleLotClick}
                    selectedLotId={selectedLot?.id}
                    className="min-h-[700px]"
                />
            </main>

            {/* Lot Modal */}
            <LotModal
                lot={selectedLot}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                projectSettings={{
                    maxCuotas: 60,
                    minInicial: 5000
                }}
            />
        </div>
    )
}
