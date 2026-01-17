export interface QRCheckpointData {
  lineId: string;
  lineName: string;
  type: 'QC_CHECKPOINT';
}

export function generateQRCodeData(lineId: string, lineName: string): string {
  const data: QRCheckpointData = {
    lineId,
    lineName,
    type: 'QC_CHECKPOINT',
  };
  return JSON.stringify(data);
}

export function parseQRCodeData(qrString: string): QRCheckpointData | null {
  try {
    const parsed = JSON.parse(qrString);
    if (parsed.type === 'QC_CHECKPOINT' && parsed.lineId && parsed.lineName) {
      return parsed as QRCheckpointData;
    }
    return null;
  } catch {
    return null;
  }
}
