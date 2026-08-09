import { timingSafeEqual } from 'node:crypto';

export function timingSafeTokenEqual(received: string, expected: string) {
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  const sameLength = receivedBytes.length === expectedBytes.length;
  const comparable = sameLength
    ? receivedBytes
    : Buffer.alloc(expectedBytes.length);

  return timingSafeEqual(comparable, expectedBytes) && sameLength;
}
