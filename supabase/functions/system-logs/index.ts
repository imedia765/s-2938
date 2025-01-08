import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogEntry {
  type: 'auth' | 'system' | 'error';
  message: string;
  details?: Record<string, unknown>;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, message, details, user_id } = await req.json() as LogEntry;

    // Create audit log entry
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        operation: type === 'auth' ? 'auth_event' : 'system_event',
        table_name: 'system_logs',
        user_id: user_id,
        severity: type === 'error' ? 'error' : 'info',
        new_values: {
          message,
          details,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      throw auditError;
    }

    // Create monitoring log for system metrics
    if (type === 'system') {
      const { error: monitoringError } = await supabaseClient
        .from('monitoring_logs')
        .insert({
          event_type: 'system_metric',
          metric_name: 'system_event',
          metric_value: 1,
          details: {
            message,
            ...details
          }
        });

      if (monitoringError) {
        console.error('Error creating monitoring log:', monitoringError);
        throw monitoringError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing log:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});