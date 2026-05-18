'use client'

import React from 'react'

interface StatsChartProps {
    data: {
        name: string
        value: number
        color: string
    }[]
}

export function StatsChart({ data }: StatsChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0)

    const SIZE = 160
    const STROKE = 22
    const r = (SIZE - STROKE) / 2
    const circumference = 2 * Math.PI * r

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-[160px]">
                <div className="relative">
                    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                        <circle
                            cx={SIZE / 2} cy={SIZE / 2} r={r}
                            fill="none" stroke="#1e293b" strokeWidth={STROKE}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-700">0</span>
                        <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Lotes</span>
                    </div>
                </div>
            </div>
        )
    }

    // Build segments with dash offsets
    let cumulativeDash = 0
    const GAP = 3
    const segments = data.map(d => {
        const pct = d.value / total
        const dash = Math.max(0, pct * circumference - GAP)
        const seg = { ...d, dash, offset: cumulativeDash }
        cumulativeDash += pct * circumference
        return seg
    })

    return (
        <div className="flex items-center justify-center h-[160px]">
            <div className="relative">
                <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Track */}
                    <circle
                        cx={SIZE / 2} cy={SIZE / 2} r={r}
                        fill="none" stroke="#1e293b" strokeWidth={STROKE}
                    />
                    {/* Segments */}
                    {segments.map((seg, i) => (
                        seg.value > 0 && (
                            <circle
                                key={i}
                                cx={SIZE / 2} cy={SIZE / 2} r={r}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={STROKE}
                                strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                                strokeDashoffset={-seg.offset}
                                strokeLinecap="butt"
                            />
                        )
                    ))}
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white leading-none">{total}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Lotes</span>
                </div>
            </div>
        </div>
    )
}
