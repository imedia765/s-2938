import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use the project ID to construct the URL
const supabaseUrl = `https://trzaeinxlytyqxptkuyj.supabase.co`;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemFlaW54bHl0eXF4cHRrdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4NzIwMDAsImV4cCI6MjAyMjQ0ODAwMH0.GYyWvXvK8xaFh4p7FJkcWCDDiOvGLSmt3tWWQX_B_Zc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);