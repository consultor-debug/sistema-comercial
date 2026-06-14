'use client'

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div style={{ background: '#020617', color: '#f8fafc', fontFamily: 'monospace', padding: '2rem', minHeight: '100vh' }}>
            <h1 style={{ color: '#f87171', marginBottom: '1rem' }}>Error</h1>
            <pre style={{
                background: '#0f172a',
                padding: '1.5rem',
                borderRadius: '8px',
                fontSize: '12px',
                overflow: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
            }}>
                {error?.name}: {error?.message}
                {'\n\n'}
                {error?.stack}
                {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
            </pre>
            <button
                onClick={reset}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                }}
            >
                Reintentar
            </button>
        </div>
    )
}
