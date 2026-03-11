import { renderToBuffer } from '@react-pdf/renderer';
import { ReactElement } from 'react';

export async function generatePdfBuffer(element: ReactElement): Promise<Buffer> {
    const buffer = await renderToBuffer(element as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    return Buffer.from(buffer);
}
