import { describe, expect, test } from 'vitest';
import { validateGalleryImportRequest } from '../scripts/validate-gallery-import-request.mjs';

const validDriveRequest = {
  version: 1,
  entryId: 'release-raccoon',
  sourceType: 'drive',
  source: '1abcDEF_ghiJKLmnop',
};

describe('gallery import request', () => {
  test('derives the fixed branch and repository-owned output path', () => {
    const request = validateGalleryImportRequest(validDriveRequest, {
      requestPath: '.scrapbook/import-requests/release-raccoon.json',
      branch: 'agent-check-in/release-raccoon',
    });

    expect(request).toEqual({
      ...validDriveRequest,
      branch: 'agent-check-in/release-raccoon',
      requestPath: '.scrapbook/import-requests/release-raccoon.json',
      outputPath: 'public/gallery/agents/release-raccoon.webp',
    });
  });

  test('rejects a request committed to another branch', () => {
    expect(() => validateGalleryImportRequest(validDriveRequest, {
      requestPath: '.scrapbook/import-requests/release-raccoon.json',
      branch: 'agent-check-in/other-entry',
    })).toThrow('request branch must equal agent-check-in/release-raccoon');
  });

  test('rejects a filename that does not match the entry identity', () => {
    expect(() => validateGalleryImportRequest(validDriveRequest, {
      requestPath: '.scrapbook/import-requests/other-entry.json',
      branch: 'agent-check-in/release-raccoon',
    })).toThrow('request path must equal .scrapbook/import-requests/release-raccoon.json');
  });

  test('rejects undeclared fields instead of accepting arbitrary paths', () => {
    expect(() => validateGalleryImportRequest({
      ...validDriveRequest,
      destination: '../../public/escape.webp',
    }, {
      requestPath: '.scrapbook/import-requests/release-raccoon.json',
      branch: 'agent-check-in/release-raccoon',
    })).toThrow('unknown request field: destination');
  });

  test('accepts supported GitHub user attachments', () => {
    const request = validateGalleryImportRequest({
      version: 1,
      entryId: 'release-raccoon',
      sourceType: 'github-attachment',
      source: 'https://github.com/user-attachments/assets/12345678-1234-1234-1234-123456789abc',
    }, {
      requestPath: '.scrapbook/import-requests/release-raccoon.json',
      branch: 'agent-check-in/release-raccoon',
    });

    expect(request.sourceType).toBe('github-attachment');
  });
});
