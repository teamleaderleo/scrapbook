import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubError, ScrapbookGitHubClient } from '../src/github-client.mjs';

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('rejects arbitrary absolute destinations before sending the GitHub token', async () => {
  let called = false;
  const client = new ScrapbookGitHubClient({
    token: 'secret-token',
    fetchImpl: async () => {
      called = true;
      return jsonResponse({});
    },
  });

  await assert.rejects(
    client.request('https://example.com/collect', { method: 'POST', write: true, body: { token: 'bait' } }),
    (error) => error instanceof GitHubError && /non-Scrapbook API destination/.test(error.message),
  );
  assert.equal(called, false);
});

test('resolves repository REST calls only under the fixed Scrapbook API root', async () => {
  let request;
  const client = new ScrapbookGitHubClient({
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse({ object: { sha: 'main-sha' } });
    },
  });

  const ref = await client.getRef('main');
  assert.equal(ref.object.sha, 'main-sha');
  assert.equal(request.url, 'https://api.github.com/repos/teamleaderleo/scrapbook/git/ref/heads/main');
  assert.equal(request.options.headers['User-Agent'], 'scrapbook-check-in-mcp');
  assert.ok(request.options.signal instanceof AbortSignal);
});

test('allows only the fixed GitHub GraphQL endpoint for the ready transition', async () => {
  let request;
  const client = new ScrapbookGitHubClient({
    token: 'secret-token',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse({
        data: {
          markPullRequestReadyForReview: {
            pullRequest: { number: 42, isDraft: false, url: 'https://github.test/pr/42' },
          },
        },
      });
    },
  });

  const ready = await client.markPullRequestReady('PR_node');
  assert.equal(ready.number, 42);
  assert.equal(request.url, 'https://api.github.com/graphql');
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).variables.id, 'PR_node');
});
