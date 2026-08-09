export type BoundedTextResult =
  | { ok: true; value: string }
  | { ok: false; error: 'payload is too large' };

export async function readBoundedText(
  request: Request,
  maxBytes: number
): Promise<BoundedTextResult> {
  const contentLength = request.headers.get('content-length');
  const declaredLength = contentLength === null ? null : Number(contentLength);

  if (
    declaredLength !== null &&
    Number.isFinite(declaredLength) &&
    declaredLength > maxBytes
  ) {
    return { ok: false, error: 'payload is too large' };
  }

  if (!request.body) return { ok: true, value: '' };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let value = '';

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;

      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel('payload is too large');
        return { ok: false, error: 'payload is too large' };
      }

      value += decoder.decode(chunk.value, { stream: true });
    }

    value += decoder.decode();
    return { ok: true, value };
  } finally {
    reader.releaseLock();
  }
}
