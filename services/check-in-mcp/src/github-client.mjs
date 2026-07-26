const OWNER = 'teamleaderleo';
const REPO = 'scrapbook';
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPO}`;
const GRAPHQL_URL = 'https://api.github.com/graphql';
const REQUEST_TIMEOUT_MS = 15_000;

export class GitHubError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.details = details;
  }
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function resolveApiUrl(path) {
  if (!path.startsWith('https://')) return `${API_ROOT}${path}`;
  if (path === GRAPHQL_URL) return path;
  throw new GitHubError('The GitHub client rejected a non-Scrapbook API destination.', 400);
}

export class ScrapbookGitHubClient {
  constructor({
    token = process.env.SCRAPBOOK_GITHUB_TOKEN,
    fetchImpl = fetch,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = {}) {
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, { method = 'GET', body, write = false, headers = {} } = {}) {
    if (write && !this.token) {
      throw new GitHubError('SCRAPBOOK_GITHUB_TOKEN is required for repository writes.', 401);
    }
    const response = await this.fetchImpl(resolveApiUrl(path), {
      method,
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'scrapbook-check-in-mcp',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 204) return null;
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: 'GitHub returned a non-JSON response.' };
      }
    }
    if (!response.ok) {
      throw new GitHubError(payload?.message || `GitHub request failed with ${response.status}.`, response.status, payload);
    }
    return payload;
  }

  async getRef(branch) {
    try {
      return await this.request(`/git/ref/heads/${encodeURIComponent(branch)}`);
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) return null;
      throw error;
    }
  }

  async createBranch(branch, sha) {
    return this.request('/git/refs', {
      method: 'POST',
      write: true,
      body: { ref: `refs/heads/${branch}`, sha },
    });
  }

  async getFile(path, ref = 'main') {
    try {
      const file = await this.request(`/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
      if (Array.isArray(file) || file.type !== 'file') throw new GitHubError('Expected a repository file.', 409);
      return {
        path,
        sha: file.sha,
        content: Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8'),
        htmlUrl: file.html_url,
      };
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) return null;
      throw error;
    }
  }

  async updateFile(path, ref, currentSha, content, message) {
    return this.request(`/contents/${encodePath(path)}`, {
      method: 'PUT',
      write: true,
      body: {
        branch: ref,
        message,
        sha: currentSha,
        content: Buffer.from(content, 'utf8').toString('base64'),
      },
    });
  }

  async dispatchArtworkImport({ sourceType, source, entryId, branch }) {
    return this.request('/actions/workflows/import-gallery-asset.yml/dispatches', {
      method: 'POST',
      write: true,
      body: {
        ref: 'main',
        inputs: {
          source_type: sourceType,
          source,
          entry_id: entryId,
          target_branch: branch,
        },
      },
    });
  }

  async listArtworkRuns(entryId, branch) {
    const result = await this.request('/actions/workflows/import-gallery-asset.yml/runs?event=workflow_dispatch&per_page=50');
    const expected = `Import gallery asset for ${entryId} on ${branch}`;
    return (result.workflow_runs || []).filter((run) => run.display_title === expected || run.name === expected);
  }

  async listPullRequestsForBranch(branch, state = 'all') {
    const head = encodeURIComponent(`${OWNER}:${branch}`);
    return this.request(`/pulls?state=${encodeURIComponent(state)}&head=${head}&per_page=20`);
  }

  async createDraftPullRequest({ branch, title, body }) {
    return this.request('/pulls', {
      method: 'POST',
      write: true,
      body: { title, body, head: branch, base: 'main', draft: true, maintainer_can_modify: true },
    });
  }

  async getPullRequest(prNumber) {
    return this.request(`/pulls/${prNumber}`);
  }

  async getCheckRuns(sha) {
    return this.request(`/commits/${sha}/check-runs?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  }

  async getCombinedStatus(sha) {
    return this.request(`/commits/${sha}/status`);
  }

  async markPullRequestReady(nodeId) {
    const query = `mutation MarkReady($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { number isDraft url } } }`;
    const response = await this.request(GRAPHQL_URL, {
      method: 'POST',
      write: true,
      body: { query, variables: { id: nodeId } },
    });
    if (response.errors?.length) {
      throw new GitHubError(response.errors[0].message || 'GitHub could not mark the pull request ready.', 422, response.errors);
    }
    return response.data.markPullRequestReadyForReview.pullRequest;
  }

  async mergePullRequest(prNumber, headSha) {
    return this.request(`/pulls/${prNumber}/merge`, {
      method: 'PUT',
      write: true,
      body: { sha: headSha, merge_method: 'squash' },
    });
  }
}

export const SCRAPBOOK_REPOSITORY = `${OWNER}/${REPO}`;
