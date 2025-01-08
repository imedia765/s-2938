import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export class DatabaseLogger {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async logOperation(status: string, message: string, userId?: string) {
    try {
      console.log(`Logging operation: ${status} - ${message}`);
      const { error } = await this.supabase
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
}