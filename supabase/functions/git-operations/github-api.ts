import { corsHeaders } from './cors.ts';

interface GitHubResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function validateGitHubToken(token: string): Promise<GitHubResponse> {
  try {
    console.log('Testing GitHub token...');
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub token validation failed:', errorText);
      return { success: false, error: `GitHub token validation failed: ${errorText}` };
    }

    console.log('GitHub token validated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error validating GitHub token:', error);
    return { success: false, error: error.message };
  }
}

export async function getRepositoryDetails(token: string, owner: string, repo: string): Promise<GitHubResponse> {
  try {
    console.log('Fetching repository details...');
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch repository details:', errorText);
      return { success: false, error: `Failed to fetch repository details: ${errorText}` };
    }

    const repoDetails = await response.json();
    console.log('Repository details:', {
      default_branch: repoDetails.default_branch,
      permissions: repoDetails.permissions,
      size: repoDetails.size
    });

    return { success: true, data: repoDetails };
  } catch (error) {
    console.error('Error fetching repository details:', error);
    return { success: false, error: error.message };
  }
}

export async function getBranchReference(token: string, owner: string, repo: string, branch: string): Promise<GitHubResponse> {
  try {
    console.log('Fetching branch reference...');
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch branch reference:', errorText);
      return { success: false, error: `Failed to fetch branch reference: ${errorText}` };
    }

    const branchData = await response.json();
    console.log('Branch reference:', branchData);
    return { success: true, data: branchData };
  } catch (error) {
    console.error('Error fetching branch reference:', error);
    return { success: false, error: error.message };
  }
}

export async function getLatestCommit(token: string, owner: string, repo: string, branch: string): Promise<GitHubResponse> {
  try {
    console.log('Fetching latest commit...');
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch latest commit:', errorText);
      return { success: false, error: `Failed to fetch latest commit: ${errorText}` };
    }

    const latestCommit = await response.json();
    console.log('Latest commit:', {
      sha: latestCommit.sha,
      message: latestCommit.commit?.message,
      date: latestCommit.commit?.author?.date
    });

    return { success: true, data: latestCommit };
  } catch (error) {
    console.error('Error fetching latest commit:', error);
    return { success: false, error: error.message };
  }
}