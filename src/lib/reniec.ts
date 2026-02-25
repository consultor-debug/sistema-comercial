interface ReniecResponse {
    success: boolean
    dni?: string
    nombres?: string
    apellidoPaterno?: string
    apellidoMaterno?: string
    nombreCompleto?: string
    error?: string
}

interface ValidatedClient {
    dni: string
    nombres: string
    apellidos: string
    nombreCompleto: string
}

export async function validateDNIWithReniec(dni: string): Promise<ReniecResponse> {
    try {
        // Usando el endpoint gratuito de apis.net.pe v1 que no requiere token para consultar DNI
        const response = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            return {
                success: false,
                error: 'El DNI no fue encontrado o hubo un error en la consulta'
            }
        }

        const data = await response.json()

        // El API de apis.net.pe retorna { nombres, apellidoPaterno, apellidoMaterno, numeroDocumento... }
        if (!data.nombres) {
            return {
                success: false,
                error: 'No se encontraron datos para este DNI'
            }
        }

        return {
            success: true,
            dni: data.numeroDocumento || dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            nombreCompleto: `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`
        }
    } catch (error) {
        console.error('RENIEC API error:', error)
        return { success: false, error: 'Error de conexión con servicio de DNI' }
    }
}

// Simulate RENIEC response for development/testing
function simulateReniecResponse(dni: string): ReniecResponse {
    // Generate random but consistent names based on DNI
    const names = ['Juan Carlos', 'María Elena', 'José Luis', 'Ana María', 'Carlos Alberto']
    const apellidosP = ['García', 'Rodríguez', 'Martínez', 'López', 'Hernández']
    const apellidosM = ['Fernández', 'González', 'Sánchez', 'Pérez', 'Gómez']

    const index = parseInt(dni.slice(-1)) % 5
    const nombres = names[index]
    const apellidoPaterno = apellidosP[index]
    const apellidoMaterno = apellidosM[(index + 1) % 5]

    return {
        success: true,
        dni,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        nombreCompleto: `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`
    }
}

export function parseReniecToClient(response: ReniecResponse): ValidatedClient | null {
    if (!response.success || !response.nombres) {
        return null
    }

    return {
        dni: response.dni || '',
        nombres: response.nombres,
        apellidos: `${response.apellidoPaterno || ''} ${response.apellidoMaterno || ''}`.trim(),
        nombreCompleto: response.nombreCompleto || ''
    }
}
