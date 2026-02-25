import { renderToBuffer } from '@react-pdf/renderer';
import { ReactElement } from 'react';

export async function generatePdfBuffer(element: ReactElement): Promise<Buffer> {
    const buffer = await renderToBuffer(element as any);
    return Buffer.from(buffer);
}
