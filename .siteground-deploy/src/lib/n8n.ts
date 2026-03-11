export async function sendToN8n(webhookUrl: string, data: Record<string, unknown>) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending to n8n:', error);
        throw error;
    }
}
