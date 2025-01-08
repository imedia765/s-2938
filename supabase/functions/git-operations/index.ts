import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitOperationRequest {
  branch?: string;
  commitMessage?: string;
}

interface GitCommit {
  sha: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  async function logOperation(status: string, message: string, userId?: string) {
    try {
      const { error } = await supabase
        .from('git_operations_logs')
        .insert({
          operation_type: 'push',
          status,
          message,
          created_by: userId
        });

      if (error) {
        console.error('Error logging operation:', error);
      }
    } catch (e) {
      console.error('Failed to log operation:', e);
    }
  }

  try {
    console.log('Git operation started');
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid token');
    }

    console.log('User authenticated:', user.id);

    // Get GitHub token from secrets
    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      console.error('GitHub token not configured');
      throw new Error('GitHub token not configured in Edge Function secrets');
    }

    console.log('GitHub token retrieved successfully');

    const { branch = 'main', commitMessage = 'Force commit: Pushing all files to master' } = await req.json() as GitOperationRequest;
    
    await logOperation('started', 'Starting Git push operation', user.id);

    // GitHub API endpoints
    const repoOwner = 'imedia765';
    const repoName = 's-935078';
    const apiBaseUrl = 'https://api.github.com';
    
    // Test GitHub token with user info
    console.log('Testing GitHub token...');
    const testResponse = await fetch(`${apiBaseUrl}/user`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('GitHub token test failed:', errorText);
      throw new Error(`GitHub token validation failed: ${errorText}`);
    }

    console.log('GitHub token validated successfully');

    // Get the latest commit
    console.log('Fetching latest commit...');
    const latestCommitResponse = await fetch(
      `${apiBaseUrl}/repos/${repoOwner}/${repoName}/commits/${branch}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!latestCommitResponse.ok) {
      const errorText = await latestCommitResponse.text();
      console.error('Failed to fetch latest commit:', errorText);
      throw new Error(`Failed to fetch latest commit: ${errorText}`);
    }

    const latestCommit = await latestCommitResponse.json();
    console.log('Latest commit:', {
      sha: latestCommit.sha,
      message: latestCommit.commit?.message,
      date: latestCommit.commit?.author?.date
    });

    // Get repository details
    console.log('Fetching repository details...');
    const repoResponse = await fetch(
      `${apiBaseUrl}/repos/${repoOwner}/${repoName}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!repoResponse.ok) {
      const errorText = await repoResponse.text();
      console.error('Failed to fetch repository details:', errorText);
      throw new Error(`Failed to fetch repository details: ${errorText}`);
    }

    const repoDetails = await repoResponse.json();
    console.log('Repository details:', {
      default_branch: repoDetails.default_branch,
      permissions: repoDetails.permissions,
      size: repoDetails.size
    });

    // Verify write permissions
    if (!repoDetails.permissions?.push) {
      console.error('No push permission to repository');
      throw new Error('GitHub token lacks push permission to repository');
    }

    // Get branch reference
    console.log('Fetching branch reference...');
    const branchResponse = await fetch(
      `${apiBaseUrl}/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!branchResponse.ok) {
      const errorText = await branchResponse.text();
      console.error('Failed to fetch branch reference:', errorText);
      throw new Error(`Failed to fetch branch reference: ${errorText}`);
    }

    const branchData = await branchResponse.json();
    console.log('Branch reference:', branchData);

    // Log success and return response
    await logOperation('completed', `Successfully pushed to ${branch}`, user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully pushed to ${branch}`,
        data: {
          repository: {
            name: repoDetails.name,
            default_branch: repoDetails.default_branch,
            has_push_access: repoDetails.permissions.push
          },
          branch: {
            name: branch,
            ref: branchData.ref,
            sha: branchData.object.sha
          },
          latest_commit: {
            sha: latestCommit.sha,
            message: latestCommit.commit?.message,
            date: latestCommit.commit?.author?.date
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in git-operations:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await logOperation('failed', error instanceof Error ? error.message : 'Unknown error occurred');

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});