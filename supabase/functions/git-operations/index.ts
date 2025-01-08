import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './cors.ts';
import { DatabaseLogger } from './db-logger.ts';
import { validateGitHubToken, getRepositoryDetails, createCommit } from './github-api.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const githubToken = Deno.env.get('GITHUB_PAT');

  const dbLogger = new DatabaseLogger(supabaseUrl, supabaseKey);

  try {
    console.log('Git operation started');
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const { branch = 'main', commitMessage = 'Force commit: Pushing all files to master' } = await req.json();
    
    // GitHub repository details
    const repoOwner = 'imedia765';
    const repoName = 's-935078';
    
    await dbLogger.logOperation('started', 'Starting Git push operation');

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

    // Create commit with current files
    const result = await createCommit(
      githubToken,
      repoOwner,
      repoName,
      branch,
      commitMessage,
      [
        {
          path: 'README.md',
          content: `# ${repoName}\nLast updated: ${new Date().toISOString()}`
        }
      ]
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    await dbLogger.logOperation('completed', `Successfully pushed to ${branch}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully pushed to ${branch}`,
        data: result.data
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