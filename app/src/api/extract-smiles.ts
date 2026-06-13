export type ExtractSmilesRequest = {
  imageDataUrl?: string;
  imageBase64?: string;
  mediaType?: string;
  svgText?: string;
  fileName?: string;
  context?: string;
};

export type ExtractSmilesResponse = {
  smiles: string | null;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  model?: string;
  rawText?: string;
};

export async function extractSmilesViaProxy(
  request: ExtractSmilesRequest,
  endpoint = '/api/extract-smiles',
): Promise<ExtractSmilesResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `SMILES extraction failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    smiles: typeof payload?.smiles === 'string' ? payload.smiles : null,
    confidence:
      payload?.confidence === 'high' || payload?.confidence === 'medium'
        ? payload.confidence
        : 'low',
    warnings: Array.isArray(payload?.warnings) ? payload.warnings.map(String) : [],
    model: typeof payload?.model === 'string' ? payload.model : undefined,
    rawText: typeof payload?.rawText === 'string' ? payload.rawText : undefined,
  };
}

export async function extractSmilesFromFile(
  file: File,
  options: Omit<ExtractSmilesRequest, 'imageDataUrl' | 'imageBase64' | 'mediaType' | 'fileName'> = {},
): Promise<ExtractSmilesResponse> {
  return extractSmilesViaProxy({
    ...options,
    imageDataUrl: await fileToDataUrl(file),
    fileName: file.name,
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed.'));
    reader.readAsDataURL(file);
  });
}
