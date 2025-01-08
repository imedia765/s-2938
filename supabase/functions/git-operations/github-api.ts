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

    const data = await response.json();
    console.log('GitHub token validated successfully');
    return { success: true, data };
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

    const data = await response.json();
    console.log('Repository details:', {
      default_branch: data.default_branch,
      permissions: data.permissions,
      size: data.size
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching repository details:', error);
    return { success: false, error: error.message };
  }
}

export async function createCommit(token: string, owner: string, repo: string, branch: string, message: string, files: { path: string; content: string }[]): Promise<GitHubResponse> {
  try {
    console.log('Creating new commit...');
    
    // Get the latest commit SHA
    const latestCommit = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!latestCommit.ok) {
      throw new Error('Failed to get latest commit');
    }

    const { object: { sha: parentSha } } = await latestCommit.json();
    console.log('Parent commit SHA:', parentSha);

    // Create blobs for each file
    const blobPromises = files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Supabase-Edge-Function',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8'
          })
        }
      );

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }

      const blob = await blobResponse.json();
      return { path: file.path, sha: blob.sha };
    });

    const blobs = await Promise.all(blobPromises);
    console.log('Created blobs:', blobs);

    // Create tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: parentSha,
          tree: blobs.map(blob => ({
            path: blob.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha
          }))
        })
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to create tree');
    }

    const tree = await treeResponse.json();
    console.log('Created tree:', tree.sha);

    // Create commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          tree: tree.sha,
          parents: [parentSha]
        })
      }
    );

    if (!commitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const commit = await commitResponse.json();
    console.log('Created commit:', commit.sha);

    // Update reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: commit.sha,
          force: true
        })
      }
    );

    if (!updateRefResponse.ok) {
      throw new Error('Failed to update reference');
    }

    const updatedRef = await updateRefResponse.json();
    console.log('Updated reference:', updatedRef);

    return { success: true, data: { commit, tree, ref: updatedRef } };
  } catch (error) {
    console.error('Error creating commit:', error);
    return { success: false, error: error.message };
  }
}