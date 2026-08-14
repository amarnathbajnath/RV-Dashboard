import { Client, GitHubSyncConfig, GitHubSyncResult, Quote } from '../types';

/**
 * Encodes string to UTF-8 safe Base64
 */
function encodeBase64Unicode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Decodes UTF-8 safe Base64 string
 */
function decodeBase64Unicode(base64Str: string): string {
  const clean = base64Str.replace(/\s/g, '');
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(clean), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Standard headers for GitHub API
 */
function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

/**
 * Test connectivity and write access to GitHub repository
 */
export async function testGitHubConnection(config: GitHubSyncConfig): Promise<{
  success: boolean;
  message: string;
  repoDetails?: { fullName: string; defaultBranch: string; isPrivate: boolean; permissions?: any };
}> {
  if (!config.token || !config.owner || !config.repo) {
    return {
      success: false,
      message: 'Please provide GitHub Personal Access Token, Repository Owner, and Repository Name.',
    };
  }

  try {
    const owner = config.owner.trim();
    const repo = config.repo.trim();
    const branch = (config.branch || 'main').trim();

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: getHeaders(config.token),
    });

    if (response.status === 401) {
      return { success: false, message: 'Invalid or expired GitHub Personal Access Token.' };
    }

    if (response.status === 404) {
      return {
        success: false,
        message: `Repository "${owner}/${repo}" not found or token lacks access permissions.`,
      };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err.message || `GitHub error ${response.status}` };
    }

    const repoData = await response.json();

    // Check if branch exists
    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      { headers: getHeaders(config.token) }
    );

    if (!branchRes.ok && branchRes.status === 404) {
      return {
        success: false,
        message: `Connected to repository "${repoData.full_name}", but branch "${branch}" was not found. Available default branch: "${repoData.default_branch}".`,
      };
    }

    return {
      success: true,
      message: `Successfully connected to ${repoData.full_name} (${branch} branch). Ready to sync!`,
      repoDetails: {
        fullName: repoData.full_name,
        defaultBranch: repoData.default_branch,
        isPrivate: repoData.private,
        permissions: repoData.permissions,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error connecting to GitHub API.',
    };
  }
}

/**
 * Fetches file SHA and raw parsed content from GitHub repo
 */
export async function getFileFromGitHub<T = any>(
  config: GitHubSyncConfig,
  filePath: string
): Promise<{ exists: boolean; sha?: string; data?: T; error?: string }> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = (config.branch || 'main').trim();
  const cleanPath = filePath.replace(/^\/+/, '');

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`,
      { headers: getHeaders(config.token) }
    );

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { exists: false, error: err.message || `HTTP ${response.status}` };
    }

    const fileMeta = await response.json();
    if (!fileMeta.content) {
      return { exists: true, sha: fileMeta.sha, data: undefined };
    }

    const decodedStr = decodeBase64Unicode(fileMeta.content);
    const parsed = JSON.parse(decodedStr);

    return {
      exists: true,
      sha: fileMeta.sha,
      data: parsed as T,
    };
  } catch (error: any) {
    return { exists: false, error: error.message || 'Error fetching file' };
  }
}

/**
 * Commits a file (creates or updates) to GitHub repository
 */
export async function saveFileToGitHub(
  config: GitHubSyncConfig,
  filePath: string,
  contentData: any,
  commitMessage: string
): Promise<{ success: boolean; sha?: string; message: string }> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = (config.branch || 'main').trim();
  const cleanPath = filePath.replace(/^\/+/, '');

  try {
    // 1. Get current SHA if file already exists
    const current = await getFileFromGitHub(config, cleanPath);
    const base64Content = encodeBase64Unicode(JSON.stringify(contentData, null, 2));

    const payload: {
      message: string;
      content: string;
      branch: string;
      sha?: string;
    } = {
      message: commitMessage,
      content: base64Content,
      branch: branch,
    };

    if (current.exists && current.sha) {
      payload.sha = current.sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`,
      {
        method: 'PUT',
        headers: getHeaders(config.token),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `Failed to save ${cleanPath} (HTTP ${response.status})`,
      };
    }

    const resData = await response.json();
    return {
      success: true,
      sha: resData.content?.sha,
      message: `Successfully saved ${cleanPath} to GitHub (${branch})`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || `Network error committing ${cleanPath} to GitHub.`,
    };
  }
}

/**
 * Push all local Quotes and Clients to GitHub repository
 */
export async function pushAllToGitHub(
  config: GitHubSyncConfig,
  quotes: Quote[],
  clients: Client[]
): Promise<GitHubSyncResult> {
  if (!config.token || !config.owner || !config.repo) {
    return {
      success: false,
      message: 'GitHub credentials are incomplete. Open GitHub Sync to configure.',
    };
  }

  const quotesPath = config.quotesPath || 'data/quotes.json';
  const clientsPath = config.clientsPath || 'data/clients.json';
  const nowStr = new Date().toLocaleString();

  // 1. Push Quotes
  const quotesRes = await saveFileToGitHub(
    config,
    quotesPath,
    quotes,
    `Update quotes (${quotes.length} quotes) via Job Costing App - ${nowStr}`
  );

  if (!quotesRes.success) {
    return {
      success: false,
      message: `Error pushing quotes: ${quotesRes.message}`,
    };
  }

  // 2. Push Clients
  const clientsRes = await saveFileToGitHub(
    config,
    clientsPath,
    clients,
    `Update clients (${clients.length} clients) via Job Costing App - ${nowStr}`
  );

  if (!clientsRes.success) {
    return {
      success: false,
      message: `Quotes saved, but error pushing clients: ${clientsRes.message}`,
    };
  }

  return {
    success: true,
    message: `Pushed ${quotes.length} quotes and ${clients.length} clients to GitHub repository (${config.owner}/${config.repo}).`,
    timestamp: new Date().toISOString(),
    quotesCount: quotes.length,
    clientsCount: clients.length,
  };
}

/**
 * Pull Quotes and Clients from GitHub repository
 */
export async function pullAllFromGitHub(
  config: GitHubSyncConfig
): Promise<{
  success: boolean;
  message: string;
  quotes?: Quote[];
  clients?: Client[];
  timestamp?: string;
}> {
  if (!config.token || !config.owner || !config.repo) {
    return {
      success: false,
      message: 'GitHub credentials are incomplete. Open GitHub Sync to configure.',
    };
  }

  const quotesPath = config.quotesPath || 'data/quotes.json';
  const clientsPath = config.clientsPath || 'data/clients.json';

  try {
    // 1. Fetch Quotes
    const quotesRes = await getFileFromGitHub<Quote[]>(config, quotesPath);
    // 2. Fetch Clients
    const clientsRes = await getFileFromGitHub<Client[]>(config, clientsPath);

    let loadedQuotes: Quote[] = [];
    let loadedClients: Client[] = [];

    if (quotesRes.exists && Array.isArray(quotesRes.data)) {
      loadedQuotes = quotesRes.data;
    } else if (quotesRes.exists && quotesRes.error) {
      return { success: false, message: `Failed to load quotes: ${quotesRes.error}` };
    }

    if (clientsRes.exists && Array.isArray(clientsRes.data)) {
      loadedClients = clientsRes.data;
    } else if (clientsRes.exists && clientsRes.error) {
      return { success: false, message: `Failed to load clients: ${clientsRes.error}` };
    }

    return {
      success: true,
      message: `Loaded ${loadedQuotes.length} quotes and ${loadedClients.length} clients from GitHub.`,
      quotes: loadedQuotes,
      clients: loadedClients,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error pulling data from GitHub.',
    };
  }
}
