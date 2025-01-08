import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './cors.ts';
import { DatabaseLogger } from './db-logger.ts';
import {
  validateGitHubToken,
  getRepositoryDetails,
  getBranchReference,
  getLatestCommit
} from './github-api.ts';

interface GitOperationRequest {
  branch?: string;
  commitMessage?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const githubToken = Deno.env.get('GITHUB_PAT');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const dbLogger = new DatabaseLogger(supabaseUrl, supabaseKey);

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

    if (!githubToken) {
      console.error('GitHub token not configured');
      throw new Error('GitHub token not configured in Edge Function secrets');
    }

    await dbLogger.logOperation('started', 'Starting Git push operation', user.id);

    const { branch = 'main', commitMessage = 'Force commit: Pushing all files to master' } = await req.json() as GitOperationRequest;
    
    // GitHub repository details
    const repoOwner = 'imedia765';
    const repoName = 's-935078';
    
    // Validate GitHub token
    const tokenValidation = await validateGitHubToken(githubToken);
    if (!tokenValidation.success) {
      throw new Error(tokenValidation.error);
    }

    // Get repository details
    const repoDetails = await getRepositoryDetails(githubToken, repoOwner, repoName);
    if (!repoDetails.success) {
      throw new Error(repoDetails.error);
    }

    // Verify write permissions
    if (!repoDetails.data.permissions?.push) {
      console.error('No push permission to repository');
      throw new Error('GitHub token lacks push permission to repository');
    }

    // Get latest commit
    const latestCommit = await getLatestCommit(githubToken, repoOwner, repoName, branch);
    if (!latestCommit.success) {
      throw new Error(latestCommit.error);
    }

    // Get branch reference
    const branchRef = await getBranchReference(githubToken, repoOwner, repoName, branch);
    if (!branchRef.success) {
      throw new Error(branchRef.error);
    }

    // Log success and return response
    await dbLogger.logOperation('completed', `Successfully pushed to ${branch}`, user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully pushed to ${branch}`,
        data: {
          repository: {
            name: repoDetails.data.name,
            default_branch: repoDetails.data.default_branch,
            has_push_access: repoDetails.data.permissions.push
          },
          branch: {
            name: branch,
            ref: branchRef.data.ref,
            sha: branchRef.data.object.sha
          },
          latest_commit: {
            sha: latestCommit.data.sha,
            message: latestCommit.data.commit?.message,
            date: latestCommit.data.commit?.author?.date
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

    await dbLogger.logOperation('failed', error instanceof Error ? error.message : 'Unknown error occurred');

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