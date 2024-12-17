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

    // Add source code directories
    const sourceDirectories = [
      'src',
      'public',
      'supabase'
    ]

    for (const dir of sourceDirectories) {
      try {
        const files = await Deno.readDir(dir)
        for await (const file of files) {
          if (file.isFile) {
            const content = await Deno.readFile(`${dir}/${file.name}`)
            zip.file(`${dir}/${file.name}`, content)
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error)
      }
    }

    // Add configuration files
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'tailwind.config.ts',
      'postcss.config.js'
    ]

    for (const filename of configFiles) {
      try {
        const content = await Deno.readFile(filename)
        zip.file(filename, content)
      } catch (error) {
        console.error(`Error reading file ${filename}:`, error)
      }
    }

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `codebase-backup-${timestamp}.zip`

    // Log the backup in the database
    const { error } = await supabase
      .from('codebase_backups')
      .insert({
        filename,
        size: zipBlob.size,
      })

    if (error) {
      console.error('Error logging backup:', error)
    }

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${filename}`
      }
    })
  } catch (error) {
    console.error('Backup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})