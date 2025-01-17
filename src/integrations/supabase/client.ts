import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://trzaeinxlytyqxptkuyj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemFlaW54bHl0eXF4cHRrdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU0NTQ0NzcsImV4cCI6MjAyMTAzMDQ3N30.RwLV9ZzqX3OXfIAXfnVHSUxgQw7MVKhZGpxC4nQpDe0';

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.message === 'Failed to fetch') {
    return new Error('Unable to connect to the server. Please check your internet connection and try again.');
  }
  
  if (error.message?.includes('Invalid API key')) {
    console.error('API Key error:', { 
      url: supabaseUrl,
      keyLength: supabaseAnonKey.length,
      error 
    });
    return new Error('Authentication error. Please check API configuration.');
  }
  
  return new Error(error.message || 'An error occurred with the database operation');
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window?.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'lovable-dashboard',
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  },
  // Add retrying for failed requests
  realtime: {
    params: {
      eventsPerSecond: 1
    }
  }
});