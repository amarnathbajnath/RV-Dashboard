import { Client, GitHubSyncConfig, GitHubSyncResult, Quote } from '../types';

/**
 * Sanitizes quote number or ID for safe file naming in GitHub repo
 */
export function getQuoteFileName(quote: Quote): string {
  const raw = (quote.quoteNo && quote.quoteNo.trim()) || quote.id;
  const safe = raw.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  return `${safe}.json`;
}

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
 * Saves a single quote as an individual JSON file in data/quotes/<quoteNo>.json
 */
export async function pushSingleQuoteToGitHub(
  config: GitHubSyncConfig,
  quote: Quote
): Promise<{ success: boolean; message: string }> {
  if (!config.token || !config.owner || !config.repo) {
    return {
      success: false,
      message: 'GitHub credentials are not configured.',
    };
  }

  const fileName = getQuoteFileName(quote);
  const filePath = `data/quotes/${fileName}`;
  const nowStr = new Date().toLocaleString();

  const res = await saveFileToGitHub(
    config,
    filePath,
    quote,
    `Update quote ${quote.quoteNo || quote.id} (${quote.customer || 'Customer'}) - ${nowStr}`
  );

  return {
    success: res.success,
    message: res.success ? `Saved separate JSON file: ${filePath}` : res.message,
  };
}

/**
 * Push all local Quotes (as separate JSON files in data/quotes/) and Clients to GitHub repository
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

  const nowStr = new Date().toLocaleString();
  let savedQuotesCount = 0;
  let failedQuotesCount = 0;

  // 1. Push each Quote as a separate JSON file in data/quotes/
  for (const quote of quotes) {
    const fileName = getQuoteFileName(quote);
    const quoteFilePath = `data/quotes/${fileName}`;
    const res = await saveFileToGitHub(
      config,
      quoteFilePath,
      quote,
      `Sync quote ${quote.quoteNo || quote.id} (${quote.customer || 'Draft'}) - ${nowStr}`
    );

    if (res.success) {
      savedQuotesCount++;
    } else {
      failedQuotesCount++;
      console.warn(`Failed to push quote ${fileName}:`, res.message);
    }
  }

  // 2. Also push data/quotes.json (combined index) for instant lookup
  const quotesIndexPath = config.quotesPath || 'data/quotes.json';
  await saveFileToGitHub(
    config,
    quotesIndexPath,
    quotes,
    `Update quotes index (${quotes.length} quotes) - ${nowStr}`
  );

  // 3. Push Clients to data/clients.json
  const clientsPath = config.clientsPath || 'data/clients.json';
  const clientsRes = await saveFileToGitHub(
    config,
    clientsPath,
    clients,
    `Update clients (${clients.length} clients) - ${nowStr}`
  );

  if (!clientsRes.success) {
    return {
      success: false,
      message: `Quotes saved, but error pushing clients: ${clientsRes.message}`,
    };
  }

  return {
    success: true,
    message: `Pushed ${savedQuotesCount} separate quote JSON file${savedQuotesCount !== 1 ? 's' : ''} to data/quotes/ and synced ${clients.length} clients in GitHub (${config.owner}/${config.repo}).`,
    timestamp: new Date().toISOString(),
    quotesCount: quotes.length,
    clientsCount: clients.length,
  };
}

/**
 * Pull Quotes (from individual data/quotes/*.json files or quotes.json) and Clients from GitHub repository
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

  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = (config.branch || 'main').trim();
  const clientsPath = config.clientsPath || 'data/clients.json';

  try {
    let loadedQuotes: Quote[] = [];

    // 1. Try reading the data/quotes/ directory to load all separate quote JSON files
    try {
      const folderRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/data/quotes?ref=${branch}`,
        { headers: getHeaders(config.token) }
      );

      if (folderRes.ok) {
        const folderItems = await folderRes.json();
        if (Array.isArray(folderItems) && folderItems.length > 0) {
          const jsonFiles = folderItems.filter(
            (item: any) => item.type === 'file' && item.name.endsWith('.json')
          );

          for (const fileItem of jsonFiles) {
            const singleFileRes = await getFileFromGitHub<Quote>(config, fileItem.path);
            if (singleFileRes.exists && singleFileRes.data && (singleFileRes.data.id || singleFileRes.data.quoteNo)) {
              loadedQuotes.push(singleFileRes.data);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading data/quotes directory:', e);
    }

    // 2. If data/quotes folder had no files or failed, fall back to data/quotes.json
    if (loadedQuotes.length === 0) {
      const quotesPath = config.quotesPath || 'data/quotes.json';
      const quotesRes = await getFileFromGitHub<Quote[]>(config, quotesPath);
      if (quotesRes.exists && Array.isArray(quotesRes.data)) {
        loadedQuotes = quotesRes.data;
      }
    }

    // 3. Fetch Clients
    const clientsRes = await getFileFromGitHub<Client[]>(config, clientsPath);
    let loadedClients: Client[] = [];

    if (clientsRes.exists && Array.isArray(clientsRes.data)) {
      loadedClients = clientsRes.data;
    }

    return {
      success: true,
      message: `Loaded ${loadedQuotes.length} quotes from separate JSON files and ${loadedClients.length} clients from GitHub.`,
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
