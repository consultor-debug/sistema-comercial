'use client'

export default function AppError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div style={{ background: '#020617', color: '#f8fafc', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
                    Ocurrió un error inesperado. Por favor intenta de nuevo.
                </p>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    Reintentar
                </button>
            </div>
        </div>
    )
}
