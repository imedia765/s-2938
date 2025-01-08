import { Json } from '@/integrations/supabase/types';

export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';
export type AuditOperation = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  operation: AuditOperation;
  table_name: string;
  record_id?: string;
  old_values?: Json | null;
  new_values?: Json | null;
  severity: SeverityLevel;
  compressed: boolean;
}