import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { JSZip } from 'https://deno.land/x/jszip@0.11.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a new ZIP file
    const zip = new JSZip()

    // Add project files to the ZIP
    // Note: This is a simplified example. In a real implementation,
    // you would need to recursively add all project files
    const files = [
      'src/',
      'public/',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
    ]

    for (const file of files) {
      // In a real implementation, you would read the actual file contents
      zip.file(file, 'File contents would go here')
    }

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=codebase-backup.zip'
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})